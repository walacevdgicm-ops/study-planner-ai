import { Check, Play } from 'lucide-react';
import type { StudySession } from '@spa/shared-types';
import { Badge, cn } from '@spa/ui-kit';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import { fmtDuration, fmtMinutes } from '@/lib/date';

export function SessionRow({
  session,
  onStart,
  showDate,
}: {
  session: StudySession;
  onStart?: (s: StudySession) => void;
  showDate?: boolean;
}) {
  const subject = useSubjectMap().get(session.subjectId);
  const completeSession = useAppStore((s) => s.completeSession);
  const done = session.status === 'done';
  const missed = session.status === 'missed';

  return (
    <li
      style={{ '--subject': subject?.hex } as React.CSSProperties}
      className={cn(
        'tab-card flex items-center gap-3 rounded-lg border border-hair bg-surface py-2.5 pr-2.5 pl-4',
        done && 'opacity-70',
        missed && 'border-caneta/35',
      )}
    >
      <span className="w-11 shrink-0 font-mono text-[12.5px] tabular-nums text-ink-2">
        {fmtMinutes(session.start)}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[13.5px] font-medium text-ink', done && 'line-through')}>
          {subject?.name ?? 'Disciplina'}
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
          {showDate && <span className="font-mono">{session.date.slice(8)}/{session.date.slice(5, 7)}</span>}
          <span>{fmtDuration(session.actualMinutes ?? session.minutes)}</span>
          {session.origin === 'redistributed' && <Badge tone="warning">realocada</Badge>}
          {missed && <Badge tone="danger">não cumprida</Badge>}
        </span>
      </span>

      {!done && !missed && (
        <span className="flex shrink-0 items-center gap-1">
          {onStart && (
            <button
              onClick={() => onStart(session)}
              aria-label="Iniciar Pomodoro"
              className="rounded-md p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <Play size={15} />
            </button>
          )}
          <button
            onClick={() => completeSession(session.id)}
            aria-label="Marcar como concluída"
            className="rounded-md p-1.5 text-ink-2 hover:bg-quadro/15 hover:text-quadro"
          >
            <Check size={16} />
          </button>
        </span>
      )}

      {done && (
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-quadro/15 text-quadro">
          <Check size={14} />
        </span>
      )}
    </li>
  );
}
