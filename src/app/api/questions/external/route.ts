import { NextResponse } from 'next/server';
import { getStoredCustomQuestions, saveExternalQuestions } from '@/lib/db';
import type { CategoryId, QuestionDifficulty, TriviaQuestion } from '@/types/game';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mapOpenTdbCategory(cat: string): CategoryId {
  const lower = cat.toLowerCase();
  if (lower.includes('history')) return 'historia';
  if (lower.includes('geography')) return 'geografia';
  if (lower.includes('art') || lower.includes('books') || lower.includes('literature')) return 'arte';
  if (
    lower.includes('science') ||
    lower.includes('computer') ||
    lower.includes('math') ||
    lower.includes('gadget')
  ) {
    return 'ciencia';
  }
  if (lower.includes('sport')) return 'esportes';
  return 'pop';
}

function mapOpenTdbDifficulty(diff: string): QuestionDifficulty {
  if (diff === 'easy') return 'facil';
  if (diff === 'hard') return 'dificil';
  return 'medio';
}

const OPENTDB_CATEGORY_IDS: Record<CategoryId, number[]> = {
  pop: [11, 12, 14, 15, 29, 31, 32],
  historia: [23],
  geografia: [22],
  arte: [10, 25],
  ciencia: [17, 18, 19, 30],
  esportes: [21],
};

async function fetchOpenTdbQuestions(
  category?: CategoryId,
  amount = 10
): Promise<TriviaQuestion[]> {
  const catIds = category ? OPENTDB_CATEGORY_IDS[category] : null;
  const chosenCatId = catIds ? catIds[Math.floor(Math.random() * catIds.length)] : null;
  const url = `https://opentdb.com/api.php?amount=${Math.min(20, Math.max(3, amount))}&type=multiple&encode=url3986${
    chosenCatId ? `&category=${chosenCatId}` : ''
  }`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao consultar OpenTDB');
  const data = (await res.json()) as {
    response_code: number;
    results: Array<{
      category: string;
      difficulty: string;
      question: string;
      correct_answer: string;
      incorrect_answers: string[];
    }>;
  };

  if (!data.results || data.results.length === 0) return [];

  return data.results.map((item, idx) => {
    const correct = decodeURIComponent(item.correct_answer);
    const incorrect = item.incorrect_answers.map((a) => decodeURIComponent(a));
    const options = shuffleArray([correct, ...incorrect]).slice(0, 4) as [
      string,
      string,
      string,
      string,
    ];
    const correctIndex = options.indexOf(correct);
    const mappedCat = category ?? mapOpenTdbCategory(decodeURIComponent(item.category));

    return {
      id: `otdb-${Date.now()}-${idx}`,
      category: mappedCat,
      difficulty: mapOpenTdbDifficulty(decodeURIComponent(item.difficulty)),
      prompt: `[EN · OpenTDB] ${decodeURIComponent(item.question)}`,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: `Resposta oficial via Open Trivia DB (${decodeURIComponent(item.category)}): ${correct}.`,
      tags: ['OpenTDB', 'Inglês'],
      source: 'opentdb',
    };
  });
}

async function fetchWikidataPtQuestions(
  category: CategoryId = 'geografia',
  amount = 8
): Promise<TriviaQuestion[]> {
  let sparql = '';
  if (category === 'ciencia') {
    sparql = `
      SELECT ?itemLabel ?symbol WHERE {
        ?item wdt:P31 wd:Q11344;
              wdt:P246 ?symbol.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
      } LIMIT 60
    `;
  } else if (category === 'arte') {
    sparql = `
      SELECT ?workLabel ?creatorLabel WHERE {
        ?work wdt:P31 wd:Q3305213;
              wdt:P170 ?creator;
              wdt:P276 wd:Q19675.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
      } LIMIT 45
    `;
  } else {
    sparql = `
      SELECT ?countryLabel ?capitalLabel WHERE {
        ?country wdt:P31 wd:Q6256;
                 wdt:P36 ?capital.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "pt". }
      } LIMIT 80
    `;
  }

  const endpoint = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await fetch(endpoint, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'NexusTriviaBot/1.0 (educational trivia app)',
    },
    signal: AbortSignal.timeout(9000),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Falha ao consultar Wikidata');
  const json = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };

  const rows = json.results.bindings;
  if (rows.length < 4) return [];

  const questions: TriviaQuestion[] = [];

  if (category === 'ciencia') {
    const valid = rows.filter(
      (r) => r.itemLabel?.value && r.symbol?.value && !r.itemLabel.value.startsWith('Q')
    );
    const allSymbols = Array.from(new Set(valid.map((v) => v.symbol.value)));
    const sample = shuffleArray(valid).slice(0, amount);
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      const wrong = shuffleArray(allSymbols.filter((s) => s !== row.symbol.value)).slice(0, 3);
      if (wrong.length < 3) continue;
      const options = shuffleArray([row.symbol.value, ...wrong]) as [string, string, string, string];
      questions.push({
        id: `wd-cie-${Date.now()}-${i}`,
        category: 'ciencia',
        difficulty: 'medio',
        prompt: `Na Tabela Periódica, qual é o símbolo químico do elemento "${row.itemLabel.value}"?`,
        options,
        correctIndex: options.indexOf(row.symbol.value),
        explanation: `Dado obtido em tempo real do grafo de conhecimento da Wikidata: ${row.itemLabel.value} = ${row.symbol.value}.`,
        tags: ['Wikidata', 'Química'],
        source: 'wikidata',
      });
    }
  } else if (category === 'arte') {
    const valid = rows.filter(
      (r) =>
        r.workLabel?.value &&
        r.creatorLabel?.value &&
        !r.workLabel.value.startsWith('Q') &&
        !r.creatorLabel.value.startsWith('Q')
    );
    const allCreators = Array.from(new Set(valid.map((v) => v.creatorLabel.value)));
    const sample = shuffleArray(valid).slice(0, amount);
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      const wrong = shuffleArray(allCreators.filter((c) => c !== row.creatorLabel.value)).slice(
        0,
        3
      );
      if (wrong.length < 3) continue;
      const options = shuffleArray([row.creatorLabel.value, ...wrong]) as [
        string,
        string,
        string,
        string,
      ];
      questions.push({
        id: `wd-art-${Date.now()}-${i}`,
        category: 'arte',
        difficulty: 'dificil',
        prompt: `Quem pintou a obra "${row.workLabel.value}" (acervo do Museu do Louvre)?`,
        options,
        correctIndex: options.indexOf(row.creatorLabel.value),
        explanation: `Registro verificado na Wikidata: "${row.workLabel.value}" é de autoria de ${row.creatorLabel.value}.`,
        tags: ['Wikidata', 'Louvre'],
        source: 'wikidata',
      });
    }
  } else {
    const valid = rows.filter(
      (r) =>
        r.countryLabel?.value &&
        r.capitalLabel?.value &&
        !r.countryLabel.value.startsWith('Q') &&
        !r.capitalLabel.value.startsWith('Q')
    );
    const allCapitals = Array.from(new Set(valid.map((v) => v.capitalLabel.value)));
    const sample = shuffleArray(valid).slice(0, amount);
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      const wrong = shuffleArray(allCapitals.filter((c) => c !== row.capitalLabel.value)).slice(
        0,
        3
      );
      if (wrong.length < 3) continue;
      const options = shuffleArray([row.capitalLabel.value, ...wrong]) as [
        string,
        string,
        string,
        string,
      ];
      questions.push({
        id: `wd-geo-${Date.now()}-${i}`,
        category: 'geografia',
        difficulty: 'medio',
        prompt: `Qual é a capital oficial de ${row.countryLabel.value}?`,
        options,
        correctIndex: options.indexOf(row.capitalLabel.value),
        explanation: `Dado geográfico obtido da Wikidata em português: a capital de ${row.countryLabel.value} é ${row.capitalLabel.value}.`,
        tags: ['Wikidata', 'Capitais'],
        source: 'wikidata',
      });
    }
  }

  return questions;
}

export async function GET() {
  try {
    const questions = await getStoredCustomQuestions();
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('Get external questions error:', err);
    return NextResponse.json({ questions: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      source?: 'wikidata' | 'opentdb';
      category?: CategoryId;
      amount?: number;
      saveToDb?: boolean;
    };

    const source = body.source ?? 'wikidata';
    const amount = Math.min(15, Math.max(3, body.amount ?? 8));

    const questions =
      source === 'opentdb'
        ? await fetchOpenTdbQuestions(body.category, amount)
        : await fetchWikidataPtQuestions(body.category ?? 'geografia', amount);

    let savedCount = 0;
    if (body.saveToDb && questions.length > 0) {
      savedCount = await saveExternalQuestions(questions);
    }

    return NextResponse.json({
      questions,
      savedCount,
      source,
    });
  } catch (err) {
    console.error('External question fetch error:', err);
    return NextResponse.json(
      {
        error: 'Não foi possível buscar perguntas externas agora (verifique a conexão ou tente novamente).',
        questions: [],
      },
      { status: 502 }
    );
  }
}
