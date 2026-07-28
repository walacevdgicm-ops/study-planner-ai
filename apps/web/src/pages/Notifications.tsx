import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Inbox } from 'lucide-react';
import type { AppNotification, NotificationKind } from '@spa/shared-types';
import { Badge, Button, Card, CardBody, EmptyState, Tabs, cn } from '@spa/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { useAppStore } from '@/store/useAppStore';
import { useUnreadCount } from '@/store/selectors';
import { relativeDays } from '@/lib/date';

const KIND_LABEL: Record<NotificationKind, string> = {
  deadline: 'Prazo',
  exam: 'Prova',
  reviewDue: 'Revisão',
  goalAtRisk: 'Meta',
  overload: 'Sobrecarga',
  conflict: 'Conflito',
  streak: 'Sequência',
  system: 'Sistema',
};

export default function Notifications() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const unread = useUnreadCount();
  const [tab, setTab] = useState('all');

  const visible = notifications
    .filter((n) => (tab === 'unread' ? !n.read : tab === 'critical' ? n.severity !== 'info' : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Central de alertas"
        highlight="alertas"
        description="Prazos, revisões vencidas, sobrecarga e metas em risco — tudo o que o motor de regras detectou por você."
        actions={
          unread > 0 && (
            <Button variant="secondary" onClick={markAll}>
              Marcar todas como lidas
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Tabs
          look="pill"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'all', label: 'Todas', count: notifications.length },
            { id: 'unread', label: 'Não lidas', count: unread },
            { id: 'critical', label: 'Requerem ação', count: notifications.filter((n) => n.severity !== 'info').length },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={tab === 'unread' ? 'Tudo lido' : 'Nenhum alerta'}
          description={
            tab === 'unread'
              ? 'Você está em dia com os avisos. Eles voltam a aparecer quando algo sair do plano.'
              : 'Quando um prazo apertar ou uma revisão vencer, o aviso aparece aqui.'
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={() => markRead(n.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function NotificationRow({ notification: n, onRead }: { notification: AppNotification; onRead: () => void }) {
  const color =
    n.severity === 'critical' ? 'var(--color-caneta)' : n.severity === 'warning' ? 'var(--color-marca)' : 'var(--accent)';

  return (
    <Card tabColor={color} className={cn(!n.read && 'shadow-paper')}>
      <CardBody className="flex flex-wrap items-start gap-3 py-3 pl-5">
        <span
          aria-hidden
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          <Bell size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-[14px] font-semibold text-ink', !n.read && 'after:ml-1.5 after:text-accent after:content-["•"]')}>
              {n.title}
            </p>
            <Badge tone={n.severity === 'critical' ? 'danger' : n.severity === 'warning' ? 'warning' : 'neutral'}>
              {KIND_LABEL[n.kind]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-2">{n.body}</p>
          <p className="mt-1 font-mono text-[11px] text-ink-3">{relativeDays(n.createdAt.slice(0, 10))}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {n.link && (
            <Link to={n.link} onClick={onRead}>
              <Button size="sm" variant="secondary">
                Abrir
              </Button>
            </Link>
          )}
          {!n.read && (
            <button onClick={onRead} className="text-[12px] text-ink-3 underline underline-offset-2 hover:text-ink">
              marcar lida
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
