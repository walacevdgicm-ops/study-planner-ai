import { useState } from 'react';
import { Pencil, Plus, Target, Trophy } from 'lucide-react';
import type { Goal, GoalMetric, GoalPeriod } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { SubjectChip } from '@/components/SubjectChip';
import { useAppStore } from '@/store/useAppStore';
import { useActiveSubjects, useGamificationSummary } from '@/store/selectors';
import { METRIC_LABEL, goalProgress } from '@/features/engine/stats';
import { addDaysISO, fmtDay, todayISO, weekRange } from '@/lib/date';
import { levelTitle } from '@/features/engine/gamification';

export default function Goals() {
  const goals = useAppStore((s) => s.goals);
  const sessions = useAppStore((s) => s.sessions);
  const reviews = useAppStore((s) => s.reviews);
  const assignments = useAppStore((s) => s.assignments);
  const materials = useAppStore((s) => s.materials);
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const archiveGoal = useAppStore((s) => s.archiveGoal);
  const subjects = useActiveSubjects();
  const { level, xp, progress, toNext, streak } = useGamificationSummary();
  const { push } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const active = goals.filter((g) => !g.archived);
  const data = { sessions, reviews, assignments, materials };

  return (
    <>
      <PageHeader
        title="Metas e desafios"
        highlight="desafios"
        description="Metas funcionam como desafios da semana: o traço na barra mostra onde você deveria estar hoje para fechar no prazo."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Nova meta
          </Button>
        }
      />

      <Card className="mb-4" tabColor="var(--color-marca)" tabFull>
        <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4 pl-5">
          <div>
            <p className="font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Nível {level}</p>
            <p className="font-display text-[20px] font-extrabold text-ink">{levelTitle(level)}</p>
          </div>
          <div className="min-w-[12rem] flex-1">
            <Progress value={progress} color="var(--color-marca)" label="Progresso de nível" />
            <p className="mt-1 font-mono text-[11.5px] text-ink-3">
              {xp} XP · faltam {toNext} para o próximo nível
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-marca" />
            <span className="font-mono text-[13px] text-ink">{streak} dias seguidos</span>
          </div>
        </CardBody>
      </Card>

      {active.length === 0 ? (
        <EmptyState
          icon={<Target size={20} />}
          title="Nenhuma meta ativa"
          description="Defina uma meta semanal de horas ou de revisões — é o jeito mais simples de manter a constância."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((goal) => {
            const p = goalProgress(goal, data);
            return (
              <Card key={goal.id}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-[15px] font-bold text-ink">{goal.title}</h3>
                      <p className="mt-0.5 text-[12px] text-ink-3">
                        {goal.period === 'weekly' ? 'Semanal' : 'Mensal'} · {fmtDay(goal.startDate)} a{' '}
                        {fmtDay(goal.endDate)}
                      </p>
                      {goal.subjectId && <SubjectChip subjectId={goal.subjectId} className="mt-1" />}
                    </div>
                    <Badge tone={p.pct >= 100 ? 'success' : p.atRisk ? 'danger' : 'neutral'}>
                      {p.pct >= 100 ? 'concluída' : p.atRisk ? 'em risco' : `${p.daysLeft}d restantes`}
                    </Badge>
                  </div>

                  <p className="mt-3 font-display text-[26px] leading-none font-extrabold text-ink">
                    <span className="tabular-nums">{p.current}</span>
                    <span className="font-mono text-[14px] font-medium text-ink-3">
                      {' '}
                      / {goal.target} {METRIC_LABEL[goal.metric]}
                    </span>
                  </p>

                  <Progress
                    className="mt-2"
                    value={p.pct}
                    marker={p.expectedPct}
                    color={p.pct >= 100 ? 'var(--color-quadro)' : 'var(--color-marca)'}
                    label={goal.title}
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[12px] text-ink-2">
                      Ritmo esperado hoje: <span className="font-mono">{p.expectedPct}%</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditing(goal)}
                        aria-label={`Editar ${goal.title}`}
                        className="flex items-center gap-1 text-[12px] text-ink-3 underline underline-offset-2 hover:text-ink"
                      >
                        <Pencil size={11} /> editar
                      </button>
                      <button
                        onClick={() => {
                          archiveGoal(goal.id);
                          push({ title: 'Meta arquivada', description: goal.title });
                        }}
                        className="text-[12px] text-ink-3 underline underline-offset-2 hover:text-ink"
                      >
                        arquivar
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <NewGoalModal
        open={creating}
        onClose={() => setCreating(false)}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSave={(g) => {
          addGoal(g);
          setCreating(false);
          push({ title: 'Meta criada', description: g.title, tone: 'success' });
        }}
      />

      {editing && (
        <NewGoalModal
          open={!!editing}
          onClose={() => setEditing(null)}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          initial={editing}
          onSave={(g) => {
            updateGoal(editing.id, g);
            setEditing(null);
            push({ title: 'Meta atualizada', description: g.title, tone: 'success' });
          }}
        />
      )}
    </>
  );
}

function NewGoalModal({
  open,
  onClose,
  onSave,
  subjects,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (g: Omit<Goal, 'id' | 'userId' | 'archived'>) => void;
  subjects: { id: string; name: string }[];
  /** Presente = modo edição. */
  initial?: Goal;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [metric, setMetric] = useState<GoalMetric>(initial?.metric ?? 'studyHours');
  const [target, setTarget] = useState(initial?.target ?? 15);
  const [period, setPeriod] = useState<GoalPeriod>(initial?.period ?? 'weekly');
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '');

  const week = weekRange(todayISO());

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={isEdit ? `Editar ${initial?.title}` : 'Nova meta'}
      description="Metas curtas funcionam melhor: prefira uma semana com número realista."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                title: title.trim() || `${target} ${METRIC_LABEL[metric]}`,
                metric,
                target,
                period,
                subjectId: subjectId || null,
                startDate: initial?.startDate ?? (period === 'weekly' ? week[0] : todayISO()),
                endDate: initial?.endDate ?? (period === 'weekly' ? week[6] : addDaysISO(todayISO(), 30)),
              })
            }
          >
            {isEdit ? 'Salvar' : 'Criar meta'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Título" htmlFor="goal-title">
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 15h de estudo nesta semana"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Métrica" htmlFor="goal-metric">
            <Select id="goal-metric" value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
              {(Object.keys(METRIC_LABEL) as GoalMetric[]).map((m) => (
                <option key={m} value={m}>
                  {METRIC_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alvo" htmlFor="goal-target">
            <Input
              id="goal-target"
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Período" htmlFor="goal-period">
            <Select id="goal-period" value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </Select>
          </Field>
          <Field label="Disciplina" hint="Opcional" htmlFor="goal-sub">
            <Select id="goal-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Todas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
