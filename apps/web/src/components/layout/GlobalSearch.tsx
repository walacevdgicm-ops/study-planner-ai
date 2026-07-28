import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, SubjectDot } from '@spa/ui-kit';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import { fmtDay } from '@/lib/date';

interface Result {
  id: string;
  label: string;
  meta: string;
  to: string;
  hex: string;
  group: string;
}

export function GlobalSearch() {
  const open = useAppStore((s) => s.searchOpen);
  const setOpen = useAppStore((s) => s.setSearchOpen);
  const subjects = useAppStore((s) => s.subjects);
  const assignments = useAppStore((s) => s.assignments);
  const exams = useAppStore((s) => s.exams);
  const materials = useAppStore((s) => s.materials);
  const subjectMap = useSubjectMap();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const hex = (id: string) => subjectMap.get(id)?.hex ?? 'var(--accent)';
    const all: Result[] = [
      ...subjects.map((s) => ({
        id: s.id,
        label: s.name,
        meta: `${s.code} · ${s.totalHours}h`,
        to: `/disciplinas/${s.id}`,
        hex: hex(s.id),
        group: 'Disciplinas',
      })),
      ...assignments.map((a) => ({
        id: a.id,
        label: a.title,
        meta: `Entrega ${fmtDay(a.dueDate)}`,
        to: '/trabalhos',
        hex: hex(a.subjectId),
        group: 'Trabalhos',
      })),
      ...exams.map((e) => ({
        id: e.id,
        label: e.title,
        meta: `Prova ${fmtDay(e.date)}`,
        to: '/provas',
        hex: hex(e.subjectId),
        group: 'Provas',
      })),
      ...materials.map((m) => ({
        id: m.id,
        label: m.title,
        meta: m.tags.join(' · ') || m.kind,
        to: m.kind === 'video' ? '/videos' : m.kind === 'reading' ? '/leituras' : '/materiais',
        hex: hex(m.subjectId),
        group: 'Biblioteca',
      })),
    ];
    return all.filter((r) => `${r.label} ${r.meta}`.toLowerCase().includes(term)).slice(0, 12);
  }, [q, subjects, assignments, exams, materials, subjectMap]);

  const go = (to: string) => {
    setOpen(false);
    setQ('');
    navigate(to);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Buscar" description="Disciplinas, trabalhos, provas e materiais">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].to);
        }}
        placeholder="Digite ao menos 2 letras…"
        aria-label="Termo de busca"
        className="h-11 w-full rounded-lg border border-hair bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
      />

      <div className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto">
        {q.trim().length >= 2 && !results.length && (
          <p className="px-1 py-6 text-center text-[13px] text-ink-2">
            Nada encontrado para <span className="font-medium text-ink">“{q}”</span>.
          </p>
        )}
        {results.map((r) => (
          <button
            key={`${r.group}_${r.id}`}
            onClick={() => go(r.to)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface-2"
          >
            <SubjectDot color={r.hex} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-ink">{r.label}</span>
              <span className="block truncate text-[12px] text-ink-3">{r.meta}</span>
            </span>
            <span className="shrink-0 font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">
              {r.group}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
