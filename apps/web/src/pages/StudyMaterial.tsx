import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, Download, FileQuestion, Play } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  useToast,
} from '@spa/ui-kit';
import type { StudySession } from '@spa/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { PomodoroTimer } from '@/features/pomodoro/PomodoroTimer';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import { materialFileUrl, fetchMaterialText } from '@/lib/api/materials';
import { fmtMinutes, todayISO } from '@/lib/date';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function StudyMaterial() {
  const { id = '' } = useParams();
  const material = useAppStore((s) => s.materials.find((m) => m.id === id));
  const subjectMap = useSubjectMap();
  const sessions = useAppStore((s) => s.sessions);
  const prefs = useAppStore((s) => s.user.preferences);
  const addSession = useAppStore((s) => s.addSession);
  const updateMaterial = useAppStore((s) => s.updateMaterial);
  const markMaterialStudied = useAppStore((s) => s.markMaterialStudied);
  const { push } = useToast();

  const [pomodoroSession, setPomodoroSession] = useState<StudySession | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);

  const subject = material ? subjectMap.get(material.subjectId) : undefined;
  const hex = subject?.hex;

  const todaySession = useMemo(() => {
    if (!material) return null;
    const today = todayISO();
    const ofDay = sessions.filter((s) => s.date === today && s.status === 'planned');
    return (
      ofDay.find((s) => s.materialId === material.id) ??
      ofDay.find((s) => s.subjectId === material.subjectId) ??
      null
    );
  }, [sessions, material]);

  useEffect(() => {
    if (material?.file?.hasText) {
      fetchMaterialText(material.file.id).then(setExtractedText);
    } else {
      setExtractedText(null);
    }
  }, [material?.file?.id, material?.file?.hasText]);

  useEffect(() => {
    if (material) setPageNum(Math.max(1, material.position ?? 1));
  }, [material?.id]);

  if (!material) {
    return (
      <EmptyState
        icon={<FileQuestion size={20} />}
        title="Material não encontrado"
        description="Ele pode ter sido removido. Volte para a biblioteca e escolha outro."
        action={
          <Link to="/materiais">
            <Button variant="secondary">Voltar para materiais</Button>
          </Link>
        }
      />
    );
  }

  const file = material.file;
  const isPdf = file?.mimeType === 'application/pdf';
  const isVideo = file?.mimeType.startsWith('video/');

  const savePdfPosition = (page: number) => {
    const pct = numPages ? Math.min(100, Math.round((page / numPages) * 100)) : material.progress;
    updateMaterial(material.id, { position: page, progress: pct });
  };

  const saveVideoPosition = (minutes: number) => {
    const pct = material.size ? Math.min(100, Math.round((minutes / material.size) * 100)) : material.progress;
    updateMaterial(material.id, { position: minutes, progress: pct });
  };

  const startNewBlock = () => {
    const now = new Date();
    const start = now.getHours() * 60 + now.getMinutes();
    const sessionId = addSession({
      subjectId: material.subjectId,
      materialId: material.id,
      date: todayISO(),
      start,
      minutes: prefs.sessionMinutes,
      status: 'planned',
      origin: 'manual',
    });
    push({
      title: 'Bloco iniciado',
      description: `${prefs.sessionMinutes} min de ${subject?.name ?? 'estudo'}, ligado a este material.`,
      tone: 'success',
    });
    setPomodoroSession({
      id: sessionId,
      subjectId: material.subjectId,
      materialId: material.id,
      date: todayISO(),
      start,
      minutes: prefs.sessionMinutes,
      status: 'planned',
      origin: 'manual',
    });
  };

  return (
    <>
      <PageHeader
        title={material.title}
        highlight={material.title}
        color={hex}
        description={subject ? `${subject.name} · ${material.kind === 'pdf' ? 'PDF' : material.kind === 'video' ? 'Vídeo' : 'Leitura'}` : undefined}
        actions={
          <Link to="/materiais">
            <Button variant="ghost">
              <ChevronLeft size={15} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            {!file ? (
              <EmptyState
                className="border-0"
                title="Este material não tem arquivo anexado"
                description="Ele foi cadastrado só com metadados (ex: os materiais de demonstração). Cadastre um novo material com upload para poder estudá-lo aqui dentro."
                action={
                  <Link to="/materiais">
                    <Button variant="secondary">Ir para a biblioteca</Button>
                  </Link>
                }
              />
            ) : isPdf ? (
              <div className="flex flex-col items-center bg-surface-2/60 p-4">
                <Document
                  file={materialFileUrl(file.id)}
                  onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                  loading={<p className="py-16 text-[13px] text-ink-2">Carregando PDF…</p>}
                  error={<p className="py-16 text-[13px] text-caneta">Não consegui abrir este PDF.</p>}
                  className="max-w-full"
                >
                  <Page
                    pageNumber={pageNum}
                    width={640}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-paper"
                  />
                </Document>

                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Página anterior"
                    disabled={pageNum <= 1}
                    onClick={() => {
                      const p = pageNum - 1;
                      setPageNum(p);
                      savePdfPosition(p);
                    }}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="font-mono text-[13px] tabular-nums text-ink-2">
                    {pageNum} / {numPages || material.size || '—'}
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Próxima página"
                    disabled={numPages > 0 && pageNum >= numPages}
                    onClick={() => {
                      const p = pageNum + 1;
                      setPageNum(p);
                      savePdfPosition(p);
                    }}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>

                {extractedText && (
                  <div className="mt-4 w-full max-w-2xl">
                    <button
                      onClick={() => setShowText((v) => !v)}
                      className="text-[12.5px] font-medium text-accent underline underline-offset-2"
                    >
                      {showText ? 'Ocultar' : 'Ver'} texto extraído do PDF
                    </button>
                    {showText && (
                      <pre className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-hair bg-surface p-3 text-[12px] whitespace-pre-wrap text-ink-2">
                        {extractedText}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : isVideo ? (
              <video
                controls
                className="max-h-[70vh] w-full bg-black"
                src={materialFileUrl(file.id)}
                onPause={(e) => saveVideoPosition(Math.round(e.currentTarget.currentTime / 60))}
                onEnded={(e) => saveVideoPosition(Math.round(e.currentTarget.currentTime / 60))}
              />
            ) : (
              <EmptyState
                className="border-0"
                title="Pré-visualização não disponível para este formato"
                description={`"${file.name}" foi guardado, mas este tipo de arquivo ainda não tem leitor dentro da plataforma.`}
                action={
                  <a href={materialFileUrl(file.id)} download={file.name}>
                    <Button variant="secondary">
                      <Download size={15} /> Baixar arquivo
                    </Button>
                  </a>
                }
              />
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card tabColor={hex} tabFull>
            <CardHeader>
              <CardTitle>Bloco de estudo</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {todaySession ? (
                <>
                  <p className="text-[13px] text-ink-2">
                    Você tem um bloco hoje às{' '}
                    <span className="font-mono font-semibold text-ink">{fmtMinutes(todaySession.start)}</span> (
                    {todaySession.minutes} min).
                  </p>
                  <Button className="w-full" onClick={() => setPomodoroSession(todaySession)}>
                    <Play size={15} /> Iniciar Pomodoro
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-ink-2">
                    Nenhum bloco planejado para hoje nesta disciplina.
                  </p>
                  <Button className="w-full" variant="secondary" onClick={startNewBlock}>
                    <Play size={15} /> Iniciar um bloco agora ({prefs.sessionMinutes} min)
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progresso</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-1 flex items-baseline justify-between text-[11.5px] text-ink-3">
                <span>
                  {material.position ?? 0} de {material.size ?? '—'} {material.kind === 'video' ? 'min' : 'pág.'}
                </span>
                <span className="font-mono tabular-nums">{material.progress}%</span>
              </div>
              <Progress value={material.progress} color={hex} label={`Progresso de ${material.title}`} />

              {material.studiedAt ? (
                <Badge tone="success" className="mt-3">
                  Estudado
                </Badge>
              ) : (
                <Button
                  className="mt-3 w-full"
                  variant="marker"
                  onClick={() => {
                    const msg = markMaterialStudied(material.id);
                    push({ title: 'Material concluído', description: msg, tone: 'success' });
                  }}
                >
                  Marcar como estudado
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <PomodoroTimer session={pomodoroSession} onClose={() => setPomodoroSession(null)} />
    </>
  );
}
