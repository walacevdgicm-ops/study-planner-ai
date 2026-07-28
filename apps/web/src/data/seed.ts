import type {
  AppNotification,
  Assignment,
  Exam,
  Gamification,
  Goal,
  Material,
  Professor,
  Review,
  Semester,
  StudySession,
  Subject,
  User,
  XpEvent,
} from '@spa/shared-types';
import { addDaysISO, todayISO, weekRange, weekdayOf } from '@/lib/date';
import { seededRandom } from '@/lib/id';
import { DEFAULT_INTERVALS } from '@/features/engine/spaced-repetition';
import { XP_RULES } from '@/features/engine/gamification';

export interface AppData {
  user: User;
  semesters: Semester[];
  professors: Professor[];
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  materials: Material[];
  sessions: StudySession[];
  reviews: Review[];
  goals: Goal[];
  notifications: AppNotification[];
  gamification: Gamification;
}

const T = todayISO();
const d = (n: number) => addDaysISO(T, n);
const rand = seededRandom(20260728);

/* ------------------------------------------------------------------ */

const professors: Professor[] = [
  { id: 'prof_1', name: 'Helena Braga', email: 'helena.braga@uni.br', office: 'Bloco C, sala 210' },
  { id: 'prof_2', name: 'Ricardo Nunes', email: 'ricardo.nunes@uni.br', office: 'Bloco A, sala 12' },
  { id: 'prof_3', name: 'Ana Prado', email: 'ana.prado@uni.br' },
  { id: 'prof_4', name: 'Marcos Lima', email: 'marcos.lima@uni.br', office: 'Laboratório 3' },
  { id: 'prof_5', name: 'Sofia Reis', email: 'sofia.reis@uni.br' },
  { id: 'prof_6', name: 'Beatriz Alencar' },
];

const subjects: Subject[] = [
  {
    id: 'sub_calc',
    semesterId: 'sem_1',
    professorId: 'prof_1',
    name: 'Cálculo II',
    code: 'MAT02',
    color: 0,
    totalHours: 90,
    credits: 6,
    weight: 5,
    currentGrade: 5.8,
    favorite: true,
    archived: false,
    classSlots: [
      { weekday: 1, start: 480, end: 600, room: 'C-210' },
      { weekday: 3, start: 480, end: 600, room: 'C-210' },
    ],
  },
  {
    id: 'sub_ed',
    semesterId: 'sem_1',
    professorId: 'prof_2',
    name: 'Estrutura de Dados',
    code: 'INF11',
    color: 1,
    totalHours: 75,
    credits: 5,
    weight: 4,
    currentGrade: 8.2,
    favorite: true,
    archived: false,
    classSlots: [
      { weekday: 2, start: 600, end: 720, room: 'Lab 2' },
      { weekday: 4, start: 600, end: 720, room: 'Lab 2' },
    ],
  },
  {
    id: 'sub_bd',
    semesterId: 'sem_1',
    professorId: 'prof_3',
    name: 'Banco de Dados',
    code: 'INF22',
    color: 2,
    totalHours: 60,
    credits: 4,
    weight: 3,
    currentGrade: 7.5,
    favorite: false,
    archived: false,
    classSlots: [{ weekday: 2, start: 840, end: 960, room: 'Lab 1' }],
  },
  {
    id: 'sub_es',
    semesterId: 'sem_1',
    professorId: 'prof_4',
    name: 'Engenharia de Software',
    code: 'INF31',
    color: 3,
    totalHours: 60,
    credits: 4,
    weight: 3,
    currentGrade: 9,
    favorite: false,
    archived: false,
    classSlots: [{ weekday: 3, start: 840, end: 960, room: 'Lab 3' }],
  },
  {
    id: 'sub_est',
    semesterId: 'sem_1',
    professorId: 'prof_5',
    name: 'Estatística Aplicada',
    code: 'EST05',
    color: 4,
    totalHours: 60,
    credits: 4,
    weight: 4,
    currentGrade: 6.4,
    favorite: false,
    archived: false,
    classSlots: [{ weekday: 5, start: 480, end: 600, room: 'B-105' }],
  },
  {
    id: 'sub_ing',
    semesterId: 'sem_1',
    professorId: 'prof_6',
    name: 'Inglês Técnico',
    code: 'LET09',
    color: 5,
    totalHours: 30,
    credits: 2,
    weight: 1,
    currentGrade: null,
    favorite: false,
    archived: false,
    classSlots: [{ weekday: 5, start: 840, end: 960, room: 'D-002' }],
  },
];

const user: User = {
  id: 'user_1',
  name: 'Rayane Vieira',
  email: 'rayane.vieira@uni.br',
  course: 'Ciência da Computação',
  university: 'Universidade Federal',
  currentSemesterId: 'sem_1',
  avatarInitials: 'RV',
  theme: 'light',
  createdAt: addDaysISO(T, -120) + 'T10:00:00.000Z',
  preferences: {
    maxDailyHours: 4,
    sessionMinutes: 50,
    breakMinutes: 10,
    longBreakMinutes: 20,
    pomodorosUntilLongBreak: 4,
    reviewIntervals: DEFAULT_INTERVALS,
    availability: [
      // noites de segunda a sexta
      { weekday: 1, start: 1140, end: 1350 },
      { weekday: 2, start: 1140, end: 1350 },
      { weekday: 3, start: 1140, end: 1350 },
      { weekday: 4, start: 1140, end: 1350 },
      { weekday: 5, start: 1140, end: 1290 },
      // janelas entre aulas
      { weekday: 1, start: 630, end: 720 },
      { weekday: 3, start: 630, end: 720 },
      { weekday: 2, start: 750, end: 840 },
      { weekday: 4, start: 750, end: 840 },
      // fins de semana
      { weekday: 6, start: 540, end: 720 },
      { weekday: 6, start: 840, end: 1020 },
      { weekday: 0, start: 900, end: 1080 },
    ],
  },
  notifications: { deadlines: true, reviews: true, goalsAtRisk: true, dailyDigest: true, digestHour: 8 },
};

const semesters: Semester[] = [
  { id: 'sem_1', userId: 'user_1', label: '2026.2', startDate: d(-22), endDate: d(101) },
  { id: 'sem_0', userId: 'user_1', label: '2026.1', startDate: d(-190), endDate: d(-40) },
];

/* ------------------------------------------------------------------ */

const exams: Exam[] = [
  {
    id: 'exam_1',
    subjectId: 'sub_calc',
    title: 'Prova 2 — Técnicas de integração',
    date: d(8),
    startTime: 480,
    room: 'C-210',
    topics: ['Integração por partes', 'Frações parciais', 'Substituição trigonométrica', 'Integrais impróprias'],
    weightInGrade: 40,
    targetHours: 14,
    grade: null,
  },
  {
    id: 'exam_2',
    subjectId: 'sub_est',
    title: 'Prova 1 — Inferência',
    date: d(14),
    startTime: 480,
    room: 'B-105',
    topics: ['Intervalos de confiança', 'Testes de hipótese', 'Erro tipo I e II'],
    weightInGrade: 35,
    targetHours: 10,
    grade: null,
  },
  {
    id: 'exam_3',
    subjectId: 'sub_ed',
    title: 'Prova 2 — Árvores e grafos',
    date: d(23),
    startTime: 600,
    room: 'Lab 2',
    topics: ['AVL', 'Heap', 'BFS/DFS', 'Dijkstra'],
    weightInGrade: 40,
    targetHours: 12,
    grade: null,
  },
  {
    id: 'exam_4',
    subjectId: 'sub_bd',
    title: 'Prova 1 — Modelagem e SQL',
    date: d(36),
    startTime: 840,
    room: 'Lab 1',
    topics: ['Modelo ER', 'Normalização', 'Junções', 'Subconsultas'],
    weightInGrade: 30,
    targetHours: 8,
    grade: null,
  },
  {
    id: 'exam_5',
    subjectId: 'sub_calc',
    title: 'Prova 1 — Sequências e séries',
    date: d(-18),
    room: 'C-210',
    topics: ['Sequências', 'Séries numéricas', 'Testes de convergência'],
    weightInGrade: 30,
    targetHours: 10,
    grade: 5.8,
  },
];

const assignments: Assignment[] = [
  {
    id: 'asg_1',
    subjectId: 'sub_ing',
    title: 'Resenha de artigo técnico',
    description: 'Resenha de 2 páginas sobre um artigo de engenharia de software em inglês.',
    dueDate: d(-1),
    dueTime: 1380,
    status: 'todo',
    estimatedHours: 2,
    weightInGrade: 15,
    favorite: false,
    createdAt: d(-12) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_1', title: 'Escolher o artigo', done: true },
      { id: 'st_2', title: 'Fichamento', done: false },
      { id: 'st_3', title: 'Redação final', done: false },
    ],
    attachments: [{ id: 'at_1', name: 'orientacoes-resenha.pdf', sizeKb: 220, kind: 'pdf' }],
  },
  {
    id: 'asg_2',
    subjectId: 'sub_bd',
    title: 'Modelagem do projeto (DER)',
    description: 'Diagrama entidade-relacionamento do sistema escolhido pelo grupo.',
    dueDate: d(1),
    dueTime: 1320,
    status: 'doing',
    estimatedHours: 4,
    weightInGrade: 20,
    favorite: true,
    createdAt: d(-9) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_4', title: 'Levantar entidades', done: true },
      { id: 'st_5', title: 'Definir cardinalidades', done: true },
      { id: 'st_6', title: 'Normalizar até 3FN', done: false },
      { id: 'st_7', title: 'Exportar diagrama', done: false },
    ],
    attachments: [],
  },
  {
    id: 'asg_3',
    subjectId: 'sub_calc',
    title: 'Lista 4 — Integração por partes',
    dueDate: d(2),
    status: 'todo',
    estimatedHours: 3,
    weightInGrade: 10,
    favorite: false,
    createdAt: d(-5) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_8', title: 'Exercícios 1 a 10', done: false },
      { id: 'st_9', title: 'Exercícios 11 a 18', done: false },
    ],
    attachments: [{ id: 'at_2', name: 'lista-04.pdf', sizeKb: 480, kind: 'pdf' }],
  },
  {
    id: 'asg_4',
    subjectId: 'sub_es',
    title: 'Apresentação do sprint 2',
    dueDate: d(3),
    dueTime: 840,
    status: 'todo',
    estimatedHours: 2,
    weightInGrade: 10,
    favorite: false,
    createdAt: d(-7) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_10', title: 'Montar slides', done: false },
      { id: 'st_11', title: 'Ensaiar com o grupo', done: false },
    ],
    attachments: [],
  },
  {
    id: 'asg_5',
    subjectId: 'sub_ed',
    title: 'Implementar árvore AVL',
    description: 'Inserção, remoção e rotações, com testes automatizados.',
    dueDate: d(6),
    status: 'doing',
    estimatedHours: 6,
    weightInGrade: 25,
    favorite: true,
    createdAt: d(-10) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_12', title: 'Inserção + rotações', done: true },
      { id: 'st_13', title: 'Remoção', done: false },
      { id: 'st_14', title: 'Testes', done: false },
    ],
    attachments: [{ id: 'at_3', name: 'especificacao-avl.pdf', sizeKb: 310, kind: 'pdf' }],
  },
  {
    id: 'asg_6',
    subjectId: 'sub_est',
    title: 'Relatório de regressão linear',
    dueDate: d(17),
    status: 'todo',
    estimatedHours: 5,
    weightInGrade: 25,
    favorite: false,
    createdAt: d(-3) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_15', title: 'Coletar base de dados', done: false },
      { id: 'st_16', title: 'Rodar o modelo', done: false },
      { id: 'st_17', title: 'Escrever análise', done: false },
    ],
    attachments: [],
  },
  {
    id: 'asg_7',
    subjectId: 'sub_es',
    title: 'Documento de requisitos',
    dueDate: d(9),
    status: 'review',
    estimatedHours: 5,
    weightInGrade: 20,
    favorite: false,
    createdAt: d(-14) + 'T09:00:00.000Z',
    subtasks: [
      { id: 'st_18', title: 'Requisitos funcionais', done: true },
      { id: 'st_19', title: 'Requisitos não funcionais', done: true },
      { id: 'st_20', title: 'Revisão do grupo', done: false },
    ],
    attachments: [{ id: 'at_4', name: 'requisitos-v2.docx', sizeKb: 96, kind: 'doc' }],
  },
  {
    id: 'asg_8',
    subjectId: 'sub_ed',
    title: 'Seminário de complexidade',
    dueDate: d(-8),
    status: 'done',
    estimatedHours: 4,
    weightInGrade: 10,
    favorite: false,
    createdAt: d(-20) + 'T09:00:00.000Z',
    subtasks: [{ id: 'st_21', title: 'Slides', done: true }],
    attachments: [],
  },
];

/* ------------------------------------------------------------------ */

interface SeedMaterial {
  id: string;
  subjectId: string;
  kind: Material['kind'];
  title: string;
  tags: string[];
  progress: number;
  size?: number;
  position?: number;
  author?: string;
  studiedDaysAgo?: number;
  favorite?: boolean;
}

const rawMaterials: SeedMaterial[] = [
  { id: 'mat_1', subjectId: 'sub_calc', kind: 'pdf', title: 'Integração por partes — slides da aula 7', tags: ['Integração por partes', 'Exemplos resolvidos'], progress: 100, size: 32, position: 32, studiedDaysAgo: 3, favorite: true },
  { id: 'mat_2', subjectId: 'sub_calc', kind: 'pdf', title: 'Frações parciais — apostila', tags: ['Frações parciais', 'Decomposição'], progress: 45, size: 24, position: 11 },
  { id: 'mat_3', subjectId: 'sub_calc', kind: 'video', title: 'Substituição trigonométrica (aula gravada)', tags: ['Substituição trigonométrica'], progress: 70, size: 62, position: 43 },
  { id: 'mat_4', subjectId: 'sub_ed', kind: 'pdf', title: 'Árvores balanceadas AVL', tags: ['AVL', 'Rotações'], progress: 100, size: 48, position: 48, studiedDaysAgo: 6, favorite: true },
  { id: 'mat_5', subjectId: 'sub_ed', kind: 'video', title: 'Grafos: BFS e DFS na prática', tags: ['Grafos', 'BFS', 'DFS'], progress: 100, size: 54, position: 54, studiedDaysAgo: 1 },
  { id: 'mat_6', subjectId: 'sub_ed', kind: 'reading', title: 'Cormen — cap. 22 (Busca em grafos)', tags: ['Grafos', 'Algoritmos'], progress: 30, size: 46, position: 14, author: 'Cormen et al.' },
  { id: 'mat_7', subjectId: 'sub_bd', kind: 'pdf', title: 'Normalização até 3FN — slides', tags: ['Normalização', '3FN'], progress: 100, size: 28, position: 28, studiedDaysAgo: 9 },
  { id: 'mat_8', subjectId: 'sub_bd', kind: 'video', title: 'SQL: junções e subconsultas', tags: ['SQL', 'Junções'], progress: 20, size: 71, position: 14 },
  { id: 'mat_9', subjectId: 'sub_es', kind: 'reading', title: 'Engenharia de Software Moderna — cap. 3', tags: ['Requisitos', 'Processos'], progress: 60, size: 38, position: 23, author: 'Marco Tulio Valente' },
  { id: 'mat_10', subjectId: 'sub_es', kind: 'pdf', title: 'Padrões de projeto — resumo da turma', tags: ['Design patterns', 'GoF'], progress: 100, size: 18, position: 18, studiedDaysAgo: 15 },
  { id: 'mat_11', subjectId: 'sub_est', kind: 'pdf', title: 'Testes de hipótese — passo a passo', tags: ['Testes de hipótese', 'Erro tipo I'], progress: 55, size: 34, position: 19 },
  { id: 'mat_12', subjectId: 'sub_est', kind: 'video', title: 'Intervalos de confiança explicados', tags: ['Intervalo de confiança'], progress: 100, size: 41, position: 41, studiedDaysAgo: 2 },
  { id: 'mat_13', subjectId: 'sub_ing', kind: 'reading', title: 'Artigo: "Technical debt in practice"', tags: ['Reading', 'Vocabulário técnico'], progress: 15, size: 12, position: 2, author: 'Ernst et al.' },
  { id: 'mat_14', subjectId: 'sub_ing', kind: 'video', title: 'Presentation skills for engineers', tags: ['Speaking'], progress: 0, size: 26, position: 0 },
];

const materials: Material[] = rawMaterials.map((m) => ({
  id: m.id,
  subjectId: m.subjectId,
  kind: m.kind,
  title: m.title,
  tags: m.tags,
  favorite: m.favorite ?? false,
  progress: m.progress,
  size: m.size,
  position: m.position,
  author: m.author,
  addedAt: d(-(20 - (Number(m.id.split('_')[1]) % 18))) + 'T12:00:00.000Z',
  studiedAt: m.studiedDaysAgo !== undefined ? d(-m.studiedDaysAgo) + 'T20:30:00.000Z' : null,
  aiSummary: null,
  aiFlashcards: [],
  aiQuiz: [],
}));

/* ------------------------------------------------------------------ *
 * Revisões: geradas a partir dos materiais já estudados, seguindo a
 * escada 1-3-7-15-30-60 a partir da data de estudo.
 * ------------------------------------------------------------------ */

const reviews: Review[] = [
  { id: 'rev_1', subjectId: 'sub_ed', sourceType: 'material', sourceId: 'mat_5', title: 'Grafos: BFS e DFS na prática', step: 0, scheduledFor: d(0), repetitions: 0, completedAt: null },
  { id: 'rev_2', subjectId: 'sub_est', sourceType: 'material', sourceId: 'mat_12', title: 'Intervalos de confiança explicados', step: 1, scheduledFor: d(0), repetitions: 1, completedAt: null, lastGrade: 'easy' },
  { id: 'rev_3', subjectId: 'sub_calc', sourceType: 'material', sourceId: 'mat_1', title: 'Integração por partes — slides da aula 7', step: 1, scheduledFor: d(-2), repetitions: 1, completedAt: null, lastGrade: 'hard' },
  { id: 'rev_4', subjectId: 'sub_ed', sourceType: 'material', sourceId: 'mat_4', title: 'Árvores balanceadas AVL', step: 2, scheduledFor: d(1), repetitions: 2, completedAt: null, lastGrade: 'easy' },
  { id: 'rev_5', subjectId: 'sub_bd', sourceType: 'material', sourceId: 'mat_7', title: 'Normalização até 3FN', step: 2, scheduledFor: d(-1), repetitions: 2, completedAt: null, lastGrade: 'easy' },
  { id: 'rev_6', subjectId: 'sub_es', sourceType: 'material', sourceId: 'mat_10', title: 'Padrões de projeto — resumo', step: 3, scheduledFor: d(4), repetitions: 3, completedAt: null, lastGrade: 'easy' },
  { id: 'rev_7', subjectId: 'sub_calc', sourceType: 'exam', sourceId: 'exam_5', title: 'Revisão geral — sequências e séries', step: 2, scheduledFor: d(2), repetitions: 2, completedAt: null, lastGrade: 'hard' },
  { id: 'rev_8', subjectId: 'sub_est', sourceType: 'material', sourceId: 'mat_11', title: 'Testes de hipótese — passo a passo', step: 0, scheduledFor: d(3), repetitions: 0, completedAt: null },
  { id: 'rev_9', subjectId: 'sub_ed', sourceType: 'material', sourceId: 'mat_4', title: 'Árvores balanceadas AVL', step: 1, scheduledFor: d(-4), repetitions: 1, completedAt: d(-4) + 'T21:10:00.000Z', lastGrade: 'easy' },
  { id: 'rev_10', subjectId: 'sub_calc', sourceType: 'material', sourceId: 'mat_1', title: 'Integração por partes', step: 0, scheduledFor: d(-6), repetitions: 0, completedAt: d(-6) + 'T20:00:00.000Z', lastGrade: 'hard' },
];

/* ------------------------------------------------------------------ *
 * Sessões: 3 semanas de histórico + a semana corrente planejada.
 * ------------------------------------------------------------------ */

const EVENING_SLOTS = [1140, 1200, 1260]; // 19h, 20h, 21h
// Fins de semana seguem as janelas declaradas nas preferências:
// sábado de manhã e à tarde, domingo só à tarde.
const SATURDAY_SLOTS = [540, 600, 900];
const SUNDAY_SLOTS = [900, 960];

function slotsFor(weekday: number): number[] {
  if (weekday === 6) return SATURDAY_SLOTS;
  if (weekday === 0) return SUNDAY_SLOTS;
  return EVENING_SLOTS;
}

function pickSubject(i: number): string {
  const order = ['sub_calc', 'sub_ed', 'sub_est', 'sub_bd', 'sub_es', 'sub_calc', 'sub_ing'];
  return order[i % order.length];
}

function buildSessions(): StudySession[] {
  const out: StudySession[] = [];
  let n = 0;

  // histórico: dos 24 dias anteriores até ontem
  for (let offset = -24; offset < 0; offset++) {
    const date = d(offset);
    const wd = weekdayOf(date);
    const slots = slotsFor(wd);
    const blocks = wd === 0 ? 1 : Math.round(1 + rand() * 2);

    for (let b = 0; b < blocks; b++) {
      const roll = rand();
      // ~80% de cumprimento — deixa espaço para atraso e redistribuição.
      const status: StudySession['status'] = roll > 0.8 ? 'missed' : 'done';
      const minutes = 50;
      out.push({
        id: `hist_${n}`,
        subjectId: pickSubject(n),
        date,
        start: slots[b % slots.length],
        minutes,
        actualMinutes: status === 'done' ? (roll > 0.6 ? 50 : 45 + Math.round(rand() * 15)) : undefined,
        status,
        origin: 'auto',
        pomodoros: status === 'done' ? 2 : undefined,
      });
      n++;
    }
  }

  // semana corrente
  for (const date of weekRange(T)) {
    const wd = weekdayOf(date);
    const slots = slotsFor(wd);
    const blocks = wd === 0 ? 2 : 3;

    for (let b = 0; b < blocks; b++) {
      const past = date < T;
      const roll = rand();
      const status: StudySession['status'] = past ? (roll > 0.75 ? 'missed' : 'done') : 'planned';
      out.push({
        id: `week_${n}`,
        subjectId: pickSubject(n),
        date,
        start: slots[b % slots.length],
        minutes: 50,
        actualMinutes: status === 'done' ? 50 : undefined,
        status,
        origin: 'auto',
        pomodoros: status === 'done' ? 2 : undefined,
      });
      n++;
    }
  }

  // garante que hoje já tenha uma sessão concluída (streak vivo)
  const todaySession = out.find((s) => s.date === T);
  if (todaySession) {
    todaySession.status = 'done';
    todaySession.actualMinutes = 50;
    todaySession.pomodoros = 2;
  }

  return out;
}

const sessions = buildSessions();

/* ------------------------------------------------------------------ */

const weekDates = weekRange(T);

const goals: Goal[] = [
  {
    id: 'goal_1',
    userId: 'user_1',
    title: '20h de estudo nesta semana',
    metric: 'studyHours',
    target: 20,
    period: 'weekly',
    startDate: weekDates[0],
    endDate: weekDates[6],
    archived: false,
  },
  {
    id: 'goal_2',
    userId: 'user_1',
    title: 'Fechar 12 revisões',
    metric: 'reviews',
    target: 12,
    period: 'weekly',
    startDate: weekDates[0],
    endDate: weekDates[6],
    archived: false,
  },
  {
    id: 'goal_3',
    userId: 'user_1',
    subjectId: 'sub_calc',
    title: 'Cálculo II: 10h até a prova',
    metric: 'studyHours',
    target: 10,
    period: 'weekly',
    startDate: weekDates[0],
    endDate: d(8),
    archived: false,
  },
  {
    id: 'goal_4',
    userId: 'user_1',
    title: 'Concluir 6 materiais no mês',
    metric: 'materials',
    target: 6,
    period: 'monthly',
    startDate: d(-27),
    endDate: d(3),
    archived: false,
  },
];

const notifications: AppNotification[] = [
  {
    id: 'not_1',
    userId: 'user_1',
    kind: 'deadline',
    severity: 'critical',
    title: 'Entrega atrasada',
    body: 'A resenha de Inglês Técnico venceu ontem e ainda está em "a fazer".',
    createdAt: d(0) + 'T07:30:00.000Z',
    read: false,
    link: '/trabalhos',
  },
  {
    id: 'not_2',
    userId: 'user_1',
    kind: 'reviewDue',
    severity: 'warning',
    title: '2 revisões vencidas',
    body: 'Integração por partes e Normalização até 3FN passaram da data.',
    createdAt: d(0) + 'T07:30:00.000Z',
    read: false,
    link: '/revisao',
  },
  {
    id: 'not_3',
    userId: 'user_1',
    kind: 'exam',
    severity: 'warning',
    title: 'Prova de Cálculo II em 8 dias',
    body: 'Faltam ~11h do plano de estudo para essa prova.',
    createdAt: d(0) + 'T07:30:00.000Z',
    read: false,
    link: '/provas',
  },
  {
    id: 'not_4',
    userId: 'user_1',
    kind: 'streak',
    severity: 'info',
    title: 'Sequência mantida',
    body: 'Você estudou hoje — a sequência continua de pé.',
    createdAt: d(0) + 'T21:00:00.000Z',
    read: true,
    link: '/',
  },
  {
    id: 'not_5',
    userId: 'user_1',
    kind: 'overload',
    severity: 'warning',
    title: 'Quinta-feira sobrecarregada',
    body: 'Há mais horas planejadas do que o seu teto diário de 4h.',
    createdAt: d(-1) + 'T18:00:00.000Z',
    read: true,
    link: '/semana',
  },
  {
    id: 'not_6',
    userId: 'user_1',
    kind: 'goalAtRisk',
    severity: 'info',
    title: 'Meta semanal em ritmo lento',
    body: 'Faltam horas para bater as 20h desta semana.',
    createdAt: d(-2) + 'T09:00:00.000Z',
    read: true,
    link: '/metas',
  },
];

/* ------------------------------------------------------------------ */

function buildGamification(): Gamification {
  const done = sessions.filter((s) => s.status === 'done');
  const events: XpEvent[] = done.map((s, i) => ({
    id: `xp_s_${i}`,
    date: s.date,
    amount: XP_RULES.session,
    reason: 'session',
    label: 'Sessão de estudo concluída',
  }));

  reviews
    .filter((r) => r.completedAt)
    .forEach((r, i) =>
      events.push({
        id: `xp_r_${i}`,
        date: r.completedAt!.slice(0, 10),
        amount: XP_RULES.review,
        reason: 'review',
        label: `Revisão feita: ${r.title}`,
      }),
    );

  assignments
    .filter((a) => a.status === 'done')
    .forEach((a, i) =>
      events.push({
        id: `xp_a_${i}`,
        date: a.dueDate,
        amount: XP_RULES.assignment,
        reason: 'assignment',
        label: `Entrega concluída: ${a.title}`,
      }),
    );

  return {
    xp: events.reduce((acc, e) => acc + e.amount, 0),
    events: events.sort((a, b) => b.date.localeCompare(a.date)),
    activeDays: [...new Set(done.map((s) => s.date))].sort(),
  };
}

export function buildSeed(): AppData {
  return {
    user,
    semesters,
    professors,
    subjects,
    assignments,
    exams,
    materials,
    sessions,
    reviews,
    goals,
    notifications,
    gamification: buildGamification(),
  };
}
