import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { GripVertical, Paperclip, Plus, Star } from 'lucide-react';
import type { Assignment, AssignmentStatus } from '@spa/shared-types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  cn,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { SubjectChip } from '@/components/SubjectChip';
import { useAppStore } from '@/store/useAppStore';
import { useActiveSubjects, useSubjectMap } from '@/store/selectors';
import { fmtDay, relativeDays, todayISO } from '@/lib/date';

const COLUMNS: { id: AssignmentStatus; label: string; hint: string }[] = [
  { id: 'todo', label: 'A fazer', hint: 'ainda não começou' },
  { id: 'doing', label: 'Em andamento', hint: 'já tem alguma coisa pronta' },
  { id: 'review', label: 'Em revisão', hint: 'esperando ajuste final' },
  { id: 'done', label: 'Entregue', hint: 'fechado' },
];

function Kard({ assignment, onOpen }: { assignment: Assignment; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: assignment.id });
  const hex = useSubjectMap().get(assignment.subjectId)?.hex;
  const late = assignment.dueDate < todayISO() && assignment.status !== 'done';
  const doneSubtasks = assignment.subtasks.filter((s) => s.done).length;

  return (
    <div
      ref={setNodeRef}
      style={{ '--subject': hex } as React.CSSProperties}
      className={cn(
        'tab-card group rounded-lg border bg-surface p-3 pl-4',
        late ? 'border-caneta/40' : 'border-hair',
        isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Mover ${assignment.title}`}
          className="mt-0.5 cursor-grab rounded text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <GripVertical size={14} />
        </button>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="text-[13.5px] leading-5 font-medium text-ink">{assignment.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <SubjectChip subjectId={assignment.subjectId} showCode asLink={false} />
            <Badge tone={late ? 'danger' : 'neutral'} mono>
              {late ? 'atrasado' : relativeDays(assignment.dueDate)}
            </Badge>
            {assignment.favorite && <Star size={12} className="text-marca" fill="currentColor" />}
            {assignment.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-ink-3">
                <Paperclip size={11} />
                {assignment.attachments.length}
              </span>
            )}
          </div>
          {assignment.subtasks.length > 0 && (
            <div className="mt-2">
              <Progress
                value={(doneSubtasks / assignment.subtasks.length) * 100}
                size="sm"
                color={hex}
                label={`Subtarefas de ${assignment.title}`}
              />
              <p className="mt-1 font-mono text-[10.5px] text-ink-3">
                {doneSubtasks}/{assignment.subtasks.length} subtarefas · {assignment.estimatedHours}h estimadas
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function Column({
  column,
  items,
  onOpen,
}: {
  column: (typeof COLUMNS)[number];
  items: Assignment[];
  onOpen: (a: Assignment) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[15rem] flex-1 flex-col rounded-card border bg-surface-2/40 p-2 transition-colors',
        isOver ? 'border-accent bg-accent-soft/40' : 'border-hair',
      )}
    >
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-display text-[13.5px] font-bold text-ink">{column.label}</h2>
        <span className="font-mono text-[11px] text-ink-3">{items.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {items.map((a) => (
          <Kard key={a.id} assignment={a} onOpen={() => onOpen(a)} />
        ))}
        {!items.length && (
          <p className="mt-6 px-2 text-center text-[11.5px] text-ink-3">Nada aqui — {column.hint}.</p>
        )}
      </div>
    </div>
  );
}

export default function Assignments() {
  const assignments = useAppStore((s) => s.assignments);
  const moveAssignment = useAppStore((s) => s.moveAssignment);
  const addAssignment = useAppStore((s) => s.addAssignment);
  const subjects = useActiveSubjects();
  const { push } = useToast();

  const [dragging, setDragging] = useState<Assignment | null>(null);
  const [detail, setDetail] = useState<Assignment | null>(null);
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const status = e.over?.id as AssignmentStatus | undefined;
    const a = assignments.find((x) => x.id === e.active.id);
    if (!status || !a || a.status === status) return;
    moveAssignment(a.id, status);
    if (status === 'done') {
      push({ title: '+60 XP', description: `"${a.title}" entregue. 🎉`, tone: 'xp' });
    }
  };

  const current = detail ? assignments.find((a) => a.id === detail.id) ?? null : null;

  return (
    <>
      <PageHeader
        title="Quadro de trabalhos"
        highlight="trabalhos"
        description="Arraste os cartões entre as colunas. Cartões com prazo vencido ganham a borda vermelha."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Novo trabalho
          </Button>
        }
      />

      {assignments.length === 0 ? (
        <EmptyState
          title="Nenhum trabalho cadastrado"
          description="Cadastre entregas com prazo e subtarefas — o sistema usa esses dados para priorizar suas disciplinas."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Cadastrar trabalho
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setDragging(assignments.find((a) => a.id === e.active.id) ?? null)}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {COLUMNS.map((c) => (
              <Column
                key={c.id}
                column={c}
                items={assignments
                  .filter((a) => a.status === c.id)
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))}
                onOpen={setDetail}
              />
            ))}
          </div>

          <DragOverlay>
            {dragging && (
              <div className="rounded-lg border border-hair bg-surface p-3 shadow-lifted">
                <p className="text-[13.5px] font-medium text-ink">{dragging.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Detalhe do trabalho */}
      <Modal
        open={!!current}
        onClose={() => setDetail(null)}
        title={current?.title ?? ''}
        description={current ? `Entrega ${fmtDay(current.dueDate)} · ${relativeDays(current.dueDate)}` : undefined}
        footer={
          current && (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Fechar
              </Button>
              {current.status !== 'done' && (
                <Button
                  variant="marker"
                  onClick={() => {
                    moveAssignment(current.id, 'done');
                    push({ title: '+60 XP', description: 'Trabalho entregue.', tone: 'xp' });
                    setDetail(null);
                  }}
                >
                  Marcar como entregue
                </Button>
              )}
            </>
          )
        }
      >
        {current && <AssignmentDetail assignment={current} />}
      </Modal>

      {/* Novo trabalho */}
      <NewAssignmentModal
        open={creating}
        onClose={() => setCreating(false)}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSave={(data) => {
          addAssignment(data);
          setCreating(false);
          push({ title: 'Trabalho cadastrado', description: data.title, tone: 'success' });
        }}
      />
    </>
  );
}

function AssignmentDetail({ assignment }: { assignment: Assignment }) {
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const addSubtask = useAppStore((s) => s.addSubtask);
  const [newTask, setNewTask] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SubjectChip subjectId={assignment.subjectId} />
        <Badge mono>{assignment.estimatedHours}h estimadas</Badge>
        {assignment.weightInGrade && <Badge tone="accent">{assignment.weightInGrade}% da nota</Badge>}
      </div>

      {assignment.description && <p className="text-[13.5px] text-ink-2">{assignment.description}</p>}

      <div>
        <p className="mb-2 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Subtarefas</p>
        <ul className="space-y-1.5">
          {assignment.subtasks.map((t) => (
            <li key={t.id}>
              <Checkbox
                checked={t.done}
                onChange={() => toggleSubtask(assignment.id, t.id)}
                label={<span className={cn('text-[13px]', t.done && 'text-ink-3 line-through')}>{t.title}</span>}
              />
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTask.trim()) return;
            addSubtask(assignment.id, newTask.trim());
            setNewTask('');
          }}
        >
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nova subtarefa…"
            aria-label="Nova subtarefa"
            className="h-9"
          />
          <Button type="submit" variant="secondary" size="sm">
            Adicionar
          </Button>
        </form>
      </div>

      {assignment.attachments.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Anexos</p>
          <ul className="space-y-1">
            {assignment.attachments.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-[13px] text-ink-2">
                <Paperclip size={13} /> {f.name}
                <span className="font-mono text-[11px] text-ink-3">{f.sizeKb} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NewAssignmentModal({
  open,
  onClose,
  onSave,
  subjects,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    subjectId: string;
    title: string;
    dueDate: string;
    status: AssignmentStatus;
    estimatedHours: number;
  }) => void;
  subjects: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(todayISO());
  const [hours, setHours] = useState(3);
  const [error, setError] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo trabalho"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (title.trim().length < 3) return setError('Descreva o trabalho em pelo menos 3 letras.');
              onSave({ subjectId, title: title.trim(), dueDate, status: 'todo', estimatedHours: hours });
              setTitle('');
              setError('');
            }}
          >
            Cadastrar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Título" error={error} htmlFor="asg-title">
          <Input id="asg-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lista 5 — Séries" />
        </Field>
        <Field label="Disciplina" htmlFor="asg-sub">
          <Select id="asg-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prazo" htmlFor="asg-due">
            <Input id="asg-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Esforço (h)" htmlFor="asg-hours">
            <Input
              id="asg-hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
