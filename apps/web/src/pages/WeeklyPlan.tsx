import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, GripVertical, Sparkles, TriangleAlert } from 'lucide-react';
import type { ISODate, StudySession } from '@spa/shared-types';
import { Badge, Button, Card, CardBody, Progress, cn, useToast } from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { useAppStore } from '@/store/useAppStore';
import { useConflicts, useSubjectMap } from '@/store/selectors';
import {
  addDaysISO,
  fmtDuration,
  fmtHours,
  fmtMinutes,
  fmtShort,
  todayISO,
  WEEKDAY_LABEL,
  weekRange,
  weekdayOf,
} from '@/lib/date';
import { dayLoad } from '@/features/engine/planner';
import { bestHoursFromHistory } from '@/features/engine/planner';

/* ---------------- bloco arrastável ---------------- */

function Block({ session, hex, name }: { session: StudySession; hex: string; name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: session.id });
  const done = session.status === 'done';
  const missed = session.status === 'missed';

  return (
    <div
      ref={setNodeRef}
      style={{ '--subject': hex } as React.CSSProperties}
      className={cn(
        'wash tab-card group rounded-lg py-2 pr-2 pl-3.5 text-left',
        isDragging && 'opacity-40',
        done && 'opacity-60',
        missed && 'border-dashed',
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Mover bloco de ${name} de ${fmtShort(session.date)} às ${fmtMinutes(session.start)}`}
          className="mt-0.5 cursor-grab rounded text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[12.5px] leading-4 font-semibold text-ink', done && 'line-through')}>
            {name}
          </p>
          <p className="font-mono text-[10.5px] text-ink-2">
            {fmtMinutes(session.start)} · {fmtDuration(session.minutes)}
          </p>
          {missed && <span className="font-mono text-[10px] text-caneta">não cumprida</span>}
          {session.origin === 'redistributed' && (
            <span className="font-mono text-[10px] text-ink-3">realocada</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- coluna do dia ---------------- */

function DayColumn({
  date,
  sessions,
  children,
}: {
  date: ISODate;
  sessions: StudySession[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const prefs = useAppStore((s) => s.user.preferences);
  const load = dayLoad(date, sessions, prefs);
  const isToday = date === todayISO();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'ruled flex min-h-[22rem] min-w-[9.5rem] flex-1 flex-col rounded-card border bg-surface p-2 transition-colors',
        isOver ? 'border-accent bg-accent-soft/40' : 'border-hair',
        isToday && 'ring-1 ring-accent/40',
      )}
      style={{ '--rule': '34px' } as React.CSSProperties}
    >
      <div className="mb-2 flex items-baseline justify-between px-1">
        <p className={cn('font-display text-[13px] font-bold', isToday ? 'text-accent' : 'text-ink')}>
          {WEEKDAY_LABEL[weekdayOf(date)]}{' '}
          <span className="font-mono text-[11px] font-medium text-ink-3">{date.slice(8)}</span>
        </p>
        <span
          className={cn(
            'font-mono text-[10.5px] tabular-nums',
            load.overloaded ? 'font-bold text-caneta' : 'text-ink-3',
          )}
        >
          {fmtHours(load.plannedMinutes)}h
        </span>
      </div>
      <Progress
        value={(load.plannedMinutes / Math.max(1, load.capacityMinutes)) * 100}
        color={load.overloaded ? 'var(--color-caneta)' : undefined}
        size="sm"
        className="mb-2"
        label={`Carga de ${date}`}
      />
      <div className="flex flex-1 flex-col gap-1.5">{children}</div>
    </div>
  );
}

/* ---------------- página ---------------- */

export default function WeeklyPlan() {
  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [dragging, setDragging] = useState<StudySession | null>(null);
  const { push } = useToast();

  const sessions = useAppStore((s) => s.sessions);
  const moveSession = useAppStore((s) => s.moveSession);
  const regenerateWeek = useAppStore((s) => s.regenerateWeek);
  const redistributeLate = useAppStore((s) => s.redistributeLate);
  const subjectMap = useSubjectMap();
  const conflicts = useConflicts(anchor);

  const days = weekRange(anchor);
  const weekSessions = sessions.filter((s) => days.includes(s.date));
  const totalPlanned = weekSessions.reduce((acc, s) => acc + s.minutes, 0);
  const best = bestHoursFromHistory(sessions);

  // Ponteiro com pequena tolerância (evita drag acidental em toque)
  // + teclado, para que o plano seja reorganizável sem mouse.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) =>
    setDragging(sessions.find((s) => s.id === e.active.id) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const target = e.over?.id as ISODate | undefined;
    const session = sessions.find((s) => s.id === e.active.id);
    if (!target || !session || session.date === target) return;
    moveSession(session.id, target, session.start);
    push({
      title: 'Bloco movido',
      description: `${subjectMap.get(session.subjectId)?.name} agora está em ${fmtShort(target)}.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Plano da semana"
        highlight="semana"
        description="Arraste os blocos entre os dias. A barra no topo de cada coluna mostra quanto do seu tempo já está comprometido."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const { moved } = redistributeLate();
                push({
                  title: moved ? `${moved} bloco(s) realocado(s)` : 'Nada atrasado',
                  description: moved ? 'Atrasos foram redistribuídos nos dias com espaço.' : 'Você está em dia.',
                  tone: moved ? 'success' : 'neutral',
                });
              }}
            >
              Redistribuir atrasos
            </Button>
            <Button
              onClick={() => {
                const n = regenerateWeek(anchor);
                push({
                  title: `${n} bloco(s) gerados`,
                  description: 'Distribuídos por prioridade nas suas janelas livres.',
                  tone: 'success',
                });
              }}
            >
              <Sparkles size={15} /> Gerar plano
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" aria-label="Semana anterior" onClick={() => setAnchor(addDaysISO(anchor, -7))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(todayISO())}>
            Hoje
          </Button>
          <Button variant="secondary" size="icon" aria-label="Próxima semana" onClick={() => setAnchor(addDaysISO(anchor, 7))}>
            <ChevronRight size={16} />
          </Button>
          <span className="ml-2 font-mono text-[12px] text-ink-2">
            {fmtShort(days[0])} — {fmtShort(days[6])}
          </span>
        </div>
        <Badge mono>{fmtHours(totalPlanned)}h planejadas</Badge>
      </div>

      {conflicts.length > 0 && (
        <Card className="mb-3 border-caneta/40">
          <CardBody className="flex flex-wrap items-start gap-x-4 gap-y-1.5 py-3">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-caneta">
              <TriangleAlert size={15} /> {conflicts.length} alerta(s)
            </span>
            {conflicts.slice(0, 4).map((c) => (
              <span key={c.id} className="text-[12.5px] text-ink-2">
                <span className="font-mono text-[11px] text-ink-3">{fmtShort(c.date)}</span> {c.message}
              </span>
            ))}
          </CardBody>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((date) => (
            <DayColumn key={date} date={date} sessions={sessions}>
              {weekSessions
                .filter((s) => s.date === date)
                .sort((a, b) => a.start - b.start)
                .map((s) => (
                  <Block
                    key={s.id}
                    session={s}
                    hex={subjectMap.get(s.subjectId)?.hex ?? 'var(--accent)'}
                    name={subjectMap.get(s.subjectId)?.name ?? 'Disciplina'}
                  />
                ))}
              {!weekSessions.some((s) => s.date === date) && (
                <p className="mt-4 px-1 text-center text-[11.5px] text-ink-3">
                  Dia livre.
                  <br />
                  Arraste um bloco para cá.
                </p>
              )}
            </DayColumn>
          ))}
        </div>

        <DragOverlay>
          {dragging && (
            <div
              style={{ '--subject': subjectMap.get(dragging.subjectId)?.hex } as React.CSSProperties}
              className="wash tab-card rounded-lg px-3 py-2 shadow-lifted"
            >
              <p className="text-[12.5px] font-semibold text-ink">
                {subjectMap.get(dragging.subjectId)?.name}
              </p>
              <p className="font-mono text-[10.5px] text-ink-2">{fmtMinutes(dragging.start)}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Card className="mt-4">
        <CardBody>
          <p className="mb-2 font-display text-[15px] font-semibold text-ink">
            Sugestão com base no seu histórico
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {best.map((b) => (
              <div key={b.label} className="rounded-lg border border-hair bg-surface-2/50 p-3">
                <p className="text-[12.5px] text-ink-2">{b.label}</p>
                <p className="mt-1 font-display text-xl font-extrabold text-ink">
                  <span className="tabular-nums">{b.rate}</span>
                  <span className="font-mono text-[12px] font-medium text-ink-3">% cumpridas</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">
            O gerador dá preferência às faixas em que você historicamente cumpre mais blocos.
          </p>
        </CardBody>
      </Card>

    </>
  );
}
