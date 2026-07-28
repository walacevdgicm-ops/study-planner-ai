import type {
  Assignment,
  Goal,
  ISODate,
  Material,
  Review,
  StudySession,
  Subject,
} from '@spa/shared-types';
import { addDaysISO, toISO, todayISO, weekRange } from '@/lib/date';

export interface SubjectMinutes {
  subjectId: string;
  name: string;
  color: number;
  minutes: number;
}

export function minutesBySubject(
  sessions: StudySession[],
  subjects: Subject[],
  from: ISODate,
  to: ISODate,
): SubjectMinutes[] {
  return subjects
    .map((s) => ({
      subjectId: s.id,
      name: s.name,
      color: s.color as number,
      minutes: sessions
        .filter(
          (x) => x.subjectId === s.id && x.status === 'done' && x.date >= from && x.date <= to,
        )
        .reduce((acc, x) => acc + (x.actualMinutes ?? x.minutes), 0),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

export interface WeekPoint {
  label: string;
  weekStart: ISODate;
  planned: number;
  done: number;
}

/** Série das últimas N semanas — planejado vs. cumprido, em horas. */
export function weeklySeries(sessions: StudySession[], weeks = 6, anchor: ISODate = todayISO()): WeekPoint[] {
  const points: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const days = weekRange(addDaysISO(anchor, -7 * i));
    const inWeek = sessions.filter((s) => days.includes(s.date));
    points.push({
      weekStart: days[0],
      label: i === 0 ? 'Esta semana' : `${days[0].slice(8)}/${days[0].slice(5, 7)}`,
      planned: +(inWeek.reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1),
      done: +(
        inWeek
          .filter((s) => s.status === 'done')
          .reduce((a, s) => a + (s.actualMinutes ?? s.minutes), 0) / 60
      ).toFixed(1),
    });
  }
  return points;
}

/** Heatmap de constância dos últimos N dias (estilo "grade de hábito"). */
export function dailyHeat(sessions: StudySession[], days = 84, anchor: ISODate = todayISO()) {
  const out: { date: ISODate; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysISO(anchor, -i);
    out.push({
      date,
      minutes: sessions
        .filter((s) => s.date === date && s.status === 'done')
        .reduce((a, s) => a + (s.actualMinutes ?? s.minutes), 0),
    });
  }
  return out;
}

export function completionRate(sessions: StudySession[], from: ISODate, to: ISODate): number {
  const closed = sessions.filter(
    (s) => s.date >= from && s.date <= to && (s.status === 'done' || s.status === 'missed'),
  );
  if (!closed.length) return 0;
  return Math.round((closed.filter((s) => s.status === 'done').length / closed.length) * 100);
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  pct: number;
  /** Ritmo esperado até aqui — vira o marcador na barra de progresso. */
  expectedPct: number;
  atRisk: boolean;
  daysLeft: number;
}

export function goalProgress(
  goal: Goal,
  data: {
    sessions: StudySession[];
    reviews: Review[];
    assignments: Assignment[];
    materials: Material[];
  },
  today: ISODate = todayISO(),
): GoalProgress {
  const inRange = (d: ISODate) => d >= goal.startDate && d <= goal.endDate;
  const bySubject = <T extends { subjectId?: string }>(x: T) =>
    !goal.subjectId || x.subjectId === goal.subjectId;

  let current = 0;
  switch (goal.metric) {
    case 'studyHours':
      current = +(
        data.sessions
          .filter((s) => s.status === 'done' && inRange(s.date) && bySubject(s))
          .reduce((a, s) => a + (s.actualMinutes ?? s.minutes), 0) / 60
      ).toFixed(1);
      break;
    case 'sessions':
      current = data.sessions.filter((s) => s.status === 'done' && inRange(s.date) && bySubject(s)).length;
      break;
    case 'reviews':
      current = data.reviews.filter(
        (r) => r.completedAt && inRange(r.completedAt.slice(0, 10)) && bySubject(r),
      ).length;
      break;
    case 'assignments':
      current = data.assignments.filter((a) => a.status === 'done' && inRange(a.dueDate) && bySubject(a)).length;
      break;
    case 'materials':
      current = data.materials.filter(
        (m) => m.studiedAt && inRange(m.studiedAt.slice(0, 10)) && bySubject(m),
      ).length;
      break;
  }

  const totalDays = Math.max(1, Math.round((+new Date(goal.endDate) - +new Date(goal.startDate)) / 86400000) + 1);
  const elapsed = Math.min(
    totalDays,
    Math.max(0, Math.round((+new Date(today) - +new Date(goal.startDate)) / 86400000) + 1),
  );
  const pct = Math.min(100, Math.round((current / goal.target) * 100));
  const expectedPct = Math.round((elapsed / totalDays) * 100);
  const daysLeft = Math.max(0, totalDays - elapsed);

  return { goal, current, pct, expectedPct, atRisk: pct < expectedPct - 15 && daysLeft <= 3, daysLeft };
}

export const METRIC_LABEL: Record<Goal['metric'], string> = {
  studyHours: 'horas de estudo',
  sessions: 'sessões',
  reviews: 'revisões',
  assignments: 'entregas',
  materials: 'materiais',
};

export function todayRange(): { from: ISODate; to: ISODate } {
  const t = toISO(new Date());
  return { from: t, to: t };
}
