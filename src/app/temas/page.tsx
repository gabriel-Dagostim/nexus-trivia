'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, CloudDownload, Database, Globe2, Sparkles } from 'lucide-react';
import { CATEGORIES, DIFFICULTY_META, PERFIL_THEMES } from '@/lib/categories';
import { getCuratedStats } from '@/data/questions';
import { getPerfilStats } from '@/data/perfil/cards';
import { soundEngine } from '@/lib/sound';
import { ThemeBackdrop } from '@/components/ThemeBackdrop';
import { CategoryIcon, PerfilThemeIcon } from '@/components/GameIcons';
import type { CategoryId, RoomDifficulty, TriviaQuestion } from '@/types/game';

export default function TemasPage() {
  const curatedStats = getCuratedStats();
  const perfilStats = getPerfilStats();

  const [storedQuestions, setStoredQuestions] = useState<TriviaQuestion[]>([]);
  const [importSource, setImportSource] = useState<'wikidata' | 'opentdb'>('wikidata');
  const [importCategory, setImportCategory] = useState<CategoryId>('geografia');
  const [loadingImport, setLoadingImport] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const loadStored = async () => {
    try {
      const res = await fetch('/api/questions/external', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { questions: TriviaQuestion[] };
        setStoredQuestions(data.questions ?? []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/questions/external', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { questions?: TriviaQuestion[] } | null) => {
        if (active && data?.questions) {
          setStoredQuestions(data.questions);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleImport = async () => {
    setLoadingImport(true);
    setImportFeedback(null);
    soundEngine.playSelect();

    try {
      const res = await fetch('/api/questions/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: importSource,
          category: importCategory,
          amount: 10,
          saveToDb: true,
        }),
      });
      const data = (await res.json()) as {
        questions?: TriviaQuestion[];
        savedCount?: number;
        error?: string;
      };

      if (!res.ok) {
        setImportFeedback(data.error || 'Falha ao importar perguntas externas.');
      } else {
        soundEngine.playCorrect();
        setImportFeedback(
          `Buscadas ${data.questions?.length ?? 0} perguntas e salvas ${data.savedCount ?? 0} novas no banco!`
        );
        await loadStored();
      }
    } catch {
      setImportFeedback('Erro de conexão ao consultar API externa.');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
      <ThemeBackdrop theme="studio" />
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/80 px-3.5 py-1 font-mono-tech text-xs font-bold text-[#8B5CF6]">
          ENCICLOPÉDIA DE TEMAS &amp; EXPANSOR DE PERGUNTAS
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Referência de Temas &amp;{' '}
          <span className="bg-gradient-to-r from-[#00D68F] via-[#1CB0F6] to-[#8B5CF6] bg-clip-text text-transparent">
            Base de Conhecimento
          </span>
        </h1>
        <p className="max-w-2xl text-sm text-[var(--fg-muted)] sm:text-base">
          Guia das 6 áreas do Perguntados, dos 6 temas do modo Perfil, níveis de dificuldade e
          expansão automática via Wikidata (PT-BR) e Open Trivia DB.
        </p>
      </div>

      {/* Trivia Categories */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#1CB0F6]" />
          6 Setores do Perguntados ({curatedStats.total} curadas + {storedQuestions.length} importadas)
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const counts = curatedStats.byCategory[cat.id];
            const extraCount = storedQuestions.filter((q) => q.category === cat.id).length;
            return (
              <div key={cat.id} className="clay-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: `0 8px 16px -6px ${cat.color}aa`,
                    }}
                  >
                    <CategoryIcon id={cat.id} className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-mono-tech text-[10px] font-bold" style={{ color: cat.color }}>
                      {cat.nerdRef}
                    </div>
                    <h3 className="font-display text-lg font-bold">{cat.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{cat.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {cat.subtopics.map((sub) => (
                    <span
                      key={sub}
                      className="clay-pill rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="clay-inset px-3 py-2 flex items-center justify-between font-mono-tech text-[11px] text-[var(--fg-muted)]">
                  <span>
                    F:{counts.facil} · M:{counts.medio} · D:{counts.dificil}
                  </span>
                  <span className="font-bold text-[#1CB0F6]">
                    {counts.total + extraCount} total
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* External API Expander */}
      <section className="clay-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 font-mono-tech text-xs font-bold text-[#00be7b]">
              <CloudDownload className="h-4 w-4" />
              EXPANSOR DE PERGUNTAS (WIKIDATA PT-BR &amp; OPENTDB)
            </div>
            <h2 className="font-display text-2xl font-bold">
              Importar Mais Perguntas para o Banco
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">
              Gere perguntas novas em português diretamente da <strong>Wikidata SPARQL</strong> ou
              importe desafios globais da <strong>Open Trivia DB</strong> salvando no banco Neon
              Postgres / local.
            </p>
          </div>

          <div className="clay-pill flex items-center gap-2 rounded-full px-4 py-2 font-mono-tech text-xs font-bold">
            <Database className="h-4 w-4 text-[#8B5CF6]" />
            <span>{storedQuestions.length} importadas salvas</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1.5">
              Fonte Externa
            </label>
            <select
              value={importSource}
              onChange={(e) => setImportSource(e.target.value as 'wikidata' | 'opentdb')}
              className="clay-inset w-full px-3.5 py-3 text-sm font-bold outline-none"
            >
              <option value="wikidata">Wikidata SPARQL (100% Português)</option>
              <option value="opentdb">Open Trivia DB (Global / Inglês)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1.5">
              Categoria Alvo
            </label>
            <select
              value={importCategory}
              onChange={(e) => setImportCategory(e.target.value as CategoryId)}
              className="clay-inset w-full px-3.5 py-3 text-sm font-bold outline-none"
            >
              {importSource === 'wikidata' ? (
                <>
                  <option value="geografia">Geografia (Países &amp; Capitais)</option>
                  <option value="ciencia">Ciência (Elementos Químicos)</option>
                  <option value="arte">Arte (Obras do Louvre)</option>
                </>
              ) : (
                CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            disabled={loadingImport}
            onClick={handleImport}
            className="clay-btn-mint inline-flex items-center justify-center gap-2 px-5 py-3.5 font-display text-sm font-bold disabled:opacity-60 cursor-pointer"
          >
            <Globe2 className="h-4 w-4" />
            {loadingImport ? 'Consultando API...' : 'Buscar & Salvar (+10)'}
          </button>
        </div>

        {importFeedback && (
          <div className="clay-inset flex items-center gap-2 px-4 py-3 text-xs font-bold text-[#00be7b]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{importFeedback}</span>
          </div>
        )}
      </section>

      {/* Perfil Themes */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FF3D8B]" />
          {PERFIL_THEMES.length} Temas do Minigame Perfil ({perfilStats.total} cartas)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERFIL_THEMES.map((t) => (
            <div key={t.id} className="clay-card p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow"
                  style={{ backgroundColor: t.color }}
                >
                  <PerfilThemeIcon id={t.id} className="h-6 w-6" />
                </span>
                <span className="clay-pill rounded-full px-3.5 py-1 font-mono-tech text-xs font-bold text-[#FF3D8B]">
                  {perfilStats.byTheme[t.id] ?? 0} cartas
                </span>
              </div>
              <h3 className="font-display text-lg font-bold">{t.name}</h3>
              <p className="text-sm text-[var(--fg-muted)]">{t.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Difficulty Reference */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Níveis de Dificuldade</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['facil', 'medio', 'dificil', 'misto'] as RoomDifficulty[]).map((diff) => {
            const meta = DIFFICULTY_META[diff];
            return (
              <div key={diff} className="clay-card p-5 space-y-1.5">
                <div className="font-display text-base font-bold">{meta.label}</div>
                <div className="font-mono-tech text-xs font-bold text-[#1CB0F6]">
                  {meta.basePoints} pts base · {meta.timeSec}s
                </div>
                <p className="text-xs text-[var(--fg-muted)]">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
