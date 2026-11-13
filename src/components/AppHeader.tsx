'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Gamepad2,
  Layers,
  LogOut,
  Menu,
  Moon,
  Sun,
  Trophy,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { soundEngine } from '@/lib/sound';

const NAV_ITEMS = [
  { href: '/perguntados', label: 'Perguntados', icon: Gamepad2, activeBg: 'bg-gradient-to-r from-[#FF3D8B] to-[#FF6BA6] shadow-[0_6px_14px_-4px_rgba(255,61,139,0.55),inset_0_-3px_0_rgba(180,20,85,0.45)]' },
  { href: '/perfil', label: 'Perfil', icon: Layers, activeBg: 'bg-gradient-to-r from-[#FFB800] to-[#FF8A00] shadow-[0_6px_14px_-4px_rgba(255,154,0,0.5),inset_0_-3px_0_rgba(180,95,0,0.45)]' },
  { href: '/temas', label: 'Temas', icon: BookOpen, activeBg: 'bg-gradient-to-r from-[#00D68F] to-[#1CB0F6] shadow-[0_6px_14px_-4px_rgba(0,214,143,0.48),inset_0_-3px_0_rgba(0,120,90,0.4)]' },
  { href: '/ranking', label: 'Ranking', icon: Trophy, activeBg: 'bg-gradient-to-r from-[#8B5CF6] to-[#1CB0F6] shadow-[0_6px_14px_-4px_rgba(139,92,246,0.5),inset_0_-3px_0_rgba(88,40,190,0.45)]' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('nexus-trivia-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);

    Promise.resolve().then(() => {
      setMuted(soundEngine.isMuted());
      setDark(isDark);
    });
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('nexus-trivia-theme', next ? 'dark' : 'light');
    soundEngine.playSelect();
  };

  const toggleMute = () => {
    const next = soundEngine.toggleMute();
    setMuted(next);
    if (!next) soundEngine.playSelect();
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="clay-capsule mx-auto flex max-w-6xl items-center justify-between rounded-full px-3.5 py-2 sm:px-5">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3D8B] via-[#8B5CF6] to-[#1CB0F6] p-0.5 shadow-[0_8px_16px_-4px_rgba(139,92,246,0.5),inset_0_-3px_0_rgba(0,0,0,0.22)] transition-transform group-hover:scale-105 group-hover:rotate-6">
            <svg viewBox="0 0 36 36" className="h-6 w-6 text-white" fill="none">
              <path
                d="M18 4L30 11V25L18 32L6 25V11L18 4Z"
                fill="rgba(255,255,255,0.2)"
                stroke="white"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="18" r="4.5" fill="#FFB800" stroke="white" strokeWidth="1.8" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Nexus<span className="text-[#FF3D8B]">Trivia</span>
            </span>
            <span className="ml-1.5 hidden rounded-full bg-[#FFB800]/20 px-2 py-0.5 font-mono-tech text-[10px] font-bold text-[#a46b00] dark:text-[#FFD65A] sm:inline-block">
              STUDIO 3D
            </span>
          </div>
        </Link>

        {/* Desktop Nav Pill Dock */}
        <nav className="hidden items-center gap-1.5 rounded-full bg-black/[0.06] p-1.5 dark:bg-white/[0.08] md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-5 py-2 font-display text-sm sm:text-[15px] font-bold transition-all ${
                  active
                    ? `${item.activeBg} text-white`
                    : 'text-[var(--fg-muted)] hover:bg-white/70 hover:text-[var(--fg)] dark:hover:bg-white/15'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            title={muted ? 'Ativar efeitos sonoros' : 'Silenciar efeitos sonoros'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] transition hover:scale-105 hover:text-[var(--fg)] cursor-pointer"
          >
            {muted ? <VolumeX className="h-5 w-5 text-rose-500" /> : <Volume2 className="h-5 w-5 text-[#00be7b]" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={dark ? 'Modo Claro Massinha' : 'Modo Noite Toybox'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] transition hover:scale-105 hover:text-[var(--fg)] cursor-pointer"
          >
            {dark ? <Sun className="h-5 w-5 text-[#FFB800]" /> : <Moon className="h-5 w-5 text-[#8B5CF6]" />}
          </button>

          {user ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/conta"
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-sm font-bold transition hover:scale-[1.02]"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate">{user.displayName}</span>
                <span className="font-mono-tech text-xs text-[#FF3D8B]">
                  {user.totalPoints}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sair"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] transition hover:text-rose-500 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/conta"
              className="clay-btn-grape hidden items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-sm font-bold sm:flex"
            >
              <User className="h-4 w-4" />
              Entrar
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] md:hidden cursor-pointer"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="clay-capsule mx-auto mt-2 max-w-6xl rounded-[28px] p-3 md:hidden">
          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 font-display text-sm font-bold ${
                    active ? `${item.activeBg} text-white` : 'text-[var(--fg-muted)] hover:bg-[#1CB0F6]/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/conta"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#8B5CF6]" />
                {user ? `${user.displayName} (${user.totalPoints} pts)` : 'Entrar / Criar Conta'}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
