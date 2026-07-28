import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Repeat, TriangleAlert, Zap } from 'lucide-react';
import type { StudySession } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Highlight,
  Progress,
  SkeletonLines,
  Timeline,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { SessionRow } from '@/components/SessionRow';
import { SubjectChip } from '@/components/SubjectChip';
import { PomodoroTimer } from '@/features/pomodoro/PomodoroTimer';
import { useAppStore } from '@/store/useAppStore';
import {
  useConflicts,
  useDayLoad,
  useGamificationSummary,
  useOpenAssignments,
  usePriorities,
  useReviewQueue,
  useSessionsOn,
  useSubjectMap,
  useUpcomingExams,
} from '@/store/selectors';
import { fmtHours, fmtShort, relativeDays, todayISO, weekRange } from '@/lib/date';
import { useSimulatedLoad } from '@/lib/hooks';
import { completionRate } from '@/features/engine/stats';
import { goalProgress } from '@/features/engine/stats';
import { PRIORITY_LABEL } from '@/features/engine/priority';
import { levelTitle } from '@/features/engine/gamification';

const priorityTone = {
  critical: 'bg-caneta/15 text-caneta',
  high: 'bg-marca/35 text-ink',
  normal: 'bg-surface-2 text-ink-2',
  low: 'bg-quadro/12 text-quadro',
} as const;

export default function Dashboard() {
  const loading = useSimulatedLoad(500);
  const [pomodoro, setPomodoro] = useState<StudySession | null>(null);
  const { push } = useToast();

  const user = useAppStore((s) => s.user);
  const sessions = useAppStore((s) => s.sessions);
  const goals = useAppStore((s) => s.goals);
  const reviewsData = useAppStore((s) => s.reviews);
  const assignmentsData = useAppStore((s) => s.assignments);
  const materials = useAppStore((s) => s.materials);
  const redistributeLate = useAppStore((s) => s.redistributeLate);

  const today = todayISO();
  const week = weekRange(today);
  const todaySessions = useSessionsOn(today);
  const load = useDayLoad(today);
  const { streak, xp, level, progress, toNext } = useGamificationSummary();
  const priorities = usePriorities();
  const subjectMap = useSubjectMap();
  const reviews = useReviewQueue();
  const openAssignments = useOpenAssignments();
  const exams = useUpcomingExams();
  const conflicts = useConflicts(today);

  const weekMinutes = sessions
    .filter((s) => week.includes(s.date) && s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);
  const rate = completionRate(sessions, week[0], week[6]);
  const mainGoal = goals.find((g) => !g.archived && g.period === 'weekly');
  const goalState = mainGoal
    ? goalProgress(mainGoal, { sessions, reviews: reviewsData, assignments: assignmentsData, materials })
    : null;

  const missedCount = sessions.filter((s) => s.status === 'missed' && s.date < today).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const handleRedistribute = () => {
    const { moved, unplaced } = redistributeLate();
    push({
      title: moved ? `${moved} sessão(ões) realocada(s)` : 'Nada para realocar',
      description: unplaced
        ? `${unplaced} não couberam no seu limite diário — revise a semana.`
        : 'O plano da semana foi ajustado ao seu tempo livre.',
      tone: moved ? 'success' : 'neutral',
    });
  };

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        highlight={user.name.split(' ')[0]}
        description={
          todaySessions.length
            ? `Você tem ${todaySessions.filter((s) => s.status === 'planned').length} bloco(s) de estudo planejados para hoje.`
            : 'Nenhum bloco planejado para hoje — que tal gerar o plano da semana?'
        }
        actions={
          <>
            {missedCount > 0 && (
              <Button variant="secondary" onClick={handleRedistribute}>
                Redistribuir {missedCount} atraso(s)
              </Button>
            )}
            <Button onClick={() => setPomodoro(todaySessions.find((s) => s.status === 'planned') ?? null)}>
              Iniciar próximo bloco
            </Button>
          </>
        }
      />

      {/* Indicadores-chave */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Sequência"
          value={streak}
          unit="dias"
          tone={streak > 0 ? 'marker' : 'neutral'}
          icon={<Flame size={16} className="text-caneta" />}
          hint={streak > 0 ? 'Estudou hoje — mantenha viva.' : 'Conclua uma sessão para reacender.'}
        />
        <StatTile
          label={`Nível ${level}`}
          value={xp}
          unit="XP"
          icon={<Zap size={16} className="text-marca" fill="currentColor" />}
          hint={
            <span className="block">
              <span className="mb-1 block">{levelTitle(level)} · faltam {toNext} XP</span>
              <Progress value={progress} size="sm" color="var(--color-marca)" label="Progresso de nível" />
            </span>
          }
        />
        <StatTile
          label="Horas na semana"
          value={fmtHours(weekMinutes)}
          unit="h"
          hint={`Hoje: ${fmtHours(load.doneMinutes)}h de ${fmtHours(load.plannedMinutes)}h planejadas`}
          tone={load.overloaded ? 'danger' : 'neutral'}
        />
        <StatTile
          label="Cumprimento"
          value={rate}
          unit="%"
          tone={rate >= 70 ? 'success' : rate >= 40 ? 'neutral' : 'danger'}
          hint="Blocos concluídos vs. planejados nesta semana"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de hoje</CardTitle>
              <Link to="/dia" className="flex items-center gap-1 text-[12.5px] font-medium text-accent">
                Ver o dia <ArrowRight size={13} />
              </Link>
            </CardHeader>
            <CardBody>
              {loading ? (
                <SkeletonLines rows={4} />
              ) : todaySessions.length ? (
                <ul className="space-y-2">
                  {todaySessions.map((s) => (
                    <SessionRow key={s.id} session={s} onStart={setPomodoro} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Nenhum bloco para hoje"
                  description="Gere o plano da semana e o sistema distribui as horas conforme suas prioridades e janelas livres."
                  action={
                    <Link to="/semana">
                      <Button variant="secondary">Ir para o plano semanal</Button>
                    </Link>
                  }
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que priorizar</CardTitle>
              <span className="font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">
                cálculo automático
              </span>
            </CardHeader>
            <CardBody className="space-y-2.5">
              {loading ? (
                <SkeletonLines rows={5} />
              ) : (
                priorities.slice(0, 5).map((p) => {
                  const subject = subjectMap.get(p.subjectId);
                  if (!subject) return null;
                  return (
                    <div key={p.subjectId} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 sm:w-40">
                        <Highlight color={subject.hex} size="sm" className="text-[13px] font-medium">
                          {subject.name}
                        </Highlight>
                      </span>
                      <span className="min-w-0 flex-1">
                        <Progress value={p.score} color={subject.hex} label={`Prioridade de ${subject.name}`} />
                        <span className="mt-1 block truncate text-[11.5px] text-ink-3">
                          {p.reasons.join(' · ')}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${priorityTone[p.level]}`}
                      >
                        {PRIORITY_LABEL[p.level]}
                      </span>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {conflicts.length > 0 && (
            <Card className="border-caneta/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TriangleAlert size={15} className="text-caneta" /> Alertas da semana
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {conflicts.slice(0, 3).map((c) => (
                  <p key={c.id} className="text-[12.5px] text-ink-2">
                    <span className="font-mono text-[11px] text-ink-3">{fmtShort(c.date)}</span> · {c.message}
                  </p>
                ))}
                <Link to="/semana" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent">
                  Resolver no plano semanal <ArrowRight size={13} />
                </Link>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat size={15} className="text-accent" /> Revisões
              </CardTitle>
              <Link to="/revisao" className="text-[12.5px] font-medium text-accent">
                Abrir fila
              </Link>
            </CardHeader>
            <CardBody>
              {reviews.overdue.length + reviews.today.length === 0 ? (
                <p className="py-2 text-[13px] text-ink-2">Fila em dia. Próxima revisão em breve.</p>
              ) : (
                <div className="space-y-2">
                  {reviews.overdue.length > 0 && (
                    <Badge tone="danger">{reviews.overdue.length} vencida(s)</Badge>
                  )}
                  <ul className="space-y-1.5">
                    {[...reviews.overdue, ...reviews.today].slice(0, 4).map((r) => (
                      <li key={r.id} className="flex items-center gap-2 text-[13px]">
                        <SubjectChip subjectId={r.subjectId} showCode />
                        <span className="min-w-0 flex-1 truncate text-ink">{r.title}</span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-3">{r.step + 1}ª</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prazos próximos</CardTitle>
            </CardHeader>
            <CardBody>
              <Timeline
                items={[
                  ...openAssignments.slice(0, 3).map((a) => ({
                    id: a.id,
                    title: a.title,
                    meta: relativeDays(a.dueDate),
                    color: subjectMap.get(a.subjectId)?.hex,
                    detail: <SubjectChip subjectId={a.subjectId} />,
                  })),
                  ...exams.slice(0, 2).map((e) => ({
                    id: e.id,
                    title: `Prova: ${e.title}`,
                    meta: relativeDays(e.date),
                    color: subjectMap.get(e.subjectId)?.hex,
                    detail: <SubjectChip subjectId={e.subjectId} />,
                  })),
                ]}
              />
            </CardBody>
          </Card>

          {goalState && (
            <Card tabColor="var(--color-marca)">
              <CardHeader>
                <CardTitle>{goalState.goal.title}</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="mb-2 font-display text-2xl font-extrabold text-ink">
                  <span className="tabular-nums">{goalState.current}</span>
                  <span className="font-mono text-sm font-medium text-ink-3"> / {goalState.goal.target}</span>
                </p>
                <Progress
                  value={goalState.pct}
                  marker={goalState.expectedPct}
                  color="var(--color-marca)"
                  label={goalState.goal.title}
                />
                <p className="mt-2 text-[12px] text-ink-2">
                  {goalState.pct >= goalState.expectedPct
                    ? 'No ritmo esperado — o traço marca onde você deveria estar hoje.'
                    : `Abaixo do ritmo: faltam ${goalState.daysLeft} dia(s) para fechar.`}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <PomodoroTimer session={pomodoro} onClose={() => setPomodoro(null)} />
    </>
  );
}
