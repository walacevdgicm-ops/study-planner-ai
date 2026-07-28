import type { AiSummary, Flashcard, Material, QuizQuestion, Subject } from '@spa/shared-types';
import { uid } from '@/lib/id';

/**
 * Assistente de IA sobre o material do aluno — STUB da Etapa 2.
 *
 * Aqui a tela e o fluxo já estão prontos (loading, erro, resultado, envio dos
 * flashcards para a fila de revisão). A geração é simulada a partir dos metadados
 * do material, e todo resultado é marcado com `source: 'mock'`.
 *
 * Na v2, este arquivo vira um cliente da API da Anthropic: o conteúdo real do
 * PDF/slide/transcrição é extraído no worker, enviado ao modelo e o retorno
 * preenche exatamente as mesmas estruturas (`AiSummary`, `Flashcard`, `QuizQuestion`).
 * Nenhuma tela precisa mudar — só a implementação destas três funções.
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

export async function generateSummary(material: Material, subject: Subject): Promise<AiSummary> {
  await delay();
  const topics = topicsOf(material, subject);
  return {
    generatedAt: new Date().toISOString(),
    source: 'mock',
    headline: `Os pontos centrais de "${material.title}" (${subject.name})`,
    keyPoints: [
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

export async function generateQuiz(material: Material, subject: Subject): Promise<QuizQuestion[]> {
  await delay();
  const topics = topicsOf(material, subject);
  return topics.slice(0, 3).map((topic, i) => ({
    id: uid('q'),
    question: `Sobre ${topic}, segundo "${material.title}", é correto afirmar que:`,
    options: [
      `É um conceito central e condiciona os demais tópicos do capítulo.`,
      `É citado apenas como curiosidade histórica, sem efeito prático.`,
      `Só se aplica fora do escopo de ${subject.name}.`,
      `Foi substituído por uma formulação incompatível com a do material.`,
    ],
    correctIndex: 0,
    rationale: `O material sustenta essa leitura na seção ${i + 1}, ao conectar ${topic} aos exemplos seguintes.`,
  }));
}

export const AI_DISCLAIMER =
  'Conteúdo gerado a partir do material que você enviou. Nesta versão a geração é simulada (stub) — a conexão com a API da Anthropic entra na v2.';
