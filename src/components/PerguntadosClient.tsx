'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import type { DataConnection, Peer as PeerType } from 'peerjs';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Bot,
  CheckCircle2,
  Copy,
  Crown,
  Flame,
  Gamepad2,
  KeyRound,
  Play,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Shield,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { TriviaWheel3D } from './TriviaWheel3D';
import { ThemeBackdrop } from './ThemeBackdrop';
import { CategoryIcon, CrownIcon } from './GameIcons';
import { CATEGORIES, CATEGORY_MAP, DIFFICULTY_META } from '@/lib/categories';
import {
  AVATAR_PALETTE,
  BOT_PROFILES,
  advanceToNextTurn,
  createInitialRoomState,
  generateRoomCode,
  generateRoomPin,
  pickNextQuestionForCategory,
  resolveRound,
  sanitizeQuestionForClients,
  simulateBotAnswer,
  spinWheelSector,
} from '@/lib/game-engine';
import {
  type ClientToHostMsg,
  type HostToClientMsg,
  connectAsClientPeer,
  createHostPeer,
} from '@/lib/p2p';
import { soundEngine } from '@/lib/sound';
import type {
  AnswerSubmission,
  CategoryId,
  PublicRoomState,
  RoomDifficulty,
  RoomSettings,
  TriviaQuestion,
} from '@/types/game';

type ConnectionMode = 'menu' | 'host_p2p' | 'host_local' | 'client_p2p';

export function PerguntadosClient() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();

  // Setup inputs (custom overrides; falls back to logged user profile)
  const [customPlayerName, setCustomPlayerName] = useState<string | null>(null);
  const [customAvatarColor, setCustomAvatarColor] = useState<string | null>(null);
  const playerName = customPlayerName ?? user?.displayName ?? 'PlayerOne';
  const avatarColor = customAvatarColor ?? user?.avatarColor ?? AVATAR_PALETTE[0];
  const [difficulty, setDifficulty] = useState<RoomDifficulty>('medio');
  const [crownsToWin, setCrownsToWin] = useState<number>(6);
  const [enableExternalApi, setEnableExternalApi] = useState(true);

  // Join inputs (initialized directly from URL query if coming via QR code)
  const [joinCode, setJoinCode] = useState(() => (searchParams.get('room') ?? '').toUpperCase());
  const [joinPin, setJoinPin] = useState(() => searchParams.get('pin') ?? '');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Active room state
  const [mode, setMode] = useState<ConnectionMode>('menu');
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [roomPin, setRoomPin] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [p2pStatus, setP2pStatus] = useState<'idle' | 'connecting' | 'online' | 'error'>('idle');
  const [p2pError, setP2pError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Round UI state
  const [answerChoice, setAnswerChoice] = useState<{ key: string; idx: number } | null>(null);
  const currentQuestionKey = roomState?.currentQuestion
    ? `${roomState.roomCode}-${roomState.turnNumber}-${roomState.currentQuestion.id}`
    : '';
  const selectedOption =
    answerChoice && answerChoice.key === currentQuestionKey ? answerChoice.idx : null;

  const [timeLeftSec, setTimeLeftSec] = useState<number>(20);
  const [extraPool, setExtraPool] = useState<TriviaQuestion[]>([]);

  // Authoritative Host refs
  const hostPeerRef = useRef<PeerType | null>(null);
  const clientPeerRef = useRef<{ peer: PeerType; conn: DataConnection } | null>(null);
  const peerConnsRef = useRef<Map<string, DataConnection>>(new Map()); // playerId -> conn
  const hostRoomStateRef = useRef<PublicRoomState | null>(null);
  const activeQuestionRef = useRef<TriviaQuestion | null>(null);
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const submissionsRef = useRef<Map<string, AnswerSubmission>>(new Map());
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const roomPinRef = useRef<string>('');
  const extraPoolRef = useRef<TriviaQuestion[]>([]);
  const recordedMatchKeyRef = useRef<string>('');

  useEffect(() => {
    extraPoolRef.current = extraPool;
  }, [extraPool]);

  // Load any stored external questions from DB on mount
  useEffect(() => {
    fetch('/api/questions/external')
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((data: { questions?: TriviaQuestion[] }) => {
        if (data.questions?.length) {
          setExtraPool(data.questions);
        }
      })
      .catch(() => {});
  }, []);

  // Cleanup on unmount
  const cleanupConnections = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    botTimersRef.current.forEach(clearTimeout);
    botTimersRef.current = [];
    peerConnsRef.current.forEach((c) => c.close());
    peerConnsRef.current.clear();
    hostPeerRef.current?.destroy();
    hostPeerRef.current = null;
    clientPeerRef.current?.conn.close();
    clientPeerRef.current?.peer.destroy();
    clientPeerRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanupConnections();
  }, [cleanupConnections]);

  const broadcastState = useCallback((next: PublicRoomState) => {
    hostRoomStateRef.current = next;
    setRoomState(next);
    const payload: HostToClientMsg = { type: 'state_update', state: next };
    peerConnsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(payload);
      }
    });
  }, []);

  const clearRoundTimers = useCallback(() => {
    if (roundTimerRef.current) {
      clearTimeout(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    botTimersRef.current.forEach(clearTimeout);
    botTimersRef.current = [];
  }, []);

  const finishQuestionRound = useCallback(() => {
    clearRoundTimers();
    const state = hostRoomStateRef.current;
    const activeQ = activeQuestionRef.current;
    if (!state || !activeQ || state.phase !== 'question') return;

    const { nextState } = resolveRound(state, activeQ, submissionsRef.current);
    activeQuestionRef.current = null;
    broadcastState(nextState);
  }, [broadcastState, clearRoundTimers]);

  const startQuestionForCategory = useCallback(
    (category: CategoryId) => {
      const state = hostRoomStateRef.current;
      if (!state) return;

      clearRoundTimers();
      submissionsRef.current = new Map();

      const poolToUse = state.settings.enableExternalApi ? extraPoolRef.current : [];
      const fullQ = pickNextQuestionForCategory(
        category,
        state.settings,
        usedQuestionIdsRef.current,
        poolToUse
      );
      activeQuestionRef.current = fullQ;

      const nextState: PublicRoomState = {
        ...state,
        phase: 'question',
        selectedCategory: category,
        currentQuestion: sanitizeQuestionForClients(fullQ),
        questionStartedAt: Date.now(),
        lastReveal: null,
        answeredPlayerIds: [],
      };
      broadcastState(nextState);

      // Schedule Bot answers
      nextState.players
        .filter((p) => p.isBot)
        .forEach((bot) => {
          const sim = simulateBotAnswer(
            fullQ,
            bot.botLevel ?? 'medio',
            nextState.settings.questionTimeSec
          );
          const t = setTimeout(() => {
            const cur = hostRoomStateRef.current;
            if (!cur || cur.phase !== 'question' || submissionsRef.current.has(bot.id)) return;
            submissionsRef.current.set(bot.id, {
              playerId: bot.id,
              selectedIndex: sim.selectedIndex,
              timeMs: sim.timeMs,
            });
            const updatedAnswered = Array.from(submissionsRef.current.keys());
            const updatedState: PublicRoomState = {
              ...cur,
              answeredPlayerIds: updatedAnswered,
            };
            broadcastState(updatedState);

            const connectedCount = updatedState.players.filter((pl) => pl.connected).length;
            if (updatedAnswered.length >= connectedCount) {
              finishQuestionRound();
            }
          }, sim.timeMs);
          botTimersRef.current.push(t);
        });

      // Schedule hard question timeout
      roundTimerRef.current = setTimeout(() => {
        finishQuestionRound();
      }, nextState.settings.questionTimeSec * 1000 + 350);
    },
    [broadcastState, clearRoundTimers, finishQuestionRound]
  );

  const handleHostSpin = useCallback(() => {
    const state = hostRoomStateRef.current;
    if (!state || state.phase !== 'spinning') return;

    const { sector, isCrown, category } = spinWheelSector();
    const nextState: PublicRoomState = {
      ...state,
      wheelTargetSector: sector,
      wheelSpinId: state.wheelSpinId + 1,
      isCrownRound: isCrown,
      selectedCategory: category,
    };
    broadcastState(nextState);
  }, [broadcastState]);

  const handleHostWheelSettled = useCallback(() => {
    const state = hostRoomStateRef.current;
    if (!state || state.phase !== 'spinning') return;

    if (state.isCrownRound) {
      const nextState: PublicRoomState = {
        ...state,
        phase: 'choosing_crown',
      };
      broadcastState(nextState);

      // If active player is a Bot, auto-pick missing crown category
      const activePlayer = state.players.find((p) => p.id === state.activePlayerId);
      if (activePlayer?.isBot) {
        const missing =
          CATEGORIES.find((c) => !activePlayer.crowns.includes(c.id))?.id ?? CATEGORIES[0].id;
        setTimeout(() => startQuestionForCategory(missing), 900);
      }
      return;
    }

    const cat = state.selectedCategory ?? CATEGORIES[state.wheelTargetSector]?.id ?? 'pop';
    startQuestionForCategory(cat);
  }, [broadcastState, startQuestionForCategory]);

  const handleSubmitAnswerOnHost = useCallback(
    (playerId: string, selectedIndex: number, timeMs: number) => {
      const state = hostRoomStateRef.current;
      if (!state || state.phase !== 'question') return;
      if (submissionsRef.current.has(playerId)) return;

      submissionsRef.current.set(playerId, {
        playerId,
        selectedIndex,
        timeMs: Math.max(200, Math.min(state.settings.questionTimeSec * 1000, timeMs)),
      });

      const updatedAnswered = Array.from(submissionsRef.current.keys());
      const updatedState: PublicRoomState = {
        ...state,
        answeredPlayerIds: updatedAnswered,
      };
      broadcastState(updatedState);

      const connectedCount = updatedState.players.filter((p) => p.connected).length;
      if (updatedAnswered.length >= connectedCount) {
        finishQuestionRound();
      }
    },
    [broadcastState, finishQuestionRound]
  );

  // Auto-spin when active player is a Bot
  useEffect(() => {
    if (mode !== 'host_p2p' && mode !== 'host_local') return;
    if (!roomState || roomState.phase !== 'spinning') return;
    const active = roomState.players.find((p) => p.id === roomState.activePlayerId);
    if (!active?.isBot) return;

    const timer = setTimeout(() => {
      handleHostSpin();
    }, 1100);
    return () => clearTimeout(timer);
  }, [mode, roomState, handleHostSpin]);

  // Handle countdown clock & sound warning during question phase
  const questionPhase = roomState?.phase;
  const questionStartedAt = roomState?.questionStartedAt;
  const questionTimeSec = roomState?.settings.questionTimeSec ?? 20;

  useEffect(() => {
    if (questionPhase !== 'question' || !questionStartedAt) return;

    const updateClock = () => {
      const elapsedSec = (Date.now() - questionStartedAt) / 1000;
      const rem = Math.max(0, Math.ceil(questionTimeSec - elapsedSec));
      setTimeLeftSec((prev) => {
        if (rem !== prev && rem > 0 && rem <= 5) {
          soundEngine.playTimerWarn();
        }
        return rem;
      });
    };

    updateClock();
    const id = setInterval(updateClock, 250);
    return () => clearInterval(id);
  }, [questionPhase, questionStartedAt, questionTimeSec]);

  // Trigger reveal sound + confetti when phase changes to 'reveal' or 'finished'
  const lastRevealIdRef = useRef<string>('');
  useEffect(() => {
    if (!roomState?.lastReveal) return;
    const key = `${roomState.turnNumber}-${roomState.lastReveal.questionId}`;
    if (lastRevealIdRef.current === key) return;
    lastRevealIdRef.current = key;

    const mySub = roomState.lastReveal.submissions[myPlayerId];
    if (roomState.lastReveal.crownAwardedTo?.playerId === myPlayerId || roomState.winnerId === myPlayerId) {
      soundEngine.playCrown();
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.65 } });
    } else if (mySub?.isCorrect) {
      soundEngine.playCorrect();
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
    } else if (mySub && !mySub.isCorrect) {
      soundEngine.playWrong();
    }
  }, [roomState?.lastReveal, roomState?.turnNumber, roomState?.winnerId, myPlayerId]);

  // Persist match stats when finished
  useEffect(() => {
    if (!roomState || roomState.phase !== 'finished') return;
    const matchKey = `${roomState.roomCode}-${roomState.turnNumber}-${roomState.winnerId}`;
    if (recordedMatchKeyRef.current === matchKey) return;
    const me = roomState.players.find((p) => p.id === myPlayerId);
    if (!me) return;

    recordedMatchKeyRef.current = matchKey;
    fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: me.name,
        mode: roomState.players.length === 1 ? 'solo' : mode === 'host_p2p' || mode === 'client_p2p' ? 'p2p' : 'bots',
        difficulty: roomState.settings.difficulty,
        score: me.score,
        crowns: me.crowns.length,
        correctAnswers: me.correctCount,
        won: roomState.winnerId === me.id,
      }),
    })
      .then(() => refreshUser())
      .catch(() => {});
  }, [roomState, myPlayerId, mode, refreshUser]);

  // Start Host Room (P2P or Local Instant)
  const createRoom = async (withP2P: boolean) => {
    cleanupConnections();
    recordedMatchKeyRef.current = '';
    usedQuestionIdsRef.current.clear();

    const code = generateRoomCode();
    const pin = generateRoomPin();
    roomPinRef.current = pin;
    setRoomPin(pin);

    const hostId = 'host-' + Math.random().toString(36).slice(2, 8);
    setMyPlayerId(hostId);

    const settings: RoomSettings = {
      difficulty,
      crownsToWin,
      questionTimeSec: DIFFICULTY_META[difficulty].timeSec,
      enableExternalApi,
      maxPlayers: 5,
    };

    const initial = createInitialRoomState(
      code,
      { id: hostId, name: playerName.trim() || 'HostNerd', avatarColor },
      settings
    );

    hostRoomStateRef.current = initial;
    setRoomState(initial);
    setMode(withP2P ? 'host_p2p' : 'host_local');
    soundEngine.playSelect();

    if (withP2P) {
      setP2pStatus('connecting');
      setP2pError(null);
      const inviteUrl = `${window.location.origin}/perguntados?room=${code}&pin=${pin}`;
      QRCode.toDataURL(inviteUrl, { width: 220, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => {});

      try {
        const peer = await createHostPeer(
          code,
          () => setP2pStatus('online'),
          (conn) => {
            let assignedPlayerId: string | null = null;

            conn.on('data', (raw) => {
              const msg = raw as ClientToHostMsg;
              const cur = hostRoomStateRef.current;
              if (!cur || !msg || typeof msg !== 'object') return;

              if (msg.type === 'join_request') {
                if (msg.pin.trim() !== roomPinRef.current) {
                  conn.send({ type: 'rejected', reason: 'PIN da sala incorreto.' } satisfies HostToClientMsg);
                  setTimeout(() => conn.close(), 250);
                  return;
                }
                if (cur.players.length >= cur.settings.maxPlayers) {
                  conn.send({
                    type: 'rejected',
                    reason: 'Sala cheia (máximo de 5 dispositivos conectados).',
                  } satisfies HostToClientMsg);
                  setTimeout(() => conn.close(), 250);
                  return;
                }
                if (cur.phase !== 'lobby') {
                  conn.send({
                    type: 'rejected',
                    reason: 'Esta partida já está em andamento.',
                  } satisfies HostToClientMsg);
                  setTimeout(() => conn.close(), 250);
                  return;
                }

                const pid = 'peer-' + Math.random().toString(36).slice(2, 8);
                assignedPlayerId = pid;
                peerConnsRef.current.set(pid, conn);

                const cleanName = (msg.name || 'Convidado').trim().slice(0, 20);
                const nextState: PublicRoomState = {
                  ...cur,
                  players: [
                    ...cur.players,
                    {
                      id: pid,
                      name: cleanName,
                      avatarColor: msg.avatarColor || AVATAR_PALETTE[cur.players.length % AVATAR_PALETTE.length],
                      isHost: false,
                      score: 0,
                      streak: 0,
                      correctCount: 0,
                      answeredCount: 0,
                      crownCharge: 0,
                      crowns: [],
                      connected: true,
                    },
                  ],
                };
                conn.send({ type: 'welcome', playerId: pid, state: nextState } satisfies HostToClientMsg);
                broadcastState(nextState);
                soundEngine.playSelect();
              } else if (msg.type === 'request_spin' && assignedPlayerId) {
                if (cur.activePlayerId === assignedPlayerId && cur.phase === 'spinning') {
                  handleHostSpin();
                }
              } else if (msg.type === 'choose_crown_category' && assignedPlayerId) {
                if (cur.activePlayerId === assignedPlayerId && cur.phase === 'choosing_crown') {
                  startQuestionForCategory(msg.category);
                }
              } else if (msg.type === 'submit_answer' && assignedPlayerId) {
                handleSubmitAnswerOnHost(assignedPlayerId, msg.selectedIndex, msg.timeMs);
              }
            });

            conn.on('close', () => {
              if (!assignedPlayerId) return;
              peerConnsRef.current.delete(assignedPlayerId);
              const cur = hostRoomStateRef.current;
              if (!cur) return;

              if (cur.phase === 'lobby') {
                broadcastState({
                  ...cur,
                  players: cur.players.filter((p) => p.id !== assignedPlayerId),
                });
              } else {
                broadcastState({
                  ...cur,
                  players: cur.players.map((p) =>
                    p.id === assignedPlayerId ? { ...p, connected: false } : p
                  ),
                });
              }
            });
          },
          (err) => {
            setP2pStatus('error');
            setP2pError(err);
          }
        );
        hostPeerRef.current = peer;
      } catch {
        setP2pStatus('error');
        setP2pError('Falha ao iniciar sinalização WebRTC.');
      }
    }
  };

  // Join an existing P2P Room from another phone/browser
  const joinExistingRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const code = joinCode.trim().toUpperCase();
    const pin = joinPin.trim();
    if (code.length < 4) {
      setJoinError('Digite o código da sala.');
      return;
    }
    if (pin.length < 4) {
      setJoinError('Digite o PIN de 4 dígitos.');
      return;
    }

    cleanupConnections();
    setJoining(true);
    recordedMatchKeyRef.current = '';

    try {
      const { peer, conn } = await connectAsClientPeer(
        code,
        {
          name: playerName.trim() || 'Jogador',
          avatarColor,
          pin,
        },
        {
          onWelcome: (pid, state) => {
            setMyPlayerId(pid);
            setRoomState(state);
            setMode('client_p2p');
            setP2pStatus('online');
            soundEngine.playSelect();
          },
          onStateUpdate: (state) => {
            setRoomState(state);
          },
          onRejected: (reason) => {
            setJoinError(reason);
          },
          onDisconnected: () => {
            setP2pStatus('error');
            setP2pError('Conexão com o Host da sala foi encerrada.');
          },
          onError: (err) => {
            setP2pError(err);
          },
        }
      );
      clientPeerRef.current = { peer, conn };
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Erro ao conectar na sala.');
    } finally {
      setJoining(false);
    }
  };

  // Lobby Host Actions
  const addBot = () => {
    const state = hostRoomStateRef.current;
    if (!state || state.players.length >= state.settings.maxPlayers) return;
    const usedNames = new Set(state.players.map((p) => p.name));
    const profile = BOT_PROFILES.find((b) => !usedNames.has(b.name)) ?? {
      name: `CyberBot-${state.players.length}`,
      color: AVATAR_PALETTE[state.players.length % AVATAR_PALETTE.length],
    };

    const botLevel =
      state.settings.difficulty === 'misto' ? 'medio' : state.settings.difficulty;

    broadcastState({
      ...state,
      players: [
        ...state.players,
        {
          id: 'bot-' + Math.random().toString(36).slice(2, 7),
          name: profile.name,
          avatarColor: profile.color,
          isHost: false,
          isBot: true,
          botLevel,
          score: 0,
          streak: 0,
          correctCount: 0,
          answeredCount: 0,
          crownCharge: 0,
          crowns: [],
          connected: true,
        },
      ],
    });
    soundEngine.playSelect();
  };

  const removePlayer = (pid: string) => {
    const state = hostRoomStateRef.current;
    if (!state || pid === myPlayerId) return;
    const conn = peerConnsRef.current.get(pid);
    conn?.close();
    peerConnsRef.current.delete(pid);
    broadcastState({
      ...state,
      players: state.players.filter((p) => p.id !== pid),
    });
  };

  const startMatch = () => {
    const state = hostRoomStateRef.current;
    if (!state) return;
    soundEngine.playSelect();
    broadcastState({
      ...state,
      phase: 'spinning',
      activePlayerId: state.players[0].id,
      turnNumber: 1,
    });
  };

  // Player actions (works seamlessly whether Host or Client P2P!)
  const isHost = mode === 'host_p2p' || mode === 'host_local';

  const triggerSpin = () => {
    if (!roomState || roomState.activePlayerId !== myPlayerId) return;
    if (isHost) {
      handleHostSpin();
    } else {
      clientPeerRef.current?.conn.send({ type: 'request_spin' } satisfies ClientToHostMsg);
    }
  };

  const chooseCrownCategory = (cat: CategoryId) => {
    if (!roomState || roomState.activePlayerId !== myPlayerId) return;
    soundEngine.playSelect();
    if (isHost) {
      startQuestionForCategory(cat);
    } else {
      clientPeerRef.current?.conn.send({
        type: 'choose_crown_category',
        category: cat,
      } satisfies ClientToHostMsg);
    }
  };

  const submitAnswer = (optionIdx: number, clickedAtMs: number) => {
    if (!roomState || roomState.phase !== 'question' || selectedOption !== null) return;
    setAnswerChoice({ key: currentQuestionKey, idx: optionIdx });
    soundEngine.playSelect();
    const timeMs = clickedAtMs - (roomState.questionStartedAt ?? clickedAtMs);

    if (isHost) {
      handleSubmitAnswerOnHost(myPlayerId, optionIdx, timeMs);
    } else {
      clientPeerRef.current?.conn.send({
        type: 'submit_answer',
        selectedIndex: optionIdx,
        timeMs,
      } satisfies ClientToHostMsg);
    }
  };

  const nextTurn = () => {
    if (!isHost || !hostRoomStateRef.current) return;
    soundEngine.playSelect();
    broadcastState(advanceToNextTurn(hostRoomStateRef.current));
  };

  const restartMatch = () => {
    if (!isHost || !hostRoomStateRef.current) return;
    recordedMatchKeyRef.current = '';
    usedQuestionIdsRef.current.clear();
    const cur = hostRoomStateRef.current;
    broadcastState({
      ...cur,
      phase: 'spinning',
      turnNumber: 1,
      activePlayerId: cur.players[0].id,
      selectedCategory: null,
      isCrownRound: false,
      currentQuestion: null,
      questionStartedAt: null,
      lastReveal: null,
      winnerId: null,
      answeredPlayerIds: [],
      players: cur.players.map((p) => ({
        ...p,
        score: 0,
        streak: 0,
        correctCount: 0,
        answeredCount: 0,
        crownCharge: 0,
        crowns: [],
      })),
    });
  };

  const leaveRoom = () => {
    cleanupConnections();
    setRoomState(null);
    setMode('menu');
    setP2pStatus('idle');
    setP2pError(null);
    setAnswerChoice(null);
  };

  const copyInviteLink = () => {
    if (!roomState) return;
    const url = `${window.location.origin}/perguntados?room=${roomState.roomCode}&pin=${roomPin}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundEngine.playSelect();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activePlayer = useMemo(
    () => roomState?.players.find((p) => p.id === roomState.activePlayerId) ?? null,
    [roomState]
  );

  // ==========================
  // VIEW 1: SETUP / JOIN MENU
  // ==========================
  if (mode === 'menu' || !roomState) {
    return (
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
        <ThemeBackdrop theme="perguntados" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/80 px-3.5 py-1 font-mono-tech text-xs font-bold text-[#8B5CF6] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#00D68F] animate-pulse" />
              ROLETA 3D · P2P NO NAVEGADOR
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Perguntados{' '}
              <span className="bg-gradient-to-r from-[#FF3D8B] via-[#FFB800] to-[#1CB0F6] bg-clip-text text-transparent">
                Arena 3D
              </span>
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D68F]/35 bg-[#00D68F]/10 px-4 py-2 text-xs font-bold text-[#009964] dark:text-[#4ef2b8] backdrop-blur-md">
            <Wifi className="h-3.5 w-3.5" />
            Host no navegador · 1 a 5 celulares
          </span>
        </div>

        {/* Organic Identity Capsule Bar */}
        <div className="clay-capsule rounded-[30px] p-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                Seu Apelido na Arena
              </label>
              <input
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => setCustomPlayerName(e.target.value)}
                placeholder="Ex: BeanMestre"
                className="clay-inset w-full px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                Cor da Massinha
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomAvatarColor(c)}
                    className={`h-9 w-9 rounded-full transition-transform shadow-md cursor-pointer ${
                      avatarColor === c ? 'scale-115 ring-3 ring-offset-2 ring-[#FF3D8B]' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: c,
                      boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.45)',
                    }}
                    aria-label={`Selecionar cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Create Room Panel */}
          <div className="clay-card p-6 space-y-5 lg:col-span-7">
            <div className="flex items-center gap-3">
              <div className="clay-btn-grape flex h-12 w-12 items-center justify-center rounded-2xl">
                <Gamepad2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Criar Nova Sala</h2>
                <p className="text-xs text-[var(--fg-muted)]">
                  Inicie com 1 jogador (solo/bots) ou conecte até 5 celulares via P2P.
                </p>
              </div>
            </div>

            {/* Difficulty Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Nível de Dificuldade
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {(['facil', 'medio', 'dificil', 'misto'] as RoomDifficulty[]).map((diff) => {
                  const meta = DIFFICULTY_META[diff];
                  const active = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`rounded-2xl p-3.5 text-left transition cursor-pointer ${
                        active
                          ? 'clay-btn-cyan text-white'
                          : 'clay-btn-soft hover:border-[#1CB0F6]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold">{meta.label}</span>
                        <span
                          className={`font-mono-tech text-xs font-bold ${
                            active ? 'text-white/95' : 'text-[#8B5CF6]'
                          }`}
                        >
                          {meta.basePoints}pts
                        </span>
                      </div>
                      <p className={`mt-0.5 text-[11px] ${active ? 'text-white/85' : 'text-[var(--fg-muted)]'}`}>
                        {meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Length + External API */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                  Coroas para Vencer
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[3, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCrownsToWin(n)}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm sm:text-base font-bold transition cursor-pointer ${
                        crownsToWin === n
                          ? 'clay-btn-primary text-white'
                          : 'clay-btn-soft'
                      }`}
                    >
                      <CrownIcon className="h-4 w-4 text-[#FFB800]" />
                      {n} Coroas
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <label className="clay-inset flex cursor-pointer items-center gap-2.5 p-3.5 w-full">
                  <input
                    type="checkbox"
                    checked={enableExternalApi}
                    onChange={(e) => setEnableExternalApi(e.target.checked)}
                    className="h-4 w-4 accent-[#FF3D8B]"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Incluir banco expandido</div>
                    <div className="text-[var(--fg-muted)]">
                      Wikidata / OpenTDB ({extraPool.length})
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => createRoom(true)}
                className="clay-btn-primary flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-4 font-display text-sm font-bold cursor-pointer"
              >
                <Radio className="h-4 w-4" />
                Criar Sala P2P (1 a 5 Celulares)
              </button>

              <button
                type="button"
                onClick={() => createRoom(false)}
                className="clay-btn-mint inline-flex items-center justify-center gap-2 px-5 py-4 font-display text-sm font-bold cursor-pointer"
              >
                <Play className="h-4 w-4" />
                Solo / Bots Offline
              </button>
            </div>
          </div>

          {/* Join Room Panel */}
          <form
            onSubmit={joinExistingRoom}
            className="clay-card p-6 space-y-5 lg:col-span-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="clay-btn-cyan flex h-12 w-12 items-center justify-center rounded-2xl">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">Entrar em Sala P2P</h2>
                  <p className="text-xs text-[var(--fg-muted)]">
                    Conecte direto ao navegador do amigo sem pesar no servidor.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                  Código da Sala (6 letras)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="EX: NX4K9P"
                  className="clay-inset w-full px-4 py-3 font-mono-tech text-lg font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-[#FF3D8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                  PIN de Segurança (4 dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--fg-muted)]" />
                  <input
                    type="text"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="clay-inset w-full pl-10 pr-4 py-3 font-mono-tech text-lg font-bold tracking-widest outline-none focus:ring-2 focus:ring-[#FF3D8B]"
                  />
                </div>
              </div>

              {joinError && (
                <div className="rounded-2xl border-2 border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-300">
                  {joinError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={joining}
              className="clay-btn-cyan w-full inline-flex items-center justify-center gap-2 px-5 py-4 font-display text-sm font-bold disabled:opacity-60 cursor-pointer"
            >
              {joining ? 'Conectando via WebRTC...' : 'Entrar na Sala Agora!'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================
  // VIEW 2: LOBBY
  // ==========================
  if (roomState.phase === 'lobby') {
    return (
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
        <ThemeBackdrop theme="perguntados" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/80 px-3.5 py-1 font-mono-tech text-xs font-bold text-[#8B5CF6]">
              {mode === 'host_p2p' ? 'HOST P2P ATIVO NO NAVEGADOR' : 'ARENA LOCAL INSTANTÂNEA'}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Sala <span className="font-mono-tech text-[#FF3D8B]">{roomState.roomCode}</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={leaveRoom}
            className="clay-btn-soft rounded-full px-5 py-2 text-xs font-bold text-rose-500 cursor-pointer"
          >
            Sair / Encerrar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Players List */}
          <div className="clay-card p-6 space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1CB0F6]" />
                <h2 className="font-display text-xl font-bold">
                  Jogadores ({roomState.players.length}/{roomState.settings.maxPlayers})
                </h2>
              </div>
              {isHost && roomState.players.length < roomState.settings.maxPlayers && (
                <button
                  type="button"
                  onClick={addBot}
                  className="clay-btn-soft inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#8B5CF6] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Bot
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {roomState.players.map((p) => (
                <div
                  key={p.id}
                  className="clay-inset flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                      style={{
                        backgroundColor: p.avatarColor,
                        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.45)',
                      }}
                    >
                      {p.isBot ? <Bot className="h-4 w-4" /> : p.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span>{p.name}</span>
                        {p.isHost && (
                          <span className="clay-pill rounded-full px-2 py-0.5 font-mono-tech text-[10px] text-[#8B5CF6]">
                            HOST
                          </span>
                        )}
                        {p.isBot && (
                          <span className="clay-pill rounded-full px-2 py-0.5 font-mono-tech text-[10px] text-[#1CB0F6]">
                            BOT
                          </span>
                        )}
                        {p.id === myPlayerId && (
                          <span className="clay-pill rounded-full px-2 py-0.5 font-mono-tech text-[10px] text-[#00be7b]">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--fg-muted)]">
                        {p.isHost
                          ? 'Hospedando a sala diretamente do navegador'
                          : p.isBot
                          ? 'IA simulada localmente'
                          : 'Conectado via WebRTC P2P'}
                      </div>
                    </div>
                  </div>

                  {isHost && p.id !== myPlayerId && (
                    <button
                      type="button"
                      onClick={() => removePlayer(p.id)}
                      className="text-[var(--fg-muted)] hover:text-rose-500 p-1 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="clay-inset p-3.5 text-xs text-[var(--fg-muted)] flex flex-wrap gap-3 justify-between">
              <span>
                Dificuldade: <strong>{DIFFICULTY_META[roomState.settings.difficulty].label}</strong>
              </span>
              <span>
                Meta: <strong>{roomState.settings.crownsToWin} Coroas</strong>
              </span>
              <span>
                Tempo: <strong>{roomState.settings.questionTimeSec}s</strong>
              </span>
            </div>

            {isHost ? (
              <button
                type="button"
                onClick={startMatch}
                className="clay-btn-mint w-full inline-flex items-center justify-center gap-2 px-6 py-4 font-display text-base font-bold cursor-pointer"
              >
                <Play className="h-5 w-5" />
                Iniciar Partida Agora ({roomState.players.length}{' '}
                {roomState.players.length === 1 ? 'jogador' : 'jogadores'})
              </button>
            ) : (
              <div className="clay-inset p-4 text-center text-sm font-bold text-[#1CB0F6]">
                Conectado! Aguardando o Host iniciar a partida...
              </div>
            )}
          </div>

          {/* P2P Invite / QR Card */}
          <div className="clay-card p-6 space-y-4 lg:col-span-5 flex flex-col items-center text-center">
            {mode === 'host_p2p' ? (
              <>
                <div className="clay-pill flex items-center gap-2 rounded-full px-3.5 py-1.5">
                  <Shield className="h-4 w-4 text-[#00be7b]" />
                  <span className="font-mono-tech text-xs font-bold">
                    {p2pStatus === 'online'
                      ? 'REDE P2P ATIVA · ZERO CARGA NA VERCEL'
                      : p2pStatus === 'connecting'
                      ? 'REGISTRANDO CANAL P2P...'
                      : 'ERRO NA REDE P2P'}
                  </span>
                </div>

                {p2pError && (
                  <div className="rounded-2xl bg-rose-500/15 p-3 text-xs font-bold text-rose-500">{p2pError}</div>
                )}

                {qrDataUrl && (
                  <div className="rounded-[24px] bg-white p-3.5 shadow-lg">
                    <Image
                      src={qrDataUrl}
                      alt="QR Code da sala"
                      width={176}
                      height={176}
                      unoptimized
                      className="h-44 w-44"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="clay-inset p-3">
                    <div className="text-[10px] font-bold uppercase text-[var(--fg-muted)]">Código</div>
                    <div className="font-mono-tech text-xl font-bold tracking-widest text-[#1CB0F6]">
                      {roomState.roomCode}
                    </div>
                  </div>
                  <div className="clay-inset p-3">
                    <div className="text-[10px] font-bold uppercase text-[var(--fg-muted)]">PIN Seguro</div>
                    <div className="font-mono-tech text-xl font-bold tracking-widest text-[#FF3D8B]">
                      {roomPin}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="clay-btn-soft w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold cursor-pointer"
                >
                  <Copy className="h-4 w-4 text-[#8B5CF6]" />
                  {copiedLink ? 'Link copiado!' : 'Copiar Link de Convite'}
                </button>

                <p className="text-xs text-[var(--fg-muted)]">
                  Até 4 celulares podem escanear o QR Code ou digitar o código + PIN para jogar com você.
                </p>
              </>
            ) : (
              <div className="my-auto space-y-3 py-6">
                <Sparkles className="mx-auto h-12 w-12 text-[#FF3D8B]" />
                <h3 className="font-display text-xl font-bold">Partida Local Instantânea</h3>
                <p className="text-xs text-[var(--fg-muted)]">
                  Você pode iniciar imediatamente sozinho ou adicionar Bots à esquerda. Para
                  conectar outros celulares, crie uma Sala P2P.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // VIEW 3: ACTIVE GAMEPLAY / FINISHED
  // ==========================
  const isMyTurn = roomState.activePlayerId === myPlayerId;
  const currentCatMeta = roomState.selectedCategory
    ? CATEGORY_MAP[roomState.selectedCategory]
    : null;

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
      <ThemeBackdrop theme={roomState.selectedCategory ?? 'perguntados'} />

      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="clay-capsule font-mono-tech rounded-full px-4 py-2 text-xs sm:text-sm font-bold">
            TURNO #{roomState.turnNumber} · {roomState.roomCode}
          </span>
          <span
            className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-bold backdrop-blur-md ${
              DIFFICULTY_META[roomState.settings.difficulty].badgeClass
            }`}
          >
            {DIFFICULTY_META[roomState.settings.difficulty].label}
          </span>
          {currentCatMeta && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-xs sm:text-sm font-bold text-white shadow"
              style={{ backgroundColor: currentCatMeta.color }}
            >
              <CategoryIcon id={currentCatMeta.id} className="h-4 w-4" />
              {currentCatMeta.name}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={leaveRoom}
          className="clay-btn-soft rounded-full px-5 py-2.5 text-sm font-bold text-rose-500 cursor-pointer"
        >
          Sair da Partida
        </button>
      </div>

      {p2pError && (
        <div className="clay-card border-rose-400/50 bg-rose-500/15 p-3 text-center text-xs font-bold text-rose-500">
          {p2pError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Main Stage */}
        <div
          className={`lg:col-span-8 transition-all duration-500 ${
            roomState.phase === 'spinning'
              ? 'clay-stage-pedestal rounded-[36px] p-4 sm:p-6'
              : 'clay-card p-5 sm:p-8'
          }`}
          style={
            roomState.phase !== 'spinning' && currentCatMeta
              ? {
                  borderColor: `${currentCatMeta.color}66`,
                  boxShadow: `0 24px 48px -18px ${currentCatMeta.color}45`,
                }
              : undefined
          }
        >
          {/* PHASE: SPINNING */}
          {roomState.phase === 'spinning' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center space-y-1">
                <div className="font-mono-tech text-xs font-bold text-[#FF3D8B]">
                  {isMyTurn ? 'SUA VEZ DE GIRAR!' : `VEZ DE ${activePlayer?.name.toUpperCase()}`}
                </div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  {activePlayer?.isBot
                    ? `${activePlayer.name} está girando...`
                    : isMyTurn
                    ? 'Gire a Roleta de Massinha 3D!'
                    : `Aguardando ${activePlayer?.name} girar`}
                </h2>
              </div>

              <TriviaWheel3D
                spinId={roomState.wheelSpinId}
                targetSector={roomState.wheelTargetSector}
                isSpinning={roomState.wheelSpinId > 0 && roomState.phase === 'spinning'}
                canSpin={isMyTurn && !activePlayer?.isBot}
                onSpinClick={triggerSpin}
                onSpinComplete={isHost ? handleHostWheelSettled : undefined}
              />
            </div>
          )}

          {/* PHASE: CHOOSING CROWN */}
          {roomState.phase === 'choosing_crown' && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-[#FFB800]/20 text-[#FFB800] animate-float shadow-inner">
                <Crown className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-3xl font-bold">
                  Setor Coroa Especial!
                </h2>
                <p className="text-sm text-[var(--fg-muted)]">
                  {isMyTurn
                    ? 'Escolha qual Coroa você quer conquistar nesta rodada:'
                    : `${activePlayer?.name} está escolhendo a categoria da Coroa...`}
                </p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const alreadyHas = activePlayer?.crowns.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={!isMyTurn || alreadyHas}
                      onClick={() => chooseCrownCategory(cat.id)}
                      className={`clay-btn-soft p-4 text-left transition ${
                        alreadyHas
                          ? 'opacity-45 cursor-not-allowed'
                          : isMyTurn
                          ? 'hover:-translate-y-1 cursor-pointer'
                          : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon id={cat.id} className="h-6 w-6" />
                        </span>
                        {alreadyHas && <CheckCircle2 className="h-5 w-5 text-[#00be7b]" />}
                      </div>
                      <div className="mt-2 font-display text-base font-bold">{cat.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHASE: QUESTION OR REVEAL */}
          {(roomState.phase === 'question' || roomState.phase === 'reveal') &&
            roomState.currentQuestion && (
              <div className="space-y-6">
                {/* Category + Timer Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {currentCatMeta && (
                      <span
                        className={`clay-pill inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold ${currentCatMeta.badgeBg}`}
                      >
                        <CategoryIcon id={currentCatMeta.id} className="h-4 w-4" />
                        <span>{currentCatMeta.name}</span>
                      </span>
                    )}
                    {roomState.isCrownRound && (
                      <span className="clay-pill inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Crown className="h-3.5 w-3.5" /> VALENDO COROA
                      </span>
                    )}
                  </div>

                  {roomState.phase === 'question' && (
                    <div
                      className={`clay-pill inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono-tech text-sm font-bold ${
                        timeLeftSec <= 5
                          ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                          : 'text-[#1CB0F6]'
                      }`}
                    >
                      <Timer className="h-4 w-4" />
                      {timeLeftSec}s
                    </div>
                  )}
                </div>

                {/* Squishy Progress Bar */}
                {roomState.phase === 'question' && (
                  <div className="clay-inset h-3.5 w-full overflow-hidden rounded-full p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, (timeLeftSec / roomState.settings.questionTimeSec) * 100)}%`,
                        backgroundColor: currentCatMeta?.color ?? '#FF3D8B',
                      }}
                    />
                  </div>
                )}

                {/* Question Prompt */}
                <div className="clay-inset p-5">
                  <h2 className="font-display text-xl font-bold leading-snug sm:text-2xl">
                    {roomState.currentQuestion.prompt}
                  </h2>
                </div>

                {/* Answer Options (Squishy Fall Guys Toy Pads) */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {roomState.currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const reveal = roomState.lastReveal;
                    const isCorrectOption = reveal?.correctIndex === idx;
                    const isWrongSelected = reveal && isSelected && !isCorrectOption;

                    let cardStyle = 'clay-btn-soft hover:border-[#1CB0F6]/50';
                    if (roomState.phase === 'question' && isSelected) {
                      cardStyle = 'clay-btn-cyan text-white ring-3 ring-[#1CB0F6]/40';
                    } else if (reveal) {
                      if (isCorrectOption) {
                        cardStyle = 'clay-btn-mint text-white animate-correct';
                      } else if (isWrongSelected) {
                        cardStyle =
                          'rounded-[22px] bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-lg animate-shake';
                      } else {
                        cardStyle = 'clay-inset opacity-55';
                      }
                    }

                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={roomState.phase !== 'question' || selectedOption !== null}
                        onClick={() => submitAnswer(idx, Date.now())}
                        className={`group flex items-center gap-3 rounded-[22px] p-4 text-left transition-all ${cardStyle} ${
                          roomState.phase === 'question' && selectedOption === null
                            ? 'cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono-tech text-sm font-bold shadow-sm ${
                            isCorrectOption || isWrongSelected || (roomState.phase === 'question' && isSelected)
                              ? 'bg-white/25 text-white'
                              : 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
                          }`}
                        >
                          {letters[idx]}
                        </span>
                        <span className="text-sm font-bold sm:text-base flex-1">{opt}</span>
                        {reveal && isCorrectOption && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                        )}
                        {reveal && isWrongSelected && (
                          <XCircle className="h-5 w-5 shrink-0 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Waiting notice */}
                {roomState.phase === 'question' && selectedOption !== null && (
                  <div className="clay-inset px-4 py-3 text-center text-xs font-bold text-[#1CB0F6]">
                    Resposta travada! Aguardando os demais jogadores ({roomState.answeredPlayerIds.length}/
                    {roomState.players.filter((p) => p.connected).length})...
                  </div>
                )}

                {/* Reveal Explanation & Next Turn */}
                {roomState.phase === 'reveal' && roomState.lastReveal && (
                  <div className="clay-inset space-y-4 p-5">
                    {roomState.lastReveal.crownAwardedTo && (
                      <div className="clay-pill flex items-center gap-2 rounded-2xl bg-amber-400/20 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Crown className="h-4 w-4 text-[#FFB800]" />
                        <span>
                          {
                            roomState.players.find(
                              (p) => p.id === roomState.lastReveal?.crownAwardedTo?.playerId
                            )?.name
                          }{' '}
                          conquistou a Coroa de{' '}
                          {CATEGORY_MAP[roomState.lastReveal.crownAwardedTo.category].name}!
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="font-mono-tech text-[11px] font-bold uppercase text-[#8B5CF6]">
                        {'// Curiosidade da Arena'}
                      </div>
                      <p className="mt-1 text-sm font-medium text-[var(--fg)]">
                        {roomState.lastReveal.explanation}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {roomState.players.map((p) => {
                        const sub = roomState.lastReveal?.submissions[p.id];
                        return (
                          <span
                            key={p.id}
                            className={`clay-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              sub?.isCorrect
                                ? 'text-[#00be7b]'
                                : 'text-rose-500'
                            }`}
                          >
                            <span>{p.name}:</span>
                            <strong>{sub?.isCorrect ? `+${sub.pointsEarned}pts` : 'Errou'}</strong>
                          </span>
                        );
                      })}
                    </div>

                    {isHost ? (
                      <button
                        type="button"
                        onClick={nextTurn}
                        className="clay-btn-primary w-full py-4 font-display text-sm font-bold cursor-pointer"
                      >
                        Continuar para o Próximo Turno →
                      </button>
                    ) : (
                      <div className="text-center text-xs font-bold text-[var(--fg-muted)]">
                        Aguardando o Host avançar o turno...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* PHASE: FINISHED */}
          {roomState.phase === 'finished' && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFB800]/20 text-[#FFB800] animate-float">
                <Trophy className="h-11 w-11" />
              </div>
              <div>
                <div className="font-mono-tech text-xs font-bold text-[#FF3D8B]">
                  COROA CONQUISTADA!
                </div>
                <h2 className="font-display text-3xl font-bold mt-1 sm:text-4xl">
                  {roomState.players.find((p) => p.id === roomState.winnerId)?.name} Venceu!
                </h2>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  Completou as {roomState.settings.crownsToWin} coroas da arena.
                </p>
              </div>

              <div className="space-y-2.5 max-w-md mx-auto text-left">
                {[...roomState.players]
                  .sort((a, b) => b.crowns.length - a.crowns.length || b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="clay-inset flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono-tech text-sm font-bold text-[#FF3D8B]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono-tech text-xs font-bold">
                        <span className="inline-flex items-center gap-1">
                          <CrownIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                          {p.crowns.length}
                        </span>
                        <span className="text-[#1CB0F6]">{p.score} pts</span>
                      </div>
                    </div>
                  ))}
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={restartMatch}
                  className="clay-btn-primary inline-flex items-center gap-2 px-7 py-4 font-display text-sm font-bold cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  Jogar Novamente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scoreboard Sidebar */}
        <aside className="clay-card p-5 space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#FFB800]" />
              Placar da Arena
            </h3>
            <span className="clay-pill inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono-tech text-xs font-bold text-[var(--fg-muted)]">
              Meta: {roomState.settings.crownsToWin}
              <CrownIcon className="h-3.5 w-3.5 text-[#FFB800]" />
            </span>
          </div>

          <div className="space-y-3">
            {roomState.players.map((p) => {
              const isTurn = p.id === roomState.activePlayerId;
              return (
                <div
                  key={p.id}
                  className={`clay-inset p-3.5 transition-all ${
                    isTurn ? 'ring-2 ring-[#FF3D8B]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                        style={{
                          backgroundColor: p.avatarColor,
                          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.45)',
                        }}
                      >
                        {p.isBot ? <Bot className="h-4 w-4" /> : p.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isTurn && (
                            <span className="rounded-full bg-[#FF3D8B] px-2 py-0.5 font-mono-tech text-[9px] text-white">
                              VEZ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
                          <span className="font-mono-tech font-bold text-[#1CB0F6]">
                            {p.score} pts
                          </span>
                          {p.streak > 1 && (
                            <span className="inline-flex items-center gap-0.5 text-[#FFB800] font-bold">
                              <Flame className="h-3 w-3" /> {p.streak}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Crown charge dots (0..3) */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1" title="Carga para próxima Coroa (3 acertos)">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className={`h-2.5 w-2.5 rounded-full ${
                              dot < p.crownCharge
                                ? 'bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.9)]'
                                : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono-tech text-[11px] font-bold text-[var(--fg-muted)]">
                        {p.crowns.length}/{roomState.settings.crownsToWin}
                        <CrownIcon className="h-3 w-3 text-[#FFB800]" />
                      </span>
                    </div>
                  </div>

                  {/* Collected Category Crowns */}
                  <div className="mt-2.5 flex gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const owned = p.crowns.includes(cat.id);
                      return (
                        <span
                          key={cat.id}
                          title={cat.name}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                            owned
                              ? 'shadow-sm scale-105'
                              : 'bg-slate-200/70 dark:bg-slate-800/70 opacity-35 grayscale'
                          }`}
                          style={
                            owned
                              ? {
                                  backgroundColor: `${cat.color}28`,
                                  boxShadow: `inset 0 -2px 0 ${cat.color}66`,
                                  border: `1.5px solid ${cat.color}`,
                                  color: cat.color,
                                }
                              : undefined
                          }
                        >
                          <CategoryIcon id={cat.id} className="h-4 w-4" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
