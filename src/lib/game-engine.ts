import { CATEGORIES, getPointsForDifficulty } from './categories';
import { pickQuestion } from '@/data/questions';
import type {
  AnswerSubmission,
  CategoryId,
  PlayerState,
  PublicRoomState,
  PublicTriviaQuestion,
  RoomSettings,
  RoundReveal,
  TriviaQuestion,
} from '@/types/game';

export const AVATAR_PALETTE = [
  '#FF3D8B',
  '#1CB0F6',
  '#00D68F',
  '#FFB800',
  '#8B5CF6',
  '#FF7A2F',
];

export const BOT_PROFILES = [
  { name: 'AdaLovelace.AI', color: '#8b5cf6' },
  { name: 'ByteBot-42', color: '#10b981' },
  { name: 'TuringCore', color: '#3b82f6' },
  { name: 'NovaQuantum', color: '#ec4899' },
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateRoomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function sanitizeQuestionForClients(q: TriviaQuestion): PublicTriviaQuestion {
  return {
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    tags: q.tags,
    source: q.source,
  };
}

export function createInitialRoomState(
  roomCode: string,
  hostPlayer: { id: string; name: string; avatarColor: string },
  settings: RoomSettings
): PublicRoomState {
  return {
    roomCode,
    phase: 'lobby',
    settings,
    players: [
      {
        id: hostPlayer.id,
        name: hostPlayer.name,
        avatarColor: hostPlayer.avatarColor,
        isHost: true,
        score: 0,
        streak: 0,
        correctCount: 0,
        answeredCount: 0,
        crownCharge: 0,
        crowns: [],
        connected: true,
      },
    ],
    activePlayerId: hostPlayer.id,
    turnNumber: 1,
    wheelTargetSector: 0,
    wheelSpinId: 0,
    selectedCategory: null,
    isCrownRound: false,
    currentQuestion: null,
    questionStartedAt: null,
    lastReveal: null,
    winnerId: null,
    answeredPlayerIds: [],
  };
}

export function spinWheelSector(): { sector: number; isCrown: boolean; category: CategoryId | null } {
  // 7 sectors: 0..5 are the 6 categories, 6 is "Coroa Especial"
  const sector = Math.floor(Math.random() * 7);
  if (sector === 6) {
    return { sector: 6, isCrown: true, category: null };
  }
  return { sector, isCrown: false, category: CATEGORIES[sector].id };
}

export function pickNextQuestionForCategory(
  category: CategoryId,
  settings: RoomSettings,
  usedIds: Set<string>,
  extraPool: TriviaQuestion[]
): TriviaQuestion {
  const q = pickQuestion(category, settings.difficulty, usedIds, extraPool);
  usedIds.add(q.id);
  return q;
}

export function simulateBotAnswer(
  question: TriviaQuestion,
  botLevel: 'facil' | 'medio' | 'dificil',
  timeLimitSec: number
): { selectedIndex: number; timeMs: number } {
  const accuracy = botLevel === 'facil' ? 0.48 : botLevel === 'medio' ? 0.68 : 0.84;
  const isRight = Math.random() < accuracy;
  let selectedIndex = question.correctIndex;
  if (!isRight) {
    const wrongOptions = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
    selectedIndex = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }
  const minMs = 2200;
  const maxMs = Math.max(3500, timeLimitSec * 1000 * 0.72);
  const timeMs = Math.round(minMs + Math.random() * (maxMs - minMs));
  return { selectedIndex, timeMs };
}

export function resolveRound(
  state: PublicRoomState,
  activeQuestion: TriviaQuestion,
  submissionsMap: Map<string, AnswerSubmission>
): { nextState: PublicRoomState; reveal: RoundReveal } {
  const totalTimeMs = state.settings.questionTimeSec * 1000;
  const revealSubmissions: RoundReveal['submissions'] = {};
  let crownAwardedTo: { playerId: string; category: CategoryId } | null = null;

  const updatedPlayers: PlayerState[] = state.players.map((player) => {
    const sub = submissionsMap.get(player.id);
    if (!sub) {
      return {
        ...player,
        streak: 0,
        answeredCount: player.answeredCount + 1,
      };
    }

    const isCorrect = sub.selectedIndex === activeQuestion.correctIndex;
    const isActivePlayer = player.id === state.activePlayerId;
    const timeLeftRatio = Math.max(0, 1 - sub.timeMs / totalTimeMs);
    let pointsEarned = 0;

    if (isCorrect) {
      const basePts = getPointsForDifficulty(activeQuestion.difficulty, timeLeftRatio);
      const streakBonus = Math.min(player.streak, 5) * 20;
      // Active player gets full points; other players answering simultaneously get 75% points!
      pointsEarned = isActivePlayer ? basePts + streakBonus : Math.round((basePts + streakBonus) * 0.75);
    }

    let nextCrownCharge = player.crownCharge;
    const nextCrowns = [...player.crowns];

    if (isCorrect && isActivePlayer) {
      if (state.isCrownRound) {
        if (!nextCrowns.includes(activeQuestion.category)) {
          nextCrowns.push(activeQuestion.category);
          crownAwardedTo = { playerId: player.id, category: activeQuestion.category };
        }
        nextCrownCharge = 0;
      } else {
        nextCrownCharge = player.crownCharge + 1;
        if (nextCrownCharge >= 3) {
          // Automatically award current category crown if not owned, else first missing crown
          const targetCat = !nextCrowns.includes(activeQuestion.category)
            ? activeQuestion.category
            : CATEGORIES.find((c) => !nextCrowns.includes(c.id))?.id;
          if (targetCat) {
            nextCrowns.push(targetCat);
            crownAwardedTo = { playerId: player.id, category: targetCat };
          }
          nextCrownCharge = 0;
        }
      }
    } else if (!isCorrect && isActivePlayer && state.isCrownRound) {
      nextCrownCharge = 0;
    }

    revealSubmissions[player.id] = {
      selectedIndex: sub.selectedIndex,
      isCorrect,
      pointsEarned,
      timeMs: sub.timeMs,
    };

    return {
      ...player,
      score: player.score + pointsEarned,
      streak: isCorrect ? player.streak + 1 : 0,
      correctCount: player.correctCount + (isCorrect ? 1 : 0),
      answeredCount: player.answeredCount + 1,
      crownCharge: nextCrownCharge,
      crowns: nextCrowns,
    };
  });

  const reveal: RoundReveal = {
    questionId: activeQuestion.id,
    correctIndex: activeQuestion.correctIndex,
    explanation: activeQuestion.explanation,
    submissions: revealSubmissions,
    crownAwardedTo,
  };

  const winner = updatedPlayers.find((p) => p.crowns.length >= state.settings.crownsToWin);

  const nextState: PublicRoomState = {
    ...state,
    phase: winner ? 'finished' : 'reveal',
    players: updatedPlayers,
    lastReveal: reveal,
    winnerId: winner ? winner.id : null,
  };

  return { nextState, reveal };
}

export function advanceToNextTurn(state: PublicRoomState): PublicRoomState {
  if (state.winnerId) {
    return { ...state, phase: 'finished' };
  }

  const activeIdx = state.players.findIndex((p) => p.id === state.activePlayerId);
  // Todos respondem simultaneamente para pontos; o giro da roleta alterna entre os jogadores em salas multiplayer
  const keepTurn = state.players.length === 1;
  const nextIdx = keepTurn
    ? activeIdx
    : (activeIdx + 1) % state.players.length;

  return {
    ...state,
    phase: 'spinning',
    activePlayerId: state.players[nextIdx]?.id ?? state.players[0].id,
    turnNumber: state.turnNumber + 1,
    selectedCategory: null,
    isCrownRound: false,
    currentQuestion: null,
    questionStartedAt: null,
    lastReveal: null,
    answeredPlayerIds: [],
  };
}
