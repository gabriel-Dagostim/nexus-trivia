import type { CategoryId, QuestionDifficulty, RoomDifficulty, TriviaQuestion } from '@/types/game';
import { POP_QUESTIONS } from './pop';
import { HISTORIA_QUESTIONS } from './historia';
import { GEOGRAFIA_QUESTIONS } from './geografia';
import { ARTE_QUESTIONS } from './arte';
import { CIENCIA_QUESTIONS } from './ciencia';
import { ESPORTES_QUESTIONS } from './esportes';

export const ALL_CURATED_QUESTIONS: TriviaQuestion[] = [
  ...POP_QUESTIONS,
  ...HISTORIA_QUESTIONS,
  ...GEOGRAFIA_QUESTIONS,
  ...ARTE_QUESTIONS,
  ...CIENCIA_QUESTIONS,
  ...ESPORTES_QUESTIONS,
];

export const QUESTIONS_BY_CATEGORY: Record<CategoryId, TriviaQuestion[]> = {
  pop: POP_QUESTIONS,
  historia: HISTORIA_QUESTIONS,
  geografia: GEOGRAFIA_QUESTIONS,
  arte: ARTE_QUESTIONS,
  ciencia: CIENCIA_QUESTIONS,
  esportes: ESPORTES_QUESTIONS,
};

export function pickQuestion(
  category: CategoryId,
  difficulty: RoomDifficulty,
  usedIds: Set<string>,
  extraPool: TriviaQuestion[] = []
): TriviaQuestion {
  const combined = [...QUESTIONS_BY_CATEGORY[category], ...extraPool.filter((q) => q.category === category)];

  const filterByDiff = (list: TriviaQuestion[], diff: QuestionDifficulty) =>
    list.filter((q) => q.difficulty === diff);

  const pool =
    difficulty === 'misto' ? combined : filterByDiff(combined, difficulty);

  let unused = pool.filter((q) => !usedIds.has(q.id));

  // If all questions of that difficulty/category were used, fall back to any unused in category
  if (unused.length === 0) {
    unused = combined.filter((q) => !usedIds.has(q.id));
  }

  // If entire category was exhausted, reset pool for that difficulty
  if (unused.length === 0) {
    unused = pool.length > 0 ? pool : combined;
  }

  const chosen = unused[Math.floor(Math.random() * unused.length)];
  return chosen;
}

export function getCuratedStats() {
  const byCategory: Record<CategoryId, { total: number; facil: number; medio: number; dificil: number }> = {
    pop: { total: 0, facil: 0, medio: 0, dificil: 0 },
    historia: { total: 0, facil: 0, medio: 0, dificil: 0 },
    geografia: { total: 0, facil: 0, medio: 0, dificil: 0 },
    arte: { total: 0, facil: 0, medio: 0, dificil: 0 },
    ciencia: { total: 0, facil: 0, medio: 0, dificil: 0 },
    esportes: { total: 0, facil: 0, medio: 0, dificil: 0 },
  };

  for (const q of ALL_CURATED_QUESTIONS) {
    byCategory[q.category].total++;
    byCategory[q.category][q.difficulty]++;
  }

  return {
    total: ALL_CURATED_QUESTIONS.length,
    byCategory,
  };
}
