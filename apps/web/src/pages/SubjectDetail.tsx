import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
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
  Tabs,
  Table,
  type Column,
  cn,
} from '@spa/ui-kit';
import type { Assignment, Exam, Material, StudySession } from '@spa/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { useAppStore } from '@/store/useAppStore';
import { usePriorities } from '@/store/selectors';
import { subjectHex } from '@/lib/subject-colors';
import { fmtDay, fmtDuration, fmtHours, fmtMinutes, relativeDays, todayISO, WEEKDAY_LONG } from '@/lib/date';
import { PRIORITY_LABEL } from '@/features/engine/priority';

const STATUS_LABEL: Record<Assignment['status'], string> = {
  todo: 'A fazer',
  doing: 'Em andamento',
  review: 'Em revisão',
  done: 'Entregue',
};

export default function SubjectDetail() {
  const { id = '' } = useParams();
  const subject = useAppStore((s) => s.subjects.find((x) => x.id === id));
  const professors = useAppStore((s) => s.professors);
  const assignments = useAppStore((s) => s.assignments.filter((a) => a.subjectId === id));
  const exams = useAppStore((s) => s.exams.filter((e) => e.subjectId === id));
  const materials = useAppStore((s) => s.materials.filter((m) => m.subjectId === id));
  const sessions = useAppStore((s) => s.sessions.filter((x) => x.subjectId === id));
  const toggleFavorite = useAppStore((s) => s.toggleSubjectFavorite);
  const priorities = usePriorities();
  const [tab, setTab] = useState('overview');

  if (!subject) {
    return (
      <EmptyState
        title="Disciplina não encontrada"
        description="Ela pode ter sido arquivada ou removida do semestre atual."
        action={
          <Link to="/disciplinas">
            <Button variant="secondary">Voltar para disciplinas</Button>
          </Link>
        }
      />
    );
  }

  const hex = subjectHex(subject.color);
  const priority = priorities.find((p) => p.subjectId === subject.id);
  const professor = professors.find((p) => p.id === subject.professorId);
  const studied = sessions
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);
  const nextExam = exams.filter((e) => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date))[0];

  const materialCols: Column<Material>[] = [
    { key: 'title', header: 'Material', render: (m) => <span className="font-medium">{m.title}</span> },
    {
      key: 'kind',
      header: 'Tipo',
      render: (m) => <Badge>{m.kind === 'pdf' ? 'PDF' : m.kind === 'video' ? 'Vídeo' : 'Leitura'}</Badge>,
    },
    {
      key: 'progress',
      header: 'Progresso',
      numeric: true,
      width: '9rem',
      render: (m) => (
        <span className="flex items-center justify-end gap-2">
          <Progress value={m.progress} color={hex} size="sm" className="w-16" />
          {m.progress}%
        </span>
      ),
    },
  ];

  const sessionCols: Column<StudySession>[] = [
    { key: 'date', header: 'Data', render: (s) => fmtDay(s.date) },
    { key: 'start', header: 'Início', render: (s) => <span className="font-mono">{fmtMinutes(s.start)}</span> },
    { key: 'dur', header: 'Duração', numeric: true, render: (s) => fmtDuration(s.actualMinutes ?? s.minutes) },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge tone={s.status === 'done' ? 'success' : s.status === 'missed' ? 'danger' : 'neutral'}>
          {s.status === 'done' ? 'concluída' : s.status === 'missed' ? 'não cumprida' : 'planejada'}
        </Badge>
      ),
    },
  ];

  const examCols: Column<Exam>[] = [
    { key: 'title', header: 'Prova', render: (e) => <span className="font-medium">{e.title}</span> },
    { key: 'date', header: 'Data', render: (e) => `${fmtDay(e.date)} (${relativeDays(e.date)})` },
    { key: 'topics', header: 'Conteúdo', render: (e) => e.topics.slice(0, 2).join(', ') + (e.topics.length > 2 ? '…' : '') },
    { key: 'grade', header: 'Nota', numeric: true, render: (e) => (e.grade != null ? e.grade.toFixed(1) : '—') },
  ];

  return (
    <>
      <PageHeader
        title={subject.name}
        highlight={subject.name}
        color={hex}
        description={`${subject.code} · ${professor?.name ?? 'sem professor'} · ${subject.credits} créditos`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => toggleFavorite(subject.id)}
              aria-pressed={subject.favorite}
            >
              <Star size={15} fill={subject.favorite ? 'currentColor' : 'none'} className={cn(subject.favorite && 'text-marca')} />
              {subject.favorite ? 'Favorita' : 'Favoritar'}
            </Button>
            <Link to="/semana">
              <Button>Planejar estudo</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Horas estudadas" value={fmtHours(studied)} unit={`/ ${subject.totalHours}h`} />
        <StatTile
          label="Prioridade"
          value={priority?.score ?? 0}
          unit="/100"
          tone={priority?.level === 'critical' ? 'danger' : 'neutral'}
          hint={priority ? PRIORITY_LABEL[priority.level] : undefined}
        />
        <StatTile
          label="Média atual"
          value={subject.currentGrade !== null ? subject.currentGrade.toFixed(1) : '—'}
          tone={subject.currentGrade !== null && subject.currentGrade < 6 ? 'danger' : 'neutral'}
        />
        <StatTile
          label="Próxima prova"
          value={nextExam ? relativeDays(nextExam.date) : '—'}
          hint={nextExam?.title}
          tone={nextExam ? 'marker' : 'neutral'}
        />
      </div>

      <div className="mt-5 border-b border-hair">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'overview', label: 'Visão geral' },
            { id: 'materials', label: 'Materiais', count: materials.length },
            { id: 'assignments', label: 'Trabalhos', count: assignments.length },
            { id: 'exams', label: 'Provas', count: exams.length },
            { id: 'sessions', label: 'Sessões', count: sessions.length },
          ]}
        />
      </div>

      <div className="mt-4">
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Por que essa disciplina está nessa posição</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {priority?.reasons.map((r) => (
                  <p key={r} className="flex items-start gap-2 text-[13.5px] text-ink-2">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: hex }} />
                    {r}
                  </p>
                ))}
                <p className="pt-1 text-[12px] text-ink-3">
                  O cálculo combina proximidade de prova, horas restantes, desempenho e entregas abertas.
                </p>
              </CardBody>
            </Card>

            <Card tabColor={hex}>
              <CardHeader>
                <CardTitle>Aulas</CardTitle>
              </CardHeader>
              <CardBody className="space-y-1.5">
                {subject.classSlots.length ? (
                  subject.classSlots.map((c, i) => (
                    <p key={i} className="text-[13px] text-ink-2">
                      <span className="font-medium text-ink">{WEEKDAY_LONG[c.weekday]}</span>
                      <span className="ml-1 font-mono text-[12px]">
                        {fmtMinutes(c.start)}–{fmtMinutes(c.end)}
                      </span>
                      {c.room && <span className="text-ink-3"> · {c.room}</span>}
                    </p>
                  ))
                ) : (
                  <p className="text-[13px] text-ink-3">Nenhum horário cadastrado.</p>
                )}
                {professor && (
                  <div className="mt-3 border-t border-hair pt-3">
                    <p className="text-[13px] font-medium text-ink">{professor.name}</p>
                    {professor.email && <p className="text-[12px] text-ink-3">{professor.email}</p>}
                    {professor.office && <p className="text-[12px] text-ink-3">{professor.office}</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'materials' && (
          <Table
            columns={materialCols}
            rows={materials}
            rowKey={(m) => m.id}
            caption={`Materiais de ${subject.name}`}
            empty={
              <EmptyState
                color={hex}
                title="Nenhum material ainda"
                description="Suba PDFs, slides e vídeos desta disciplina para gerar resumos, flashcards e a fila de revisão."
                action={
                  <Link to="/materiais">
                    <Button variant="secondary">
                      Ir para a biblioteca <ArrowRight size={14} />
                    </Button>
                  </Link>
                }
              />
            }
          />
        )}

        {tab === 'assignments' && (
          <div className="space-y-2">
            {assignments.length ? (
              assignments.map((a) => (
                <Card key={a.id} tabColor={hex}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-3 py-3 pl-5">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-ink">{a.title}</p>
                      <p className="text-[12px] text-ink-3">
                        Entrega {fmtDay(a.dueDate)} · {relativeDays(a.dueDate)} ·{' '}
                        {a.subtasks.filter((s) => s.done).length}/{a.subtasks.length} subtarefas
                      </p>
                    </div>
                    <Badge tone={a.status === 'done' ? 'success' : a.dueDate < todayISO() ? 'danger' : 'neutral'}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </CardBody>
                </Card>
              ))
            ) : (
              <EmptyState color={hex} title="Sem trabalhos" description="Nada pendente nesta disciplina por enquanto." />
            )}
          </div>
        )}

        {tab === 'exams' && (
          <Table
            columns={examCols}
            rows={exams}
            rowKey={(e) => e.id}
            caption={`Provas de ${subject.name}`}
            empty={<EmptyState color={hex} title="Nenhuma prova cadastrada" description="Cadastre as datas para o sistema priorizar seus estudos." />}
          />
        )}

        {tab === 'sessions' && (
          <Table
            columns={sessionCols}
            rows={[...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40)}
            rowKey={(s) => s.id}
            caption={`Sessões de estudo de ${subject.name}`}
            empty={<EmptyState color={hex} title="Nenhuma sessão registrada" description="As sessões aparecem aqui conforme você estuda." />}
          />
        )}
      </div>
    </>
  );
}
