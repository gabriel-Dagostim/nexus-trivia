import { Suspense } from 'react';
import { PerguntadosClient } from '@/components/PerguntadosClient';

export default function PerguntadosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12 text-center font-mono-tech text-sm text-[var(--fg-muted)]">
          Inicializando motor 3D & módulo WebRTC...
        </div>
      }
    >
      <PerguntadosClient />
    </Suspense>
  );
}
