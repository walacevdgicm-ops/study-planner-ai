import { useState } from 'react';
import { BookMarked, Check, FileText, Plus, Sparkles, Star, Video } from 'lucide-react';
import type { Material, MaterialKind } from '@spa/shared-types';
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
  SkeletonLines,
  cn,
  useToast,
} from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { SubjectChip } from '@/components/SubjectChip';
import { AiAssistantModal } from '@/features/ai/AiAssistantModal';
import { useAppStore } from '@/store/useAppStore';
import { useActiveSubjects, useSubjectMap } from '@/store/selectors';
import { useSimulatedLoad } from '@/lib/hooks';
import { fmtDay } from '@/lib/date';

const COPY: Record<
  MaterialKind,
  { title: string; highlight: string; description: string; unit: string; empty: string; icon: typeof FileText }
> = {
  pdf: {
    title: 'PDFs e materiais',
    highlight: 'PDFs',
    description:
      'Slides, apostilas e listas por disciplina. Marque como estudado para o material entrar na fila de revisão espaçada.',
    unit: 'páginas',
    empty: 'Suba os slides e apostilas de cada disciplina para organizar o que precisa ser lido.',
    icon: FileText,
  },
  video: {
    title: 'Vídeo-aulas',
    highlight: 'Vídeo-aulas',
    description: 'Aulas gravadas com progresso de visualização — retome de onde parou.',
    unit: 'minutos',
    empty: 'Cadastre as aulas gravadas da disciplina para acompanhar quanto já assistiu.',
    icon: Video,
  },
  reading: {
    title: 'Leituras',
    highlight: 'Leituras',
    description: 'Livros e artigos com controle de páginas lidas e tempo estimado restante.',
    unit: 'páginas',
    empty: 'Adicione os livros e artigos da bibliografia para controlar o ritmo de leitura.',
    icon: BookMarked,
  },
};

export default function Library({ kind }: { kind: MaterialKind }) {
  const loading = useSimulatedLoad(450);
  const materials = useAppStore((s) => s.materials);
  const addMaterial = useAppStore((s) => s.addMaterial);
  const toggleFavorite = useAppStore((s) => s.toggleMaterialFavorite);
  const markStudied = useAppStore((s) => s.markMaterialStudied);
  const subjects = useActiveSubjects();
  const subjectMap = useSubjectMap();
  const { push } = useToast();

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [aiTarget, setAiTarget] = useState<Material | null>(null);
  const [creating, setCreating] = useState(false);

  const copy = COPY[kind];
  const Icon = copy.icon;

  const visible = materials
    .filter((m) => m.kind === kind)
    .filter((m) => (subjectFilter === 'all' ? true : m.subjectId === subjectFilter))
    .filter((m) =>
      `${m.title} ${m.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
    );

  return (
    <>
      <PageHeader
        title={copy.title}
        highlight={copy.highlight}
        description={copy.description}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Adicionar
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou tag…"
          aria-label="Buscar material"
          className="max-w-xs"
        />
        <Select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          aria-label="Filtrar por disciplina"
          className="max-w-[14rem]"
        >
          <option value="all">Todas as disciplinas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody>
                <SkeletonLines rows={4} />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Icon size={20} />}
          title={query || subjectFilter !== 'all' ? 'Nada com esse filtro' : 'Biblioteca vazia'}
          description={query || subjectFilter !== 'all' ? 'Ajuste a busca ou volte para todas as disciplinas.' : copy.empty}
          action={
            !query && (
              <Button onClick={() => setCreating(true)}>
                <Plus size={16} /> Adicionar material
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => {
            const hex = subjectMap.get(m.subjectId)?.hex;
            const studied = !!m.studiedAt;
            return (
              <Card key={m.id} tabColor={hex} className="flex flex-col">
                <CardBody className="flex flex-1 flex-col p-4 pl-5">
                  <div className="flex items-start justify-between gap-2">
                    <SubjectChip subjectId={m.subjectId} />
                    <button
                      onClick={() => toggleFavorite(m.id)}
                      aria-label={m.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                      aria-pressed={m.favorite}
                      className={cn('rounded p-1', m.favorite ? 'text-marca' : 'text-ink-3 hover:text-ink')}
                    >
                      <Star size={15} fill={m.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h3 className="mt-1.5 text-[14px] leading-5 font-semibold text-ink">{m.title}</h3>
                  {m.author && <p className="text-[12px] text-ink-3">{m.author}</p>}

                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.tags.map((t) => (
                      <Badge key={t} tone="subject" color={hex}>
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-[11.5px] text-ink-3">
                      <span>
                        {m.position ?? 0} de {m.size ?? '—'} {copy.unit}
                      </span>
                      <span className="font-mono tabular-nums">{m.progress}%</span>
                    </div>
                    <Progress value={m.progress} color={hex} size="sm" label={`Progresso de ${m.title}`} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-hair pt-3">
                    <Button variant="secondary" size="sm" onClick={() => setAiTarget(m)}>
                      <Sparkles size={14} /> Resumo · flashcards · quiz
                    </Button>
                    {studied ? (
                      <Badge tone="success">
                        <Check size={11} /> estudado {fmtDay(m.studiedAt!.slice(0, 10))}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const msg = markStudied(m.id);
                          push({ title: 'Material concluído', description: msg, tone: 'success' });
                        }}
                      >
                        Marcar como estudado
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <AiAssistantModal material={aiTarget} onClose={() => setAiTarget(null)} />

      <NewMaterialModal
        open={creating}
        kind={kind}
        unit={copy.unit}
        onClose={() => setCreating(false)}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        onSave={(data) => {
          addMaterial({ ...data, kind });
          setCreating(false);
          push({ title: 'Material adicionado', description: data.title, tone: 'success' });
        }}
      />
    </>
  );
}

function NewMaterialModal({
  open,
  kind,
  unit,
  onClose,
  onSave,
  subjects,
}: {
  open: boolean;
  kind: MaterialKind;
  unit: string;
  onClose: () => void;
  onSave: (data: { subjectId: string; title: string; tags: string[]; size: number; position: number }) => void;
  subjects: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [tags, setTags] = useState('');
  const [size, setSize] = useState(30);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={kind === 'video' ? 'Nova vídeo-aula' : kind === 'reading' ? 'Nova leitura' : 'Novo material'}
      description="Nesta etapa o arquivo é apenas referenciado — o upload real entra com o back-end."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!title.trim()) return;
              onSave({
                subjectId,
                title: title.trim(),
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                size,
                position: 0,
              });
              setTitle('');
              setTags('');
            }}
          >
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Título" htmlFor="mat-title">
          <Input id="mat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Slides da aula 8" />
        </Field>
        <Field label="Disciplina" htmlFor="mat-sub">
          <Select id="mat-sub" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Total de ${unit}`} htmlFor="mat-size">
            <Input id="mat-size" type="number" min={1} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </Field>
          <Field label="Tags" hint="Separadas por vírgula" htmlFor="mat-tags">
            <Input id="mat-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Integrais, Exercícios" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
