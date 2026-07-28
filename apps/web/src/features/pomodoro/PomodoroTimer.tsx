import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button, Modal, Ring, useToast } from '@spa/ui-kit';
import type { StudySession } from '@spa/shared-types';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';

type Phase = 'focus' | 'break';

export interface PomodoroTimerProps {
  session: StudySession | null;
  onClose: () => void;
}

export function PomodoroTimer({ session, onClose }: PomodoroTimerProps) {
  const prefs = useAppStore((s) => s.user.preferences);
  const completeSession = useAppStore((s) => s.completeSession);
  const subjectMap = useSubjectMap();
  const { push } = useToast();

  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(prefs.sessionMinutes * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const tick = useRef<number | null>(null);

  const total = (phase === 'focus' ? prefs.sessionMinutes : prefs.breakMinutes) * 60;
  const subject = session ? subjectMap.get(session.subjectId) : undefined;

  useEffect(() => {
    if (!session) return;
    setPhase('focus');
    setRemaining(prefs.sessionMinutes * 60);
    setRunning(true);
    setCycles(0);
  }, [session, prefs.sessionMinutes]);

  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running]);

  useEffect(() => {
    if (remaining > 0) return;
    setRunning(false);
    if (phase === 'focus') {
      setCycles((c) => c + 1);
      setPhase('break');
      setRemaining(prefs.breakMinutes * 60);
      push({ title: 'Pomodoro concluído', description: 'Levanta, bebe água, volta em alguns minutos.', tone: 'success' });
    } else {
      setPhase('focus');
      setRemaining(prefs.sessionMinutes * 60);
    }
  }, [remaining, phase, prefs.breakMinutes, prefs.sessionMinutes, push]);

  const mm = String(Math.max(0, Math.floor(remaining / 60))).padStart(2, '0');
  const ss = String(Math.max(0, remaining % 60)).padStart(2, '0');

  const finish = () => {
    if (session) {
      completeSession(session.id, cycles > 0 ? cycles * prefs.sessionMinutes : session.minutes);
      push({ title: `+20 XP`, description: 'Sessão registrada no seu histórico.', tone: 'xp' });
    }
    onClose();
  };

  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title={phase === 'focus' ? 'Foco' : 'Pausa'}
      description={subject ? `${subject.name} · bloco de ${prefs.sessionMinutes} min` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="marker" onClick={finish}>
            Concluir sessão
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <Ring
          value={((total - remaining) / total) * 100}
          size={168}
          stroke={12}
          color={phase === 'focus' ? (subject?.hex ?? 'var(--accent)') : 'var(--color-quadro)'}
          label={`${mm}:${ss} restantes`}
        >
          <div>
            <p className="font-mono text-[34px] leading-none font-bold tabular-nums text-ink">
              {mm}:{ss}
            </p>
            <p className="mt-1 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">
              {phase === 'focus' ? 'foco' : 'pausa'} · {cycles} ciclo(s)
            </p>
          </div>
        </Ring>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pausar' : 'Retomar'}>
            {running ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reiniciar"
            onClick={() => {
              setRemaining(total);
              setRunning(false);
            }}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
