export type CategoryId =
  | 'pop'
  | 'historia'
  | 'geografia'
  | 'arte'
  | 'ciencia'
  | 'esportes';

export type QuestionDifficulty = 'facil' | 'medio' | 'dificil';
export type RoomDifficulty = QuestionDifficulty | 'misto';

export interface TriviaQuestion {
  id: string;
  category: CategoryId;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  tags?: string[];
  source?: 'curated' | 'opentdb' | 'wikidata' | 'custom';
}

/** Public question payload sent from Host to Peers (never leaks correctIndex) */
export interface PublicTriviaQuestion {
  id: string;
  category: CategoryId;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: [string, string, string, string];
  tags?: string[];
  source?: 'curated' | 'opentdb' | 'wikidata' | 'custom';
}

export type PerfilTheme =
  | 'personagem_ficticio'
  | 'lugar'
  | 'pessoa_famosa'
  | 'objeto'
  | 'obra_midia'
  | 'ciencia_conceito'
  | 'animal_natureza'
  | 'musica_banda'
  | 'comida_bebida'
  | 'jogo_esporte';

export interface PerfilCard {
  id: string;
  theme: PerfilTheme;
  difficulty: QuestionDifficulty;
  answer: string;
  subtitle?: string;
  era?: string;
  origin?: string;
  referenceHint?: string;
  clues: string[]; // 10 clues, ordered from most cryptic (10 pts) to easiest (1 pt)
}

export interface PlayerState {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isBot?: boolean;
  botLevel?: QuestionDifficulty;
  score: number;
  streak: number;
  correctCount: number;
  answeredCount: number;
  crownCharge: number; // 0 to 3
  crowns: CategoryId[];
  connected: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'spinning'
  | 'choosing_crown'
  | 'question'
  | 'reveal'
  | 'finished';

export interface AnswerSubmission {
  playerId: string;
  selectedIndex: number;
  timeMs: number;
}

export interface RoundReveal {
  questionId: string;
  correctIndex: number;
  explanation: string;
  submissions: Record<
    string,
    {
      selectedIndex: number;
      isCorrect: boolean;
      pointsEarned: number;
      timeMs: number;
    }
  >;
  crownAwardedTo?: { playerId: string; category: CategoryId } | null;
}

export interface RoomSettings {
  difficulty: RoomDifficulty;
  crownsToWin: number; // 3 or 6
  questionTimeSec: number;
  enableExternalApi: boolean;
  maxPlayers: number; // up to 5
}

export interface PublicRoomState {
  roomCode: string;
  phase: GamePhase;
  settings: RoomSettings;
  players: PlayerState[];
  activePlayerId: string;
  turnNumber: number;
  wheelTargetSector: number; // 0..6 (0..5 categories, 6 = Coroa Especial)
  wheelSpinId: number;
  selectedCategory: CategoryId | null;
  isCrownRound: boolean;
  currentQuestion: PublicTriviaQuestion | null;
  questionStartedAt: number | null;
  lastReveal: RoundReveal | null;
  winnerId: string | null;
  answeredPlayerIds: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  correctAnswers: number;
  createdAt: string;
}
