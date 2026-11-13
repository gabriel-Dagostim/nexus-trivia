'use client';

import type { DataConnection, Peer as PeerType } from 'peerjs';
import type { CategoryId, PublicRoomState } from '@/types/game';

export type ClientToHostMsg =
  | { type: 'join_request'; name: string; avatarColor: string; pin: string }
  | { type: 'request_spin' }
  | { type: 'choose_crown_category'; category: CategoryId }
  | { type: 'submit_answer'; selectedIndex: number; timeMs: number }
  | { type: 'ping' };

export type HostToClientMsg =
  | { type: 'welcome'; playerId: string; state: PublicRoomState }
  | { type: 'state_update'; state: PublicRoomState }
  | { type: 'rejected'; reason: string }
  | { type: 'pong' };

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  },
};

export function getHostPeerId(roomCode: string): string {
  return `nx-trivia-${roomCode.trim().toUpperCase()}`;
}

export async function createHostPeer(
  roomCode: string,
  onReady: (peerId: string) => void,
  onConnection: (conn: DataConnection) => void,
  onError: (err: string) => void
): Promise<PeerType> {
  const { default: Peer } = await import('peerjs');
  const peer = new Peer(getHostPeerId(roomCode), PEER_CONFIG);

  peer.on('open', (id) => {
    onReady(id);
  });

  peer.on('connection', (conn) => {
    onConnection(conn);
  });

  peer.on('error', (err) => {
    const msg = err?.message || String(err);
    if (msg.includes('unavailable-id')) {
      onError('Código de sala já em uso na rede P2P. Gere um novo código.');
    } else {
      onError(`Erro P2P: ${msg}`);
    }
  });

  return peer;
}

export async function connectAsClientPeer(
  roomCode: string,
  joinPayload: { name: string; avatarColor: string; pin: string },
  handlers: {
    onWelcome: (playerId: string, state: PublicRoomState) => void;
    onStateUpdate: (state: PublicRoomState) => void;
    onRejected: (reason: string) => void;
    onDisconnected: () => void;
    onError: (err: string) => void;
  }
): Promise<{ peer: PeerType; conn: DataConnection }> {
  const { default: Peer } = await import('peerjs');
  const peer = new Peer(PEER_CONFIG);

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        peer.destroy();
        reject(new Error('Tempo esgotado ao conectar à sala P2P. Verifique o código e tente novamente.'));
      }
    }, 15000);

    peer.on('open', () => {
      const conn = peer.connect(getHostPeerId(roomCode), { reliable: true });

      conn.on('open', () => {
        const msg: ClientToHostMsg = {
          type: 'join_request',
          name: joinPayload.name,
          avatarColor: joinPayload.avatarColor,
          pin: joinPayload.pin,
        };
        conn.send(msg);
      });

      conn.on('data', (raw) => {
        const msg = raw as HostToClientMsg;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'welcome') {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve({ peer, conn });
          }
          handlers.onWelcome(msg.playerId, msg.state);
        } else if (msg.type === 'state_update') {
          handlers.onStateUpdate(msg.state);
        } else if (msg.type === 'rejected') {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            peer.destroy();
            reject(new Error(msg.reason));
          }
          handlers.onRejected(msg.reason);
        }
      });

      conn.on('close', () => {
        handlers.onDisconnected();
      });

      conn.on('error', (err) => {
        const errMsg = err?.message || 'Erro de conexão com o Host.';
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(errMsg));
        }
        handlers.onError(errMsg);
      });
    });

    peer.on('error', (err) => {
      const errMsg = err?.message || 'Não foi possível localizar a sala P2P.';
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(errMsg));
      }
      handlers.onError(errMsg);
    });
  });
}
