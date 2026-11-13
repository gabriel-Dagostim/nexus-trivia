import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CategoryId, QuestionDifficulty, TriviaQuestion, UserProfile } from '@/types/game';
import { getPrismaClient } from './prisma';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarColor: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  correctAnswers: number;
  createdAt: string;
}

interface StoredMatch {
  id: string;
  userId: string | null;
  playerName: string;
  mode: string;
  difficulty: string;
  score: number;
  crowns: number;
  won: boolean;
  createdAt: string;
}

interface LocalDbSchema {
  users: StoredUser[];
  customQuestions: TriviaQuestion[];
  matches: StoredMatch[];
}

function getLocalDbPath(): string {
  // On Vercel without DB configured, fallback to /tmp so reads/writes don't crash on read-only FS
  if (process.env.VERCEL) {
    return path.join('/tmp', 'nexus-trivia-local-db.json');
  }
  return path.join(process.cwd(), 'data', 'local-db.json');
}

function readLocalDb(): LocalDbSchema {
  const filePath = getLocalDbPath();
  try {
    if (!fs.existsSync(filePath)) {
      return { users: [], customQuestions: [], matches: [] };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LocalDbSchema>;
    return {
      users: parsed.users ?? [],
      customQuestions: parsed.customQuestions ?? [],
      matches: parsed.matches ?? [],
    };
  } catch {
    return { users: [], customQuestions: [], matches: [] };
  }
}

function writeLocalDb(db: LocalDbSchema): void {
  const filePath = getLocalDbPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
}

function toPublicUser(u: {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  correctAnswers: number;
  createdAt: Date | string;
}): UserProfile {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    totalPoints: u.totalPoints,
    gamesPlayed: u.gamesPlayed,
    wins: u.wins,
    correctAnswers: u.correctAnswers,
    createdAt: typeof u.createdAt === 'string' ? u.createdAt : u.createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  if (prisma) {
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) return null;
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  const db = readLocalDb();
  return db.users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<UserProfile | null> {
  const prisma = getPrismaClient();
  if (prisma) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toPublicUser(user) : null;
  }

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === id);
  return user ? toPublicUser(user) : null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarColor: string;
}): Promise<UserProfile> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const prisma = getPrismaClient();

  if (prisma) {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        displayName: input.displayName.trim(),
        avatarColor: input.avatarColor,
      },
    });
    return toPublicUser(created);
  }

  const db = readLocalDb();
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    displayName: input.displayName.trim(),
    avatarColor: input.avatarColor,
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    correctAnswers: 0,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeLocalDb(db);
  return toPublicUser(newUser);
}

export async function recordMatchAndStats(input: {
  userId: string | null;
  playerName: string;
  mode: string;
  difficulty: string;
  score: number;
  crowns: number;
  correctAnswers: number;
  won: boolean;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    await prisma.matchRecord.create({
      data: {
        userId: input.userId,
        playerName: input.playerName,
        mode: input.mode,
        difficulty: input.difficulty,
        score: input.score,
        crowns: input.crowns,
        won: input.won,
      },
    });

    if (input.userId) {
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          totalPoints: { increment: Math.max(0, input.score) },
          gamesPlayed: { increment: 1 },
          wins: { increment: input.won ? 1 : 0 },
          correctAnswers: { increment: Math.max(0, input.correctAnswers) },
        },
      });
    }
    return;
  }

  const db = readLocalDb();
  db.matches.unshift({
    id: crypto.randomUUID(),
    userId: input.userId,
    playerName: input.playerName,
    mode: input.mode,
    difficulty: input.difficulty,
    score: input.score,
    crowns: input.crowns,
    won: input.won,
    createdAt: new Date().toISOString(),
  });
  db.matches = db.matches.slice(0, 100);

  if (input.userId) {
    const user = db.users.find((u) => u.id === input.userId);
    if (user) {
      user.totalPoints += Math.max(0, input.score);
      user.gamesPlayed += 1;
      if (input.won) user.wins += 1;
      user.correctAnswers += Math.max(0, input.correctAnswers);
    }
  }
  writeLocalDb(db);
}

export async function getLeaderboard() {
  const prisma = getPrismaClient();
  if (prisma) {
    const [topUsers, recentMatches] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ totalPoints: 'desc' }, { wins: 'desc' }],
        take: 15,
        select: {
          id: true,
          displayName: true,
          avatarColor: true,
          totalPoints: true,
          gamesPlayed: true,
          wins: true,
          correctAnswers: true,
        },
      }),
      prisma.matchRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    return {
      topUsers,
      recentMatches: recentMatches.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
      storageMode: 'neon-postgres' as const,
    };
  }

  const db = readLocalDb();
  const topUsers = [...db.users]
    .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins)
    .slice(0, 15)
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      avatarColor: u.avatarColor,
      totalPoints: u.totalPoints,
      gamesPlayed: u.gamesPlayed,
      wins: u.wins,
      correctAnswers: u.correctAnswers,
    }));

  return {
    topUsers,
    recentMatches: db.matches.slice(0, 15),
    storageMode: 'local-json' as const,
  };
}

export async function saveExternalQuestions(questions: TriviaQuestion[]): Promise<number> {
  if (questions.length === 0) return 0;
  const prisma = getPrismaClient();

  if (prisma) {
    let saved = 0;
    for (const q of questions) {
      const existing = await prisma.customQuestion.findFirst({
        where: { prompt: q.prompt },
      });
      if (!existing) {
        await prisma.customQuestion.create({
          data: {
            category: q.category,
            difficulty: q.difficulty,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            source: q.source ?? 'external',
          },
        });
        saved++;
      }
    }
    return saved;
  }

  const db = readLocalDb();
  const existingPrompts = new Set(db.customQuestions.map((q) => q.prompt));
  let saved = 0;
  for (const q of questions) {
    if (!existingPrompts.has(q.prompt)) {
      db.customQuestions.push(q);
      existingPrompts.add(q.prompt);
      saved++;
    }
  }
  writeLocalDb(db);
  return saved;
}

export async function getStoredCustomQuestions(): Promise<TriviaQuestion[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    const rows = await prisma.customQuestion.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      category: r.category as CategoryId,
      difficulty: r.difficulty as QuestionDifficulty,
      prompt: r.prompt,
      options: r.options as [string, string, string, string],
      correctIndex: r.correctIndex,
      explanation: r.explanation,
      source: (r.source as TriviaQuestion['source']) ?? 'custom',
    }));
  }

  const db = readLocalDb();
  return db.customQuestions;
}
