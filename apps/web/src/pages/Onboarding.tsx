import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { SubjectColor, Weekday } from '@spa/shared-types';
import { Button, Field, Highlight, Input, Progress, Select, cn, useToast } from '@spa/ui-kit';
import { useAppStore } from '@/store/useAppStore';
import { SUBJECT_COLORS } from '@/lib/subject-colors';
import { WEEKDAY_LABEL } from '@/lib/date';

interface DraftSubject {
  name: string;
  code: string;
  color: SubjectColor;
  totalHours: number;
  weight: number;
}

const STEPS = ['Quem é você', 'Suas disciplinas', 'Seu tempo', 'Tudo pronto'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { push } = useToast();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const addSubject = useAppStore((s) => s.addSubject);
  const regenerateWeek = useAppStore((s) => s.regenerateWeek);
  const user = useAppStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name);
  const [course, setCourse] = useState(user.course);
  const [university, setUniversity] = useState(user.university);
  const [drafts, setDrafts] = useState<DraftSubject[]>([]);
  const [draft, setDraft] = useState<DraftSubject>({ name: '', code: '', color: 0, totalHours: 60, weight: 3 });
  const [days, setDays] = useState<Weekday[]>([1, 2, 3, 4, 5]);
  const [maxDailyHours, setMaxDailyHours] = useState(user.preferences.maxDailyHours);
  const [sessionMinutes, setSessionMinutes] = useState(user.preferences.sessionMinutes);

  const finish = () => {
    drafts.forEach((d, i) =>
      addSubject({
        name: d.name,
        code: d.code || d.name.slice(0, 3).toUpperCase(),
        color: ((d.color + i) % 6) as SubjectColor,
        professorId: null,
        totalHours: d.totalHours,
        credits: Math.max(1, Math.round(d.totalHours / 15)),
        weight: d.weight as 1 | 2 | 3 | 4 | 5,
        currentGrade: null,
        classSlots: [],
      }),
    );

    completeOnboarding({
      name,
      course,
      university,
      avatarInitials: name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(''),
      preferences: {
        maxDailyHours,
        sessionMinutes,
        availability: days.map((weekday) => ({ weekday, start: 1140, end: 1140 + maxDailyHours * 60 })),
      },
    });

    const created = regenerateWeek();
    push({
      title: 'Tudo pronto!',
      description: `${created} blocos de estudo já distribuídos na sua semana.`,
      tone: 'success',
    });
    navigate('/');
  };

  return (
    <div className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-lg bg-grafite font-display text-[15px] font-extrabold text-papel"
            >
              S
            </span>
            <span className="font-display text-[16px] font-extrabold text-ink">Study Planner AI</span>
          </div>

          <h1 className="mt-5 font-display text-[26px] leading-tight font-extrabold text-ink">
            {step === 0 && (
              <>
                Vamos montar o seu <Highlight>semestre</Highlight>
              </>
            )}
            {step === 1 && (
              <>
                Quais <Highlight color={SUBJECT_COLORS[2].hex}>disciplinas</Highlight> você está cursando?
              </>
            )}
            {step === 2 && (
              <>
                Quanto <Highlight color={SUBJECT_COLORS[3].hex}>tempo</Highlight> você tem?
              </>
            )}
            {step === 3 && (
              <>
                Pronto para <Highlight color={SUBJECT_COLORS[1].hex}>começar</Highlight>
              </>
            )}
          </h1>

          <div className="mt-4">
            <Progress value={((step + 1) / STEPS.length) * 100} label="Progresso do cadastro" />
            <div className="mt-2 flex justify-between font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">
              {STEPS.map((s, i) => (
                <span key={s} className={cn(i === step && 'font-bold text-ink')}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="rounded-card border border-hair bg-surface p-5 shadow-paper">
          {step === 0 && (
            <div className="space-y-3">
              <Field label="Seu nome" htmlFor="ob-name">
                <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamada(o)" />
              </Field>
              <Field label="Curso" htmlFor="ob-course">
                <Input id="ob-course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ex: Ciência da Computação" />
              </Field>
              <Field label="Instituição" htmlFor="ob-uni">
                <Input id="ob-uni" value={university} onChange={(e) => setUniversity(e.target.value)} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {drafts.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-hair px-3 py-2">
                    <span aria-hidden className="size-3 rounded-[3px]" style={{ background: SUBJECT_COLORS[d.color].hex }} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{d.name}</span>
                    <span className="font-mono text-[11.5px] text-ink-3">{d.totalHours}h</span>
                    <button
                      onClick={() => setDrafts(drafts.filter((_, x) => x !== i))}
                      aria-label={`Remover ${d.name}`}
                      className="rounded p-1 text-ink-3 hover:text-caneta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {!drafts.length && (
                  <p className="rounded-lg border border-dashed border-hair px-3 py-6 text-center text-[13px] text-ink-2">
                    Nenhuma disciplina ainda. Adicione ao menos uma para o sistema montar seu cronograma.
                  </p>
                )}
              </div>

              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.name.trim()) return;
                  setDrafts([...drafts, { ...draft, color: (drafts.length % 6) as SubjectColor }]);
                  setDraft({ name: '', code: '', color: 0, totalHours: 60, weight: 3 });
                }}
              >
                <Field label="Disciplina" className="min-w-[12rem] flex-1" htmlFor="ob-sub">
                  <Input
                    id="ob-sub"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Ex: Cálculo II"
                  />
                </Field>
                <Field label="Carga (h)" className="w-24" htmlFor="ob-hours">
                  <Input
                    id="ob-hours"
                    type="number"
                    min={15}
                    step={15}
                    value={draft.totalHours}
                    onChange={(e) => setDraft({ ...draft, totalHours: Number(e.target.value) })}
                  />
                </Field>
                <Button type="submit" variant="secondary">
                  <Plus size={15} /> Adicionar
                </Button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[13px] font-medium text-ink-2">Em quais dias você costuma estudar?</p>
                <div className="flex flex-wrap gap-1.5">
                  {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((wd) => (
                    <button
                      key={wd}
                      onClick={() => setDays(days.includes(wd) ? days.filter((d) => d !== wd) : [...days, wd])}
                      aria-pressed={days.includes(wd)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
                        days.includes(wd)
                          ? 'border-transparent bg-accent text-white'
                          : 'border-hair text-ink-2 hover:text-ink',
                      )}
                    >
                      {WEEKDAY_LABEL[wd]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Horas por dia" hint="Vira o teto do alerta de sobrecarga" htmlFor="ob-max">
                  <Input
                    id="ob-max"
                    type="number"
                    min={1}
                    max={10}
                    value={maxDailyHours}
                    onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                  />
                </Field>
                <Field label="Duração do bloco" htmlFor="ob-session">
                  <Select
                    id="ob-session"
                    value={sessionMinutes}
                    onChange={(e) => setSessionMinutes(Number(e.target.value))}
                  >
                    {[25, 30, 45, 50, 60, 90].map((m) => (
                      <option key={m} value={m}>
                        {m} minutos
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-center">
              <span aria-hidden className="mx-auto block h-3 w-24 -rotate-1 rounded-sm bg-marca" />
              <p className="font-display text-[18px] font-bold text-ink">
                {drafts.length || 'Suas'} disciplina(s) · {days.length} dia(s) por semana · {maxDailyHours}h/dia
              </p>
              <p className="mx-auto max-w-sm text-[13.5px] text-ink-2">
                Vou distribuir os blocos de estudo priorizando provas próximas e disciplinas com nota mais baixa. Você
                pode reorganizar tudo arrastando no plano semanal.
              </p>
              <ul className="mx-auto max-w-xs space-y-1.5 pt-2 text-left">
                {[
                  'Cronograma semanal gerado automaticamente',
                  'Revisões espaçadas de 1-3-7-15-30-60 dias',
                  'Alertas de sobrecarga e conflito de horário',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-quadro" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-hair pt-4">
            <button
              onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
              className="text-[13px] text-ink-3 hover:text-ink"
            >
              {step === 0 ? 'Pular por agora' : 'Voltar'}
            </button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !name.trim()}>
                Continuar <ArrowRight size={15} />
              </Button>
            ) : (
              <Button variant="marker" onClick={finish}>
                <Sparkles size={15} /> Gerar meu plano
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
