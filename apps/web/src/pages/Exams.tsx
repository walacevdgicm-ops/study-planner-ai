import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Highlight,
  Input,
  Modal,
  Progress,
  Ring,
  Select,
  Table,
  type Column,
  useToast,
} from '@spa/ui-kit';
import type { Exam } from '@spa/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { SubjectChip } from '@/components/SubjectChip';
import { useAppStore } from '@/store/useAppStore';
import { useActiveSubjects, useSubjectMap } from '@/store/selectors';
import { daysBetween, fmtDay, fmtHours, fmtMinutes, relativeDays, todayISO } from '@/lib/date';
import { previewLadder } from '@/features/engine/spaced-repetition';

export default function Exams() {
  const exams = useAppStore((s) => s.exams);
  const sessions = useAppStore((s) => s.sessions);
  const addExam = useAppStore((s) => s.addExam);
  const updateExam = useAppStore((s) => s.updateExam);
  const deleteExam = useAppStore((s) => s.deleteExam);
  const prefs = useAppStore((s) => s.user.preferences);
  const subjects = useActiveSubjects();
  const subjectMap = useSubjectMap();
  const { push } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);

  const today = todayISO();
  const upcoming = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = exams.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const studiedFor = (e: Exam) =>
    sessions
      .filter((s) => s.subjectId === e.subjectId && s.status === 'done')
      .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);

  const pastCols: Column<Exam>[] = [
    { key: 'title', header: 'Prova', render: (e) => <span className="font-medium">{e.title}</span> },
    { key: 'subject', header: 'Disciplina', render: (e) => <SubjectChip subjectId={e.subjectId} /> },
    { key: 'date', header: 'Data', render: (e) => fmtDay(e.date) },
    {
      key: 'grade',
      header: 'Nota',
      numeric: true,
      render: (e) =>
        e.grade != null ? (
          <span className={e.grade < 6 ? 'font-semibold text-caneta' : 'font-semibold text-quadro'}>
            {e.grade.toFixed(1)}
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Provas do semestre"
        highlight="Provas"
        description="Cada prova puxa a prioridade da disciplina para cima conforme a data se aproxima."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Nova prova
          </Button>
        }
      />

      {upcoming.length === 0 ? (
        <EmptyState
          title="Nenhuma prova marcada"
          description="Cadastre as datas de avaliação — é isso que faz o cronograma se reorganizar sozinho."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Cadastrar prova
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {upcoming.map((exam) => {
            const subject = subjectMap.get(exam.subjectId);
            const days = daysBetween(today, exam.date);
            const studied = studiedFor(exam);
            const pct = Math.min(100, (studied / 60 / exam.targetHours) * 100);
            const ladder = previewLadder(today, prefs.reviewIntervals).filter((d) => d <= exam.date);

            return (
              <Card key={exam.id} tabColor={subject?.hex} tabFull className="relative">
                <CardBody className="p-4 pl-5">
                  <div className="absolute top-3 right-3 flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${exam.title}`}
                      onClick={() => setEditing(exam)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${exam.title}`}
                      className="hover:text-caneta"
                      onClick={() => {
                        if (confirm(`Excluir "${exam.title}"? As revisões geradas para ela também somem.`)) {
                          deleteExam(exam.id);
                          push({ title: 'Prova excluída', description: exam.title });
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="flex items-start gap-4 pr-16">
                    <Ring
                      value={Math.max(0, 100 - (days / 30) * 100)}
                      size={72}
                      stroke={7}
                      color={days <= 7 ? 'var(--color-caneta)' : (subject?.hex ?? 'var(--accent)')}
                      label={`Faltam ${days} dias`}
                    >
                      <div>
                        <p className="font-mono text-[17px] leading-none font-bold tabular-nums text-ink">{days}</p>
                        <p className="font-mono text-[9px] tracking-wider text-ink-3 uppercase">dias</p>
                      </div>
                    </Ring>

                    <div className="min-w-0 flex-1">
                      <Highlight color={subject?.hex} size="sm" className="font-display text-[15px] font-bold">
                        {exam.title}
                      </Highlight>
                      <p className="mt-1.5 text-[12.5px] text-ink-2">
                        {fmtDay(exam.date)}
                        {exam.startTime ? ` às ${fmtMinutes(exam.startTime)}` : ''} · {exam.room ?? 'local a definir'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <SubjectChip subjectId={exam.subjectId} />
                        {exam.weightInGrade && <Badge tone="accent">{exam.weightInGrade}% da nota</Badge>}
                        {days <= 7 && <Badge tone="danger">{relativeDays(exam.date)}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-[11.5px] text-ink-3">
                      <span>Preparo</span>
                      <span className="font-mono tabular-nums">
                        {fmtHours(studied)}h / {exam.targetHours}h
                      </span>
                    </div>
                    <Progress value={pct} color={subject?.hex} label={`Preparo para ${exam.title}`} />
                  </div>

                  <div className="mt-3">
                    <p className="mb-1 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">
                      Conteúdo cobrado
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exam.topics.map((t) => (
                        <Badge key={t} tone="subject" color={subject?.hex}>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {ladder.length > 0 && (
                    <p className="mt-3 border-t border-hair pt-2.5 font-mono text-[11px] text-ink-3">
                      Revisões até a prova: {ladder.map((d) => d.slice(8) + '/' + d.slice(5, 7)).join(' · ')}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <Card className="mt-5 border-0 bg-transparent">
          <CardHeader className="px-0">
            <CardTitle>Provas já realizadas</CardTitle>
          </CardHeader>
          <CardBody className="px-0">
            <Table columns={pastCols} rows={past} rowKey={(e) => e.id} caption="Provas realizadas" />
          </CardBody>
        </Card>
      )}

      <NewExamModal
        open={creating}
        onClose={() => setCreating(false)}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSave={(data) => {
          addExam(data);
          setCreating(false);
          push({ title: 'Prova cadastrada', description: `${data.title} · ${fmtDay(data.date)}`, tone: 'success' });
        }}
      />

      {editing && (
        <NewExamModal
          open={!!editing}
          onClose={() => setEditing(null)}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          initial={editing}
          onSave={(data) => {
            updateExam(editing.id, data);
            setEditing(null);
            push({ title: 'Prova atualizada', description: data.title, tone: 'success' });
          }}
        />
      )}
    </>
  );
}

function NewExamModal({
  open,
  onClose,
  onSave,
  subjects,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: Omit<Exam, 'id'>) => void;
  subjects: { id: string; name: string }[];
  /** Presente = modo edição. */
  initial?: Exam;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? subjects[0]?.id ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [topics, setTopics] = useState(initial?.topics.join(', ') ?? '');
  const [targetHours, setTargetHours] = useState(initial?.targetHours ?? 10);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar ${initial?.title}` : 'Nova prova'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                subjectId,
                title: title.trim() || 'Avaliação',
                date,
                topics: topics
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
                targetHours,
                startTime: initial?.startTime,
                room: initial?.room,
                weightInGrade: initial?.weightInGrade,
                grade: initial?.grade ?? null,
              })
            }
          >
            {isEdit ? 'Salvar' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Título" htmlFor="ex-title">
          <Input id="ex-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prova 2 — Integrais" />
        </Field>
        <Field label="Disciplina" htmlFor="ex-sub">
          <Select id="ex-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" htmlFor="ex-date">
            <Input id="ex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Horas de preparo" htmlFor="ex-hours">
            <Input
              id="ex-hours"
              type="number"
              min={1}
              value={targetHours}
              onChange={(e) => setTargetHours(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Conteúdo cobrado" hint="Separe os tópicos por vírgula." htmlFor="ex-topics">
          <Input
            id="ex-topics"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Integração por partes, Frações parciais"
          />
        </Field>
      </div>
    </Modal>
  );
}
