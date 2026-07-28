import type {
  Assignment,
  DayLoad,
  ISODate,
  MinuteOfDay,
  ScheduleConflict,
  StudyPreferences,
  StudySession,
  Subject,
  SubjectPriority,
} from '@spa/shared-types';
import { fmtMinutes, todayISO, weekdayOf, WEEKDAY_LABEL } from '@/lib/date';
import { uid } from '@/lib/id';

export interface Interval {
  start: MinuteOfDay;
  end: MinuteOfDay;
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

function subtract(base: Interval[], cuts: Interval[]): Interval[] {
  let result = [...base];
  for (const cut of cuts) {
    const next: Interval[] = [];
    for (const iv of result) {
      if (!overlaps(iv, cut)) {
        next.push(iv);
        continue;
      }
      if (cut.start > iv.start) next.push({ start: iv.start, end: cut.start });
      if (cut.end < iv.end) next.push({ start: cut.end, end: iv.end });
    }
    result = next;
  }
  return result.filter((iv) => iv.end - iv.start >= 15);
}

/** Janelas realmente livres do dia: disponibilidade − aulas − sessões já marcadas. */
export function freeIntervals(
  date: ISODate,
  prefs: StudyPreferences,
  subjects: Subject[],
  sessions: StudySession[],
): Interval[] {
  const wd = weekdayOf(date);
  const windows = prefs.availability
    .filter((w) => w.weekday === wd)
    .map((w) => ({ start: w.start, end: w.end }));

  const classes = subjects
    .filter((s) => !s.archived)
    .flatMap((s) => s.classSlots.filter((c) => c.weekday === wd).map((c) => ({ start: c.start, end: c.end })));

  const booked = sessions
    .filter((s) => s.date === date && s.status !== 'missed' && s.status !== 'skipped')
    .map((s) => ({ start: s.start, end: s.start + s.minutes }));

  return subtract(windows, [...classes, ...booked]);
}

export function capacityMinutes(date: ISODate, prefs: StudyPreferences): number {
  const wd = weekdayOf(date);
  const declared = prefs.availability
    .filter((w) => w.weekday === wd)
    .reduce((acc, w) => acc + (w.end - w.start), 0);
  // O teto diário do aluno vence a disponibilidade bruta.
  return Math.min(declared, prefs.maxDailyHours * 60);
}

export function dayLoad(date: ISODate, sessions: StudySession[], prefs: StudyPreferences): DayLoad {
  const ofDay = sessions.filter((s) => s.date === date);
  const planned = ofDay
    .filter((s) => s.status === 'planned' || s.status === 'done')
    .reduce((acc, s) => acc + s.minutes, 0);
  const done = ofDay
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);
  const capacity = capacityMinutes(date, prefs);
  return {
    date,
    plannedMinutes: planned,
    doneMinutes: done,
    capacityMinutes: capacity,
    overloaded: planned > capacity,
  };
}

/**
 * Geração automática do plano semanal.
 * Distribui blocos nas janelas livres, na ordem de prioridade das disciplinas,
 * usando round-robin ponderado para não concentrar tudo em uma matéria.
 */
export function generateWeekPlan(
  dates: ISODate[],
  prefs: StudyPreferences,
  subjects: Subject[],
  priorities: SubjectPriority[],
  existing: StudySession[],
): StudySession[] {
  const active = subjects.filter((s) => !s.archived);
  if (!active.length) return [];

  // Cota semanal proporcional à prioridade (mínimo de 1 bloco por disciplina).
  const total = priorities.reduce((acc, p) => acc + Math.max(10, p.score), 0);
  const quota = new Map<string, number>();
  const weeklyBlocks = Math.floor((prefs.maxDailyHours * 60 * dates.length) / prefs.sessionMinutes);
  for (const p of priorities) {
    quota.set(p.subjectId, Math.max(1, Math.round((Math.max(10, p.score) / total) * weeklyBlocks)));
  }

  const created: StudySession[] = [];
  const queue = [...priorities].sort((a, b) => b.score - a.score);

  for (const date of dates) {
    if (date < todayISO()) continue;
    let remaining = capacityMinutes(date, prefs);
    const planned = existing.filter((s) => s.date === date && s.status === 'planned');
    remaining -= planned.reduce((acc, s) => acc + s.minutes, 0);

    let slots = freeIntervals(date, prefs, active, [...existing, ...created]);

    while (remaining >= prefs.sessionMinutes && slots.length) {
      const candidate = queue.find((p) => (quota.get(p.subjectId) ?? 0) > 0);
      if (!candidate) break;

      const slot = slots.find((iv) => iv.end - iv.start >= prefs.sessionMinutes);
      if (!slot) break;

      const session: StudySession = {
        id: uid('ses'),
        subjectId: candidate.subjectId,
        date,
        start: slot.start,
        minutes: prefs.sessionMinutes,
        status: 'planned',
        origin: 'auto',
      };
      created.push(session);

      quota.set(candidate.subjectId, (quota.get(candidate.subjectId) ?? 1) - 1);
      // Manda para o fim da fila: alterna disciplinas dentro do mesmo dia.
      queue.push(queue.splice(queue.indexOf(candidate), 1)[0]);

      remaining -= prefs.sessionMinutes;
      slots = freeIntervals(date, prefs, active, [...existing, ...created]);
    }
  }

  return created;
}

/**
 * Redistribuição por atraso: pega as sessões perdidas e realoca nos
 * próximos dias com espaço, respeitando o teto diário.
 */
export function redistributeMissed(
  missed: StudySession[],
  horizon: ISODate[],
  prefs: StudyPreferences,
  subjects: Subject[],
  sessions: StudySession[],
): { moved: { from: StudySession; to: StudySession }[]; unplaced: StudySession[] } {
  const moved: { from: StudySession; to: StudySession }[] = [];
  const unplaced: StudySession[] = [];
  const working = [...sessions];

  for (const session of missed) {
    let placed = false;
    for (const date of horizon) {
      if (date < todayISO()) continue;
      const load = dayLoad(date, working, prefs);
      if (load.plannedMinutes + session.minutes > load.capacityMinutes) continue;

      const slot = freeIntervals(date, prefs, subjects, working).find(
        (iv) => iv.end - iv.start >= session.minutes,
      );
      if (!slot) continue;

      const replacement: StudySession = {
        ...session,
        id: uid('ses'),
        date,
        start: slot.start,
        status: 'planned',
        origin: 'redistributed',
        note: `Realocada de ${session.date}`,
      };
      working.push(replacement);
      moved.push({ from: session, to: replacement });
      placed = true;
      break;
    }
    if (!placed) unplaced.push(session);
  }

  return { moved, unplaced };
}

/** Conflitos de agenda: sobreposição, choque com aula, sobrecarga e acúmulo de prazos. */
export function detectConflicts(
  dates: ISODate[],
  sessions: StudySession[],
  subjects: Subject[],
  assignments: Assignment[],
  prefs: StudyPreferences,
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const date of dates) {
    const ofDay = sessions
      .filter((s) => s.date === date && s.status === 'planned')
      .sort((a, b) => a.start - b.start);

    // Sobreposição entre sessões
    for (let i = 0; i < ofDay.length - 1; i++) {
      const a = ofDay[i];
      const b = ofDay[i + 1];
      if (a.start + a.minutes > b.start) {
        conflicts.push({
          id: `ov_${a.id}_${b.id}`,
          date,
          kind: 'overlap',
          severity: 'critical',
          message: `Dois blocos se sobrepõem às ${fmtMinutes(b.start)}.`,
          sessionIds: [a.id, b.id],
        });
      }
    }

    // Choque com horário de aula
    const wd = weekdayOf(date);
    const classes = subjects.flatMap((s) =>
      s.classSlots.filter((c) => c.weekday === wd).map((c) => ({ subject: s, ...c })),
    );
    for (const s of ofDay) {
      const clash = classes.find((c) => overlaps({ start: s.start, end: s.start + s.minutes }, c));
      if (clash) {
        conflicts.push({
          id: `cl_${s.id}`,
          date,
          kind: 'classClash',
          severity: 'critical',
          message: `Bloco às ${fmtMinutes(s.start)} cai na aula de ${clash.subject.name} (${WEEKDAY_LABEL[wd]}).`,
          sessionIds: [s.id],
        });
      }
    }

    // Sobrecarga do dia
    const load = dayLoad(date, sessions, prefs);
    if (load.overloaded) {
      conflicts.push({
        id: `ol_${date}`,
        date,
        kind: 'overload',
        severity: 'warning',
        message: `${Math.round(load.plannedMinutes / 60)}h planejadas contra um teto de ${prefs.maxDailyHours}h.`,
        sessionIds: ofDay.map((s) => s.id),
      });
    }

    // Acúmulo de entregas no mesmo dia
    const due = assignments.filter((a) => a.dueDate === date && a.status !== 'done');
    if (due.length >= 2) {
      conflicts.push({
        id: `dc_${date}`,
        date,
        kind: 'deadlineCollision',
        severity: 'warning',
        message: `${due.length} entregas caem no mesmo dia: ${due.map((d) => d.title).join(', ')}.`,
        sessionIds: [],
      });
    }
  }

  return conflicts;
}

/**
 * Sugestão de horários com base no histórico: em que faixa do dia o aluno
 * realmente cumpre o que planeja.
 */
export function bestHoursFromHistory(sessions: StudySession[]): { label: string; rate: number }[] {
  const buckets = [
    { label: 'Manhã (6h–12h)', from: 360, to: 720 },
    { label: 'Tarde (12h–18h)', from: 720, to: 1080 },
    { label: 'Noite (18h–24h)', from: 1080, to: 1440 },
  ];
  return buckets.map((b) => {
    const inBucket = sessions.filter(
      (s) => s.start >= b.from && s.start < b.to && (s.status === 'done' || s.status === 'missed'),
    );
    const done = inBucket.filter((s) => s.status === 'done').length;
    return { label: b.label, rate: inBucket.length ? Math.round((done / inBucket.length) * 100) : 0 };
  });
}
