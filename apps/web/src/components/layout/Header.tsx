import { Link, useLocation } from 'react-router-dom';
import { Bell, Flame, Menu, Moon, Search, Sun, Zap } from 'lucide-react';
import { cn } from '@spa/ui-kit';
import { useAppStore } from '@/store/useAppStore';
import { useGamificationSummary, useUnreadCount } from '@/store/selectors';
import { ROUTE_TITLES } from '@/config/nav';
import { fmtDayLong, todayISO } from '@/lib/date';

export function Header() {
  const { pathname } = useLocation();
  const setSidebar = useAppStore((s) => s.setSidebar);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const user = useAppStore((s) => s.user);
  const unread = useUnreadCount();
  const { streak, xp } = useGamificationSummary();

  const isDark = theme === 'dark';
  const title =
    ROUTE_TITLES[pathname] ?? (pathname.startsWith('/disciplinas/') ? 'Detalhe da disciplina' : 'Study Planner');

  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-bg/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <button
          onClick={() => setSidebar(true)}
          className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={19} />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Trilha de navegação" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 text-[13px] text-ink-3">
            <li className="hidden sm:block">
              <Link to="/" className="hover:text-ink">
                Study Planner
              </Link>
            </li>
            <li aria-hidden className="hidden sm:block">
              /
            </li>
            <li className="min-w-0">
              <span className="block truncate font-display text-[15px] font-semibold text-ink" aria-current="page">
                {title}
              </span>
            </li>
          </ol>
          <p className="hidden text-[11.5px] text-ink-3 sm:block">{fmtDayLong(todayISO())}</p>
        </nav>

        {/* Streak + XP: gamificação sempre à vista */}
        <Link
          to="/perfil"
          className="hidden items-center gap-3 rounded-lg border border-hair bg-surface px-2.5 py-1.5 sm:flex"
          aria-label={`Sequência de ${streak} dias e ${xp} pontos de experiência`}
        >
          <span className="flex items-center gap-1.5">
            <Flame size={15} className="text-caneta" />
            <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{streak}</span>
          </span>
          <span aria-hidden className="h-4 w-px bg-hair" />
          <span className="flex items-center gap-1.5">
            <Zap size={15} className="text-marca" fill="currentColor" />
            <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{xp}</span>
          </span>
        </Link>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-hair bg-surface px-2.5 py-1.5 text-[13px] text-ink-3 hover:text-ink"
          aria-label="Buscar (Ctrl+K)"
        >
          <Search size={15} />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden rounded border border-hair bg-surface-2 px-1 font-mono text-[10px] md:inline">
            Ctrl K
          </kbd>
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink"
          aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <Link
          to="/notificacoes"
          className="relative rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink"
          aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`}
        >
          <Bell size={17} />
          {unread > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 grid size-4 place-items-center rounded-full',
                'bg-caneta font-mono text-[9px] font-bold text-white',
              )}
            >
              {unread}
            </span>
          )}
        </Link>

        <Link
          to="/perfil"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-[12px] font-bold text-accent"
          aria-label="Perfil"
        >
          {user.avatarInitials}
        </Link>
      </div>
    </header>
  );
}
