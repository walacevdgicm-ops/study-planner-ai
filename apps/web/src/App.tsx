import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SkeletonLines } from '@spa/ui-kit';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeManager } from '@/components/layout/ThemeManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppStore } from '@/store/useAppStore';
import Dashboard from '@/pages/Dashboard';

/* O Dashboard entra no bundle inicial (é a rota de entrada).
   As demais são carregadas sob demanda — Recharts e o calendário
   não precisam pesar no primeiro carregamento. */
const Subjects = lazy(() => import('@/pages/Subjects'));
const SubjectDetail = lazy(() => import('@/pages/SubjectDetail'));
const WeeklyPlan = lazy(() => import('@/pages/WeeklyPlan'));
const DailyPlan = lazy(() => import('@/pages/DailyPlan'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const Assignments = lazy(() => import('@/pages/Assignments'));
const Exams = lazy(() => import('@/pages/Exams'));
const Library = lazy(() => import('@/pages/Library'));
const Reviews = lazy(() => import('@/pages/Reviews'));
const Goals = lazy(() => import('@/pages/Goals'));
const Stats = lazy(() => import('@/pages/Stats'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RouteFallback() {
  return (
    <div className="space-y-4">
      <SkeletonLines rows={2} className="max-w-md" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-surface-2" />
    </div>
  );
}

export default function App() {
  const onboarded = useAppStore((s) => s.onboarded);

  return (
    <>
      <ThemeManager />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={onboarded ? <AppShell /> : <Navigate to="/onboarding" replace />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dia" element={<DailyPlan />} />
              <Route path="/semana" element={<WeeklyPlan />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/disciplinas" element={<Subjects />} />
              <Route path="/disciplinas/:id" element={<SubjectDetail />} />
              <Route path="/trabalhos" element={<Assignments />} />
              <Route path="/provas" element={<Exams />} />
              <Route path="/materiais" element={<Library kind="pdf" />} />
              <Route path="/videos" element={<Library kind="video" />} />
              <Route path="/leituras" element={<Library kind="reading" />} />
              <Route path="/revisao" element={<Reviews />} />
              <Route path="/metas" element={<Goals />} />
              <Route path="/estatisticas" element={<Stats />} />
              <Route path="/notificacoes" element={<Notifications />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
