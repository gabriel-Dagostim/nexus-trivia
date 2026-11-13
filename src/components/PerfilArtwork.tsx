'use client';

import React from 'react';
import type { PerfilTheme } from '@/types/game';

interface PerfilArtworkProps {
  theme: PerfilTheme;
  color: string;
  className?: string;
}

export function PerfilArtwork({ theme, color, className = 'h-32 w-32' }: PerfilArtworkProps) {
  switch (theme) {
    case 'personagem_ficticio':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-char" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF3D8B" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="72" fill={color} fillOpacity="0.16" />
          <path
            d="M90 22L106 60L148 56L122 88L142 124L98 112L74 148L72 106L32 96L68 72L56 34L90 54Z"
            fill="url(#pf-char)"
            fillOpacity="0.24"
            stroke="url(#pf-char)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Hero Mask */}
          <path
            d="M44 76C58 64 76 68 90 78C104 68 122 64 136 76C138 92 126 108 108 104C99 102 94 94 90 92C86 94 81 102 72 104C54 108 42 92 44 76Z"
            fill="url(#pf-char)"
            stroke="white"
            strokeWidth="3.5"
          />
          <ellipse cx="69" cy="86" rx="10" ry="6" fill="white" />
          <ellipse cx="111" cy="86" rx="10" ry="6" fill="white" />
          {/* Magic sparkles */}
          <path d="M142 36L146 46L156 50L146 54L142 64L138 54L128 50L138 46Z" fill="#FFB800" />
          <circle cx="38" cy="134" r="7" fill="#1CB0F6" />
        </svg>
      );

    case 'lugar':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-place" x1="30" y1="30" x2="150" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1CB0F6" />
              <stop offset="1" stopColor="#00D68F" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="94" r="64" fill="url(#pf-place)" fillOpacity="0.18" stroke="url(#pf-place)" strokeWidth="4" />
          <path d="M38 112L66 78L90 100L118 68L144 112H38Z" fill="#00D68F" fillOpacity="0.45" stroke="white" strokeWidth="3" strokeLinejoin="round" />
          {/* Floating Map Pin */}
          <path
            d="M90 22C74 22 62 34 62 50C62 72 90 98 90 98C90 98 118 72 118 50C118 34 106 22 90 22Z"
            fill="#FF3D8B"
            stroke="white"
            strokeWidth="3.5"
          />
          <circle cx="90" cy="50" r="10" fill="white" />
          <circle cx="42" cy="54" r="8" fill="#FFB800" />
        </svg>
      );

    case 'pessoa_famosa':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-vip" x1="30" y1="20" x2="150" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB800" />
              <stop offset="1" stopColor="#FF5A5F" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#FFB800" fillOpacity="0.16" />
          {/* Crown / Laurel */}
          <path
            d="M44 128C32 104 34 72 52 52M136 128C148 104 146 72 128 52"
            stroke="#FFB800"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M90 30L106 66L146 70L116 96L124 136L90 116L56 136L64 96L34 70L74 66Z"
            fill="url(#pf-vip)"
            stroke="white"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="90" cy="90" r="14" fill="white" fillOpacity="0.9" />
          <circle cx="90" cy="90" r="6" fill="#FF3D8B" />
        </svg>
      );

    case 'objeto':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-obj" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D68F" />
              <stop offset="1" stopColor="#1CB0F6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#00D68F" fillOpacity="0.16" />
          {/* Isometric Magic Cube / Artifact */}
          <path d="M90 32L140 60V116L90 144L40 116V60L90 32Z" fill="url(#pf-obj)" fillOpacity="0.3" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M40 60L90 88L140 60M90 88V144" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          {/* Magnifier / Orbit */}
          <circle cx="126" cy="54" r="16" fill="#FFB800" fillOpacity="0.88" stroke="white" strokeWidth="3" />
          <line x1="138" y1="66" x2="152" y2="80" stroke="white" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'obra_midia':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-media" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5A5F" />
              <stop offset="1" stopColor="#FFB800" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#FF5A5F" fillOpacity="0.16" />
          {/* Film & Vinyl */}
          <rect x="34" y="54" width="94" height="76" rx="16" fill="url(#pf-media)" stroke="white" strokeWidth="3.5" />
          <polygon points="72,76 72,110 100,93" fill="white" />
          <circle cx="128" cy="108" r="28" fill="#8B5CF6" stroke="white" strokeWidth="3.5" />
          <circle cx="128" cy="108" r="8" fill="#FFB800" />
          <path d="M42 46L122 34L126 50L46 62Z" fill="#FFB800" stroke="white" strokeWidth="2.5" />
        </svg>
      );

    case 'ciencia_conceito':
    default:
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-sci" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#1CB0F6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#8B5CF6" fillOpacity="0.18" />
          <ellipse cx="90" cy="90" rx="64" ry="24" transform="rotate(30 90 90)" stroke="url(#pf-sci)" strokeWidth="5" />
          <ellipse cx="90" cy="90" rx="64" ry="24" transform="rotate(-30 90 90)" stroke="#00D68F" strokeWidth="5" />
          <ellipse cx="90" cy="90" rx="64" ry="24" transform="rotate(90 90 90)" stroke="#1CB0F6" strokeWidth="5" />
          <circle cx="90" cy="90" r="16" fill="url(#pf-sci)" stroke="white" strokeWidth="3.5" />
          <circle cx="136" cy="54" r="7" fill="#FFB800" stroke="white" strokeWidth="2" />
          <circle cx="44" cy="126" r="7" fill="#FF3D8B" stroke="white" strokeWidth="2" />
        </svg>
      );

    case 'animal_natureza':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-ani" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06B6D4" />
              <stop offset="1" stopColor="#00D68F" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#06B6D4" fillOpacity="0.16" />
          <path d="M90 132C62 132 46 116 46 98C46 82 62 72 90 72C118 72 134 82 134 98C134 116 118 132 90 132Z" fill="url(#pf-ani)" stroke="white" strokeWidth="3.5" />
          <circle cx="54" cy="60" r="13" fill="url(#pf-ani)" stroke="white" strokeWidth="3" />
          <circle cx="80" cy="46" r="13" fill="url(#pf-ani)" stroke="white" strokeWidth="3" />
          <circle cx="108" cy="46" r="13" fill="url(#pf-ani)" stroke="white" strokeWidth="3" />
          <circle cx="130" cy="64" r="12" fill="url(#pf-ani)" stroke="white" strokeWidth="3" />
          <path d="M40 138C56 122 124 122 140 138" stroke="#00D68F" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'musica_banda':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-mus" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D946EF" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#D946EF" fillOpacity="0.18" />
          <circle cx="80" cy="94" r="46" fill="#1E1B4B" stroke="url(#pf-mus)" strokeWidth="4" />
          <circle cx="80" cy="94" r="30" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
          <circle cx="80" cy="94" r="14" fill="#FFB800" stroke="white" strokeWidth="2.5" />
          <path d="M116 42V104M116 42L148 34V88" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="106" cy="108" r="11" fill="url(#pf-mus)" stroke="white" strokeWidth="2.5" />
          <circle cx="138" cy="92" r="11" fill="url(#pf-mus)" stroke="white" strokeWidth="2.5" />
        </svg>
      );

    case 'comida_bebida':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-food" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F97316" />
              <stop offset="1" stopColor="#FFB800" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#F97316" fillOpacity="0.16" />
          <path d="M50 76C38 76 34 62 42 52C48 44 60 44 66 50C72 38 108 38 114 50C120 44 132 44 138 52C146 62 142 76 130 76V98H50V76Z" fill="url(#pf-food)" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M40 108H140C138 130 118 144 90 144C62 144 42 130 40 108Z" fill="#FF3D8B" fillOpacity="0.85" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="136" cy="40" r="7" fill="#00D68F" />
        </svg>
      );

    case 'jogo_esporte':
      return (
        <svg viewBox="0 0 180 180" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="pf-gam" x1="25" y1="25" x2="155" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22C55E" />
              <stop offset="1" stopColor="#1CB0F6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="68" fill="#22C55E" fillOpacity="0.16" />
          <path d="M62 42H118V76C118 96 106 108 90 108C74 108 62 96 62 76V42Z" fill="url(#pf-gam)" stroke="white" strokeWidth="3.5" />
          <path d="M62 50H44C44 68 50 78 62 78M118 50H136C136 68 130 78 118 78" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="70" y="120" width="40" height="14" rx="7" fill="#FFB800" stroke="white" strokeWidth="3" />
          <path d="M40 132H140C148 132 152 146 140 150H40C28 146 32 132 40 132Z" fill="url(#pf-gam)" stroke="white" strokeWidth="3" />
        </svg>
      );
  }
}
