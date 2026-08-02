import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppNotification,
  Assignment,
  AssignmentStatus,
  Exam,
  Goal,
  ID,
  ISODate,
  Material,
  MinuteOfDay,
  Review,
  ReviewGrade,
  StudyPreferences,
  StudySession,
  Subject,
  User,
} from '@spa/shared-types';
import { buildSeed, type AppData } from '@/data/seed';
import { addDaysISO, todayISO, weekRange } from '@/lib/date';
import { uid } from '@/lib/id';
import { validateImport } from '@/lib/import-schema';
import { createFirstReview, gradeReview, DEFAULT_INTERVALS } from '@/features/engine/spaced-repetition';
import { computeAllPriorities } from '@/features/engine/priority';
import { generateWeekPlan, redistributeMissed } from '@/features/engine/planner';
import { XP_RULES } from '@/features/engine/gamification';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UiState {
  onboarded: boolean;
  theme: ThemeMode;
  sidebarOpen: boolean;
  searchOpen: boolean;
}

interface Actions {
  /* preferências e conta */
  setTheme: (t: ThemeMode) => void;
  setSidebar: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  completeOnboarding: (
    patch: Omit<Partial<User>, 'preferences'> & { preferences?: Partial<StudyPreferences> },
  ) => void;
  updateUser: (patch: Partial<User>) => void;
  updatePreferences: (patch: Partial<StudyPreferences>) => void;

  /* disciplinas */
  addSubject: (s: Omit<Subject, 'id' | 'semesterId' | 'favorite' | 'archived'>) => void;
  updateSubject: (id: ID, patch: Partial<Subject>) => void;
  toggleSubjectFavorite: (id: ID) => void;
  archiveSubject: (id: ID) => void;

  /* trabalhos */
  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt' | 'subtasks' | 'attachments' | 'favorite'>) => void;
  updateAssignment: (id: ID, patch: Partial<Assignment>) => void;
  deleteAssignment: (id: ID) => void;
  moveAssignment: (id: ID, status: AssignmentStatus) => void;
  toggleSubtask: (assignmentId: ID, subtaskId: ID) => void;
  addSubtask: (assignmentId: ID, title: string) => void;

  /* provas */
  addExam: (e: Omit<Exam, 'id'>) => void;
  updateExam: (id: ID, patch: Partial<Exam>) => void;
  deleteExam: (id: ID) => void;

  /* materiais */
  addMaterial: (m: Omit<Material, 'id' | 'addedAt' | 'favorite' | 'progress' | 'studiedAt'>) => void;
  updateMaterial: (id: ID, patch: Partial<Material>) => void;
  deleteMaterial: (id: ID) => void;
  toggleMaterialFavorite: (id: ID) => void;
  markMaterialStudied: (id: ID) => string;
  queueFlashcards: (materialId: ID) => number;

  /* sessões */
  addSession: (s: Omit<StudySession, 'id'>) => ID;
  moveSession: (id: ID, date: ISODate, start: MinuteOfDay) => void;
  completeSession: (id: ID, actualMinutes?: number) => void;
  updateSession: (id: ID, patch: Partial<StudySession>) => void;
  deleteSession: (id: ID) => void;
  /**
   * Vira `missed` toda sessão `planned` cuja data já passou. Sem isso, nada
   * transiciona o status sozinho — "Redistribuir atrasos" nunca teria o que
   * processar fora dos dados de demonstração. Chamado uma vez ao abrir o
   * app (ver `App.tsx`); idempotente, seguro de rodar várias vezes.
   */
  reconcileMissedSessions: () => number;
  regenerateWeek: (anchor?: ISODate) => number;
  redistributeLate: () => { moved: number; unplaced: number };

  /* revisões */
  answerReview: (id: ID, grade: ReviewGrade) => string;

  /* metas */
  addGoal: (g: Omit<Goal, 'id' | 'userId' | 'archived'>) => void;
  updateGoal: (id: ID, patch: Partial<Goal>) => void;
  archiveGoal: (id: ID) => void;

  /* notificações e gamificação */
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'read'>) => void;
  grantXp: (reason: keyof typeof XP_RULES, label: string) => void;

  /* dados */
  exportData: () => string;
  importData: (json: string) => { ok: boolean; errors: string[] };
  resetData: () => void;
  startFresh: () => void;
}

export type AppState = AppData & UiState & Actions;

const initialUi: UiState = { onboarded: true, theme: 'light', sidebarOpen: false, searchOpen: false };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      ...initialUi,

      /* ---------------- preferências ---------------- */
      setTheme: (theme) => set((s) => ({ theme, user: { ...s.user, theme } })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),

      completeOnboarding: (patch) =>
        set((s) => ({
          onboarded: true,
          user: {
            ...s.user,
            ...patch,
            preferences: { ...s.user.preferences, ...(patch.preferences ?? {}) },
          },
        })),

      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      updatePreferences: (patch) =>
        set((s) => ({ user: { ...s.user, preferences: { ...s.user.preferences, ...patch } } })),

      /* ---------------- disciplinas ---------------- */
      addSubject: (subject) =>
        set((s) => ({
          subjects: [
            ...s.subjects,
            { ...subject, id: uid('sub'), semesterId: s.user.currentSemesterId, favorite: false, archived: false },
          ],
        })),

      updateSubject: (id, patch) =>
        set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      toggleSubjectFavorite: (id) =>
        set((s) => ({
          subjects: s.subjects.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)),
        })),

      archiveSubject: (id) =>
        set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, archived: true } : x)) })),

      /* ---------------- trabalhos ---------------- */
      addAssignment: (a) =>
        set((s) => ({
          assignments: [
            ...s.assignments,
            { ...a, id: uid('asg'), createdAt: new Date().toISOString(), subtasks: [], attachments: [], favorite: false },
          ],
        })),

      updateAssignment: (id, patch) =>
        set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      deleteAssignment: (id) =>
        set((s) => ({
          assignments: s.assignments.filter((x) => x.id !== id),
          // preserva o histórico de estudo — só desvincula o trabalho apagado
          sessions: s.sessions.map((x) => (x.assignmentId === id ? { ...x, assignmentId: null } : x)),
        })),

      moveAssignment: (id, status) => {
        const before = get().assignments.find((a) => a.id === id);
        set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, status } : x)) }));
        if (status === 'done' && before && before.status !== 'done') {
          get().grantXp('assignment', `Entrega concluída: ${before.title}`);
        }
      },

      toggleSubtask: (assignmentId, subtaskId) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === assignmentId
              ? { ...a, subtasks: a.subtasks.map((t) => (t.id === subtaskId ? { ...t, done: !t.done } : t)) }
              : a,
          ),
        })),

      addSubtask: (assignmentId, title) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === assignmentId
              ? { ...a, subtasks: [...a.subtasks, { id: uid('st'), title, done: false }] }
              : a,
          ),
        })),

      /* ---------------- provas ---------------- */
      addExam: (e) => set((s) => ({ exams: [...s.exams, { ...e, id: uid('exam') }] })),
      updateExam: (id, patch) =>
        set((s) => ({ exams: s.exams.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      deleteExam: (id) =>
        set((s) => {
          const orphanReviewIds = new Set(
            s.reviews.filter((r) => r.sourceType === 'exam' && r.sourceId === id).map((r) => r.id),
          );
          return {
            exams: s.exams.filter((x) => x.id !== id),
            reviews: s.reviews.filter((r) => !orphanReviewIds.has(r.id)),
            sessions: s.sessions.map((x) =>
              x.reviewId && orphanReviewIds.has(x.reviewId) ? { ...x, reviewId: null } : x,
            ),
          };
        }),

      /* ---------------- materiais ---------------- */
      addMaterial: (m) =>
        set((s) => ({
          materials: [
            ...s.materials,
            {
              ...m,
              id: uid('mat'),
              addedAt: new Date().toISOString(),
              favorite: false,
              progress: 0,
              studiedAt: null,
              aiSummary: null,
              aiFlashcards: [],
              aiQuiz: [],
            },
          ],
        })),

      updateMaterial: (id, patch) =>
        set((s) => ({ materials: s.materials.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      deleteMaterial: (id) =>
        set((s) => {
          const orphanReviewIds = new Set(
            s.reviews.filter((r) => r.sourceType === 'material' && r.sourceId === id).map((r) => r.id),
          );
          return {
            materials: s.materials.filter((x) => x.id !== id),
            reviews: s.reviews.filter((r) => !orphanReviewIds.has(r.id)),
            sessions: s.sessions.map((x) => {
              const next = { ...x };
              if (next.materialId === id) next.materialId = null;
              if (next.reviewId && orphanReviewIds.has(next.reviewId)) next.reviewId = null;
              return next;
            }),
          };
        }),

      toggleMaterialFavorite: (id) =>
        set((s) => ({
          materials: s.materials.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)),
        })),

      /**
       * Regra da Etapa 1: marcar material como estudado agenda a revisão espaçada.
       */
      markMaterialStudied: (id) => {
        const state = get();
        const material = state.materials.find((m) => m.id === id);
        if (!material) return 'Material não encontrado.';

        const review = createFirstReview(
          { subjectId: material.subjectId, sourceType: 'material', sourceId: material.id, title: material.title },
          todayISO(),
          state.user.preferences.reviewIntervals,
        );

        set((s) => ({
          materials: s.materials.map((m) =>
            m.id === id ? { ...m, studiedAt: new Date().toISOString(), progress: 100 } : m,
          ),
          reviews: [...s.reviews, review],
        }));

        get().grantXp('session', `Material concluído: ${material.title}`);
        return `Revisão agendada para ${review.scheduledFor.split('-').reverse().slice(0, 2).join('/')}.`;
      },

      queueFlashcards: (materialId) => {
        const state = get();
        const material = state.materials.find((m) => m.id === materialId);
        if (!material?.aiFlashcards?.length) return 0;

        const pending = material.aiFlashcards.filter((f) => !f.queued);
        const newReviews: Review[] = pending.map((f) =>
          createFirstReview(
            { subjectId: material.subjectId, sourceType: 'flashcard', sourceId: f.id, title: f.front },
            todayISO(),
            state.user.preferences.reviewIntervals,
          ),
        );

        set((s) => ({
          reviews: [...s.reviews, ...newReviews],
          materials: s.materials.map((m) =>
            m.id === materialId
              ? { ...m, aiFlashcards: (m.aiFlashcards ?? []).map((f) => ({ ...f, queued: true })) }
              : m,
          ),
        }));

        return pending.length;
      },

      /* ---------------- sessões ---------------- */
      addSession: (s) => {
        const id = uid('ses');
        set((st) => ({ sessions: [...st.sessions, { ...s, id }] }));
        return id;
      },

      moveSession: (id, date, start) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, date, start, origin: 'manual' } : x)),
        })),

      updateSession: (id, patch) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      completeSession: (id, actualMinutes) => {
        const session = get().sessions.find((s) => s.id === id);
        if (!session || session.status === 'done') return;

        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, status: 'done', actualMinutes: actualMinutes ?? x.minutes } : x,
          ),
          gamification: {
            ...s.gamification,
            activeDays: [...new Set([...s.gamification.activeDays, session.date])].sort(),
          },
        }));

        get().grantXp('session', 'Sessão de estudo concluída');
      },

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      reconcileMissedSessions: () => {
        const today = todayISO();
        const s = get();
        const toFlip = s.sessions.filter((x) => x.status === 'planned' && x.date < today);
        if (!toFlip.length) return 0;
        const flipIds = new Set(toFlip.map((x) => x.id));
        set((st) => ({
          sessions: st.sessions.map((x) => (flipIds.has(x.id) ? { ...x, status: 'missed' as const } : x)),
        }));
        return toFlip.length;
      },

      regenerateWeek: (anchor = todayISO()) => {
        const s = get();
        const dates = weekRange(anchor);
        // limpa o que era automático e ainda não aconteceu
        const kept = s.sessions.filter(
          (x) => !(dates.includes(x.date) && x.status === 'planned' && x.origin === 'auto'),
        );
        const priorities = computeAllPriorities(s.subjects, s.exams, s.assignments, s.sessions);
        const created = generateWeekPlan(dates, s.user.preferences, s.subjects, priorities, kept);
        set({ sessions: [...kept, ...created] });
        return created.length;
      },

      redistributeLate: () => {
        const s = get();
        const today = todayISO();
        const missed = s.sessions.filter((x) => x.status === 'missed' && x.date < today);
        // Semana atual + a seguinte — sem a próxima, atrasos de sexta não achavam
        // espaço e caíam em `unplaced` mesmo havendo dias livres à frente.
        const horizon = [...weekRange(today), ...weekRange(addDaysISO(today, 7))].filter(
          (dt, i, arr) => arr.indexOf(dt) === i && dt >= today,
        );
        const { moved, unplaced } = redistributeMissed(
          missed,
          horizon,
          s.user.preferences,
          s.subjects,
          s.sessions,
        );
        if (moved.length) {
          set((st) => ({
            sessions: [
              ...st.sessions.map((x) =>
                moved.some((m) => m.from.id === x.id) ? { ...x, status: 'skipped' as const } : x,
              ),
              ...moved.map((m) => m.to),
            ],
          }));
        }
        return { moved: moved.length, unplaced: unplaced.length };
      },

      /* ---------------- revisões ---------------- */
      answerReview: (id, grade) => {
        const s = get();
        const review = s.reviews.find((r) => r.id === id);
        if (!review) return 'Revisão não encontrada.';

        const result = gradeReview(review, grade, s.user.preferences.reviewIntervals);
        set((st) => ({
          reviews: [
            ...st.reviews.map((r) => (r.id === id ? result.completed : r)),
            ...(result.next ? [result.next] : []),
          ],
        }));
        get().grantXp('review', `Revisão feita: ${review.title}`);
        return result.message;
      },

      /* ---------------- metas ---------------- */
      addGoal: (g) =>
        set((s) => ({ goals: [...s.goals, { ...g, id: uid('goal'), userId: s.user.id, archived: false }] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      archiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, archived: true } : x)) })),

      /* ---------------- notificações e XP ---------------- */
      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid('not'), userId: s.user.id, createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),

      grantXp: (reason, label) =>
        set((s) => ({
          gamification: {
            ...s.gamification,
            xp: s.gamification.xp + XP_RULES[reason],
            events: [
              { id: uid('xp'), date: todayISO(), amount: XP_RULES[reason], reason, label },
              ...s.gamification.events,
            ].slice(0, 400),
          },
        })),

      /* ---------------- dados ---------------- */
      exportData: () => {
        const s = get();
        const payload: AppData = {
          user: s.user,
          semesters: s.semesters,
          professors: s.professors,
          subjects: s.subjects,
          assignments: s.assignments,
          exams: s.exams,
          materials: s.materials,
          sessions: s.sessions,
          reviews: s.reviews,
          goals: s.goals,
          notifications: s.notifications,
          gamification: s.gamification,
        };
        return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: payload }, null, 2);
      },

      importData: (json) => {
        const result = validateImport(json);
        if (!result.ok || !result.data) return { ok: false, errors: result.errors };
        // Atribuição explícita por campo — nunca `set({ ...data })`: um JSON
        // com uma chave igual a uma ação (ex. "addSession") substituiria a
        // função no store por um valor arbitrário do arquivo importado.
        const data = result.data;
        set({
          user: data.user,
          semesters: data.semesters,
          professors: data.professors,
          subjects: data.subjects,
          assignments: data.assignments,
          exams: data.exams,
          materials: data.materials,
          sessions: data.sessions,
          reviews: data.reviews,
          goals: data.goals,
          notifications: data.notifications,
          gamification: data.gamification,
        });
        return { ok: true, errors: [] };
      },

      resetData: () => set({ ...buildSeed(), onboarded: true }),

      /**
       * Apaga o semestre de demonstração e deixa tudo vazio, pronto para
       * o usuário cadastrar dados reais pelo onboarding.
       */
      startFresh: () => {
        const userId = uid('user');
        const semesterId = uid('sem');
        const today = todayISO();

        set({
          onboarded: false,
          user: {
            id: userId,
            name: '',
            email: '',
            course: '',
            university: '',
            currentSemesterId: semesterId,
            avatarInitials: '',
            theme: get().theme,
            createdAt: new Date().toISOString(),
            preferences: {
              maxDailyHours: 4,
              sessionMinutes: 50,
              breakMinutes: 10,
              longBreakMinutes: 20,
              pomodorosUntilLongBreak: 4,
              reviewIntervals: DEFAULT_INTERVALS,
              availability: [],
            },
            notifications: {
              deadlines: true,
              reviews: true,
              goalsAtRisk: true,
              dailyDigest: false,
              digestHour: 8,
            },
          },
          semesters: [
            { id: semesterId, userId, label: '', startDate: today, endDate: addDaysISO(today, 120) },
          ],
          professors: [],
          subjects: [],
          assignments: [],
          exams: [],
          materials: [],
          sessions: [],
          reviews: [],
          goals: [],
          notifications: [],
          gamification: { xp: 0, events: [], activeDays: [] },
        });
      },
    }),
    {
      name: 'study-planner-ai:v1',
      version: 1,
      partialize: ({ sidebarOpen, searchOpen, ...rest }) => rest as AppState,
    },
  ),
);
