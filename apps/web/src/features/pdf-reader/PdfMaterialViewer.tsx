import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button, cn } from '@spa/ui-kit';
import type { PdfHighlight } from '@spa/shared-types';
import { SUBJECT_COLORS } from '@/lib/subject-colors';
import { PdfPageStage } from './PdfPageStage';

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.2;
const ZOOM_STEP = 0.2;
const BASE_WIDTH_INLINE = 640;
const BASE_WIDTH_READER = 780;

export interface PdfMaterialViewerProps {
  fileId: string;
  title: string;
  pageNum: number;
  numPages: number;
  onPageChange: (page: number) => void;
  onNumPagesChange: (numPages: number) => void;
  highlights: PdfHighlight[];
  onHighlightsChange: (next: PdfHighlight[]) => void;
}

export function PdfMaterialViewer({
  fileId,
  title,
  pageNum,
  numPages,
  onPageChange,
  onNumPagesChange,
  highlights,
  onHighlightsChange,
}: PdfMaterialViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [toolActive, setToolActive] = useState(false);
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0].hex);
  const [isReading, setIsReading] = useState(false);
  const [turnDir, setTurnDir] = useState<1 | -1>(1);

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));

  const canPrev = pageNum > 1;
  const canNext = numPages > 0 ? pageNum < numPages : true;

  const goPrev = () => {
    if (!canPrev) return;
    setTurnDir(-1);
    onPageChange(pageNum - 1);
  };
  const goNext = () => {
    if (!canNext) return;
    setTurnDir(1);
    onPageChange(pageNum + 1);
  };

  const pageHighlightCount = highlights.filter((h) => h.page === pageNum).length;
  const clearPageHighlights = () => onHighlightsChange(highlights.filter((h) => h.page !== pageNum));

  useEffect(() => {
    if (!isReading) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsReading(false);
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReading, pageNum, numPages]);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isReading) closeBtnRef.current?.focus();
  }, [isReading]);

  const toolbar = (variant: 'inline' | 'reader') => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-hair bg-surface p-0.5">
        <Button variant="ghost" size="icon" aria-label="Diminuir zoom" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>
          <ZoomOut size={15} />
        </Button>
        <span className="w-11 text-center font-mono text-[12px] tabular-nums text-ink-2">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" aria-label="Aumentar zoom" onClick={zoomIn} disabled={zoom >= ZOOM_MAX}>
          <ZoomIn size={15} />
        </Button>
      </div>

      <Button
        variant={toolActive ? 'marker' : 'secondary'}
        size="sm"
        aria-pressed={toolActive}
        onClick={() => setToolActive((v) => !v)}
      >
        <Highlighter size={15} /> Marca-texto
      </Button>

      {toolActive && (
        <div className="flex items-center gap-1 rounded-lg border border-hair bg-surface px-1.5 py-1">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={`Cor ${c.label}`}
              aria-pressed={color === c.hex}
              onClick={() => setColor(c.hex)}
              className={cn(
                'size-5 rounded-full ring-offset-1 ring-offset-surface transition-shadow',
                color === c.hex ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-hair',
              )}
              style={{ background: c.hex }}
            />
          ))}
          {pageHighlightCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Apagar marcações desta página"
              title="Apagar marcações desta página"
              onClick={clearPageHighlights}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )}

      {variant === 'inline' && (
        <Button variant="secondary" size="sm" onClick={() => setIsReading(true)}>
          <BookOpen size={15} /> Modo leitura
        </Button>
      )}
    </div>
  );

  const pageNav = (size: 'sm' | 'lg') => (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size={size === 'lg' ? 'icon' : 'icon'}
        className={size === 'lg' ? 'size-11' : undefined}
        aria-label="Página anterior"
        disabled={!canPrev}
        onClick={goPrev}
      >
        <ChevronLeft size={size === 'lg' ? 20 : 16} />
      </Button>
      <span className="font-mono text-[13px] tabular-nums text-ink-2">
        {pageNum} / {numPages || '—'}
      </span>
      <Button
        variant="secondary"
        size={size === 'lg' ? 'icon' : 'icon'}
        className={size === 'lg' ? 'size-11' : undefined}
        aria-label="Próxima página"
        disabled={!canNext}
        onClick={goNext}
      >
        <ChevronRight size={size === 'lg' ? 20 : 16} />
      </Button>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center gap-3 bg-surface-2/60 p-4">
      {toolbar('inline')}

      <PdfPageStage
        fileId={fileId}
        pageNum={pageNum}
        width={BASE_WIDTH_INLINE * zoom}
        highlights={highlights}
        toolActive={toolActive}
        color={color}
        onHighlightsChange={onHighlightsChange}
        onLoadSuccess={onNumPagesChange}
        className="max-w-full overflow-auto"
      />

      {pageNav('sm')}

      {isReading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={`Modo leitura — ${title}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">{title}</p>
                <p className="text-[12px] text-ink-3">Modo leitura</p>
              </div>
              <div className="flex items-center gap-2">
                {toolbar('reader')}
                <Button ref={closeBtnRef} variant="ghost" size="icon" aria-label="Fechar modo leitura" onClick={() => setIsReading(false)}>
                  <X size={18} />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center gap-4 overflow-auto p-4 sm:p-8">
              <Button
                variant="ghost"
                size="icon"
                className="hidden shrink-0 sm:flex"
                aria-label="Página anterior"
                disabled={!canPrev}
                onClick={goPrev}
              >
                <ChevronLeft size={22} />
              </Button>

              <div key={pageNum} className={cn('flex justify-center', turnDir === 1 ? 'pdf-turn-next' : 'pdf-turn-prev')}>
                <PdfPageStage
                  fileId={fileId}
                  pageNum={pageNum}
                  width={BASE_WIDTH_READER * zoom}
                  highlights={highlights}
                  toolActive={toolActive}
                  color={color}
                  onHighlightsChange={onHighlightsChange}
                  onLoadSuccess={onNumPagesChange}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="hidden shrink-0 sm:flex"
                aria-label="Próxima página"
                disabled={!canNext}
                onClick={goNext}
              >
                <ChevronRight size={22} />
              </Button>
            </div>

            <div className="flex justify-center border-t border-hair px-4 py-3 sm:hidden">{pageNav('lg')}</div>
          </div>,
          document.body,
        )}
    </div>
  );
}
