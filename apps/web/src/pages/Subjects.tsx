import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Pencil, Plus, Star } from 'lucide-react';
import type { SubjectColor } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Highlight,
  Input,
  Modal,
  Progress,
  Select,
  Tabs,
  cn,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { useAppStore } from '@/store/useAppStore';
import { usePriorities, useSubjectMap } from '@/store/selectors';
import { SUBJECT_COLORS, subjectHex } from '@/lib/subject-colors';
import { fmtHours, fmtMinutes, relativeDays, WEEKDAY_LABEL } from '@/lib/date';
import { PRIORITY_LABEL } from '@/features/engine/priority';

export default function Subjects() {
  const subjects = useAppStore((s) => s.subjects);
  const professors = useAppStore((s) => s.professors);
  const sessions = useAppStore((s) => s.sessions);
  const exams = useAppStore((s) => s.exams);
  const addSubject = useAppStore((s) => s.addSubject);
  const updateSubject = useAppStore((s) => s.updateSubject);
  const archiveSubject = useAppStore((s) => s.archiveSubject);
  const toggleFavorite = useAppStore((s) => s.toggleSubjectFavorite);
  const priorities = usePriorities();
  const subjectMap = useSubjectMap();
  const { push } = useToast();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<(typeof subjects)[number] | null>(null);

  const priorityOf = useMemo(
    () => new Map(priorities.map((p) => [p.subjectId, p])),
    [priorities],
  );

  const visible = subjects
    .filter((s) => !s.archived)
    .filter((s) => (filter === 'fav' ? s.favorite : true))
    .filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) =>
      filter === 'priority'
        ? (priorityOf.get(b.id)?.score ?? 0) - (priorityOf.get(a.id)?.score ?? 0)
        : a.name.localeCompare(b.name),
    );

  const studiedMinutes = (id: string) =>
    sessions
      .filter((s) => s.subjectId === id && s.status === 'done')
      .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);

  return (
    <>
      <PageHeader
        title="Suas disciplinas"
        highlight="disciplinas"
        description="Cada matéria tem uma cor — ela acompanha você em toda a plataforma, do calendário à fila de revisão."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nova disciplina
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou código…"
          aria-label="Buscar disciplina"
          className="max-w-xs"
        />
        <Tabs
          look="pill"
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: 'Todas', count: subjects.filter((s) => !s.archived).length },
            { id: 'fav', label: 'Favoritas', count: subjects.filter((s) => s.favorite).length },
            { id: 'priority', label: 'Por prioridade' },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={query ? 'Nenhuma disciplina encontrada' : 'Semestre ainda vazio'}
          description={
            query
              ? 'Tente outro termo — a busca cobre nome e código da disciplina.'
              : 'Cadastre as matérias do período para o sistema montar seu cronograma.'
          }
          action={
            !query && (
              <Button onClick={() => setOpen(true)}>
                <Plus size={16} /> Cadastrar disciplina
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((subject) => {
            const hex = subjectHex(subject.color);
            const p = priorityOf.get(subject.id);
            const studied = studiedMinutes(subject.id);
            const pct = Math.min(100, Math.round((studied / 60 / subject.totalHours) * 100));
            const nextExam = exams
              .filter((e) => e.subjectId === subject.id && e.date >= new Date().toISOString().slice(0, 10))
              .sort((a, b) => a.date.localeCompare(b.date))[0];
            const professor = professors.find((x) => x.id === subject.professorId);

            return (
              <Card key={subject.id} tabColor={hex} tabFull interactive className="overflow-hidden">
                <CardBody className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/disciplinas/${subject.id}`} className="block">
                        <Highlight color={hex} className="font-display text-[16px] font-bold">
                          {subject.name}
                        </Highlight>
                      </Link>
                      <p className="mt-1.5 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
                        {subject.code} · {subject.credits} créditos
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => toggleFavorite(subject.id)}
                        aria-label={subject.favorite ? 'Remover dos favoritos' : 'Marcar como favorita'}
                        aria-pressed={subject.favorite}
                        className={cn(
                          'rounded-md p-1.5 transition-colors',
                          subject.favorite ? 'text-marca' : 'text-ink-3 hover:text-ink',
                        )}
                      >
                        <Star size={16} fill={subject.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => setEditing(subject)}
                        aria-label={`Editar ${subject.name}`}
                        className="rounded-md p-1.5 text-ink-3 transition-colors hover:text-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Arquivar "${subject.name}"? Ela some das listas, mas trabalhos, provas e materiais já cadastrados continuam no histórico.`,
                            )
                          ) {
                            archiveSubject(subject.id);
                            push({ title: 'Disciplina arquivada', description: subject.name });
                          }
                        }}
                        aria-label={`Arquivar ${subject.name}`}
                        className="rounded-md p-1.5 text-ink-3 transition-colors hover:text-caneta"
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[12.5px] text-ink-2">
                    {professor ? professor.name : 'Sem professor cadastrado'}
                  </p>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-[11.5px] text-ink-3">
                      <span>Carga cumprida</span>
                      <span className="font-mono tabular-nums">
                        {fmtHours(studied)}h / {subject.totalHours}h
                      </span>
                    </div>
                    <Progress value={pct} color={hex} label={`Progresso de ${subject.name}`} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {p && (
                      <Badge tone={p.level === 'critical' ? 'danger' : p.level === 'high' ? 'warning' : 'neutral'}>
                        {PRIORITY_LABEL[p.level]}
                      </Badge>
                    )}
                    {subject.currentGrade !== null && (
                      <Badge tone={subject.currentGrade < 6 ? 'danger' : 'success'} mono>
                        média {subject.currentGrade.toFixed(1)}
                      </Badge>
                    )}
                    {nextExam && <Badge tone="accent">prova {relativeDays(nextExam.date)}</Badge>}
                  </div>

                  <p className="mt-3 border-t border-hair pt-2.5 font-mono text-[11px] text-ink-3">
                    {subject.classSlots.length
                      ? subject.classSlots
                          .map((c) => `${WEEKDAY_LABEL[c.weekday]} ${fmtMinutes(c.start)}`)
                          .join(' · ')
                      : 'Sem horário de aula'}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <NewSubjectModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(data) => {
          addSubject(data);
          setOpen(false);
          push({ title: 'Disciplina cadastrada', description: `${data.name} entrou no semestre.`, tone: 'success' });
        }}
        usedColors={subjects.map((s) => s.color)}
      />

      {editing && (
        <NewSubjectModal
          open={!!editing}
          onClose={() => setEditing(null)}
          initial={editing}
          onSave={(data) => {
            updateSubject(editing.id, data);
            setEditing(null);
            push({ title: 'Disciplina atualizada', description: data.name, tone: 'success' });
          }}
          usedColors={subjects.filter((s) => s.id !== editing.id).map((s) => s.color)}
        />
      )}
      {subjectMap.size === 0 && null}
    </>
  );
}

/* ------------------------------------------------------------------ */

interface NewSubjectData {
  name: string;
  code: string;
  professorId: string | null;
  color: SubjectColor;
  totalHours: number;
  credits: number;
  weight: 1 | 2 | 3 | 4 | 5;
  currentGrade: number | null;
  classSlots: [];
}

function NewSubjectModal({
  open,
  onClose,
  onSave,
  usedColors,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewSubjectData) => void;
  usedColors: number[];
  /** Presente = modo edição, pré-preenche o formulário com a disciplina existente. */
  initial?: {
    name: string;
    code: string;
    professorId: string | null;
    color: SubjectColor;
    totalHours: number;
    weight: number;
    currentGrade: number | null;
  };
}) {
  const professors = useAppStore((s) => s.professors);
  const suggested = (SUBJECT_COLORS.findIndex((_, i) => !usedColors.includes(i)) + 6) % 6;
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [professorId, setProfessorId] = useState(initial?.professorId ?? '');
  const [color, setColor] = useState<SubjectColor>(initial?.color ?? (suggested as SubjectColor));
  const [totalHours, setTotalHours] = useState(initial?.totalHours ?? 60);
  const [weight, setWeight] = useState(initial?.weight ?? 3);
  const [currentGrade, setCurrentGrade] = useState(initial?.currentGrade?.toString() ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    if (name.trim().length < 3) {
      setError('Dê um nome com pelo menos 3 letras.');
      return;
    }
    const grade = currentGrade.trim() === '' ? null : Number(currentGrade.replace(',', '.'));
    onSave({
      name: name.trim(),
      code: code.trim() || name.slice(0, 3).toUpperCase(),
      professorId: professorId || null,
      color,
      totalHours,
      credits: Math.max(1, Math.round(totalHours / 15)),
      weight: weight as 1 | 2 | 3 | 4 | 5,
      currentGrade: grade !== null && Number.isFinite(grade) ? grade : null,
      classSlots: [],
    });
    if (!isEdit) {
      setName('');
      setCode('');
    }
    setError('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar ${initial?.name}` : 'Nova disciplina'}
      description="O horário de aula pode ser ajustado depois, na tela da disciplina."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Nome da disciplina" error={error} htmlFor="sub-name">
          <Input
            id="sub-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cálculo III"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Código" htmlFor="sub-code">
            <Input id="sub-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT03" />
          </Field>
          <Field label="Professor" htmlFor="sub-prof">
            <Select id="sub-prof" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">Sem professor</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Carga horária (h)" htmlFor="sub-hours">
            <Input
              id="sub-hours"
              type="number"
              min={15}
              step={15}
              value={totalHours}
              onChange={(e) => setTotalHours(Number(e.target.value))}
            />
          </Field>
          <Field label="Peso / dificuldade" hint="1 = tranquila · 5 = crítica" htmlFor="sub-weight">
            <Select id="sub-weight" value={weight} onChange={(e) => setWeight(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Média atual" hint="Deixe em branco se ainda não tiver nota." htmlFor="sub-grade">
          <Input
            id="sub-grade"
            inputMode="decimal"
            value={currentGrade}
            onChange={(e) => setCurrentGrade(e.target.value)}
            placeholder="Ex: 7,5"
          />
        </Field>

        <Field label="Cor da disciplina" hint="É por essa cor que você vai reconhecer a matéria em todo o app.">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(i as SubjectColor)}
                aria-label={c.label}
                aria-pressed={color === i}
                className={cn(
                  'size-9 rounded-lg border-2 transition-transform',
                  color === i ? 'scale-105 border-ink' : 'border-transparent hover:scale-105',
                )}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
