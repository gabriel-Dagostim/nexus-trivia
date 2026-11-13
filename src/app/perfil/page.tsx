'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Plus,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { PERFIL_CARDS } from '@/data/perfil/cards';
import { DIFFICULTY_META, PERFIL_THEMES, PERFIL_THEME_MAP } from '@/lib/categories';
import { soundEngine } from '@/lib/sound';
import { ThemeBackdrop } from '@/components/ThemeBackdrop';
import { PerfilArtwork } from '@/components/PerfilArtwork';
import { PerfilThemeIcon } from '@/components/GameIcons';
import type { PerfilTheme, QuestionDifficulty } from '@/types/game';

interface TabletopPlayer {
  id: string;
  name: string;
  score: number;
  color: string;
}

const PAWN_COLORS = ['#FF3D8B', '#1CB0F6', '#00D68F', '#FFB800', '#8B5CF6', '#FF5A5F'];

export default function PerfilPage() {
  const [view, setView] = useState<'room' | 'card'>('room');
  const [selectedTheme, setSelectedTheme] = useState<'all' | PerfilTheme>('all');
  const [selectedDiff, setSelectedDiff] = useState<'all' | QuestionDifficulty>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [shuffledSeed, setShuffledSeed] = useState(1);

  const [revealedClues, setRevealedClues] = useState<number[]>([0]);
  const [answerFlipped, setAnswerFlipped] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [shieldLocked, setShieldLocked] = useState(true);

  // Tabletop optional timer
  const [timerPreset, setTimerPreset] = useState<0 | 30 | 60>(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Scoreboard
  const [players, setPlayers] = useState<TabletopPlayer[]>([
    { id: 't1', name: 'Equipe Neon', score: 0, color: '#FF3D8B' },
    { id: 't2', name: 'Equipe Ciano', score: 0, color: '#1CB0F6' },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [lastAwardBanner, setLastAwardBanner] = useState<string | null>(null);
  const awardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countsByTheme = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of PERFIL_CARDS) {
      counts[c.theme] = (counts[c.theme] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredCards = useMemo(() => {
    const base = PERFIL_CARDS.filter((c) => {
      if (selectedTheme !== 'all' && c.theme !== selectedTheme) return false;
      if (selectedDiff !== 'all' && c.difficulty !== selectedDiff) return false;
      return true;
    });
    const list = base.length > 0 ? [...base] : [...PERFIL_CARDS];
    return list.sort((a, b) => {
      const ha = Math.sin(shuffledSeed * 91 + a.id.charCodeAt(0) * 17 + a.id.charCodeAt(a.id.length - 1)) * 10000;
      const hb = Math.sin(shuffledSeed * 91 + b.id.charCodeAt(0) * 17 + b.id.charCodeAt(b.id.length - 1)) * 10000;
      return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
    });
  }, [selectedTheme, selectedDiff, shuffledSeed]);

  const currentCard = filteredCards[cardIndex % filteredCards.length];
  const themeMeta = PERFIL_THEME_MAP[currentCard.theme];
  const maxPointsRemaining = Math.max(1, 11 - revealedClues.length);
  const maxLeaderScore = Math.max(20, ...players.map((p) => p.score));

  const resetRoundUI = (nextTimerPreset = timerPreset, startTimer = false) => {
    setRevealedClues([0]);
    setAnswerFlipped(false);
    setPeeking(false);
    setShieldLocked(true);
    setLastAwardBanner(null);
    setTimeLeft(nextTimerPreset);
    setTimerActive(startTimer && nextTimerPreset > 0);
  };

  useEffect(() => {
    if (!timerActive || timerPreset === 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          soundEngine.playWrong();
          return 0;
        }
        if (prev <= 6) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive, timerPreset]);

  const openDeckIntoCardView = (nextTheme: 'all' | PerfilTheme) => {
    setSelectedTheme(nextTheme);
    setShuffledSeed((s) => s + 1);
    setCardIndex(0);
    resetRoundUI(timerPreset, true);
    setView('card');
    soundEngine.playCardFlip();
  };

  const backToRoom = () => {
    setTimerActive(false);
    setView('room');
    soundEngine.playSelect();
  };

  const drawNextCard = () => {
    setCardIndex((prev) => (prev + 1) % filteredCards.length);
    resetRoundUI(timerPreset, true);
    soundEngine.playCardFlip();
  };

  const drawRandomCard = () => {
    setShuffledSeed((s) => s + 1);
    setCardIndex(0);
    resetRoundUI(timerPreset, true);
    soundEngine.playSpinStart();
  };

  const toggleClue = (idx: number) => {
    setRevealedClues((prev) => {
      if (prev.includes(idx)) {
        return prev.length > 1 ? prev.filter((item) => item !== idx) : prev;
      }
      soundEngine.playSelect();
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const revealNextClue = () => {
    for (let i = 0; i < currentCard.clues.length; i++) {
      if (!revealedClues.includes(i)) {
        setRevealedClues((prev) => [...prev, i]);
        soundEngine.playSelect();
        return;
      }
    }
  };

  const revealAllClues = () => {
    setRevealedClues(currentCard.clues.map((_, idx) => idx));
    soundEngine.playSelect();
  };

  const toggleFlipAnswer = () => {
    if (shieldLocked && !answerFlipped) {
      setShieldLocked(false);
    }
    setAnswerFlipped((v) => !v);
    soundEngine.playCardFlip();
  };

  const addPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        name: trimmed.slice(0, 18),
        score: 0,
        color: PAWN_COLORS[prev.length % PAWN_COLORS.length],
      },
    ]);
    setNewPlayerName('');
    setShowAddPlayer(false);
    soundEngine.playSelect();
  };

  const removePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    soundEngine.playSelect();
  };

  const awardPointsToPlayer = (playerId: string, pts: number) => {
    const winner = players.find((p) => p.id === playerId);
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, score: Math.max(0, p.score + pts) } : p))
    );
    soundEngine.playCrown();
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.72 },
      colors: [themeMeta.color, '#FFB800', '#00D68F', '#FFFFFF'],
    });
    if (winner) {
      setLastAwardBanner(`+${pts} pts para ${winner.name}`);
      if (awardTimeoutRef.current) clearTimeout(awardTimeoutRef.current);
      awardTimeoutRef.current = setTimeout(() => setLastAwardBanner(null), 3200);
    }
  };

  const resetAllScores = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setLastAwardBanner(null);
    soundEngine.playSelect();
  };

  const changeTimerPreset = (sec: 0 | 30 | 60) => {
    setTimerPreset(sec);
    setTimeLeft(sec);
    setTimerActive(view === 'card' && sec > 0);
    soundEngine.playSelect();
  };

  const showAnswerContent = answerFlipped || peeking;

  // =========================================================
  // TELA 1: SALA DO PERFIL (ESCOLHA DE TEMAS E PLACAR DA MESA)
  // =========================================================
  if (view === 'room') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] pb-16">
        <ThemeBackdrop theme="perfil-lobby" />

        <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 space-y-7">
          {/* Header Sala */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/85 px-4 py-1.5 font-mono-tech text-xs font-bold text-[#00D68F] backdrop-blur-md">
                PERFIL · MESA FÍSICA · {PERFIL_CARDS.length} CARTAS · {PERFIL_THEMES.length} TEMAS
              </div>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Escolha um{' '}
                <span className="bg-gradient-to-r from-[#FFB800] via-[#FF3D8B] to-[#1CB0F6] bg-clip-text text-transparent">
                  Baralho
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timer Selector */}
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 p-1.5 backdrop-blur-md">
                <span className="flex items-center gap-1.5 pl-3 pr-1 text-xs sm:text-sm font-bold text-[var(--fg-muted)]">
                  <Clock className="h-4 w-4 text-[#8B5CF6]" />
                  Timer:
                </span>
                {([0, 30, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => changeTimerPreset(sec)}
                    className={`rounded-full px-3.5 py-2 font-mono-tech text-xs sm:text-sm font-bold transition cursor-pointer ${
                      timerPreset === sec
                        ? 'bg-[#8B5CF6] text-white shadow'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {sec === 0 ? 'Livre' : `${sec}s`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openDeckIntoCardView('all')}
                className="clay-btn-primary inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-display text-base font-bold cursor-pointer"
              >
                <Shuffle className="h-5 w-5" />
                Sortear Qualquer Tema
              </button>
            </div>
          </div>

          {/* Difficulty Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/85 p-1.5 backdrop-blur-md">
              {(['all', 'facil', 'medio', 'dificil'] as const).map((diff) => {
                const label =
                  diff === 'all'
                    ? 'Todas as Dificuldades'
                    : diff === 'facil'
                    ? 'Fácil'
                    : diff === 'medio'
                    ? 'Médio'
                    : 'Difícil';
                const active = selectedDiff === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      setSelectedDiff(diff);
                      soundEngine.playSelect();
                    }}
                    className={`rounded-full px-4 py-2 font-display text-sm font-bold transition cursor-pointer ${
                      active
                        ? 'bg-[var(--fg)] text-[var(--bg)] shadow'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Placar da Sala */}
          <section className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)]/85 p-5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#8B5CF6]" />
                <h2 className="font-display text-lg font-bold">Placar da Sala</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {showAddPlayer ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Nome / Equipe..."
                      className="rounded-full border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold outline-none focus:border-[#1CB0F6]"
                    />
                    <button
                      type="button"
                      onClick={addPlayer}
                      className="clay-btn-mint rounded-full px-4 py-2 font-display text-sm font-bold cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPlayer(false)}
                      className="rounded-full px-3 py-2 text-sm font-bold text-[var(--fg-muted)] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddPlayer(true)}
                    className="clay-btn-soft flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-[#1CB0F6]" />
                    Adicionar Jogador
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetAllScores}
                  title="Zerar pontos da sala"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-rose-500 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {players.map((p) => {
                const pct = Math.min(100, Math.round((p.score / maxLeaderScore) * 100));
                return (
                  <div
                    key={p.id}
                    className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white shadow-sm"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate font-display text-base font-bold">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech text-base font-bold" style={{ color: p.color }}>
                          {p.score} pts
                        </span>
                        {players.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlayer(p.id)}
                            aria-label={`Remover ${p.name}`}
                            className="opacity-0 transition group-hover:opacity-100 text-[var(--fg-muted)] hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, pct)}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 10 DECKS VISUAIS CLICÁVEIS — Clique abre a carta focada! */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              Toque em um tema para puxar carta
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {PERFIL_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openDeckIntoCardView(t.id)}
                  style={{
                    borderColor: `${t.color}66`,
                    background: `linear-gradient(155deg, var(--bg-card) 20%, ${t.color}22 100%)`,
                  }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 p-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer"
                >
                  <div className="card-holo-sheen pointer-events-none absolute inset-0" />
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110"
                      style={{ backgroundColor: t.color }}
                    >
                      <PerfilThemeIcon id={t.id} className="h-5 w-5" />
                    </span>
                    <span
                      className="rounded-full px-3 py-1 font-mono-tech text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: t.color }}
                    >
                      {countsByTheme[t.id] ?? 0}
                    </span>
                  </div>

                  <div className="relative z-10 my-3 flex justify-center">
                    <PerfilArtwork
                      theme={t.id}
                      color={t.color}
                      className="h-24 w-24 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="font-display text-lg font-bold">{t.name}</div>
                    <p className="mt-0.5 text-xs text-[var(--fg-muted)] line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================
  // TELA 2: CARTA SELECIONADA EM FOCO (COM VOLTAR PARA A SALA)
  // =========================================================
  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-14">
      <ThemeBackdrop theme={currentCard.theme} />

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 space-y-6">
        {/* TOP FOCUSED BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={backToRoom}
              className="clay-btn-soft inline-flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm sm:text-base font-bold cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-[#1CB0F6]" />
              Voltar para a Sala
            </button>

            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-bold text-white shadow"
              style={{ backgroundColor: themeMeta.color }}
            >
              <PerfilThemeIcon id={currentCard.theme} className="h-4 w-4" />
              {themeMeta.name}
            </span>

            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2 font-mono-tech text-sm font-bold text-[#00D68F]">
              Valendo {maxPointsRemaining} pts
            </span>

            {timerPreset > 0 && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono-tech text-sm font-bold ${
                  timeLeft <= 6 && timerActive
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'border border-[var(--border)] bg-[var(--bg-card)]/90'
                }`}
              >
                <Clock className="h-4 w-4" />
                {timeLeft}s
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={drawRandomCard}
              className="clay-btn-soft inline-flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold cursor-pointer"
            >
              <Shuffle className="h-4 w-4 text-[#1CB0F6]" />
              Embaralhar
            </button>

            <button
              type="button"
              onClick={drawNextCard}
              className="clay-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm sm:text-base font-bold cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Próxima Carta ({(cardIndex % filteredCards.length) + 1}/{filteredCards.length})
            </button>
          </div>
        </div>

        {lastAwardBanner && (
          <div className="animate-correct mx-auto w-fit rounded-full bg-[#00D68F] px-6 py-2 font-display text-sm sm:text-base font-bold text-white shadow-lg">
            {lastAwardBanner}
          </div>
        )}

        {/* FOCUSED CARD + 10 DICAS ONLY */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT: 3D COLLECTOR CARD */}
          <div className="lg:col-span-5 space-y-4">
            <div className="perspective-1200">
              <div
                className={`preserve-3d relative min-h-[500px] w-full transition-transform duration-700 ${
                  showAnswerContent ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT */}
                <div
                  className="backface-hidden group relative flex h-full min-h-[500px] flex-col justify-between overflow-hidden rounded-[36px] border-2 p-6 sm:p-7 shadow-[0_26px_48px_-14px_rgba(15,23,42,0.32)]"
                  style={{
                    borderColor: `${themeMeta.color}77`,
                    background: `linear-gradient(160deg, var(--bg-card) 15%, color-mix(in srgb, ${themeMeta.color} 22%, var(--bg-card)) 100%)`,
                  }}
                >
                  <div className="card-holo-sheen pointer-events-none absolute inset-0" />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-sm font-bold text-white shadow"
                      style={{ backgroundColor: themeMeta.color }}
                    >
                      <PerfilThemeIcon id={currentCard.theme} className="h-4 w-4" />
                      {themeMeta.name}
                    </span>

                    <span className={`rounded-full border px-3.5 py-1 text-xs font-bold ${DIFFICULTY_META[currentCard.difficulty].badgeClass}`}>
                      {currentCard.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="relative z-10 my-4 flex flex-col items-center text-center">
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute inset-4 rounded-full blur-2xl opacity-40"
                        style={{ backgroundColor: themeMeta.color }}
                      />
                      <PerfilArtwork
                        theme={currentCard.theme}
                        color={themeMeta.color}
                        className="relative h-44 w-44 drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/[0.08] px-4 py-1.5 text-xs sm:text-sm font-bold dark:bg-white/[0.12]">
                      <Shield className="h-4 w-4" style={{ color: themeMeta.color }} />
                      {shieldLocked ? 'Resposta Protegida' : 'Pronta para Revelar'}
                    </div>

                    <h2 className="mt-3 font-display text-3xl font-bold">
                      Carta #{currentCard.id.toUpperCase()}
                    </h2>
                  </div>

                  <div className="relative z-10 space-y-3">
                    {(currentCard.era || currentCard.origin) && (
                      <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-[var(--fg-muted)]">
                        {currentCard.era && (
                          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1">
                            {currentCard.era}
                          </span>
                        )}
                        {currentCard.origin && (
                          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1">
                            {currentCard.origin}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onPointerDown={() => setPeeking(true)}
                        onPointerUp={() => setPeeking(false)}
                        onPointerLeave={() => setPeeking(false)}
                        className="clay-btn-soft flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-display text-sm font-bold select-none cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-[#1CB0F6]" />
                        Espiar
                      </button>

                      <button
                        type="button"
                        onClick={toggleFlipAnswer}
                        className="flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-display text-sm font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: themeMeta.color,
                          boxShadow: `0 10px 18px -6px ${themeMeta.color}aa`,
                        }}
                      >
                        <Unlock className="h-4 w-4" />
                        Revelar
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="backface-hidden rotate-y-180 absolute inset-0 flex min-h-[500px] flex-col justify-between overflow-hidden rounded-[36px] border-2 p-6 sm:p-7 text-white shadow-[0_26px_48px_-14px_rgba(15,23,42,0.4)]"
                  style={{
                    borderColor: 'rgba(255,255,255,0.45)',
                    background: `linear-gradient(145deg, ${themeMeta.color}, #1E1B4B)`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 font-display text-sm font-bold backdrop-blur-md">
                      <PerfilThemeIcon id={currentCard.theme} className="h-4 w-4" />
                      {themeMeta.name}
                    </span>
                    <span className="rounded-full bg-black/30 px-3.5 py-1 font-mono-tech text-xs font-bold">
                      {peeking && !answerFlipped ? 'ESPIANDO' : 'REVELADA'}
                    </span>
                  </div>

                  <div className="my-auto py-4 text-center">
                    <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-white/85">
                      {currentCard.subtitle ?? 'Resposta Secreta'}
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-bold leading-tight drop-shadow sm:text-4xl">
                      {currentCard.answer}
                    </h2>

                    {(currentCard.era || currentCard.origin || currentCard.referenceHint) && (
                      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
                        {currentCard.era && (
                          <span className="rounded-full bg-white/20 px-3.5 py-1.5 font-semibold">
                            {currentCard.era}
                          </span>
                        )}
                        {currentCard.origin && (
                          <span className="rounded-full bg-white/20 px-3.5 py-1.5 font-semibold">
                            {currentCard.origin}
                          </span>
                        )}
                        {currentCard.referenceHint && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-1.5 text-white">
                            <Tag className="h-3.5 w-3.5" />
                            {currentCard.referenceHint}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-center gap-2">
                      {players.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => awardPointsToPlayer(p.id, maxPointsRemaining)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-4 py-2 font-display text-sm font-bold transition hover:bg-white/35 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          +{maxPointsRemaining} {p.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAnswerFlipped(false);
                          setPeeking(false);
                          setShieldLocked(true);
                          soundEngine.playCardFlip();
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/20 py-3.5 font-display text-sm font-bold backdrop-blur-md transition hover:bg-white/30 cursor-pointer"
                      >
                        <Lock className="h-4 w-4" />
                        Ocultar
                      </button>
                      <button
                        type="button"
                        onClick={drawNextCard}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-display text-sm font-bold text-slate-900 shadow-lg transition hover:scale-[1.02] cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 text-[#FF3D8B]" />
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: 10 DICAS LIST */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Flame className="h-6 w-6" style={{ color: themeMeta.color }} />
                10 Dicas da Carta
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={revealNextClue}
                  disabled={revealedClues.length >= currentCard.clues.length}
                  className="clay-btn-cyan rounded-full px-5 py-2.5 font-display text-sm font-bold disabled:opacity-45 cursor-pointer"
                >
                  + Abrir Dica
                </button>
                <button
                  type="button"
                  onClick={revealAllClues}
                  className="clay-btn-soft rounded-full px-4 py-2.5 font-display text-sm font-bold cursor-pointer"
                >
                  Abrir Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRevealedClues([0]);
                    soundEngine.playSelect();
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2.5 text-sm font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <EyeOff className="h-4 w-4" />
                  Ocultar
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentCard.clues.map((clue, idx) => {
                const isOpen = revealedClues.includes(idx);
                const clueValue = 10 - idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleClue(idx)}
                    style={
                      isOpen
                        ? {
                            borderColor: `${themeMeta.color}88`,
                            boxShadow: `0 12px 24px -10px ${themeMeta.color}45`,
                          }
                        : undefined
                    }
                    className={`group flex items-start gap-3.5 rounded-[24px] border-2 p-4 text-left transition-all cursor-pointer ${
                      isOpen
                        ? 'bg-[var(--bg-card)] hover:-translate-y-0.5'
                        : 'border-dashed border-[var(--border)] bg-[var(--bg-card)]/55 hover:bg-[var(--bg-card)]/90'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-mono-tech text-sm font-bold transition ${
                        isOpen ? 'text-white shadow-sm' : 'bg-black/15 text-[var(--fg-muted)] dark:bg-white/15'
                      }`}
                      style={isOpen ? { backgroundColor: themeMeta.color } : undefined}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                          Dica {idx + 1}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 font-mono-tech text-xs font-bold"
                          style={
                            isOpen
                              ? { backgroundColor: `${themeMeta.color}25`, color: themeMeta.color }
                              : undefined
                          }
                        >
                          {clueValue} pts
                        </span>
                      </div>

                      {isOpen ? (
                        <p className="text-sm sm:text-[15px] font-semibold leading-snug text-[var(--fg)]">
                          {clue}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-medium text-[var(--fg-muted)]">
                          Toque para abrir...
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
