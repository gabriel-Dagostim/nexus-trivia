import { NextResponse } from 'next/server';
import { createSessionToken, hashPassword, setSessionCookie } from '@/lib/auth';
import { createUser, findUserByEmail } from '@/lib/db';
import { getJwtSecret } from '@/lib/auth-secret';

const AVATAR_COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      avatarColor?: string;
    };

    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const displayName = (body.displayName ?? '').trim() || email.split('@')[0] || 'Jogador';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha precisa ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }
    if (displayName.length < 2 || displayName.length > 24) {
      return NextResponse.json(
        { error: 'O apelido deve ter entre 2 e 24 caracteres.' },
        { status: 400 }
      );
    }

    getJwtSecret();

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 }
      );
    }

    const avatarColor =
      body.avatarColor && /^#[0-9a-fA-F]{6}$/.test(body.avatarColor)
        ? body.avatarColor
        : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await createUser({
      email,
      passwordHash: hashPassword(password),
      displayName,
      avatarColor,
    });

    const token = await createSessionToken(user.id, user.email);
    await setSessionCookie(token);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}
