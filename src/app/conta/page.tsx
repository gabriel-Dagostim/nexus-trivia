'use client';

import { useState } from 'react';
import { Award, CheckCircle2, KeyRound, LogIn, LogOut, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { AVATAR_PALETTE } from '@/lib/game-engine';
import { soundEngine } from '@/lib/sound';
import { ThemeBackdrop } from '@/components/ThemeBackdrop';

export default function ContaPage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: tab === 'register' ? displayName : undefined,
          avatarColor: tab === 'register' ? avatarColor : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || 'Erro ao autenticar.');
        soundEngine.playWrong();
      } else {
        soundEngine.playCorrect();
        await refreshUser();
      }
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center font-mono-tech text-sm text-[var(--fg-muted)]">
        Verificando sessão...
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative mx-auto w-full max-w-2xl px-4 py-10 space-y-6">
        <ThemeBackdrop theme="studio" />
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-lg"
                style={{
                  backgroundColor: user.avatarColor,
                  boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.22), inset 0 3px 5px rgba(255,255,255,0.45)',
                }}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00be7b]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sessão Ativa
                </div>
                <h1 className="font-display text-2xl font-bold">{user.displayName}</h1>
                <p className="font-mono-tech text-xs text-[var(--fg-muted)]">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="clay-btn-soft inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-500 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="clay-inset p-4 text-center">
              <div className="font-display text-2xl font-bold text-[#1CB0F6]">
                {user.totalPoints}
              </div>
              <div className="text-xs font-semibold text-[var(--fg-muted)]">Pontos Totais</div>
            </div>
            <div className="clay-inset p-4 text-center">
              <div className="font-display text-2xl font-bold text-[#00be7b]">
                {user.wins}
              </div>
              <div className="text-xs font-semibold text-[var(--fg-muted)]">Vitórias</div>
            </div>
            <div className="clay-inset p-4 text-center">
              <div className="font-display text-2xl font-bold text-[#FF3D8B]">
                {user.gamesPlayed}
              </div>
              <div className="text-xs font-semibold text-[var(--fg-muted)]">Partidas</div>
            </div>
            <div className="clay-inset p-4 text-center">
              <div className="font-display text-2xl font-bold text-[#FFB800]">
                {user.correctAnswers}
              </div>
              <div className="text-xs font-semibold text-[var(--fg-muted)]">Acertos</div>
            </div>
          </div>

          <div className="clay-inset flex items-center gap-3 p-4 text-xs font-medium text-[var(--fg)]">
            <Award className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
            <span>
              Suas partidas finalizadas no Perguntados 3D somam pontos automaticamente no Ranking
              Global usando seu e-mail cadastrado.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md px-4 py-10">
      <ThemeBackdrop theme="studio" />
      <div className="clay-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="clay-btn-grape mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            {tab === 'login' ? 'Entrar na Arena' : 'Criar Conta Simples'}
          </h1>
          <p className="text-xs text-[var(--fg-muted)]">
            Apenas e-mail e senha (sem 2FA). Salve seu histórico e dispute o Ranking!
          </p>
        </div>

        {/* Tabs */}
        <div className="clay-inset grid grid-cols-2 gap-2 p-1.5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`rounded-2xl py-2.5 font-display text-xs font-bold transition cursor-pointer ${
              tab === 'login' ? 'clay-btn-cyan text-white' : 'text-[var(--fg-muted)]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`rounded-2xl py-2.5 font-display text-xs font-bold transition cursor-pointer ${
              tab === 'register' ? 'clay-btn-primary text-white' : 'text-[var(--fg-muted)]'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1">
                  Apelido
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={24}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: BeanMestre"
                  className="clay-inset w-full px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FF3D8B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1.5">
                  Cor da Massinha
                </label>
                <div className="flex gap-2.5">
                  {AVATAR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`h-8 w-8 rounded-full cursor-pointer ${
                        avatarColor === c ? 'ring-3 ring-offset-2 ring-[#FF3D8B] scale-110' : 'opacity-80'
                      }`}
                      style={{
                        backgroundColor: c,
                        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.45)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--fg-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="clay-inset w-full pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--fg-muted)] mb-1">
              Senha (mín. 6 caracteres)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--fg-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="clay-inset w-full pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border-2 border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-bold text-rose-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="clay-btn-primary w-full inline-flex items-center justify-center gap-2 py-4 font-display text-sm font-bold disabled:opacity-60 cursor-pointer"
          >
            {tab === 'login' ? (
              <>
                <LogIn className="h-4 w-4" />
                {submitting ? 'Entrando...' : 'Entrar'}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {submitting ? 'Criando...' : 'Criar Conta'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
