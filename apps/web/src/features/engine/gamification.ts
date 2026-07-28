import type { ISODate, XpEvent } from '@spa/shared-types';
import { addDaysISO, todayISO } from '@/lib/date';

/** XP por evento — reforço de hábito, deliberadamente modesto. */
export const XP_RULES = {
  session: 20,
  review: 12,
  assignment: 60,
  goal: 100,
  streak: 25,
} as const;

export function xpFor(reason: keyof typeof XP_RULES): number {
  return XP_RULES[reason];
}

/**
 * Streak = dias consecutivos com pelo menos uma sessão concluída.
 * Conta a partir de hoje; se ainda não estudou hoje, o streak de ontem
 * continua válido (o dia ainda não acabou).
 */
export function computeStreak(activeDays: ISODate[], today: ISODate = todayISO()): number {
  const set = new Set(activeDays);
  let cursor = set.has(today) ? today : addDaysISO(today, -1);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function longestStreak(activeDays: ISODate[]): number {
  const sorted = [...new Set(activeDays)].sort();
  let best = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const d of sorted) {
    run = prev && addDaysISO(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Nível cresce em curva quadrática: cada patamar exige mais que o anterior. */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 120)) + 1;
  const currentFloor = (level - 1) ** 2 * 120;
  const nextFloor = level ** 2 * 120;
  return {
    level,
    currentFloor,
    nextFloor,
    progress: Math.round(((xp - currentFloor) / (nextFloor - currentFloor)) * 100),
    toNext: nextFloor - xp,
  };
}

export const LEVEL_TITLES = [
  'Caloura(o)',
  'Ouvinte',
  'Fichário organizado',
  'Marca-texto afiado',
  'Monitor(a)',
  'Veterana(o)',
  'Mestre do cronograma',
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Veterana(o)';
}

export function xpInRange(events: XpEvent[], from: ISODate, to: ISODate): number {
  return events.filter((e) => e.date >= from && e.date <= to).reduce((acc, e) => acc + e.amount, 0);
}
