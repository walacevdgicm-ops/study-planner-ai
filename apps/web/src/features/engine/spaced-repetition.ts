import type { ID, ISODate, Review, ReviewGrade } from '@spa/shared-types';
import { addDaysISO, todayISO } from '@/lib/date';
import { uid } from '@/lib/id';

/** Escala aprovada na Etapa 1 — ajustável pelo aluno nas Configurações. */
export const DEFAULT_INTERVALS = [1, 3, 7, 15, 30, 60];

export interface ReviewSource {
  subjectId: ID;
  sourceType: Review['sourceType'];
  sourceId: ID;
  title: string;
}

/**
 * Primeira revisão do ciclo. As seguintes nascem conforme o aluno avalia,
 * porque o intervalo real depende do desempenho (lembrei fácil / difícil / esqueci).
 */
export function createFirstReview(
  source: ReviewSource,
  from: ISODate = todayISO(),
  intervals = DEFAULT_INTERVALS,
): Review {
  return {
    id: uid('rev'),
    subjectId: source.subjectId,
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    title: source.title,
    step: 0,
    scheduledFor: addDaysISO(from, intervals[0]),
    repetitions: 0,
    completedAt: null,
  };
}

/** Datas de toda a escada, para exibir o plano de revisão antes de começar. */
export function previewLadder(from: ISODate = todayISO(), intervals = DEFAULT_INTERVALS): ISODate[] {
  let cursor = from;
  return intervals.map((days) => {
    cursor = addDaysISO(cursor, days);
    return cursor;
  });
}

export interface GradeResult {
  completed: Review;
  next: Review | null;
  message: string;
}

/**
 * Avaliação de uma revisão. Regra determinística inspirada no SM-2:
 * - esqueci  → volta ao início da escada (revê amanhã)
 * - difícil  → repete o mesmo degrau, com intervalo encurtado (60%)
 * - fácil    → avança um degrau
 */
export function gradeReview(
  review: Review,
  grade: ReviewGrade,
  intervals = DEFAULT_INTERVALS,
  today: ISODate = todayISO(),
): GradeResult {
  const completed: Review = {
    ...review,
    completedAt: new Date().toISOString(),
    lastGrade: grade,
    repetitions: review.repetitions + 1,
  };

  if (grade === 'forgot') {
    return {
      completed,
      next: {
        ...completed,
        id: uid('rev'),
        step: 0,
        scheduledFor: addDaysISO(today, 1),
        completedAt: null,
        lastGrade: undefined,
      },
      message: 'Sem problema — recomeçamos a escada: nova revisão amanhã.',
    };
  }

  if (grade === 'hard') {
    const shortened = Math.max(1, Math.round(intervals[review.step] * 0.6));
    return {
      completed,
      next: {
        ...completed,
        id: uid('rev'),
        scheduledFor: addDaysISO(today, shortened),
        completedAt: null,
        lastGrade: undefined,
      },
      message: `Intervalo encurtado: você revê de novo em ${shortened} dia(s).`,
    };
  }

  const nextStep = review.step + 1;
  if (nextStep >= intervals.length) {
    return {
      completed,
      next: null,
      message: 'Escada concluída — esse conteúdo saiu da fila de revisão. 🎓',
    };
  }

  return {
    completed,
    next: {
      ...completed,
      id: uid('rev'),
      step: nextStep,
      scheduledFor: addDaysISO(today, intervals[nextStep]),
      completedAt: null,
      lastGrade: undefined,
    },
    message: `Boa. Próxima revisão em ${intervals[nextStep]} dias.`,
  };
}

export function isOverdue(review: Review, today: ISODate = todayISO()) {
  return !review.completedAt && review.scheduledFor < today;
}

export function isDueToday(review: Review, today: ISODate = todayISO()) {
  return !review.completedAt && review.scheduledFor === today;
}
