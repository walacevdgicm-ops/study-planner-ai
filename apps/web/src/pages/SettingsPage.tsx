import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Sparkles, Trash2, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Switch,
  Tabs,
  cn,
  useToast,
} from '@spa/ui-kit';
import type { Weekday } from '@spa/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_INTERVALS } from '@/features/engine/spaced-repetition';
import { fmtMinutes, WEEKDAY_LABEL } from '@/lib/date';

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const prefs = useAppStore((s) => s.user.preferences);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const updateUser = useAppStore((s) => s.updateUser);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const resetData = useAppStore((s) => s.resetData);
  const startFresh = useAppStore((s) => s.startFresh);
  const { push } = useToast();
  const navigate = useNavigate();

  const fileRef = useRef<HTMLInputElement>(null);
  const [intervals, setIntervals] = useState(prefs.reviewIntervals.join(', '));

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push({ title: 'Backup gerado', description: 'Arquivo JSON salvo no seu dispositivo.', tone: 'success' });
  };

  const upload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      push({
        title: ok ? 'Dados importados' : 'Arquivo inválido',
        description: ok ? 'Seu semestre foi restaurado.' : 'Verifique se é um backup gerado por esta ferramenta.',
        tone: ok ? 'success' : 'danger',
      });
    };
    reader.readAsText(file);
  };

  const toggleWindow = (weekday: Weekday) => {
    const has = prefs.availability.some((w) => w.weekday === weekday);
    updatePreferences({
      availability: has
        ? prefs.availability.filter((w) => w.weekday !== weekday)
        : [...prefs.availability, { weekday, start: 1140, end: 1320 }],
    });
  };

  return (
    <>
      <PageHeader
        title="Configurações"
        highlight="Configurações"
        description="Ritmo de estudo, revisão espaçada, notificações, aparência e backup dos seus dados."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ritmo de estudo</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teto diário (horas)" hint="Base do alerta de sobrecarga" htmlFor="cfg-max">
                <Input
                  id="cfg-max"
                  type="number"
                  min={1}
                  max={12}
                  value={prefs.maxDailyHours}
                  onChange={(e) => updatePreferences({ maxDailyHours: Number(e.target.value) })}
                />
              </Field>
              <Field label="Duração do bloco (min)" htmlFor="cfg-session">
                <Select
                  id="cfg-session"
                  value={prefs.sessionMinutes}
                  onChange={(e) => updatePreferences({ sessionMinutes: Number(e.target.value) })}
                >
                  {[25, 30, 45, 50, 60, 90].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Pausa (min)" htmlFor="cfg-break">
                <Input
                  id="cfg-break"
                  type="number"
                  min={1}
                  value={prefs.breakMinutes}
                  onChange={(e) => updatePreferences({ breakMinutes: Number(e.target.value) })}
                />
              </Field>
              <Field label="Pausa longa" htmlFor="cfg-long">
                <Input
                  id="cfg-long"
                  type="number"
                  min={5}
                  value={prefs.longBreakMinutes}
                  onChange={(e) => updatePreferences({ longBreakMinutes: Number(e.target.value) })}
                />
              </Field>
              <Field label="Ciclos" hint="até a pausa longa" htmlFor="cfg-cycles">
                <Input
                  id="cfg-cycles"
                  type="number"
                  min={2}
                  value={prefs.pomodorosUntilLongBreak}
                  onChange={(e) => updatePreferences({ pomodorosUntilLongBreak: Number(e.target.value) })}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revisão espaçada</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Field
              label="Intervalos (em dias)"
              hint="Padrão consolidado: 1, 3, 7, 15, 30, 60. Separe por vírgula."
              htmlFor="cfg-intervals"
            >
              <Input
                id="cfg-intervals"
                value={intervals}
                onChange={(e) => setIntervals(e.target.value)}
                onBlur={() => {
                  const parsed = intervals
                    .split(',')
                    .map((n) => Number(n.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0);
                  if (parsed.length) {
                    updatePreferences({ reviewIntervals: parsed });
                    push({ title: 'Intervalos atualizados', description: parsed.join(' · ') + ' dias', tone: 'success' });
                  } else {
                    setIntervals(prefs.reviewIntervals.join(', '));
                  }
                }}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-1.5">
              {prefs.reviewIntervals.map((d, i) => (
                <Badge key={i} mono tone="accent">
                  {d}d
                </Badge>
              ))}
              <button
                onClick={() => {
                  updatePreferences({ reviewIntervals: DEFAULT_INTERVALS });
                  setIntervals(DEFAULT_INTERVALS.join(', '));
                }}
                className="ml-1 text-[12px] text-ink-3 underline underline-offset-2 hover:text-ink"
              >
                restaurar padrão
              </button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disponibilidade semanal</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-[12.5px] text-ink-2">
              Os dias marcados recebem blocos automáticos. Ajuste as janelas de cada dia conforme sua rotina.
            </p>
            <div className="space-y-2">
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((wd) => {
                const windows = prefs.availability.filter((w) => w.weekday === wd);
                const active = windows.length > 0;
                return (
                  <div
                    key={wd}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
                      active ? 'border-hair bg-surface' : 'border-dashed border-hair',
                    )}
                  >
                    <button
                      onClick={() => toggleWindow(wd)}
                      aria-pressed={active}
                      className="flex items-center gap-2 text-[13px] font-medium text-ink"
                    >
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded border text-[11px]',
                          active ? 'border-transparent bg-accent text-white' : 'border-hair text-transparent',
                        )}
                      >
                        ✓
                      </span>
                      {WEEKDAY_LABEL[wd]}
                    </button>
                    <span className="font-mono text-[11.5px] text-ink-3">
                      {active
                        ? windows.map((w) => `${fmtMinutes(w.start)}–${fmtMinutes(w.end)}`).join(' · ')
                        : 'sem janela'}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Switch
                checked={user.notifications.deadlines}
                onChange={(v) => updateUser({ notifications: { ...user.notifications, deadlines: v } })}
                label="Prazos de entrega"
                description="Avisa quando um trabalho está próximo do vencimento."
              />
              <Switch
                checked={user.notifications.reviews}
                onChange={(v) => updateUser({ notifications: { ...user.notifications, reviews: v } })}
                label="Revisões vencidas"
                description="Alerta quando a fila de revisão acumula."
              />
              <Switch
                checked={user.notifications.goalsAtRisk}
                onChange={(v) => updateUser({ notifications: { ...user.notifications, goalsAtRisk: v } })}
                label="Metas em risco"
                description="Quando o ritmo fica abaixo do necessário para fechar a meta."
              />
              <Switch
                checked={user.notifications.dailyDigest}
                onChange={(v) => updateUser({ notifications: { ...user.notifications, dailyDigest: v } })}
                label="Resumo diário"
                description={`Enviado às ${String(user.notifications.digestHour).padStart(2, '0')}:00.`}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
            </CardHeader>
            <CardBody>
              <Tabs
                look="pill"
                value={theme}
                onChange={(t) => setTheme(t as 'light' | 'dark' | 'system')}
                items={[
                  { id: 'light', label: 'Claro' },
                  { id: 'dark', label: 'Escuro' },
                  { id: 'system', label: 'Sistema' },
                ]}
              />
              <p className="mt-2 text-[12.5px] text-ink-2">
                No tema escuro as cores de disciplina mudam de mistura (de <em>multiply</em> para <em>screen</em>) para
                continuarem legíveis.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-[12.5px] text-ink-2">
                Nesta etapa tudo fica no seu navegador (localStorage). O backup exporta o semestre inteiro em JSON.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={download}>
                  <Download size={15} /> Exportar
                </Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                  <Upload size={15} /> Importar
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Isso apaga suas alterações e recarrega os dados de demonstração. Continuar?')) {
                      resetData();
                      push({ title: 'Dados redefinidos', description: 'O semestre de demonstração foi restaurado.' });
                    }
                  }}
                >
                  <Trash2 size={15} /> Redefinir para o exemplo
                </Button>
              </div>

              <div className="mt-1 rounded-lg border border-dashed border-hair bg-surface-2/50 p-3">
                <p className="mb-2 text-[12.5px] font-medium text-ink">
                  Quer usar com o seu semestre de verdade?
                </p>
                <p className="mb-2.5 text-[12px] text-ink-2">
                  Isso apaga as disciplinas, provas e materiais de demonstração (Cálculo II, Estrutura de
                  Dados…) e te leva direto para o cadastro inicial, para você colocar suas matérias e seus
                  dados reais.
                </p>
                <Button
                  variant="marker"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        'Isso remove TODOS os dados de demonstração (disciplinas, provas, trabalhos, materiais, histórico) e não pode ser desfeito. Se quiser guardar algo, exporte antes. Continuar?',
                      )
                    ) {
                      startFresh();
                      navigate('/onboarding');
                    }
                  }}
                >
                  <Sparkles size={15} /> Começar do zero com meus dados
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
