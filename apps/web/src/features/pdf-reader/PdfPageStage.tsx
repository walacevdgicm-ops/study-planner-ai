import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { cn } from '@spa/ui-kit';
import type { PdfHighlight } from '@spa/shared-types';
import { materialFileUrl } from '@/lib/api/materials';
import { uid } from '@/lib/id';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Arrasto mínimo (em % da página) para virar marcação — evita cliques acidentais. */
const MIN_DRAG_W = 0.012;
const MIN_DRAG_H = 0.004;
/** Altura mínima de uma marcação, para um clique-rápido ainda cobrir uma linha de texto. */
const MIN_MARK_H = 0.015;

interface DraftRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PdfPageStageProps {
  fileId: string;
  pageNum: number;
  width: number;
  highlights: PdfHighlight[];
  toolActive: boolean;
  color: string;
  onHighlightsChange: (next: PdfHighlight[]) => void;
  onLoadSuccess?: (numPages: number) => void;
  className?: string;
}

/**
 * Renderiza uma página do PDF e captura o gesto de "passar o marca-texto"
 * (arrastar sobre a página) quando a ferramenta está ativa. Compartilhado
 * entre a leitura inline e o modo leitura em tela cheia — para os dois
 * ficarem sempre em sincronia, esse é o único lugar que desenha marcações.
 */
export function PdfPageStage({
  fileId,
  pageNum,
  width,
  highlights,
  toolActive,
  color,
  onHighlightsChange,
  onLoadSuccess,
  className,
}: PdfPageStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<DraftRect | null>(null);
  // Espelha `draft` fora do estado: no fim do arrasto (pointerup) não podemos
  // depender do closure de `draft`, porque pointerdown/move/up costumam cair
  // no mesmo batch do React e o handler de pointerup ainda veria o valor
  // anterior ao render.
  const draftRef = useRef<DraftRect | null>(null);

  const pagePoint = (e: React.PointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!toolActive || e.button === 2) return;
    try {
      stageRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // ambiente sem ponteiro real (ex.: eventos sintéticos) — segue sem capturar
    }
    const p = pagePoint(e);
    dragStart.current = p;
    const rect = { x: p.x, y: p.y, w: 0, h: 0 };
    draftRef.current = rect;
    setDraft(rect);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!toolActive || !dragStart.current) return;
    const p = pagePoint(e);
    const rect = {
      x: Math.min(dragStart.current.x, p.x),
      y: Math.min(dragStart.current.y, p.y),
      w: Math.abs(p.x - dragStart.current.x),
      h: Math.abs(p.y - dragStart.current.y),
    };
    draftRef.current = rect;
    setDraft(rect);
  };

  const commitDraft = () => {
    const rect = draftRef.current;
    if (dragStart.current && rect && rect.w >= MIN_DRAG_W && rect.h >= MIN_DRAG_H) {
      const mark: PdfHighlight = {
        id: uid('hl'),
        page: pageNum,
        xPct: rect.x,
        yPct: rect.y,
        widthPct: rect.w,
        heightPct: Math.max(rect.h, MIN_MARK_H),
        color,
        createdAt: new Date().toISOString(),
      };
      onHighlightsChange([...highlights, mark]);
    }
    dragStart.current = null;
    draftRef.current = null;
    setDraft(null);
  };

  const removeHighlight = (id: string) => {
    onHighlightsChange(highlights.filter((h) => h.id !== id));
  };

  const pageHighlights = highlights.filter((h) => h.page === pageNum);

  return (
    <div
      ref={stageRef}
      className={cn('relative inline-block select-none', toolActive && 'cursor-crosshair', className)}
      style={{ touchAction: toolActive ? 'none' : undefined }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commitDraft}
      onPointerLeave={commitDraft}
    >
      <Document
        file={materialFileUrl(fileId)}
        onLoadSuccess={({ numPages: n }) => onLoadSuccess?.(n)}
        loading={<p className="py-16 text-[13px] text-ink-2">Carregando PDF…</p>}
        error={<p className="py-16 text-[13px] text-caneta">Não consegui abrir este PDF.</p>}
        className="max-w-full"
      >
        <Page
          pageNumber={pageNum}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="pointer-events-none shadow-paper"
        />
      </Document>

      {pageHighlights.map((h) => (
        <div
          key={h.id}
          role={toolActive ? 'button' : undefined}
          tabIndex={toolActive ? 0 : undefined}
          aria-label={toolActive ? 'Marcação do marca-texto — clique para apagar' : undefined}
          onPointerDown={(e) => toolActive && e.stopPropagation()}
          onClick={(e) => {
            if (!toolActive) return;
            e.stopPropagation();
            removeHighlight(h.id);
          }}
          onKeyDown={(e) => {
            if (toolActive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              removeHighlight(h.id);
            }
          }}
          className={cn(
            'pdf-mark absolute rounded-[3px]',
            toolActive ? 'cursor-pointer hover:brightness-90' : 'pointer-events-none',
          )}
          style={
            {
              left: `${h.xPct * 100}%`,
              top: `${h.yPct * 100}%`,
              width: `${h.widthPct * 100}%`,
              height: `${h.heightPct * 100}%`,
              '--subject': h.color,
            } as React.CSSProperties
          }
        />
      ))}

      {draft && (
        <div
          aria-hidden
          className="pdf-mark pdf-mark-draft pointer-events-none absolute rounded-[3px]"
          style={
            {
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.w * 100}%`,
              height: `${Math.max(draft.h, MIN_MARK_H) * 100}%`,
              '--subject': color,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
