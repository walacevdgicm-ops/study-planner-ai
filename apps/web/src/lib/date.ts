import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ISODate, MinuteOfDay, Weekday } from '@spa/shared-types';

export const WEEKDAY_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const fromISO = (s: ISODate): Date => parseISO(s);
export const todayISO = (): ISODate => toISO(new Date());

export const addDaysISO = (s: ISODate, n: number): ISODate => toISO(addDays(fromISO(s), n));
export const daysBetween = (a: ISODate, b: ISODate) => differenceInCalendarDays(fromISO(b), fromISO(a));
export const weekdayOf = (s: ISODate): Weekday => fromISO(s).getDay() as Weekday;

/** Semana de segunda a domingo — convenção acadêmica brasileira. */
export function weekRange(anchor: ISODate): ISODate[] {
  const start = startOfWeek(fromISO(anchor), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: endOfWeek(fromISO(anchor), { weekStartsOn: 1 }) }).map(toISO);
}

/** Grade do mês, completada com os dias vizinhos (6 linhas fixas). */
export function monthGrid(anchor: ISODate): { date: ISODate; inMonth: boolean; isToday: boolean }[] {
  const base = fromISO(anchor);
  const start = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => ({
    date: toISO(d),
    inMonth: isSameMonth(d, base),
    isToday: isSameDay(d, new Date()),
  }));
}

export const fmtDay = (s: ISODate) => format(fromISO(s), "d 'de' MMM", { locale: ptBR });
export const fmtDayLong = (s: ISODate) => format(fromISO(s), "EEEE, d 'de' MMMM", { locale: ptBR });
export const fmtMonth = (s: ISODate) => format(fromISO(s), "MMMM 'de' yyyy", { locale: ptBR });
export const fmtShort = (s: ISODate) => format(fromISO(s), 'dd/MM');

/** 570 -> "09:30" */
export function fmtMinutes(m: MinuteOfDay): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** 135 -> "2h15" | 60 -> "1h" | 45 -> "45min" */
export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function fmtHours(minutes: number): string {
  return (minutes / 60).toFixed(1).replace('.', ',');
}

/** "hoje", "amanhã", "em 4 dias", "há 2 dias" — usado em prazos e revisões. */
export function relativeDays(target: ISODate, from: ISODate = todayISO()): string {
  const d = daysBetween(from, target);
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'ontem';
  if (d > 0) return `em ${d} dias`;
  return `há ${Math.abs(d)} dias`;
}

export function isWeekend(s: ISODate) {
  const w = weekdayOf(s);
  return w === 0 || w === 6;
}
