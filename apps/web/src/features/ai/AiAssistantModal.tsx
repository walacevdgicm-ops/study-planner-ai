import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Material } from '@spa/shared-types';
import {
  Badge,
  Button,
  ErrorState,
  Modal,
  SkeletonLines,
  Tabs,
  useToast,
} from '@spa/ui-kit';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import { AI_DISCLAIMER, generateFlashcards, generateQuiz, generateSummary } from '@/features/engine/ai-assistant';

type Mode = 'summary' | 'flashcards' | 'quiz';

export function AiAssistantModal({ material, onClose }: { material: Material | null; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const updateMaterial = useAppStore((s) => s.updateMaterial);
  const queueFlashcards = useAppStore((s) => s.queueFlashcards);
  const subjectMap = useSubjectMap();
  const { push } = useToast();

  const subject = material ? subjectMap.get(material.subjectId) : undefined;
  const live = useAppStore((s) => s.materials.find((m) => m.id === material?.id)) ?? material;

  useEffect(() => {
    setMode('summary');
    setError(null);
    setAnswers({});
  }, [material?.id]);

  const run = async (target: Mode) => {
    if (!live || !subject) return;
    setLoading(true);
    setError(null);
    try {
      if (target === 'summary') {
        const summary = await generateSummary(live, subject);
        updateMaterial(live.id, { aiSummary: summary });
      } else if (target === 'flashcards') {
        const cards = await generateFlashcards(live, subject);
        updateMaterial(live.id, { aiFlashcards: cards });
      } else {
        const quiz = await generateQuiz(live, subject);
        updateMaterial(live.id, { aiQuiz: quiz });
      }
    } catch {
      setError('A geração falhou. Isso costuma ser instabilidade momentânea — tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const hasContent =
    (mode === 'summary' && live?.aiSummary) ||
    (mode === 'flashcards' && live?.aiFlashcards?.length) ||
    (mode === 'quiz' && live?.aiQuiz?.length);

  return (
    <Modal
      open={!!material}
      onClose={onClose}
      size="lg"
      title="Assistente sobre o seu material"
      description={live?.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {mode === 'flashcards' && !!live?.aiFlashcards?.length && (
            <Button
              variant="marker"
              onClick={() => {
                const n = queueFlashcards(live.id);
                push({
                  title: n ? `${n} flashcards na fila` : 'Flashcards já enviados',
                  description: n ? 'Entram na revisão espaçada a partir de amanhã.' : undefined,
                  tone: n ? 'success' : 'neutral',
                });
              }}
            >
              Enviar para revisão espaçada
            </Button>
          )}
          <Button onClick={() => run(mode)} loading={loading}>
            <Sparkles size={15} /> {hasContent ? 'Gerar de novo' : 'Gerar'}
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs
          look="pill"
          value={mode}
          onChange={(m) => setMode(m as Mode)}
          items={[
            { id: 'summary', label: 'Resumo' },
            { id: 'flashcards', label: 'Flashcards' },
            { id: 'quiz', label: 'Quiz / Simulado' },
          ]}
        />
        <Badge tone="warning">stub — sem chamada de API</Badge>
        {live?.file?.hasText && (
          <Badge tone="accent">gerado a partir do texto do PDF</Badge>
        )}
      </div>

      <p className="mb-4 rounded-lg border border-hair bg-surface-2/60 px-3 py-2 text-[12px] text-ink-2">
        {AI_DISCLAIMER}
      </p>

      {error ? (
        <ErrorState description={error} onRetry={() => run(mode)} />
      ) : loading ? (
        <div className="space-y-3">
          <SkeletonLines rows={6} />
          <p className="text-center text-[12.5px] text-ink-3">Lendo o material e organizando os pontos…</p>
        </div>
      ) : !hasContent ? (
        <div className="rounded-card border border-dashed border-hair px-5 py-10 text-center">
          <span aria-hidden className="mx-auto mb-3 block h-2.5 w-14 -rotate-2 rounded-sm bg-marca" />
          <p className="font-display text-[15px] font-semibold text-ink">
            {mode === 'summary'
              ? 'Resumo ainda não gerado'
              : mode === 'flashcards'
                ? 'Nenhum flashcard gerado'
                : 'Nenhum quiz gerado'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-2">
            O conteúdo sai do material que você subiu para {subject?.name ?? 'esta disciplina'} — nunca de texto
            genérico.
          </p>
        </div>
      ) : mode === 'summary' && live?.aiSummary ? (
        <div className="space-y-4">
          <h3 className="font-display text-[16px] font-bold text-ink">{live.aiSummary.headline}</h3>
          <ul className="space-y-2">
            {live.aiSummary.keyPoints.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-6 text-ink-2">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full"
                  style={{ background: subject?.hex ?? 'var(--accent)' }}
                />
                {p}
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-1.5 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">Glossário</p>
            <dl className="space-y-1.5">
              {live.aiSummary.glossary.map((g) => (
                <div key={g.term} className="text-[13px]">
                  <dt className="inline font-semibold text-ink">{g.term}: </dt>
                  <dd className="inline text-ink-2">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : mode === 'flashcards' && live?.aiFlashcards?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {live.aiFlashcards.map((f) => (
            <div key={f.id} className="rounded-card border border-hair bg-surface p-3">
              <p className="text-[13.5px] font-semibold text-ink">{f.front}</p>
              <p className="mt-1.5 border-t border-dashed border-hair pt-1.5 text-[12.5px] text-ink-2">{f.back}</p>
              {f.queued && (
                <span className="mt-2 inline-block font-mono text-[10.5px] text-quadro">na fila de revisão</span>
              )}
            </div>
          ))}
        </div>
      ) : mode === 'quiz' && live?.aiQuiz?.length ? (
        <div className="space-y-4">
          {(() => {
            const total = live.aiQuiz.length;
            const answered = live.aiQuiz.filter((q) => answers[q.id] !== undefined).length;
            if (answered < total) {
              return (
                <p className="text-[12.5px] text-ink-3">
                  {answered} de {total} respondidas
                </p>
              );
            }
            const correct = live.aiQuiz.filter((q) => answers[q.id] === q.correctIndex).length;
            const pct = Math.round((correct / total) * 100);
            return (
              <div className="flex items-center justify-between rounded-lg border border-hair bg-surface-2/60 px-3 py-2.5">
                <p className="text-[13.5px] font-semibold text-ink">
                  Resultado do simulado: <span className="font-mono tabular-nums">{correct}</span>/{total} (
                  <span className="font-mono tabular-nums">{pct}%</span>)
                </p>
                <Button variant="ghost" size="sm" onClick={() => setAnswers({})}>
                  Refazer
                </Button>
              </div>
            );
          })()}
          <ol className="space-y-4">
            {live.aiQuiz.map((q, qi) => (
              <li key={q.id}>
                <p className="text-[13.5px] font-medium text-ink">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const chosen = answers[q.id];
                    const isChosen = chosen === oi;
                    const revealed = chosen !== undefined;
                    const correct = oi === q.correctIndex;
                    return (
                      <button
                        key={oi}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={[
                          'block w-full rounded-lg border px-3 py-2 text-left text-[13px] transition-colors',
                          revealed && correct
                            ? 'border-quadro bg-quadro/10 text-ink'
                            : revealed && isChosen
                              ? 'border-caneta bg-caneta/10 text-ink'
                              : 'border-hair text-ink-2 hover:bg-surface-2',
                        ].join(' ')}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answers[q.id] !== undefined && (
                  <p className="mt-1.5 text-[12.5px] text-ink-3">{q.rationale}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Modal>
  );
}
