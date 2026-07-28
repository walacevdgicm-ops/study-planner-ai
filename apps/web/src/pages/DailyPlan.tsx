import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import type { ISODate, StudySession } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Modal,
  Progress,
  Select,
  cn,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { SessionRow } from '@/components/SessionRow';
import { SubjectChip } from '@/components/SubjectChip';
import { PomodoroTimer } from '@/features/pomodoro/PomodoroTimer';
import { useAppStore } from '@/store/useAppStore';
import { useActiveSubjects, useDayLoad, useSessionsOn, useSubjectMap } from '@/store/selectors';
import { addDaysISO, fmtDayLong, fmtHours, fmtMinutes, relativeDays, todayISO } from '@/lib/date';
import { freeIntervals } from '@/features/engine/planner';

export default function DailyPlan() {
  const [date, setDate] = useState<ISODate>(todayISO());
  const [pomodoro, setPomodoro] = useState<StudySession | null>(null);
  const [adding, setAdding] = useState(false);
  const { push } = useToast();

  const sessions = useSessionsOn(date);
  const load = useDayLoad(date);
  const subjects = useActiveSubjects();
  const subjectMap = useSubjectMap();
  const prefs = useAppStore((s) => s.user.preferences);
  const allSessions = useAppStore((s) => s.sessions);
  const allSubjects = useAppStore((s) => s.subjects);
  const assignments = useAppStore((s) => s.assignments);
  const reviews = useAppStore((s) => s.reviews);
  const addSession = useAppStore((s) => s.addSession);
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);

  const dueToday = assignments.filter((a) => a.dueDate === date && a.status !== 'done');
  const reviewsToday = reviews.filter((r) => !r.completedAt && r.scheduledFor === date);
  const free = freeIntervals(date, prefs, allSubjects, allSessions);
  const donePct = load.plannedMinutes ? (load.doneMinutes / load.plannedMinutes) * 100 : 0;

  return (
    <>
      <PageHeader
        title={date === todayISO() ? 'Seu dia' : fmtDayLong(date)}
        highlight={date === todayISO() ? 'dia' : undefined}
        description={`${fmtHours(load.doneMinutes)}h cumpridas de ${fmtHours(load.plannedMinutes)}h planejadas · teto diário de ${prefs.maxDailyHours}h`}
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={15} /> Adicionar bloco
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-1">
        <Button variant="secondary" size="icon" aria-label="Dia anterior" onClick={() => setDate(addDaysISO(date, -1))}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDate(todayISO())}>
          Hoje
        </Button>
        <Button variant="secondary" size="icon" aria-label="Próximo dia" onClick={() => setDate(addDaysISO(date, 1))}>
          <ChevronRight size={16} />
        </Button>
        <span className="ml-2 text-[13px] text-ink-2">{fmtDayLong(date)}</span>
      </div>

      {load.overloaded && (
        <div role="alert" className="mb-3 rounded-card border border-caneta/40 bg-caneta/8 px-4 py-2.5 text-[13px] text-ink">
          Este dia passa do seu teto de {prefs.maxDailyHours}h. Mova um bloco no{' '}
          <Link to="/semana" className="font-semibold text-caneta underline underline-offset-2">
            plano semanal
          </Link>
          .
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Blocos de estudo</CardTitle>
              <span className="font-mono text-[11px] text-ink-3">
                {sessions.filter((s) => s.status === 'done').length}/{sessions.length} concluídos
              </span>
            </CardHeader>
            <CardBody>
              <Progress value={donePct} color="var(--color-quadro)" className="mb-3" label="Progresso do dia" />
              {sessions.length ? (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <SessionRow key={s.id} session={s} onStart={setPomodoro} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Dia sem blocos"
                  description="Nenhuma sessão planejada. Você pode adicionar uma manualmente ou gerar o plano da semana inteira."
                  action={
                    <Button variant="secondary" onClick={() => setAdding(true)}>
                      <Plus size={15} /> Adicionar bloco
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entregas com prazo hoje</CardTitle>
            </CardHeader>
            <CardBody>
              {dueToday.length ? (
                <div className="space-y-3">
                  {dueToday.map((a) => (
                    <div key={a.id} className="rounded-lg border border-hair p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[14px] font-medium text-ink">{a.title}</p>
                        <SubjectChip subjectId={a.subjectId} />
                      </div>
                      <ul className="mt-2 space-y-1">
                        {a.subtasks.map((t) => (
                          <li key={t.id}>
                            <Checkbox
                              checked={t.done}
                              onChange={() => toggleSubtask(a.id, t.id)}
                              label={
                                <span className={cn('text-[13px]', t.done && 'text-ink-3 line-through')}>
                                  {t.title}
                                </span>
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-[13px] text-ink-2">Nenhuma entrega vence hoje.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card tabColor="var(--color-marca)">
            <CardHeader>
              <CardTitle>Revisões do dia</CardTitle>
              <Link to="/revisao" className="text-[12.5px] font-medium text-accent">
                Abrir
              </Link>
            </CardHeader>
            <CardBody>
              {reviewsToday.length ? (
                <ul className="space-y-1.5">
                  {reviewsToday.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-[13px]">
                      <SubjectChip subjectId={r.subjectId} showCode />
                      <span className="min-w-0 flex-1 truncate text-ink">{r.title}</span>
                      <Badge mono>{r.step + 1}ª</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink-2">Nenhuma revisão marcada para hoje.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={15} className="text-accent" /> Janelas livres
              </CardTitle>
            </CardHeader>
            <CardBody>
              {free.length ? (
                <ul className="space-y-1.5">
                  {free.map((iv, i) => (
                    <li key={i} className="flex items-center justify-between text-[13px]">
                      <span className="font-mono text-ink">
                        {fmtMinutes(iv.start)}–{fmtMinutes(iv.end)}
                      </span>
                      <span className="text-ink-3">{fmtHours(iv.end - iv.start)}h livres</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink-2">
                  Sem janelas livres declaradas para este dia. Ajuste sua disponibilidade em Configurações.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <AddBlockModal
        open={adding}
        date={date}
        onClose={() => setAdding(false)}
        onSave={(subjectId, start, minutes) => {
          addSession({ subjectId, date, start, minutes, status: 'planned', origin: 'manual' });
          setAdding(false);
          push({
            title: 'Bloco adicionado',
            description: `${subjectMap.get(subjectId)?.name} às ${fmtMinutes(start)} (${relativeDays(date)}).`,
            tone: 'success',
          });
        }}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />

      <PomodoroTimer session={pomodoro} onClose={() => setPomodoro(null)} />
    </>
  );
}

function AddBlockModal({
  open,
  date,
  onClose,
  onSave,
  subjects,
}: {
  open: boolean;
  date: ISODate;
  onClose: () => void;
  onSave: (subjectId: string, start: number, minutes: number) => void;
  subjects: { id: string; name: string }[];
}) {
  const prefs = useAppStore((s) => s.user.preferences);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [start, setStart] = useState(1140);
  const [minutes, setMinutes] = useState(prefs.sessionMinutes);

  const slots = Array.from({ length: 32 }, (_, i) => 360 + i * 30);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar bloco de estudo"
      description={fmtDayLong(date)}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => subjectId && onSave(subjectId, start, minutes)}>Adicionar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Disciplina" htmlFor="blk-sub">
          <Select id="blk-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" htmlFor="blk-start">
            <Select id="blk-start" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {slots.map((m) => (
                <option key={m} value={m}>
                  {fmtMinutes(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duração" htmlFor="blk-dur">
            <Select id="blk-dur" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {[25, 50, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
