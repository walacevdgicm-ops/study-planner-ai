import type { AiSummary, Flashcard, Material, QuizQuestion, Subject } from '@spa/shared-types';
import { uid } from '@/lib/id';
import { fetchMaterialText } from '@/lib/api/materials';

/**
 * Assistente de IA sobre o material do aluno — STUB da Etapa 2.
 *
 * Aqui a tela e o fluxo já estão prontos (loading, erro, resultado, envio dos
 * flashcards para a fila de revisão). Quando o PDF teve texto extraído no
 * upload (`material.file.hasText`), a geração usa trechos reais desse texto —
 * é simulada (não passa por nenhum modelo), mas já é "com base no conteúdo"
 * de verdade, não um texto genérico sobre o título. Sem texto extraído
 * (PDF escaneado, vídeo, ou material sem arquivo), cai no gerador por tags.
 *
 * Na v2, este arquivo vira um cliente da API da Anthropic: o conteúdo real do
 * PDF/slide/transcrição é extraído no worker, enviado ao modelo e o retorno
 * preenche exatamente as mesmas estruturas (`AiSummary`, `Flashcard`, `QuizQuestion`).
 * Nenhuma tela precisa mudar — só a implementação destas funções.
 */

const LATENCY = [900, 1600] as const;

function delay() {
  const ms = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function topicsOf(material: Material, subject: Subject): string[] {
  const base = material.tags.length ? material.tags : [subject.name];
  return base.slice(0, 4);
}

const STOPWORDS = new Set([
  'para',
  'como',
  'entre',
  'sobre',
  'quando',
  'porque',
  'então',
  'ainda',
  'depois',
  'antes',
  'assim',
  'também',
  'apenas',
  'sendo',
  'sendo',
  'esses',
  'essas',
  'deste',
  'desta',
  'nesse',
  'nessa',
]);

/** Frases "limpas" o bastante para virar excerto — nem título de slide, nem lixo de quebra de página. */
function splitSentences(raw: string): string[] {
  const text = raw.replace(/\s+/g, ' ').trim();
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÀ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 260 && /[a-zA-ZÀ-ÿ]{4,}/.test(s));
}

/** Amostra `count` trechos espalhados pelo documento inteiro (não só o começo). */
async function contentExcerpts(material: Material, count: number): Promise<string[]> {
  if (!material.file?.hasText) return [];
  let text: string | null;
  try {
    text = await fetchMaterialText(material.file.id);
  } catch {
    return [];
  }
  if (!text) return [];

  const sentences = splitSentences(text);
  if (sentences.length < 2) return [];

  const step = Math.max(1, Math.floor(sentences.length / count));
  const picked: string[] = [];
  for (let i = 0; i < sentences.length && picked.length < count; i += step) {
    picked.push(sentences[i]);
  }
  return picked;
}

/** Escolhe uma palavra "de conteúdo" (longa, não trivial) para virar lacuna de flashcard/pergunta. */
function keywordOf(sentence: string): string | null {
  const words = sentence.match(/[A-Za-zÀ-ÿ]{5,}/g) ?? [];
  const candidates = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  if (!candidates.length) return null;
  return candidates.reduce((longest, w) => (w.length > longest.length ? w : longest), candidates[0]);
}

function cloze(sentence: string, word: string): string {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return sentence.replace(re, '_____');
}

/** Embaralho simples (Fisher-Yates) — só varia a ordem visual, não precisa ser criptográfico. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function generateSummary(material: Material, subject: Subject): Promise<AiSummary> {
  await delay();
  const topics = topicsOf(material, subject);
  const excerpts = await contentExcerpts(material, 4);
  const grounded = excerpts.length >= 2;

  return {
    generatedAt: new Date().toISOString(),
    source: 'mock',
    headline: `Os pontos centrais de "${material.title}" (${subject.name})`,
    keyPoints: grounded
      ? excerpts.map((ex, i) => (i === 0 ? `Abre com: "${ex}"` : `O material também traz: "${ex}"`))
      : [
          `${topics[0]} aparece como eixo do material e sustenta os exemplos usados ao longo do texto.`,
          `A relação entre ${topics[0]} e ${topics[1] ?? subject.name} é o ponto que mais costuma cair em prova.`,
          `O material fecha com aplicações práticas — vale refazer os exercícios resolvidos antes da avaliação.`,
          topics[2]
            ? `${topics[2]} é tratado de forma introdutória: complemente com a bibliografia da disciplina.`
            : `Há trechos que dependem de conteúdo anterior da disciplina — revise-os antes.`,
        ],
    glossary: topics.slice(0, 3).map((t) => ({
      term: t,
      definition: `Conceito trabalhado em "${material.title}", dentro do escopo de ${subject.name}.`,
    })),
  };
}

export async function generateFlashcards(material: Material, subject: Subject): Promise<Flashcard[]> {
  await delay();
  const excerpts = await contentExcerpts(material, 8);

  const grounded: Flashcard[] = [];
  for (const sentence of excerpts) {
    const word = keywordOf(sentence);
    if (!word) continue;
    grounded.push({
      id: uid('fc'),
      materialId: material.id,
      queued: false,
      front: `Complete, a partir de "${material.title}": ${cloze(sentence, word)}`,
      back: `${word} — trecho completo: "${sentence}"`,
    });
  }
  if (grounded.length >= 3) return grounded;

  const topics = topicsOf(material, subject);
  return topics.flatMap((topic, i) => [
    {
      id: uid('fc'),
      materialId: material.id,
      queued: false,
      front: `O que define ${topic}?`,
      back: `Definição apresentada em "${material.title}", com o exemplo discutido na seção ${i + 1}.`,
    },
    {
      id: uid('fc'),
      materialId: material.id,
      queued: false,
      front: `Onde ${topic} é aplicado em ${subject.name}?`,
      back: `Nos casos trabalhados pelo material — atenção às condições de validade.`,
    },
  ]);
}

/**
 * Quiz/simulado: até 8 perguntas. Com texto extraído, cada pergunta usa uma
 * afirmação real do material como alternativa certa e outros trechos do
 * mesmo material como "distratores" plausíveis — sem inventar conteúdo de
 * fora. O índice da resposta certa é sorteado a cada pergunta (a versão
 * anterior sempre usava a opção 0, o que entregava a resposta de graça).
 */
export async function generateQuiz(material: Material, subject: Subject): Promise<QuizQuestion[]> {
  await delay();
  const excerpts = await contentExcerpts(material, 8);

  if (excerpts.length >= 4) {
    return excerpts.map((correct, i) => {
      const distractorPool = excerpts.filter((_, j) => j !== i);
      const distractors = shuffle(distractorPool).slice(0, 3);
      const correctIndex = Math.floor(Math.random() * (distractors.length + 1));
      const options = [...distractors];
      options.splice(correctIndex, 0, correct);
      return {
        id: uid('q'),
        question: `Qual trecho a seguir aparece de fato em "${material.title}"?`,
        options,
        correctIndex,
        rationale: `É o trecho real do material — os demais são de outras partes do mesmo texto, postos como distração.`,
      };
    });
  }

  const topics = topicsOf(material, subject);
  return topics.slice(0, 3).map((topic, i) => {
    const wrongOptions = [
      `É citado apenas como curiosidade histórica, sem efeito prático.`,
      `Só se aplica fora do escopo de ${subject.name}.`,
      `Foi substituído por uma formulação incompatível com a do material.`,
    ];
    const correctOption = `É um conceito central e condiciona os demais tópicos do capítulo.`;
    const correctIndex = Math.floor(Math.random() * 4);
    const options = shuffle(wrongOptions);
    options.splice(correctIndex, 0, correctOption);
    return {
      id: uid('q'),
      question: `Sobre ${topic}, segundo "${material.title}", é correto afirmar que:`,
      options,
      correctIndex,
      rationale: `O material sustenta essa leitura na seção ${i + 1}, ao conectar ${topic} aos exemplos seguintes.`,
    };
  });
}

export const AI_DISCLAIMER =
  'Conteúdo gerado a partir do material que você enviou. Nesta versão a geração é simulada (stub) — a conexão com a API da Anthropic entra na v2.';
