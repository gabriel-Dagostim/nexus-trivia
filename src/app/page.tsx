import { getCuratedStats, QUESTIONS_BY_CATEGORY } from '@/data/questions';
import { getPerfilStats, PERFIL_CARDS } from '@/data/perfil/cards';
import { HomeShowcase, type HomePerfilPreviewCard, type HomeSampleQuestion } from '@/components/HomeShowcase';
import type { CategoryId } from '@/types/game';

export default function HomePage() {
  const stats = getCuratedStats();
  const perfilStats = getPerfilStats();

  const categories: CategoryId[] = ['pop', 'historia', 'geografia', 'arte', 'ciencia', 'esportes'];
  const samples = {} as Record<CategoryId, HomeSampleQuestion>;

  for (const cat of categories) {
    const pool = QUESTIONS_BY_CATEGORY[cat] ?? [];
    const pick = pool[Math.min(3, Math.max(0, pool.length - 1))];
    if (pick) {
      samples[cat] = {
        category: cat,
        prompt: pick.prompt,
        options: pick.options,
        correctIndex: pick.correctIndex,
        explanation: pick.explanation,
      };
    }
  }

  const preferredIds = ['pf-01', 'lg-01', 'cc-06'];
  const featuredPerfil: HomePerfilPreviewCard[] = preferredIds
    .map((id) => PERFIL_CARDS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      id: c.id,
      theme: c.theme,
      answer: c.answer,
      subtitle: c.subtitle,
      firstClue: c.clues[0] ?? '',
    }));

  const categoryCounts: Record<string, number> = {};
  for (const cat of categories) {
    categoryCounts[cat] = stats.byCategory[cat]?.total ?? 0;
  }

  return (
    <HomeShowcase
      totalQuestions={stats.total}
      categoryCounts={categoryCounts}
      totalPerfilCards={perfilStats.total}
      perfilCounts={perfilStats.byTheme}
      samples={samples}
      featuredPerfil={featuredPerfil}
    />
  );
}
