import {
  Bell,
  BookMarked,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  Columns3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Repeat,
  Settings,
  Target,
  User,
  Video,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Chave para o contador no menu (revisões vencidas, prazos, etc). */
  badge?: 'reviews' | 'assignments' | 'notifications';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Hoje',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/dia', label: 'Planejamento diário', icon: CalendarDays },
      { to: '/revisao', label: 'Revisão espaçada', icon: Repeat, badge: 'reviews' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { to: '/semana', label: 'Semana', icon: CalendarRange },
      { to: '/calendario', label: 'Calendário', icon: CalendarDays },
    ],
  },
  {
    title: 'Acadêmico',
    items: [
      { to: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
      { to: '/trabalhos', label: 'Trabalhos', icon: Columns3, badge: 'assignments' },
      { to: '/provas', label: 'Provas', icon: GraduationCap },
    ],
  },
  {
    title: 'Biblioteca',
    items: [
      { to: '/materiais', label: 'PDFs e materiais', icon: FileText },
      { to: '/videos', label: 'Vídeo-aulas', icon: Video },
      { to: '/leituras', label: 'Leituras', icon: BookMarked },
    ],
  },
  {
    title: 'Progresso',
    items: [
      { to: '/metas', label: 'Metas', icon: Target },
      { to: '/estatisticas', label: 'Estatísticas', icon: ChartColumn },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { to: '/notificacoes', label: 'Notificações', icon: Bell, badge: 'notifications' },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/perfil', label: 'Perfil', icon: User },
];

/** Rótulos de breadcrumb por rota. */
export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dia': 'Planejamento diário',
  '/semana': 'Planejamento semanal',
  '/calendario': 'Calendário',
  '/disciplinas': 'Disciplinas',
  '/trabalhos': 'Trabalhos',
  '/provas': 'Provas',
  '/materiais': 'PDFs e materiais',
  '/videos': 'Vídeo-aulas',
  '/leituras': 'Leituras',
  '/revisao': 'Revisão espaçada',
  '/metas': 'Metas',
  '/estatisticas': 'Estatísticas',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil',
};
