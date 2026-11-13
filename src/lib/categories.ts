import type { CategoryId, PerfilTheme, QuestionDifficulty, RoomDifficulty } from '@/types/game';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  shortName: string;
  color: string;
  accentHex: string;
  glowRgba: string;
  badgeBg: string;
  nerdRef: string;
  description: string;
  subtopics: string[];
  symbol: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pop',
    name: 'Entretenimento & Pop',
    shortName: 'Pop',
    color: '#FF3D8B',
    accentHex: '#FF70A9',
    glowRgba: 'rgba(255, 61, 139, 0.38)',
    badgeBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-400/40',
    nerdRef: 'Fase 01 · Arena Pop & Geek',
    description: 'Cinema, séries, videogames, animes, música, quadrinhos e cultura digital.',
    subtopics: ['Cinema & Séries', 'Videogames', 'Animes & Mangás', 'Música', 'Quadrinhos & Sci-Fi'],
    symbol: 'POP',
  },
  {
    id: 'historia',
    name: 'História',
    shortName: 'História',
    color: '#FFB800',
    accentHex: '#FFD147',
    glowRgba: 'rgba(255, 184, 0, 0.38)',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40',
    nerdRef: 'Fase 02 · Túnel do Tempo',
    description: 'Civilizações antigas, História do Brasil, grandes guerras, impérios e revoluções.',
    subtopics: ['Antiguidade', 'História do Brasil', 'Idade Média & Moderna', 'Século XX', 'Revoluções'],
    symbol: 'HIS',
  },
  {
    id: 'geografia',
    name: 'Geografia',
    shortName: 'Geografia',
    color: '#1CB0F6',
    accentHex: '#5CC9FF',
    glowRgba: 'rgba(28, 176, 246, 0.38)',
    badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/40',
    nerdRef: 'Fase 03 · Globo de Massinha',
    description: 'Capitais, fronteiras, biomas, oceanos, bandeiras, relevo e geopolítica mundial.',
    subtopics: ['Capitais & Países', 'Relevo & Hidrografia', 'Brasil Regional', 'Clima & Biomas', 'Geopolítica'],
    symbol: 'GEO',
  },
  {
    id: 'arte',
    name: 'Arte & Literatura',
    shortName: 'Arte',
    color: '#FF5A5F',
    accentHex: '#FF8589',
    glowRgba: 'rgba(255, 90, 95, 0.38)',
    badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40',
    nerdRef: 'Fase 04 · Ateliê Criativo',
    description: 'Pintura, escultura, arquitetura, literatura brasileira e universal, teatro e música clássica.',
    subtopics: ['Pintura & Escultura', 'Literatura Brasileira', 'Literatura Mundial', 'Arquitetura', 'Música Clássica'],
    symbol: 'ART',
  },
  {
    id: 'ciencia',
    name: 'Ciência & Tecnologia',
    shortName: 'Ciência',
    color: '#00D68F',
    accentHex: '#3FE8AF',
    glowRgba: 'rgba(0, 214, 143, 0.38)',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
    nerdRef: 'Fase 05 · Lab de Slime & Átomos',
    description: 'Física, química, biologia, astronomia, computação, matemática e grandes invenções.',
    subtopics: ['Astronomia', 'Física & Química', 'Biologia & Genética', 'Computação & IA', 'Matemática'],
    symbol: 'CIE',
  },
  {
    id: 'esportes',
    name: 'Esportes',
    shortName: 'Esportes',
    color: '#8B5CF6',
    accentHex: '#A78BFA',
    glowRgba: 'rgba(139, 92, 246, 0.38)',
    badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/40',
    nerdRef: 'Fase 06 · Pódio dos Campeões',
    description: 'Futebol, Olimpíadas, NBA, Fórmula 1, tênis, artes marciais, e-sports e recordes mundiais.',
    subtopics: ['Futebol & Copas', 'Jogos Olímpicos', 'Automobilismo & F1', 'Basquete & Tênis', 'E-Sports'],
    symbol: 'ESP',
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>
);

export interface PerfilThemeMeta {
  id: PerfilTheme;
  name: string;
  symbol: string;
  color: string;
  badgeBg: string;
  description: string;
}

export const PERFIL_THEMES: PerfilThemeMeta[] = [
  {
    id: 'personagem_ficticio',
    name: 'Personagem',
    symbol: 'PER',
    color: '#ec4899',
    badgeBg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
    description: 'Heróis, vilões e ícones de HQs, filmes e séries.',
  },
  {
    id: 'lugar',
    name: 'Lugar',
    symbol: 'LUG',
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    description: 'Cidades, monumentos e cenários pelo mundo.',
  },
  {
    id: 'pessoa_famosa',
    name: 'Personalidade',
    symbol: 'VIP',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    description: 'Cientistas, artistas e líderes históricos.',
  },
  {
    id: 'objeto',
    name: 'Objeto',
    symbol: 'OBJ',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    description: 'Invenções, artefatos e itens clássicos.',
  },
  {
    id: 'obra_midia',
    name: 'Filme & Obra',
    symbol: 'OBR',
    color: '#ef4444',
    badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    description: 'Filmes, livros, animações e clássicos.',
  },
  {
    id: 'ciencia_conceito',
    name: 'Ciência',
    symbol: 'CIE',
    color: '#8b5cf6',
    badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    description: 'Fenômenos físicos, astros e descobertas.',
  },
  {
    id: 'animal_natureza',
    name: 'Animal & Bioma',
    symbol: 'ANI',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    description: 'Criaturas incríveis e forças da natureza.',
  },
  {
    id: 'musica_banda',
    name: 'Música & Banda',
    symbol: 'MUS',
    color: '#d946ef',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    description: 'Bandas lendárias, álbuns e instrumentos.',
  },
  {
    id: 'comida_bebida',
    name: 'Gastronomia',
    symbol: 'GAS',
    color: '#f97316',
    badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    description: 'Pratos típicos, ingredientes e bebidas.',
  },
  {
    id: 'jogo_esporte',
    name: 'Games & Esporte',
    symbol: 'JOG',
    color: '#22c55e',
    badgeBg: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
    description: 'Jogos marcantes, campeonatos e arenas.',
  },
];

export const PERFIL_THEME_MAP: Record<PerfilTheme, PerfilThemeMeta> = PERFIL_THEMES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<PerfilTheme, PerfilThemeMeta>
);

export const DIFFICULTY_META: Record<
  RoomDifficulty,
  {
    label: string;
    timeSec: number;
    basePoints: number;
    description: string;
    badgeClass: string;
  }
> = {
  facil: {
    label: 'Padawan (Fácil)',
    timeSec: 30,
    basePoints: 100,
    description: '30s por pergunta · Perguntas acessíveis para aquecer os circuitos.',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  medio: {
    label: 'Cientista (Médio)',
    timeSec: 20,
    basePoints: 150,
    description: '20s por pergunta · Equilíbrio clássico estilo Perguntados.',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  },
  dificil: {
    label: 'Grão-Mestre (Difícil)',
    timeSec: 14,
    basePoints: 250,
    description: '14s por pergunta · Conhecimento profundo, bônus máximo de velocidade.',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  misto: {
    label: 'Quântico (Misto)',
    timeSec: 20,
    basePoints: 160,
    description: '20s por pergunta · Mistura dinâmica de fácil, médio e difícil.',
    badgeClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
};

export function getPointsForDifficulty(difficulty: QuestionDifficulty, timeLeftRatio: number): number {
  const base = difficulty === 'facil' ? 100 : difficulty === 'medio' ? 150 : 250;
  const speedBonus = Math.round(base * 0.4 * Math.max(0, Math.min(1, timeLeftRatio)));
  return base + speedBonus;
}
