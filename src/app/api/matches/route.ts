import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLeaderboard, recordMatchAndStats } from '@/lib/db';

export async function GET() {
  try {
    const data = await getLeaderboard();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ error: 'Erro ao carregar ranking.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = (await req.json()) as {
      playerName?: string;
      mode?: string;
      difficulty?: string;
      score?: number;
      crowns?: number;
      correctAnswers?: number;
      won?: boolean;
    };

    const playerName =
      user?.displayName || (body.playerName ?? '').trim() || 'Visitante';

    await recordMatchAndStats({
      userId: user?.id ?? null,
      playerName: playerName.slice(0, 32),
      mode: body.mode ?? 'solo',
      difficulty: body.difficulty ?? 'medio',
      score: Math.max(0, Math.round(body.score ?? 0)),
      crowns: Math.max(0, Math.round(body.crowns ?? 0)),
      correctAnswers: Math.max(0, Math.round(body.correctAnswers ?? 0)),
      won: Boolean(body.won),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Match record error:', err);
    return NextResponse.json({ error: 'Erro ao registrar partida.' }, { status: 500 });
  }
}
