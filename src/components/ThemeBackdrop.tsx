'use client';

import React from 'react';
import type { CategoryId, PerfilTheme } from '@/types/game';

export type BackdropTheme =
  | 'studio'
  | 'perguntados'
  | 'perfil-lobby'
  | CategoryId
  | PerfilTheme;

interface ThemePalette {
  lightBg: string;
  darkBg: string;
  orbA: string;
  orbB: string;
  orbC: string;
  accent: string;
  patternClass: string;
}

const THEME_PALETTES: Record<BackdropTheme, ThemePalette> = {
  studio: {
    lightBg:
      'radial-gradient(circle at 12% 14%, rgba(255,61,139,0.22), transparent 44%), radial-gradient(circle at 86% 18%, rgba(28,176,246,0.26), transparent 45%), radial-gradient(circle at 52% 86%, rgba(255,184,0,0.20), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 12% 14%, rgba(255,61,139,0.30), transparent 46%), radial-gradient(circle at 86% 18%, rgba(28,176,246,0.32), transparent 48%), radial-gradient(circle at 52% 86%, rgba(139,92,246,0.28), transparent 48%)',
    orbA: '#FF3D8B',
    orbB: '#1CB0F6',
    orbC: '#FFB800',
    accent: '#FF3D8B',
    patternClass: 'theme-pattern-studio',
  },
  perguntados: {
    lightBg:
      'radial-gradient(circle at 20% 10%, rgba(255,184,0,0.24), transparent 45%), radial-gradient(circle at 82% 20%, rgba(255,61,139,0.22), transparent 46%), radial-gradient(circle at 48% 92%, rgba(28,176,246,0.24), transparent 48%)',
    darkBg:
      'radial-gradient(circle at 20% 10%, rgba(255,184,0,0.28), transparent 46%), radial-gradient(circle at 82% 20%, rgba(255,61,139,0.30), transparent 46%), radial-gradient(circle at 48% 92%, rgba(28,176,246,0.28), transparent 48%)',
    orbA: '#FFB800',
    orbB: '#FF3D8B',
    orbC: '#1CB0F6',
    accent: '#FFB800',
    patternClass: 'theme-pattern-pop',
  },
  'perfil-lobby': {
    lightBg:
      'radial-gradient(circle at 15% 15%, rgba(0,214,143,0.22), transparent 45%), radial-gradient(circle at 85% 22%, rgba(255,184,0,0.22), transparent 45%), radial-gradient(circle at 50% 88%, rgba(139,92,246,0.20), transparent 48%)',
    darkBg:
      'radial-gradient(circle at 15% 15%, rgba(0,214,143,0.28), transparent 46%), radial-gradient(circle at 85% 22%, rgba(255,184,0,0.25), transparent 46%), radial-gradient(circle at 50% 88%, rgba(139,92,246,0.28), transparent 48%)',
    orbA: '#00D68F',
    orbB: '#FFB800',
    orbC: '#8B5CF6',
    accent: '#00D68F',
    patternClass: 'theme-pattern-historia',
  },
  pop: {
    lightBg:
      'radial-gradient(circle at 14% 12%, rgba(255,61,139,0.28), transparent 44%), radial-gradient(circle at 85% 25%, rgba(139,92,246,0.22), transparent 44%), radial-gradient(circle at 50% 90%, rgba(255,184,0,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 12%, rgba(255,61,139,0.34), transparent 46%), radial-gradient(circle at 85% 25%, rgba(139,92,246,0.28), transparent 46%), radial-gradient(circle at 50% 90%, rgba(255,184,0,0.18), transparent 46%)',
    orbA: '#FF3D8B',
    orbB: '#EC4899',
    orbC: '#8B5CF6',
    accent: '#FF3D8B',
    patternClass: 'theme-pattern-pop',
  },
  historia: {
    lightBg:
      'radial-gradient(circle at 16% 14%, rgba(255,184,0,0.28), transparent 45%), radial-gradient(circle at 84% 24%, rgba(217,119,6,0.20), transparent 44%), radial-gradient(circle at 48% 88%, rgba(245,158,11,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 16% 14%, rgba(255,184,0,0.30), transparent 46%), radial-gradient(circle at 84% 24%, rgba(180,83,9,0.28), transparent 46%), radial-gradient(circle at 48% 88%, rgba(217,119,6,0.22), transparent 46%)',
    orbA: '#FFB800',
    orbB: '#F59E0B',
    orbC: '#D97706',
    accent: '#FFB800',
    patternClass: 'theme-pattern-historia',
  },
  geografia: {
    lightBg:
      'radial-gradient(circle at 14% 12%, rgba(28,176,246,0.28), transparent 45%), radial-gradient(circle at 86% 24%, rgba(0,214,143,0.22), transparent 44%), radial-gradient(circle at 50% 88%, rgba(56,189,248,0.20), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 12%, rgba(28,176,246,0.32), transparent 46%), radial-gradient(circle at 86% 24%, rgba(0,214,143,0.25), transparent 46%), radial-gradient(circle at 50% 88%, rgba(14,165,233,0.22), transparent 46%)',
    orbA: '#1CB0F6',
    orbB: '#00D68F',
    orbC: '#38BDF8',
    accent: '#1CB0F6',
    patternClass: 'theme-pattern-geografia',
  },
  arte: {
    lightBg:
      'radial-gradient(circle at 15% 15%, rgba(255,90,95,0.26), transparent 44%), radial-gradient(circle at 85% 22%, rgba(255,184,0,0.22), transparent 44%), radial-gradient(circle at 50% 90%, rgba(255,61,139,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 15% 15%, rgba(255,90,95,0.32), transparent 46%), radial-gradient(circle at 85% 22%, rgba(255,184,0,0.24), transparent 46%), radial-gradient(circle at 50% 90%, rgba(244,63,94,0.22), transparent 46%)',
    orbA: '#FF5A5F',
    orbB: '#FFB800',
    orbC: '#FB7185',
    accent: '#FF5A5F',
    patternClass: 'theme-pattern-arte',
  },
  ciencia: {
    lightBg:
      'radial-gradient(circle at 16% 12%, rgba(0,214,143,0.26), transparent 45%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.22), transparent 44%), radial-gradient(circle at 52% 88%, rgba(16,185,129,0.20), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 16% 12%, rgba(0,214,143,0.30), transparent 46%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.28), transparent 46%), radial-gradient(circle at 52% 88%, rgba(16,185,129,0.22), transparent 46%)',
    orbA: '#00D68F',
    orbB: '#1CB0F6',
    orbC: '#34D399',
    accent: '#00D68F',
    patternClass: 'theme-pattern-ciencia',
  },
  esportes: {
    lightBg:
      'radial-gradient(circle at 14% 12%, rgba(139,92,246,0.26), transparent 45%), radial-gradient(circle at 86% 24%, rgba(28,176,246,0.20), transparent 44%), radial-gradient(circle at 52% 88%, rgba(0,214,143,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 12%, rgba(139,92,246,0.34), transparent 46%), radial-gradient(circle at 86% 24%, rgba(28,176,246,0.24), transparent 46%), radial-gradient(circle at 52% 88%, rgba(0,214,143,0.20), transparent 46%)',
    orbA: '#8B5CF6',
    orbB: '#1CB0F6',
    orbC: '#A78BFA',
    accent: '#8B5CF6',
    patternClass: 'theme-pattern-esportes',
  },
  personagem_ficticio: {
    lightBg:
      'radial-gradient(circle at 14% 12%, rgba(236,72,153,0.28), transparent 44%), radial-gradient(circle at 84% 24%, rgba(139,92,246,0.24), transparent 44%), radial-gradient(circle at 48% 90%, rgba(255,184,0,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 12%, rgba(236,72,153,0.34), transparent 46%), radial-gradient(circle at 84% 24%, rgba(139,92,246,0.30), transparent 46%), radial-gradient(circle at 48% 90%, rgba(255,184,0,0.20), transparent 46%)',
    orbA: '#ec4899',
    orbB: '#8B5CF6',
    orbC: '#FFB800',
    accent: '#ec4899',
    patternClass: 'theme-pattern-pop',
  },
  lugar: {
    lightBg:
      'radial-gradient(circle at 16% 12%, rgba(59,130,246,0.28), transparent 45%), radial-gradient(circle at 85% 24%, rgba(0,214,143,0.22), transparent 44%), radial-gradient(circle at 50% 90%, rgba(28,176,246,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 16% 12%, rgba(59,130,246,0.32), transparent 46%), radial-gradient(circle at 85% 24%, rgba(0,214,143,0.26), transparent 46%), radial-gradient(circle at 50% 90%, rgba(56,189,248,0.22), transparent 46%)',
    orbA: '#3b82f6',
    orbB: '#00D68F',
    orbC: '#38BDF8',
    accent: '#3b82f6',
    patternClass: 'theme-pattern-geografia',
  },
  pessoa_famosa: {
    lightBg:
      'radial-gradient(circle at 15% 12%, rgba(245,158,11,0.28), transparent 45%), radial-gradient(circle at 85% 24%, rgba(255,61,139,0.20), transparent 44%), radial-gradient(circle at 50% 90%, rgba(251,191,36,0.20), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 15% 12%, rgba(245,158,11,0.32), transparent 46%), radial-gradient(circle at 85% 24%, rgba(255,61,139,0.24), transparent 46%), radial-gradient(circle at 50% 90%, rgba(245,158,11,0.22), transparent 46%)',
    orbA: '#f59e0b',
    orbB: '#FF3D8B',
    orbC: '#FBBF24',
    accent: '#f59e0b',
    patternClass: 'theme-pattern-historia',
  },
  objeto: {
    lightBg:
      'radial-gradient(circle at 15% 14%, rgba(16,185,129,0.26), transparent 45%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.22), transparent 44%), radial-gradient(circle at 50% 90%, rgba(255,184,0,0.16), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 15% 14%, rgba(16,185,129,0.30), transparent 46%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.26), transparent 46%), radial-gradient(circle at 50% 90%, rgba(16,185,129,0.20), transparent 46%)',
    orbA: '#10b981',
    orbB: '#1CB0F6',
    orbC: '#FFB800',
    accent: '#10b981',
    patternClass: 'theme-pattern-ciencia',
  },
  obra_midia: {
    lightBg:
      'radial-gradient(circle at 15% 14%, rgba(239,68,68,0.26), transparent 45%), radial-gradient(circle at 85% 24%, rgba(139,92,246,0.20), transparent 44%), radial-gradient(circle at 50% 90%, rgba(255,184,0,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 15% 14%, rgba(239,68,68,0.32), transparent 46%), radial-gradient(circle at 85% 24%, rgba(139,92,246,0.26), transparent 46%), radial-gradient(circle at 50% 90%, rgba(239,68,68,0.20), transparent 46%)',
    orbA: '#ef4444',
    orbB: '#8B5CF6',
    orbC: '#FFB800',
    accent: '#ef4444',
    patternClass: 'theme-pattern-arte',
  },
  ciencia_conceito: {
    lightBg:
      'radial-gradient(circle at 15% 12%, rgba(139,92,246,0.28), transparent 45%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.24), transparent 44%), radial-gradient(circle at 50% 90%, rgba(0,214,143,0.20), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 15% 12%, rgba(139,92,246,0.34), transparent 46%), radial-gradient(circle at 85% 22%, rgba(28,176,246,0.28), transparent 46%), radial-gradient(circle at 50% 90%, rgba(0,214,143,0.22), transparent 46%)',
    orbA: '#8b5cf6',
    orbB: '#1CB0F6',
    orbC: '#00D68F',
    accent: '#8b5cf6',
    patternClass: 'theme-pattern-ciencia',
  },
  animal_natureza: {
    lightBg:
      'radial-gradient(circle at 14% 12%, rgba(6,182,212,0.28), transparent 45%), radial-gradient(circle at 84% 22%, rgba(0,214,143,0.24), transparent 44%), radial-gradient(circle at 50% 90%, rgba(56,189,248,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 12%, rgba(6,182,212,0.32), transparent 46%), radial-gradient(circle at 84% 22%, rgba(0,214,143,0.28), transparent 46%), radial-gradient(circle at 50% 90%, rgba(6,182,212,0.22), transparent 46%)',
    orbA: '#06b6d4',
    orbB: '#00D68F',
    orbC: '#38BDF8',
    accent: '#06b6d4',
    patternClass: 'theme-pattern-geografia',
  },
  musica_banda: {
    lightBg:
      'radial-gradient(circle at 14% 14%, rgba(217,70,239,0.26), transparent 45%), radial-gradient(circle at 86% 24%, rgba(139,92,246,0.24), transparent 44%), radial-gradient(circle at 50% 90%, rgba(255,61,139,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 14%, rgba(217,70,239,0.32), transparent 46%), radial-gradient(circle at 86% 24%, rgba(139,92,246,0.28), transparent 46%), radial-gradient(circle at 50% 90%, rgba(255,61,139,0.22), transparent 46%)',
    orbA: '#d946ef',
    orbB: '#8B5CF6',
    orbC: '#FF3D8B',
    accent: '#d946ef',
    patternClass: 'theme-pattern-pop',
  },
  comida_bebida: {
    lightBg:
      'radial-gradient(circle at 14% 14%, rgba(249,115,22,0.26), transparent 45%), radial-gradient(circle at 85% 24%, rgba(255,184,0,0.24), transparent 44%), radial-gradient(circle at 50% 90%, rgba(239,68,68,0.16), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 14%, rgba(249,115,22,0.32), transparent 46%), radial-gradient(circle at 85% 24%, rgba(255,184,0,0.26), transparent 46%), radial-gradient(circle at 50% 90%, rgba(239,68,68,0.20), transparent 46%)',
    orbA: '#f97316',
    orbB: '#FFB800',
    orbC: '#FF5A5F',
    accent: '#f97316',
    patternClass: 'theme-pattern-arte',
  },
  jogo_esporte: {
    lightBg:
      'radial-gradient(circle at 14% 14%, rgba(34,197,94,0.26), transparent 45%), radial-gradient(circle at 85% 24%, rgba(28,176,246,0.22), transparent 44%), radial-gradient(circle at 50% 90%, rgba(139,92,246,0.18), transparent 46%)',
    darkBg:
      'radial-gradient(circle at 14% 14%, rgba(34,197,94,0.30), transparent 46%), radial-gradient(circle at 85% 24%, rgba(28,176,246,0.26), transparent 46%), radial-gradient(circle at 50% 90%, rgba(139,92,246,0.22), transparent 46%)',
    orbA: '#22c55e',
    orbB: '#1CB0F6',
    orbC: '#8B5CF6',
    accent: '#22c55e',
    patternClass: 'theme-pattern-esportes',
  },
};

function ThemeSilhouetteMotifs({ theme, color }: { theme: BackdropTheme; color: string }) {
  switch (theme) {
    case 'pop':
    case 'personagem_ficticio':
    case 'musica_banda':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-10 top-24 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <circle cx="110" cy="110" r="92" stroke={color} strokeWidth="6" strokeDasharray="16 10" />
            <circle cx="110" cy="110" r="64" stroke={color} strokeWidth="3.5" />
            <path d="M110 42L126 86L172 86L134 114L148 160L110 132L72 160L86 114L48 86L94 86Z" stroke={color} strokeWidth="4.5" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-56 w-56 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <rect x="24" y="54" width="132" height="76" rx="34" stroke={color} strokeWidth="5.5" />
            <path d="M62 78V106M48 92H76" stroke={color} strokeWidth="6" strokeLinecap="round" />
            <circle cx="124" cy="84" r="7" fill={color} />
            <circle cx="138" cy="98" r="7" fill={color} />
          </svg>
        </>
      );

    case 'historia':
    case 'pessoa_famosa':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-8 top-24 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <path d="M36 74L110 34L184 74H36Z" stroke={color} strokeWidth="5.5" strokeLinejoin="round" />
            <line x1="56" y1="86" x2="56" y2="164" stroke={color} strokeWidth="8" strokeLinecap="round" />
            <line x1="92" y1="86" x2="92" y2="164" stroke={color} strokeWidth="8" strokeLinecap="round" />
            <line x1="128" y1="86" x2="128" y2="164" stroke={color} strokeWidth="8" strokeLinecap="round" />
            <line x1="164" y1="86" x2="164" y2="164" stroke={color} strokeWidth="8" strokeLinecap="round" />
            <rect x="32" y="168" width="156" height="14" rx="7" stroke={color} strokeWidth="4.5" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-56 w-56 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <path d="M52 34H128L96 90L128 146H52L84 90L52 34Z" stroke={color} strokeWidth="5.5" strokeLinejoin="round" />
            <line x1="42" y1="34" x2="138" y2="34" stroke={color} strokeWidth="6" strokeLinecap="round" />
            <line x1="42" y1="146" x2="138" y2="146" stroke={color} strokeWidth="6" strokeLinecap="round" />
          </svg>
        </>
      );

    case 'geografia':
    case 'lugar':
    case 'animal_natureza':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-10 top-20 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <circle cx="110" cy="110" r="82" stroke={color} strokeWidth="4.5" />
            <ellipse cx="110" cy="110" rx="40" ry="82" stroke={color} strokeWidth="3.5" />
            <line x1="28" y1="110" x2="192" y2="110" stroke={color} strokeWidth="3.5" />
            <path d="M40 72C75 84 145 84 180 72" stroke={color} strokeWidth="3.5" />
            <path d="M40 148C75 136 145 136 180 148" stroke={color} strokeWidth="3.5" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-56 w-56 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <circle cx="90" cy="90" r="64" stroke={color} strokeWidth="4.5" strokeDasharray="8 8" />
            <polygon points="90,34 106,90 90,146 74,90" stroke={color} strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="90" cy="90" r="8" fill={color} />
          </svg>
        </>
      );

    case 'arte':
    case 'obra_midia':
    case 'comida_bebida':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-10 top-24 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <path
              d="M110 34C64 34 32 68 32 108C32 146 62 174 96 174C110 174 118 164 116 154C114 144 122 136 134 138C164 142 188 122 188 94C188 58 152 34 110 34Z"
              stroke={color}
              strokeWidth="5.5"
            />
            <circle cx="76" cy="84" r="10" fill={color} />
            <circle cx="110" cy="68" r="10" fill={color} />
            <circle cx="146" cy="86" r="10" fill={color} />
            <circle cx="74" cy="124" r="11" stroke={color} strokeWidth="4.5" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-6 bottom-16 h-52 w-52 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <rect x="34" y="34" width="112" height="112" rx="18" stroke={color} strokeWidth="4.5" />
            <rect x="52" y="52" width="76" height="76" rx="10" stroke={color} strokeWidth="3.5" strokeDasharray="8 6" />
          </svg>
        </>
      );

    case 'ciencia':
    case 'objeto':
    case 'ciencia_conceito':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-10 top-24 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <ellipse cx="110" cy="110" rx="86" ry="32" transform="rotate(28 110 110)" stroke={color} strokeWidth="4.5" />
            <ellipse cx="110" cy="110" rx="86" ry="32" transform="rotate(-28 110 110)" stroke={color} strokeWidth="4.5" />
            <ellipse cx="110" cy="110" rx="86" ry="32" transform="rotate(90 110 110)" stroke={color} strokeWidth="4.5" />
            <circle cx="110" cy="110" r="14" fill={color} />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-52 w-52 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <path d="M74 34H106M80 34V74L48 134C44 142 50 150 60 150H120C130 150 136 142 132 134L100 74V34" stroke={color} strokeWidth="5.5" strokeLinejoin="round" />
            <line x1="60" y1="118" x2="120" y2="118" stroke={color} strokeWidth="4.5" strokeDasharray="6 6" />
          </svg>
        </>
      );

    case 'esportes':
    case 'jogo_esporte':
    case 'perguntados':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-10 top-20 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <circle cx="110" cy="110" r="84" stroke={color} strokeWidth="5" />
            <line x1="110" y1="26" x2="110" y2="194" stroke={color} strokeWidth="3" />
            <line x1="26" y1="110" x2="194" y2="110" stroke={color} strokeWidth="3" />
            <circle cx="110" cy="110" r="24" stroke={color} strokeWidth="5" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-52 w-52 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <path d="M58 42H122V86C122 114 106 130 90 130C74 130 58 114 58 86V42Z" stroke={color} strokeWidth="5" />
            <rect x="66" y="142" width="48" height="14" rx="7" stroke={color} strokeWidth="4" />
          </svg>
        </>
      );

    case 'perfil-lobby':
      return (
        <>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-8 top-24 h-72 w-72 opacity-[0.18] dark:opacity-[0.22] animate-float-slow"
            fill="none"
          >
            <rect x="44" y="34" width="106" height="144" rx="22" transform="rotate(10 44 34)" stroke={color} strokeWidth="5" />
            <rect x="76" y="48" width="106" height="144" rx="22" transform="rotate(-6 76 48)" stroke="#FFB800" strokeWidth="4" />
          </svg>
          <svg
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -left-8 bottom-16 h-52 w-52 opacity-[0.16] dark:opacity-[0.20] animate-float"
            fill="none"
          >
            <circle cx="90" cy="90" r="60" stroke={color} strokeWidth="5" strokeDasharray="12 10" />
            <circle cx="90" cy="90" r="24" stroke="#1CB0F6" strokeWidth="5" />
          </svg>
        </>
      );

    default:
      return (
        <>
          {/* Home Studio: Floating Playful 3D Toy Orbits + Star Polyhedron + Gamepad Silhouettes */}
          <svg
            viewBox="0 0 260 260"
            className="pointer-events-none absolute -right-8 top-16 h-80 w-80 opacity-[0.18] dark:opacity-[0.24] animate-float-slow"
            fill="none"
          >
            <circle cx="130" cy="130" r="98" stroke="#1CB0F6" strokeWidth="5" strokeDasharray="18 12" />
            <circle cx="130" cy="130" r="64" stroke="#FF3D8B" strokeWidth="4" />
            <path d="M130 56L146 100L192 100L154 128L168 174L130 146L92 174L106 128L68 100L114 100Z" stroke="#FFB800" strokeWidth="4.5" />
          </svg>
          <svg
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -left-10 bottom-12 h-64 w-64 opacity-[0.16] dark:opacity-[0.22] animate-float"
            fill="none"
          >
            <rect x="44" y="44" width="132" height="132" rx="38" transform="rotate(14 110 110)" stroke="#00D68F" strokeWidth="5" />
            <circle cx="110" cy="110" r="28" stroke="#FFB800" strokeWidth="5" />
          </svg>
        </>
      );
  }
}

export function ThemeBackdrop({ theme = 'studio' }: { theme?: BackdropTheme }) {
  const palette = THEME_PALETTES[theme] ?? THEME_PALETTES.studio;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen overflow-hidden transition-all duration-700"
    >
      {/* Light mode radial atmosphere */}
      <div
        className="absolute inset-0 transition-opacity duration-700 dark:opacity-0"
        style={{ backgroundImage: palette.lightBg }}
      />
      {/* Dark mode radial atmosphere */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100"
        style={{ backgroundImage: palette.darkBg }}
      />

      {/* Organic pattern texture */}
      <div className={`absolute inset-0 opacity-55 dark:opacity-40 ${palette.patternClass}`} />

      {/* Animated Playful Clay Floating Blobs (inside full viewport bounds, never cut on any card!) */}
      <div
        className="absolute left-[4%] top-[10%] h-80 w-80 rounded-full blur-[100px] opacity-25 dark:opacity-35 transition-colors duration-700"
        style={{ backgroundColor: palette.orbA }}
      />
      <div
        className="absolute right-[6%] top-[24%] h-96 w-96 rounded-full blur-[110px] opacity-25 dark:opacity-35 transition-colors duration-700"
        style={{ backgroundColor: palette.orbB }}
      />
      <div
        className="absolute left-[38%] bottom-[4%] h-80 w-80 rounded-full blur-[100px] opacity-20 dark:opacity-30 transition-colors duration-700"
        style={{ backgroundColor: palette.orbC }}
      />

      {/* Theme SVG silhouette motifs */}
      <ThemeSilhouetteMotifs theme={theme} color={palette.accent} />
    </div>
  );
}
