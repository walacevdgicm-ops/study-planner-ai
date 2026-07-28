import type {
  Assignment,
  Exam,
  ISODate,
  StudySession,
  Subject,
  SubjectPriority,
} from '@spa/shared-types';
import { daysBetween, todayISO } from '@/lib/date';

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/**
 * Priorização automática (v1 — determinística, sem custo de IA).
 * Quatro forças, somando 100:
 *   proximidade de prova (40) · lacuna de horas (25) · desempenho (20) · pressão de entregas (15)
 */
export function computePriority(
  subject: Subject,
  exams: Exam[],
  assignments: Assignment[],
  sessions: StudySession[],
  today: ISODate = todayISO(),
): SubjectPriority {
  const reasons: string[] = [];

  const nextExam = exams
    .filter((e) => e.subjectId === subject.id && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const daysToNextExam = nextExam ? daysBetween(today, nextExam.date) : null;

  // 1. Proximidade de prova — janela de atenção de 21 dias.
  let examScore = 0;
  if (daysToNextExam !== null) {
    examScore = 40 * clamp((21 - daysToNextExam) / 21);
    if (daysToNextExam <= 7) reasons.push(`Prova em ${daysToNextExam} dia(s)`);
  }

  // 2. Lacuna de horas até a prova (conteúdo total vs. já estudado).
  const studiedMinutes = sessions
    .filter((s) => s.subjectId === subject.id && s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);
  const targetHours = nextExam?.targetHours ?? Math.round(subject.totalHours * 0.4);
  const hoursRemaining = Math.max(0, targetHours - studiedMinutes / 60);
  const gapScore = 25 * clamp(hoursRemaining / Math.max(1, targetHours));
  if (hoursRemaining > targetHours * 0.6) {
    reasons.push(`Faltam ~${Math.round(hoursRemaining)}h de estudo`);
  }

  // 3. Desempenho — nota baixa puxa a disciplina para cima.
  let gradeScore = 0;
  if (subject.currentGrade !== null) {
    gradeScore = 20 * clamp((7 - subject.currentGrade) / 7);
    if (subject.currentGrade < 6) reasons.push(`Média atual ${subject.currentGrade.toFixed(1)}`);
  }

  // 4. Entregas próximas ainda não concluídas.
  const openAssignments = assignments.filter(
    (a) => a.subjectId === subject.id && a.status !== 'done' && a.dueDate >= today,
  );
  const nearest = openAssignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  let assignmentScore = 0;
  if (nearest) {
    const d = daysBetween(today, nearest.dueDate);
    assignmentScore = 15 * clamp((14 - d) / 14);
    if (d <= 3) reasons.push(`Entrega "${nearest.title}" ${d === 0 ? 'hoje' : `em ${d} dia(s)`}`);
  }

  // Peso declarado pelo aluno modula o resultado (±20%).
  const weightFactor = 0.9 + subject.weight * 0.04;
  const raw = (examScore + gapScore + gradeScore + assignmentScore) * weightFactor;
  const score = Math.round(clamp(raw / 100) * 100);

  const level: SubjectPriority['level'] =
    score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 30 ? 'normal' : 'low';

  if (!reasons.length) reasons.push('Em dia — manter ritmo de manutenção');

  return { subjectId: subject.id, score, level, reasons, hoursRemaining, daysToNextExam };
}

export function computeAllPriorities(
  subjects: Subject[],
  exams: Exam[],
  assignments: Assignment[],
  sessions: StudySession[],
  today: ISODate = todayISO(),
): SubjectPriority[] {
  return subjects
    .filter((s) => !s.archived)
    .map((s) => computePriority(s, exams, assignments, sessions, today))
    .sort((a, b) => b.score - a.score);
}

export const PRIORITY_LABEL: Record<SubjectPriority['level'], string> = {
  critical: 'Crítica',
  high: 'Alta',
  normal: 'Normal',
  low: 'Tranquila',
};
