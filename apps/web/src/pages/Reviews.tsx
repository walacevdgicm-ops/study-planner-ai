import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import type { Review, ReviewGrade } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Highlight,
  Tabs,
  cn,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { SubjectChip } from '@/components/SubjectChip';
import { useAppStore } from '@/store/useAppStore';
import { useReviewQueue, useSubjectMap } from '@/store/selectors';
import { fmtDay, relativeDays, todayISO } from '@/lib/date';

const GRADES: { id: ReviewGrade; label: string; hint: string; className: string }[] = [
  { id: 'forgot', label: 'Esqueci', hint: 'volta ao início da escada', className: 'bg-caneta/12 text-caneta hover:bg-caneta/20' },
  { id: 'hard', label: 'Difícil', hint: 'intervalo encurtado', className: 'bg-marca/30 text-ink hover:bg-marca/45' },
  { id: 'easy', label: 'Fácil', hint: 'avança um degrau', className: 'bg-quadro/12 text-quadro hover:bg-quadro/20' },
];

export default function Reviews() {
  const { overdue, today, upcoming, completed } = useReviewQueue();
  const answerReview = useAppStore((s) => s.answerReview);
  const intervals = useAppStore((s) => s.user.preferences.reviewIntervals);
  const subjectMap = useSubjectMap();
  const { push } = useToast();

  const [tab, setTab] = useState('queue');
  const [revealed, setRevealed] = useState<string | null>(null);

  const queue = [...overdue, ...today];
  const current = queue[0];

  const answer = (grade: ReviewGrade) => {
    if (!current) return;
    const msg = answerReview(current.id, grade);
    setRevealed(null);
    push({ title: '+12 XP', description: msg, tone: grade === 'easy' ? 'success' : 'neutral' });
  };

  return (
    <>
      <PageHeader
        title="Revisão espaçada"
        highlight="espaçada"
        description={`Escada de ${intervals.join('-')} dias. Cada material estudado entra automaticamente na fila.`}
        actions={
          <Link to="/configuracoes">
            <Button variant="secondary">Ajustar intervalos</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Vencidas" value={overdue.length} tone={overdue.length ? 'danger' : 'neutral'} />
        <StatTile label="Para hoje" value={today.length} tone={today.length ? 'marker' : 'neutral'} />
        <StatTile label="Agendadas" value={upcoming.length} />
        <StatTile label="Concluídas" value={completed.length} tone="success" />
      </div>

      <div className="mt-5 border-b border-hair">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'queue', label: 'Fila de hoje', count: queue.length },
            { id: 'upcoming', label: 'Próximas', count: upcoming.length },
            { id: 'history', label: 'Histórico', count: completed.length },
          ]}
        />
      </div>

      <div className="mt-4">
        {tab === 'queue' &&
          (current ? (
            <Card className="mx-auto max-w-2xl" tabColor={subjectMap.get(current.subjectId)?.hex} tabFull>
              <CardBody className="p-6 pl-7">
                <div className="flex items-center justify-between gap-2">
                  <SubjectChip subjectId={current.subjectId} />
                  <div className="flex items-center gap-1.5">
                    <Badge mono>{current.step + 1}ª revisão</Badge>
                    {current.scheduledFor < todayISO() && <Badge tone="danger">vencida</Badge>}
                  </div>
                </div>

                <p className="mt-5 text-center font-display text-[22px] leading-tight font-bold text-ink">
                  <Highlight color={subjectMap.get(current.subjectId)?.hex}>{current.title}</Highlight>
                </p>

                <div className="mt-6 min-h-[6rem] rounded-card border border-dashed border-hair p-4 text-center">
                  {revealed === current.id ? (
                    <p className="text-[13.5px] leading-6 text-ink-2">
                      Retome o material original e verifique se você consegue explicar o conteúdo em voz alta.
                      Depois, avalie honestamente o quanto lembrou — é essa avaliação que define o próximo intervalo.
                    </p>
                  ) : (
                    <Button variant="secondary" onClick={() => setRevealed(current.id)}>
                      Tentei lembrar — mostrar orientação
                    </Button>
                  )}
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {GRADES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => answer(g.id)}
                      className={cn('rounded-lg px-3 py-2.5 text-center transition-colors', g.className)}
                    >
                      <span className="block text-[14px] font-semibold">{g.label}</span>
                      <span className="block text-[11px] opacity-80">{g.hint}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-center font-mono text-[11px] text-ink-3">
                  restam {queue.length} nesta rodada
                </p>
              </CardBody>
            </Card>
          ) : (
            <EmptyState
              icon={<Repeat size={20} />}
              title="Fila zerada"
              description="Nenhuma revisão vencida ou marcada para hoje. Marque um material como estudado para alimentar a escada."
              action={
                <Link to="/materiais">
                  <Button variant="secondary">Ir para os materiais</Button>
                </Link>
              }
            />
          ))}

        {tab === 'upcoming' && <ReviewList reviews={upcoming} emptyLabel="Nenhuma revisão agendada à frente." />}
        {tab === 'history' && (
          <ReviewList reviews={completed.slice(-40).reverse()} emptyLabel="Você ainda não concluiu revisões." completed />
        )}
      </div>
    </>
  );
}

function ReviewList({
  reviews,
  emptyLabel,
  completed,
}: {
  reviews: Review[];
  emptyLabel: string;
  completed?: boolean;
}) {
  const subjectMap = useSubjectMap();
  if (!reviews.length) return <EmptyState title="Nada por aqui" description={emptyLabel} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{completed ? 'Revisões concluídas' : 'Próximas revisões'}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="divide-y divide-hair">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: subjectMap.get(r.subjectId)?.hex }}
              />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{r.title}</span>
              <Badge mono>{r.step + 1}ª</Badge>
              {completed ? (
                <span className="font-mono text-[11.5px] text-ink-3">
                  {r.lastGrade === 'easy' ? 'fácil' : r.lastGrade === 'hard' ? 'difícil' : 'esqueci'} ·{' '}
                  {fmtDay(r.completedAt!.slice(0, 10))}
                </span>
              ) : (
                <span className="font-mono text-[11.5px] text-ink-3">
                  {fmtDay(r.scheduledFor)} · {relativeDays(r.scheduledFor)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
