import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL
  );
}

export function hasDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.startsWith('postgres'));
}

export function getPrismaClient(): PrismaClient | null {
  if (!hasDatabaseConfigured()) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasourceUrl: getDatabaseUrl(),
    });
  }

  return globalForPrisma.prisma;
}
