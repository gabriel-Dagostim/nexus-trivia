'use client';

import React from 'react';
import {
  Atom,
  Award,
  Brain,
  Clapperboard,
  Compass,
  Cpu,
  Crown,
  Dna,
  Flame,
  Gamepad2,
  Hourglass,
  MapPin,
  Music,
  Palette,
  PawPrint,
  Trophy,
  Utensils,
  Zap,
} from 'lucide-react';
import type { CategoryId, PerfilTheme } from '@/types/game';

export function CategoryIcon({
  id,
  className = 'h-5 w-5',
}: {
  id: CategoryId;
  className?: string;
}) {
  switch (id) {
    case 'pop':
      return <Gamepad2 className={className} />;
    case 'historia':
      return <Hourglass className={className} />;
    case 'geografia':
      return <Compass className={className} />;
    case 'arte':
      return <Palette className={className} />;
    case 'ciencia':
      return <Atom className={className} />;
    case 'esportes':
      return <Trophy className={className} />;
  }
}

export function PerfilThemeIcon({
  id,
  className = 'h-5 w-5',
}: {
  id: PerfilTheme;
  className?: string;
}) {
  switch (id) {
    case 'personagem_ficticio':
      return <Flame className={className} />;
    case 'lugar':
      return <MapPin className={className} />;
    case 'pessoa_famosa':
      return <Brain className={className} />;
    case 'objeto':
      return <Cpu className={className} />;
    case 'obra_midia':
      return <Clapperboard className={className} />;
    case 'ciencia_conceito':
      return <Dna className={className} />;
    case 'animal_natureza':
      return <PawPrint className={className} />;
    case 'musica_banda':
      return <Music className={className} />;
    case 'comida_bebida':
      return <Utensils className={className} />;
    case 'jogo_esporte':
      return <Award className={className} />;
  }
}

export function CrownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <Crown className={className} />;
}

export function BoltIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <Zap className={className} />;
}
