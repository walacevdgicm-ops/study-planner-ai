import { useMemo } from 'react';
import type { ID, ISODate, Subject } from '@spa/shared-types';
import { useAppStore } from './useAppStore';
import { subjectHex } from '@/lib/subject-colors';
import { todayISO, weekRange } from '@/lib/date';
import { computeAllPriorities } from '@/features/engine/priority';
import { detectConflicts, dayLoad } from '@/features/engine/planner';
import { computeStreak, levelFromXp } from '@/features/engine/gamification';
import { isDueToday, isOverdue } from '@/features/engine/spaced-repetition';

export function useSubjects() {
  return useAppStore((s) => s.subjects);
}

export function useActiveSubjects() {
  const subjects = useSubjects();
  return useMemo(() => subjects.filter((s) => !s.archived), [subjects]);
}

/** Mapa id → disciplina + cor resolvida: usado em praticamente toda tela. */
export function useSubjectMap() {
  const subjects = useSubjects();
  return useMemo(() => {
    const map = new Map<ID, Subject & { hex: string }>();
    subjects.forEach((s) => map.set(s.id, { ...s, hex: subjectHex(s.color) }));
    return map;
  }, [subjects]);
}

export function usePriorities() {
  const subjects = useAppStore((s) => s.subjects);
  const exams = useAppStore((s) => s.exams);
  const assignments = useAppStore((s) => s.assignments);
  const sessions = useAppStore((s) => s.sessions);
  return useMemo(
    () => computeAllPriorities(subjects, exams, assignments, sessions),
    [subjects, exams, assignments, sessions],
  );
}

export function useSessionsOn(date: ISODate) {
  const sessions = useAppStore((s) => s.sessions);
  return useMemo(
    () => sessions.filter((s) => s.date === date).sort((a, b) => a.start - b.start),
    [sessions, date],
  );
}

export function useWeekSessions(anchor: ISODate) {
  const sessions = useAppStore((s) => s.sessions);
  return useMemo(() => {
    const days = weekRange(anchor);
    return sessions.filter((s) => days.includes(s.date));
  }, [sessions, anchor]);
}

export function useConflicts(anchor: ISODate = todayISO()) {
  const sessions = useAppStore((s) => s.sessions);
  const subjects = useAppStore((s) => s.subjects);
  const assignments = useAppStore((s) => s.assignments);
  const prefs = useAppStore((s) => s.user.preferences);
  return useMemo(
    () => detectConflicts(weekRange(anchor), sessions, subjects, assignments, prefs),
    [sessions, subjects, assignments, prefs, anchor],
  );
}

export function useDayLoad(date: ISODate) {
  const sessions = useAppStore((s) => s.sessions);
  const prefs = useAppStore((s) => s.user.preferences);
  return useMemo(() => dayLoad(date, sessions, prefs), [sessions, prefs, date]);
}

export function useReviewQueue() {
  const reviews = useAppStore((s) => s.reviews);
  return useMemo(() => {
    const pending = reviews.filter((r) => !r.completedAt);
    return {
      overdue: pending.filter((r) => isOverdue(r)).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
      today: pending.filter((r) => isDueToday(r)),
      upcoming: pending
        .filter((r) => r.scheduledFor > todayISO())
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
      completed: reviews.filter((r) => r.completedAt),
    };
  }, [reviews]);
}

export function useGamificationSummary() {
  const g = useAppStore((s) => s.gamification);
  return useMemo(() => {
    const level = levelFromXp(g.xp);
    return { ...level, xp: g.xp, streak: computeStreak(g.activeDays), events: g.events };
  }, [g]);
}

export function useUnreadCount() {
  const notifications = useAppStore((s) => s.notifications);
  return useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
}

export function useOpenAssignments() {
  const assignments = useAppStore((s) => s.assignments);
  return useMemo(
    () =>
      assignments
        .filter((a) => a.status !== 'done')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignments],
  );
}

export function useUpcomingExams() {
  const exams = useAppStore((s) => s.exams);
  return useMemo(
    () => exams.filter((e) => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)),
    [exams],
  );
}
