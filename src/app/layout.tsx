import type { Metadata } from 'next';
import { Fredoka, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';
import { AuthProvider } from '@/components/AuthProvider';

const fredoka = Fredoka({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '700'],
});

export const metadata: Metadata = {
  title: 'NexusTrivia 3D · Arena Massinha & Perfil',
  description:
    'Jogo estilo Perguntados e Perfil com estética 3D de massinha (Claymorphism), roleta 3D, base extensa de conhecimentos e multiplayer P2P.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fredoka.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-clay-arena text-[var(--fg)] transition-colors duration-300">
        <AuthProvider>
          <AppHeader />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
