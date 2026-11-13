'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Gamepad2,
  Layers,
  Radio,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';
import { CATEGORIES, PERFIL_THEMES, PERFIL_THEME_MAP } from '@/lib/categories';
import { HeroPolyhedron3D } from '@/components/HeroPolyhedron3D';
import { ThemeBackdrop, type BackdropTheme } from '@/components/ThemeBackdrop';
import { PerfilArtwork } from '@/components/PerfilArtwork';
import { CategoryIcon, CrownIcon, PerfilThemeIcon } from '@/components/GameIcons';
import { soundEngine } from '@/lib/sound';
import type { CategoryId, PerfilTheme } from '@/types/game';

export interface HomeSampleQuestion {
  category: CategoryId;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
}

export interface HomePerfilPreviewCard {
  id: string;
  theme: PerfilTheme;
  answer: string;
  subtitle?: string;
  firstClue: string;
}

interface HomeShowcaseProps {
  totalQuestions: number;
  categoryCounts: Record<string, number>;
  totalPerfilCards: number;
  perfilCounts: Record<string, number>;
  samples: Record<CategoryId, HomeSampleQuestion>;
  featuredPerfil: HomePerfilPreviewCard[];
}

export function HomeShowcase({
  totalQuestions,
  categoryCounts,
  totalPerfilCards,
  perfilCounts,
  samples,
  featuredPerfil,
}: HomeShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('pop');
  const [backdropTheme, setBackdropTheme] = useState<BackdropTheme>('studio');
  const [pickedOption, setPickedOption] = useState<number | null>(null);

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory) ?? CATEGORIES[0];
  const activeSample = samples[selectedCategory];

  const handleSelectCategory = (id: CategoryId) => {
    setSelectedCategory(id);
    setBackdropTheme(id);
    setPickedOption(null);
    soundEngine.playSelect();
  };

  const handleAnswerPreview = (idx: number) => {
    if (pickedOption !== null) return;
    setPickedOption(idx);
    if (idx === activeSample.correctIndex) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }
  };

  return (
    <div className="relative overflow-x-clip pb-20">
      <ThemeBackdrop theme={backdropTheme} />

      {/* 1. OPEN STUDIO HERO — Mascot floats freely with zero clipped shadow boxes */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00D68F] animate-pulse" />
              <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-[var(--fg)]">
                Arena 3D · P2P + Mesa Física
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-6xl">
              Conhecimento em{' '}
              <span className="bg-gradient-to-r from-[#FF3D8B] via-[#FFB800] to-[#1CB0F6] bg-clip-text text-transparent">
                Massinha 3D
              </span>
            </h1>

            <p className="max-w-lg text-base font-medium leading-relaxed text-[var(--fg-muted)] sm:text-lg">
              Gire a roleta de 6 mundos com até 5 celulares ou puxe cartas de 10 pistas na mesa.
            </p>

            {/* Big High-Contrast CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/perguntados"
                onClick={() => soundEngine.playSelect()}
                className="clay-btn-primary inline-flex items-center gap-3 rounded-full px-8 py-4 font-display text-base sm:text-lg font-bold"
              >
                <Gamepad2 className="h-5 w-5" />
                Jogar Perguntados
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/perfil"
                onClick={() => soundEngine.playSelect()}
                className="clay-btn-cyan inline-flex items-center gap-3 rounded-full px-8 py-4 font-display text-base sm:text-lg font-bold"
              >
                <Layers className="h-5 w-5" />
                Jogar Perfil
              </Link>

              <Link
                href="/temas"
                className="clay-btn-soft inline-flex items-center gap-2 rounded-full px-6 py-4 font-display text-sm sm:text-base font-bold"
              >
                <Compass className="h-5 w-5 text-[#00D68F]" />
                Temas
              </Link>
            </div>

            {/* Visual KPI Chips (high contrast, zero clutter) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2.5 backdrop-blur-md">
                <Zap className="h-4 w-4 text-[#FF3D8B]" />
                <span className="font-mono-tech text-sm font-bold">{totalQuestions}</span>
                <span className="text-xs font-semibold text-[var(--fg-muted)]">perguntas</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2.5 backdrop-blur-md">
                <Layers className="h-4 w-4 text-[#FFB800]" />
                <span className="font-mono-tech text-sm font-bold">{totalPerfilCards}</span>
                <span className="text-xs font-semibold text-[var(--fg-muted)]">cartas Perfil</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2.5 backdrop-blur-md">
                <Users className="h-4 w-4 text-[#1CB0F6]" />
                <span className="font-mono-tech text-sm font-bold">1–5</span>
                <span className="text-xs font-semibold text-[var(--fg-muted)]">celulares P2P</span>
              </div>
            </div>
          </div>

          {/* Right Open 3D Stage — Unclipped WebGL Canvas */}
          <div className="relative lg:col-span-6">
            <div className="relative mx-auto flex h-[340px] w-full items-center justify-center sm:h-[420px]">
              <HeroPolyhedron3D />

              <div className="pointer-events-none absolute left-3 top-6 hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md sm:flex items-center gap-2 animate-float">
                <CrownIcon className="h-4 w-4 text-[#FFB800]" />
                Coroa aos 3 acertos
              </div>

              <div className="pointer-events-none absolute right-3 bottom-10 hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)]/90 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md sm:flex items-center gap-2 animate-float-slow">
                <Volume2 className="h-4 w-4 text-[#00D68F]" />
                Sons Ao Vivo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VISUAL 2-MODE ARCADE LAUNCHER (Elements first, minimal text) */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Perguntados Visual Card */}
          <Link
            href="/perguntados"
            onMouseEnter={() => setBackdropTheme('perguntados')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[36px] border-2 border-[#FF3D8B]/40 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[#FF3D8B]/15 p-7 shadow-xl transition hover:-translate-y-1.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF3D8B] px-3.5 py-1 font-display text-xs font-bold text-white">
                  <Radio className="h-3.5 w-3.5" />
                  ONLINE P2P + SOLO
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold">Perguntados 3D</h2>
              </div>

              {/* Stylized Vector Wheel Emblem */}
              <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 transition-transform duration-500 group-hover:rotate-45" fill="none">
                <circle cx="40" cy="40" r="34" fill="#1CB0F6" fillOpacity="0.18" stroke="#FFB800" strokeWidth="4" />
                <path d="M40 6V74M6 40H74M16 16L64 64M64 16L16 64" stroke="white" strokeOpacity="0.4" strokeWidth="2.5" />
                <circle cx="40" cy="40" r="12" fill="#FF3D8B" stroke="white" strokeWidth="3" />
              </svg>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-bold"
                >
                  <span style={{ color: c.color }}>
                    <CategoryIcon id={c.id} className="h-4 w-4" />
                  </span>
                  {c.shortName}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono-tech text-sm font-bold text-[#FF3D8B]">
                {totalQuestions} perguntas · 4 níveis
              </span>
              <span className="clay-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm sm:text-base font-bold">
                Entrar na Arena <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Perfil Visual Card */}
          <Link
            href="/perfil"
            onMouseEnter={() => setBackdropTheme('perfil-lobby')}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[36px] border-2 border-[#1CB0F6]/40 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[#1CB0F6]/15 p-7 shadow-xl transition hover:-translate-y-1.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1CB0F6] px-3.5 py-1 font-display text-xs font-bold text-white">
                  <Layers className="h-3.5 w-3.5" />
                  MESA FÍSICA · 10 PISTAS
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold">Perfil Clássico</h2>
              </div>

              {/* Stylized Stacked Deck Emblem */}
              <div className="relative h-20 w-20 shrink-0">
                <div className="absolute right-1 top-1 h-16 w-12 rotate-12 rounded-2xl border-2 border-white/60 bg-[#FFB800] shadow-md transition-transform group-hover:rotate-18" />
                <div className="absolute left-1 top-2 h-16 w-12 -rotate-12 rounded-2xl border-2 border-white/60 bg-[#FF3D8B] shadow-md transition-transform group-hover:-rotate-18" />
                <div className="absolute left-4 top-0 flex h-16 w-12 items-center justify-center rounded-2xl border-2 border-white bg-[#1CB0F6] text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {PERFIL_THEMES.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold"
                >
                  <span style={{ color: t.color }}>
                    <PerfilThemeIcon id={t.id} className="h-3.5 w-3.5" />
                  </span>
                  {t.name}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono-tech text-sm font-bold text-[#1CB0F6]">
                {totalPerfilCards} cartas · {PERFIL_THEMES.length} temas
              </span>
              <span className="clay-btn-cyan inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm sm:text-base font-bold">
                Escolher Baralho <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. INTERACTIVE TEST ARENA — Playable sample without reading prose */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-[#1CB0F6]">
              Mini-Desafio Ao Vivo
            </span>
            <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              Toque em uma Área e Teste
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setBackdropTheme('studio');
              soundEngine.playSelect();
            }}
            className="clay-btn-soft rounded-full px-5 py-2.5 font-display text-xs sm:text-sm font-bold cursor-pointer"
          >
            Fundo Studio
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Tactile Icon Tiles — zero paragraph bloat */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  style={
                    active
                      ? {
                          borderColor: cat.color,
                          background: `linear-gradient(145deg, ${cat.color}2e, var(--bg-card))`,
                          boxShadow: `0 16px 30px -12px ${cat.color}99`,
                        }
                      : undefined
                  }
                  className={`group flex flex-col justify-between rounded-[28px] border-2 p-5 text-left transition-all cursor-pointer ${
                    active
                      ? '-translate-y-1'
                      : 'border-[var(--border)] bg-[var(--bg-card)]/90 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow transition-transform group-hover:scale-110"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon id={cat.id} className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full px-3 py-1 font-mono-tech text-xs font-bold"
                      style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="mt-4 font-display text-lg font-bold">{cat.shortName}</div>
                </button>
              );
            })}
          </div>

          {/* Live Playable Sample */}
          <div
            className="relative overflow-hidden rounded-[36px] border-2 p-6 sm:p-8 lg:col-span-7 backdrop-blur-xl transition-all duration-500"
            style={{
              borderColor: `${activeCategoryMeta.color}77`,
              background: `linear-gradient(145deg, var(--bg-card) 20%, ${activeCategoryMeta.color}20 100%)`,
              boxShadow: `0 24px 48px -18px ${activeCategoryMeta.color}55`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow"
                  style={{ backgroundColor: activeCategoryMeta.color }}
                >
                  <CategoryIcon id={activeCategoryMeta.id} className="h-6 w-6" />
                </span>
                <div>
                  <span
                    className="font-mono-tech text-xs font-bold uppercase tracking-wider"
                    style={{ color: activeCategoryMeta.color }}
                  >
                    {activeCategoryMeta.name}
                  </span>
                  <h3 className="font-display text-xl font-bold">Desafio Rápido</h3>
                </div>
              </div>

              <Link
                href="/perguntados"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow transition hover:scale-105"
                style={{ backgroundColor: activeCategoryMeta.color }}
              >
                Jogar na Roleta <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {activeSample && (
              <div className="mt-5 space-y-4">
                <p className="font-display text-xl font-bold leading-snug sm:text-2xl">
                  {activeSample.prompt}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {activeSample.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isPicked = pickedOption === idx;
                    const isCorrect = idx === activeSample.correctIndex;
                    const showResult = pickedOption !== null;

                    let stateClass =
                      'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[#1CB0F6] hover:-translate-y-0.5';
                    if (showResult && isCorrect) {
                      stateClass = 'border-[#00D68F] bg-[#00D68F]/20 text-[#007a50] dark:text-[#7affd4] animate-correct';
                    } else if (showResult && isPicked && !isCorrect) {
                      stateClass = 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-300 animate-shake';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerPreview(idx)}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm sm:text-base font-bold transition cursor-pointer ${stateClass}`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono-tech text-xs font-bold"
                          style={{
                            backgroundColor:
                              showResult && isCorrect
                                ? '#00D68F'
                                : showResult && isPicked
                                ? '#F43F5E'
                                : `${activeCategoryMeta.color}25`,
                            color: showResult && (isCorrect || isPicked) ? '#fff' : activeCategoryMeta.color,
                          }}
                        >
                          {letter}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {pickedOption !== null && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm">
                    <span className="text-[var(--fg-muted)] font-medium">
                      <strong className="text-[var(--fg)]">
                        {pickedOption === activeSample.correctIndex ? 'Acertou!' : 'Quase!'}{' '}
                      </strong>
                      {activeSample.explanation || 'Entre na Arena para somar pontos!'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickedOption(null)}
                      className="font-display font-bold text-[#1CB0F6] hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FANNED PERFIL CARDS PREVIEW — Visual Collector Gallery */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-[#FFB800]">
              {PERFIL_THEMES.length} Baralhos Temáticos
            </span>
            <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              Cartas do Perfil
            </h2>
          </div>

          <Link
            href="/perfil"
            onClick={() => soundEngine.playCardFlip()}
            className="clay-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-display text-sm sm:text-base font-bold"
          >
            <Layers className="h-4 w-4" />
            Abrir Mesa ({totalPerfilCards} cartas)
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {featuredPerfil.map((card) => {
            const meta = PERFIL_THEME_MAP[card.theme];
            return (
              <Link
                key={card.id}
                href="/perfil"
                onMouseEnter={() => setBackdropTheme(card.theme)}
                style={{
                  borderColor: `${meta.color}66`,
                  background: `linear-gradient(160deg, var(--bg-card) 15%, ${meta.color}22 100%)`,
                }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[30px] border-2 p-6 shadow-xl transition duration-300 hover:-translate-y-2"
              >
                <div className="card-holo-sheen pointer-events-none absolute inset-0" />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-display text-xs font-bold text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <PerfilThemeIcon id={card.theme} className="h-3.5 w-3.5" />
                    {meta.name}
                  </span>
                  <span className="font-mono-tech text-xs font-bold text-[var(--fg-muted)]">
                    {perfilCounts[card.theme] ?? 0} cartas
                  </span>
                </div>

                <div className="my-5 flex justify-center">
                  <PerfilArtwork
                    theme={card.theme}
                    color={meta.color}
                    className="h-28 w-28 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div>
                  <span className="font-mono-tech text-xs font-bold uppercase" style={{ color: meta.color }}>
                    Dica #01 · 10 pts
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                    “{card.firstClue}”
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. COMPACT VISUAL FEATURE PILLS (no bulky prose boxes) */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]/85 p-5 backdrop-blur-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1CB0F6] text-white shadow">
              <Radio className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Multiplayer P2P</h3>
              <p className="text-xs sm:text-sm font-semibold text-[var(--fg-muted)]">1 a 5 celulares via navegador</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]/85 p-5 backdrop-blur-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-white shadow">
              <CrownIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">4 Níveis + Coroa</h3>
              <p className="text-xs sm:text-sm font-semibold text-[var(--fg-muted)]">Bônus rápido por tempo</p>
            </div>
          </div>

          <Link
            href="/ranking"
            className="flex items-center gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]/85 p-5 backdrop-blur-md transition hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00D68F] text-white shadow">
              <Trophy className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Ranking & Conta</h3>
              <p className="text-xs sm:text-sm font-semibold text-[var(--fg-muted)]">E-mail + senha no Postgres</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
