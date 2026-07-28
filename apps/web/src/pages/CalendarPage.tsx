import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ISODate } from '@spa/shared-types';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Tabs, cn } from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { SubjectChip } from '@/components/SubjectChip';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import {
  addDaysISO,
  fmtDayLong,
  fmtMinutes,
  fmtMonth,
  monthGrid,
  todayISO,
  WEEKDAY_LABEL,
  weekRange,
  weekdayOf,
} from '@/lib/date';

type EventKind = 'exam' | 'assignment' | 'session' | 'review' | 'class';

interface CalEvent {
  id: string;
  date: ISODate;
  kind: EventKind;
  title: string;
  subjectId: string;
  time?: number;
}

const KIND_LABEL: Record<EventKind, string> = {
  exam: 'Prova',
  assignment: 'Entrega',
  session: 'Estudo',
  review: 'Revisão',
  class: 'Aula',
};

export default function CalendarPage() {
  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [selected, setSelected] = useState<ISODate>(todayISO());
  const [view, setView] = useState('month');
  const [kinds, setKinds] = useState<EventKind[]>(['exam', 'assignment', 'session', 'review']);

  const exams = useAppStore((s) => s.exams);
  const assignments = useAppStore((s) => s.assignments);
  const sessions = useAppStore((s) => s.sessions);
  const reviews = useAppStore((s) => s.reviews);
  const subjects = useAppStore((s) => s.subjects);
  const subjectMap = useSubjectMap();

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = [
      ...exams.map((e) => ({ id: e.id, date: e.date, kind: 'exam' as const, title: e.title, subjectId: e.subjectId, time: e.startTime })),
      ...assignments
        .filter((a) => a.status !== 'done')
        .map((a) => ({ id: a.id, date: a.dueDate, kind: 'assignment' as const, title: a.title, subjectId: a.subjectId, time: a.dueTime })),
      ...sessions
        .filter((s) => s.status === 'planned' || s.status === 'done')
        .map((s) => ({
          id: s.id,
          date: s.date,
          kind: 'session' as const,
          title: subjectMap.get(s.subjectId)?.name ?? 'Estudo',
          subjectId: s.subjectId,
          time: s.start,
        })),
      ...reviews
        .filter((r) => !r.completedAt)
        .map((r) => ({ id: r.id, date: r.scheduledFor, kind: 'review' as const, title: r.title, subjectId: r.subjectId })),
    ];
    return list.filter((e) => kinds.includes(e.kind));
  }, [exams, assignments, sessions, reviews, subjectMap, kinds]);

  const byDate = useMemo(() => {
    const map = new Map<ISODate, CalEvent[]>();
    events.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return map;
  }, [events]);

  const grid = monthGrid(anchor);
  const week = weekRange(anchor);
  const classesOn = (date: ISODate) =>
    subjects
      .filter((s) => !s.archived)
      .flatMap((s) =>
        s.classSlots
          .filter((c) => c.weekday === weekdayOf(date))
          .map((c) => ({ subject: s, ...c })),
      );

  const toggleKind = (k: EventKind) =>
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const dayEvents = (byDate.get(selected) ?? []).sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  return (
    <>
      <PageHeader
        title="Calendário do semestre"
        highlight="Calendário"
        description="Provas, entregas, blocos de estudo e revisões no mesmo lugar — filtre pelo que quiser enxergar."
        actions={<Tabs look="pill" value={view} onChange={setView} items={[{ id: 'month', label: 'Mês' }, { id: 'week', label: 'Semana' }]} />}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Anterior"
            onClick={() => setAnchor(addDaysISO(anchor, view === 'month' ? -28 : -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(todayISO())}>
            Hoje
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Próximo"
            onClick={() => setAnchor(addDaysISO(anchor, view === 'month' ? 28 : 7))}
          >
            <ChevronRight size={16} />
          </Button>
          <span className="ml-2 font-display text-[15px] font-semibold text-ink capitalize">{fmtMonth(anchor)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['exam', 'assignment', 'session', 'review'] as EventKind[]).map((k) => (
            <button
              key={k}
              onClick={() => toggleKind(k)}
              aria-pressed={kinds.includes(k)}
              className={cn(
                'rounded-md border px-2 py-1 text-[12px] font-medium transition-colors',
                kinds.includes(k)
                  ? 'border-transparent bg-surface-2 text-ink'
                  : 'border-hair text-ink-3 hover:text-ink',
              )}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-hair bg-surface-2/60">
            {WEEKDAY_LABEL.slice(1).concat(WEEKDAY_LABEL[0]).map((d) => (
              <div key={d} className="px-2 py-2 text-center font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {(view === 'month' ? grid : week.map((date) => ({ date, inMonth: true, isToday: date === todayISO() }))).map(
              (cell) => {
                const list = byDate.get(cell.date) ?? [];
                const isSelected = cell.date === selected;
                return (
                  <button
                    key={cell.date}
                    onClick={() => setSelected(cell.date)}
                    aria-current={cell.isToday ? 'date' : undefined}
                    className={cn(
                      'ruled min-h-[5.5rem] border-r border-b border-hair p-1.5 text-left align-top transition-colors last:border-r-0',
                      !cell.inMonth && 'bg-surface-2/40',
                      isSelected && 'bg-accent-soft/60',
                      view === 'week' && 'min-h-[16rem]',
                    )}
                    style={{ '--rule': '26px' } as React.CSSProperties}
                  >
                    <span
                      className={cn(
                        'inline-grid size-5 place-items-center rounded font-mono text-[11px] tabular-nums',
                        cell.isToday ? 'bg-accent font-bold text-white' : cell.inMonth ? 'text-ink-2' : 'text-ink-3',
                      )}
                    >
                      {cell.date.slice(8)}
                    </span>

                    <span className="mt-1 flex flex-col gap-0.5">
                      {list.slice(0, view === 'week' ? 8 : 3).map((e) => {
                        const hex = subjectMap.get(e.subjectId)?.hex ?? 'var(--accent)';
                        return (
                          <span
                            key={`${e.kind}_${e.id}`}
                            style={{ '--subject': hex } as React.CSSProperties}
                            className={cn(
                              'truncate rounded-[4px] px-1 py-0.5 text-[10.5px] leading-3.5',
                              e.kind === 'exam'
                                ? 'bg-caneta/15 font-semibold text-caneta'
                                : e.kind === 'assignment'
                                  ? 'border border-dashed border-ink-3/40 text-ink-2'
                                  : 'wash text-ink',
                            )}
                          >
                            {e.kind === 'exam' ? '★ ' : ''}
                            {e.title}
                          </span>
                        );
                      })}
                      {list.length > (view === 'week' ? 8 : 3) && (
                        <span className="px-1 font-mono text-[10px] text-ink-3">
                          +{list.length - (view === 'week' ? 8 : 3)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{fmtDayLong(selected)}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {classesOn(selected).length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Aulas</p>
                <ul className="space-y-1">
                  {classesOn(selected).map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px]">
                      <SubjectChip subjectId={c.subject.id} />
                      <span className="ml-auto font-mono text-[11.5px] text-ink-3">
                        {fmtMinutes(c.start)}–{fmtMinutes(c.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-1 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Agenda</p>
              {dayEvents.length ? (
                <ul className="space-y-1.5">
                  {dayEvents.map((e) => (
                    <li key={`${e.kind}_${e.id}`} className="flex items-start gap-2">
                      <Badge tone={e.kind === 'exam' ? 'danger' : e.kind === 'review' ? 'accent' : 'neutral'}>
                        {KIND_LABEL[e.kind]}
                      </Badge>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{e.title}</span>
                        <SubjectChip subjectId={e.subjectId} />
                      </span>
                      {e.time !== undefined && (
                        <span className="shrink-0 font-mono text-[11.5px] text-ink-3">{fmtMinutes(e.time)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-[13px] text-ink-2">
                  Nada marcado para este dia — bom momento para adiantar uma revisão.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
