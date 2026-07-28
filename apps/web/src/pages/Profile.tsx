import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Zap } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Modal,
  Progress,
  Timeline,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { useAppStore } from '@/store/useAppStore';
import { useGamificationSummary } from '@/store/selectors';
import { fmtDay, fmtHours, todayISO, weekRange } from '@/lib/date';
import { levelTitle, longestStreak } from '@/features/engine/gamification';
import { completionRate } from '@/features/engine/stats';

export default function Profile() {
  const user = useAppStore((s) => s.user);
  const semesters = useAppStore((s) => s.semesters);
  const subjects = useAppStore((s) => s.subjects);
  const sessions = useAppStore((s) => s.sessions);
  const reviews = useAppStore((s) => s.reviews);
  const assignments = useAppStore((s) => s.assignments);
  const gamification = useAppStore((s) => s.gamification);
  const updateUser = useAppStore((s) => s.updateUser);
  const { level, xp, progress, toNext, streak, events } = useGamificationSummary();
  const { push } = useToast();
  const [editing, setEditing] = useState(false);

  const semester = semesters.find((s) => s.id === user.currentSemesterId);
  const week = weekRange(todayISO());
  const totalMinutes = sessions
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);

  return (
    <>
      <PageHeader
        title="Seu perfil"
        highlight="perfil"
        description="Quem você é no semestre atual e como está a sua constância."
        actions={
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar dados
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-5 p-5">
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-2xl bg-accent-soft font-display text-[22px] font-extrabold text-accent"
          >
            {user.avatarInitials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[22px] font-extrabold text-ink">{user.name}</h2>
            <p className="text-[13.5px] text-ink-2">
              {user.course} · {user.university}
            </p>
            <p className="mt-1 font-mono text-[11.5px] text-ink-3">
              {user.email} · semestre {semester?.label} ({fmtDay(semester?.startDate ?? todayISO())} —{' '}
              {fmtDay(semester?.endDate ?? todayISO())})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-center">
              <Flame size={18} className="mx-auto text-caneta" />
              <span className="mt-1 block font-mono text-[16px] font-bold text-ink">{streak}</span>
              <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">sequência</span>
            </span>
            <span className="text-center">
              <Trophy size={18} className="mx-auto text-marca" />
              <span className="mt-1 block font-mono text-[16px] font-bold text-ink">
                {longestStreak(gamification.activeDays)}
              </span>
              <span className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">recorde</span>
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Disciplinas" value={subjects.filter((s) => !s.archived).length} />
        <StatTile label="Horas estudadas" value={fmtHours(totalMinutes)} unit="h" />
        <StatTile label="Revisões feitas" value={reviews.filter((r) => r.completedAt).length} />
        <StatTile
          label="Entregas concluídas"
          value={assignments.filter((a) => a.status === 'done').length}
          hint={`${completionRate(sessions, week[0], week[6])}% de cumprimento nesta semana`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card tabColor="var(--color-marca)" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={15} className="text-marca" fill="currentColor" /> Nível {level}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="font-display text-[20px] font-extrabold text-ink">{levelTitle(level)}</p>
            <p className="mt-0.5 font-mono text-[12px] text-ink-3">{xp} XP acumulados</p>
            <Progress className="mt-3" value={progress} color="var(--color-marca)" label="Progresso de nível" />
            <p className="mt-1.5 text-[12px] text-ink-2">Faltam {toNext} XP para o próximo nível.</p>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-hair pt-3">
              <Badge mono>+20 sessão</Badge>
              <Badge mono>+12 revisão</Badge>
              <Badge mono>+60 entrega</Badge>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <Link to="/estatisticas" className="text-[12.5px] font-medium text-accent">
              Ver estatísticas
            </Link>
          </CardHeader>
          <CardBody>
            <Timeline
              items={events.slice(0, 8).map((e) => ({
                id: e.id,
                title: e.label,
                meta: `+${e.amount} XP`,
                detail: fmtDay(e.date),
                color:
                  e.reason === 'assignment'
                    ? 'var(--color-quadro)'
                    : e.reason === 'review'
                      ? 'var(--accent)'
                      : 'var(--color-marca)',
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <p className="mt-4 text-[12.5px] text-ink-3">
        Quer refazer a configuração inicial?{' '}
        <Link to="/onboarding" className="font-medium text-accent underline underline-offset-2">
          Repetir o onboarding
        </Link>
        .
      </p>

      <EditProfileModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={{ name: user.name, course: user.course, university: user.university, email: user.email }}
        onSave={(data) => {
          updateUser({
            ...data,
            avatarInitials: data.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join(''),
          });
          setEditing(false);
          push({ title: 'Perfil atualizado', tone: 'success' });
        }}
      />
    </>
  );
}

function EditProfileModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: { name: string; course: string; university: string; email: string }) => void;
  initial: { name: string; course: string; university: string; email: string };
}) {
  const [form, setForm] = useState(initial);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Editar perfil"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(form)}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Nome" htmlFor="pf-name">
          <Input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="E-mail" htmlFor="pf-email">
          <Input id="pf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Curso" htmlFor="pf-course">
          <Input id="pf-course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
        </Field>
        <Field label="Instituição" htmlFor="pf-uni">
          <Input
            id="pf-uni"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
