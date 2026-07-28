import { NavLink } from 'react-router-dom';
import { cn } from '@spa/ui-kit';
import { FOOTER_NAV, NAV_GROUPS, type NavItem } from '@/config/nav';
import { useAppStore } from '@/store/useAppStore';
import { useOpenAssignments, useReviewQueue, useUnreadCount } from '@/store/selectors';
import { todayISO } from '@/lib/date';

function useBadgeCounts() {
  const { overdue, today } = useReviewQueue();
  const open = useOpenAssignments();
  const unread = useUnreadCount();
  return {
    reviews: overdue.length + today.length,
    assignments: open.filter((a) => a.dueDate <= todayISO()).length,
    notifications: unread,
  };
}

function Item({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const counts = useBadgeCounts();
  const count = item.badge ? counts[item.badge] : 0;
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg py-2 pr-2 pl-3.5 text-[13.5px] font-medium transition-colors',
          isActive ? 'bg-surface text-ink shadow-paper' : 'text-ink-2 hover:bg-surface/60 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* aba de fichário no item ativo — assinatura do produto */}
          {isActive && (
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 -left-px w-[5px] rounded-r-md bg-accent"
            />
          )}
          <Icon size={17} strokeWidth={2} className={cn(isActive ? 'text-accent' : 'text-ink-3')} />
          <span className="flex-1 truncate">{item.label}</span>
          {count > 0 && (
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-4 tabular-nums',
                item.badge === 'reviews' || item.badge === 'assignments'
                  ? 'bg-caneta/15 text-caneta'
                  : 'bg-accent-soft text-accent',
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAppStore((s) => s.user);
  const semester = useAppStore((s) => s.semesters.find((x) => x.id === s.user.currentSemesterId));

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4 no-scrollbar">
      <div className="px-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-grafite font-display text-[15px] font-extrabold text-papel"
          >
            S
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] leading-4 font-extrabold text-ink">
              Study Planner
            </p>
            <p className="font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">
              {semester?.label ?? '—'} · {user.course.slice(0, 18)}
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Item key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-hair pt-3">
        {FOOTER_NAV.map((item) => (
          <Item key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const open = useAppStore((s) => s.sidebarOpen);
  const setSidebar = useAppStore((s) => s.setSidebar);

  return (
    <>
      <aside className="hidden w-[248px] shrink-0 border-r border-hair bg-surface-2/60 lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarContent />
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-grafite/45 backdrop-blur-[2px]"
            onClick={() => setSidebar(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Menu de navegação"
            className="absolute inset-y-0 left-0 w-[268px] border-r border-hair bg-bg shadow-lifted"
          >
            <SidebarContent onNavigate={() => setSidebar(false)} />
          </div>
        </div>
      )}
    </>
  );
}
