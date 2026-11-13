'use client';

import { useEffect, useState } from 'react';
import { Crown, Database, History, Medal, Trophy } from 'lucide-react';
import { ThemeBackdrop } from '@/components/ThemeBackdrop';

interface LeaderboardData {
  topUsers: Array<{
    id: string;
    displayName: string;
    avatarColor: string;
    totalPoints: number;
    gamesPlayed: number;
    wins: number;
    correctAnswers: number;
  }>;
  recentMatches: Array<{
    id: string;
    playerName: string;
    mode: string;
    difficulty: string;
    score: number;
    crowns: number;
    won: boolean;
    createdAt: string;
  }>;
  storageMode: 'neon-postgres' | 'local-json';
}

export default function RankingPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: LeaderboardData) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <ThemeBackdrop theme="studio" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/80 px-3.5 py-1 font-mono-tech text-xs font-bold text-[#FFB800]">
            HALL DA FAMA &amp; TELEMETRIA
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Ranking da{' '}
            <span className="bg-gradient-to-r from-[#FFB800] via-[#FF3D8B] to-[#8B5CF6] bg-clip-text text-transparent">
              Arena
            </span>
          </h1>
        </div>

        {data && (
          <span className="clay-pill inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono-tech text-xs font-bold">
            <Database className="h-3.5 w-3.5 text-[#8B5CF6]" />
            {data.storageMode === 'neon-postgres'
              ? 'Conectado ao Neon Postgres (Vercel)'
              : 'Modo Local JSON (Configure DATABASE_URL na Vercel)'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="clay-card p-10 text-center font-mono-tech text-sm text-[var(--fg-muted)]">
          Carregando placares...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="clay-card p-6 space-y-4 lg:col-span-7">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#FFB800]" />
              Melhores Jogadores Cadastrados
            </h2>

            {!data?.topUsers.length ? (
              <p className="text-sm text-[var(--fg-muted)] py-6 text-center">
                Nenhum jogador pontuou ainda. Crie sua conta e complete uma partida!
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.topUsers.map((u, idx) => (
                  <div
                    key={u.id}
                    className="clay-inset flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tech text-sm font-bold w-6 text-[#8B5CF6]">
                        {idx === 0 ? <Medal className="h-5 w-5 text-[#FFB800]" /> : `#${idx + 1}`}
                      </span>
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                        style={{ backgroundColor: u.avatarColor }}
                      >
                        {u.displayName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-bold">{u.displayName}</div>
                        <div className="text-[11px] text-[var(--fg-muted)]">
                          {u.gamesPlayed} partidas · {u.wins} vitórias · {u.correctAnswers} acertos
                        </div>
                      </div>
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#1CB0F6]">
                      {u.totalPoints} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="clay-card p-6 space-y-4 lg:col-span-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-[#FF3D8B]" />
              Partidas Recentes
            </h2>

            {!data?.recentMatches.length ? (
              <p className="text-sm text-[var(--fg-muted)] py-6 text-center">
                Nenhuma partida finalizada registrada ainda.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.recentMatches.map((m) => (
                  <div
                    key={m.id}
                    className="clay-inset flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{m.playerName}</span>
                        {m.won && <Crown className="h-3.5 w-3.5 text-[#FFB800]" />}
                      </div>
                      <div className="text-[11px] text-[var(--fg-muted)]">
                        {m.mode.toUpperCase()} · {m.difficulty} · {m.crowns} coroas
                      </div>
                    </div>
                    <span className="font-mono-tech font-bold text-[#1CB0F6]">
                      {m.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
