import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Table, type Column, cn } from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectMap } from '@/store/selectors';
import { addDaysISO, fmtHours, fmtShort, todayISO, weekRange, WEEKDAY_LABEL } from '@/lib/date';
import { completionRate, dailyHeat, minutesBySubject, weeklySeries } from '@/features/engine/stats';
import { bestHoursFromHistory } from '@/features/engine/planner';
import { subjectHex } from '@/lib/subject-colors';
import { useSimulatedLoad } from '@/lib/hooks';

interface Row {
  id: string;
  name: string;
  hex: string;
  thisWeek: number;
  lastWeek: number;
}

export default function Stats() {
  const loading = useSimulatedLoad(600);
  const sessions = useAppStore((s) => s.sessions);
  const subjects = useAppStore((s) => s.subjects);
  const subjectMap = useSubjectMap();

  const week = weekRange(todayISO());
  const lastWeek = weekRange(addDaysISO(todayISO(), -7));

  const series = useMemo(() => weeklySeries(sessions, 6), [sessions]);
  const bySubject = useMemo(
    () => minutesBySubject(sessions, subjects, week[0], week[6]).filter((s) => s.minutes > 0),
    [sessions, subjects, week],
  );
  const heat = useMemo(() => dailyHeat(sessions, 84), [sessions]);
  const rate = completionRate(sessions, week[0], week[6]);
  const best = bestHoursFromHistory(sessions);

  const totalMinutes = sessions
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMinutes ?? s.minutes), 0);

  const rows: Row[] = subjects
    .filter((s) => !s.archived)
    .map((s) => ({
      id: s.id,
      name: s.name,
      hex: subjectHex(s.color),
      thisWeek: sessions
        .filter((x) => x.subjectId === s.id && x.status === 'done' && week.includes(x.date))
        .reduce((a, x) => a + (x.actualMinutes ?? x.minutes), 0),
      lastWeek: sessions
        .filter((x) => x.subjectId === s.id && x.status === 'done' && lastWeek.includes(x.date))
        .reduce((a, x) => a + (x.actualMinutes ?? x.minutes), 0),
    }))
    .sort((a, b) => b.thisWeek - a.thisWeek);

  const cols: Column<Row>[] = [
    {
      key: 'name',
      header: 'Disciplina',
      render: (r) => (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: r.hex }} />
          {r.name}
        </span>
      ),
    },
    { key: 'this', header: 'Esta semana', numeric: true, render: (r) => `${fmtHours(r.thisWeek)}h` },
    { key: 'last', header: 'Semana anterior', numeric: true, render: (r) => `${fmtHours(r.lastWeek)}h` },
    {
      key: 'delta',
      header: 'Variação',
      numeric: true,
      render: (r) => {
        const delta = r.thisWeek - r.lastWeek;
        if (!r.lastWeek && !r.thisWeek) return <span className="text-ink-3">—</span>;
        return (
          <span className={delta >= 0 ? 'text-quadro' : 'text-caneta'}>
            {delta >= 0 ? '+' : ''}
            {fmtHours(delta)}h
          </span>
        );
      },
    },
  ];

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--hair)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--ink)',
  };

  return (
    <>
      <PageHeader
        title="Suas estatísticas"
        highlight="estatísticas"
        description="Comparação entre semanas, distribuição por disciplina e constância — os números que dizem se o plano está funcionando."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total no semestre" value={fmtHours(totalMinutes)} unit="h" />
        <StatTile
          label="Média semanal"
          value={(series.reduce((a, p) => a + p.done, 0) / Math.max(1, series.length)).toFixed(1).replace('.', ',')}
          unit="h"
        />
        <StatTile label="Cumprimento" value={rate} unit="%" tone={rate >= 70 ? 'success' : 'neutral'} />
        <StatTile
          label="Melhor faixa"
          value={best.sort((a, b) => b.rate - a.rate)[0]?.label.split(' ')[0] ?? '—'}
          hint={`${best.sort((a, b) => b.rate - a.rate)[0]?.rate ?? 0}% de cumprimento`}
          tone="marker"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Planejado vs. cumprido</CardTitle>
            <span className="font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">últimas 6 semanas</span>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="h-[260px] animate-pulse rounded-lg bg-surface-2" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--hair)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)' }} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: unknown, name: unknown) => [`${value}h`, String(name)] as [string, string]}
                    cursor={{ fill: 'var(--surface-2)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="planned" name="Planejado" fill="var(--surface-2)" stroke="var(--hair)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="done" name="Cumprido" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horas por disciplina</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="h-[260px] animate-pulse rounded-lg bg-surface-2" />
            ) : bySubject.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={bySubject}
                    dataKey="minutes"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="var(--surface)"
                  >
                    {bySubject.map((s) => (
                      <Cell key={s.subjectId} fill={subjectHex(s.color as 0)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: unknown, name: unknown) =>
                      [`${fmtHours(Number(value))}h`, String(name)] as [string, string]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Semana ainda em branco" description="Conclua sessões para ver a distribuição por matéria." />
            )}
            <ul className="mt-2 space-y-1">
              {bySubject.slice(0, 6).map((s) => (
                <li key={s.subjectId} className="flex items-center gap-2 text-[12.5px]">
                  <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: subjectHex(s.color as 0) }} />
                  <span className="min-w-0 flex-1 truncate text-ink-2">{s.name}</span>
                  <span className="font-mono text-ink-3">{fmtHours(s.minutes)}h</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Constância</CardTitle>
          <span className="font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">últimos 84 dias</span>
        </CardHeader>
        <CardBody>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: 12 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, row) => {
                  const cell = heat[col * 7 + row];
                  if (!cell) return <span key={row} className="size-3.5" />;
                  const level = cell.minutes === 0 ? 0 : cell.minutes < 60 ? 1 : cell.minutes < 120 ? 2 : 3;
                  return (
                    <span
                      key={row}
                      title={`${fmtShort(cell.date)} · ${fmtHours(cell.minutes)}h`}
                      className={cn(
                        'size-3.5 rounded-[3px]',
                        level === 0 && 'bg-surface-2',
                        level === 1 && 'bg-marca/40',
                        level === 2 && 'bg-marca/70',
                        level === 3 && 'bg-marca',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10.5px] text-ink-3">
            <span>menos</span>
            <span className="size-3 rounded-[3px] bg-surface-2" />
            <span className="size-3 rounded-[3px] bg-marca/40" />
            <span className="size-3 rounded-[3px] bg-marca/70" />
            <span className="size-3 rounded-[3px] bg-marca" />
            <span>mais</span>
            <span className="ml-3">
              linhas = {WEEKDAY_LABEL[1]}…{WEEKDAY_LABEL[0]}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4 border-0 bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>Comparação entre semanas</CardTitle>
        </CardHeader>
        <CardBody className="px-0">
          <Table columns={cols} rows={rows} rowKey={(r) => r.id} caption="Horas por disciplina" />
          <p className="mt-2 text-[12px] text-ink-3">
            {subjectMap.size} disciplinas ativas · dados calculados a partir das sessões concluídas.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
