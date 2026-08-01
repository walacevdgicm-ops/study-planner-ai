/**
 * Contratos de domínio do Study Planner AI.
 * Espelham 1:1 as entidades e relacionamentos aprovados na Etapa 1.
 * Compartilhados entre apps/web, apps/api e apps/worker.
 */

export type ID = string;
/** Data ISO (YYYY-MM-DD) — sem fuso, para datas de calendário. */
export type ISODate = string;
/** Timestamp ISO completo. */
export type ISODateTime = string;
/** Minutos desde 00:00 (planejamento intra-dia). */
export type MinuteOfDay = number;

/** Índice na escala de cores de disciplina (tons de marcador). */
export type SubjectColor = 0 | 1 | 2 | 3 | 4 | 5;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/* ------------------------------------------------------------------ *
 * Usuário e semestre
 * ------------------------------------------------------------------ */

export interface TimeWindow {
  weekday: Weekday;
  start: MinuteOfDay;
  end: MinuteOfDay;
}

export interface StudyPreferences {
  /** Janelas semanais em que o aluno declara estar livre para estudar. */
  availability: TimeWindow[];
  /** Teto de horas planejadas por dia — dispara o alerta de sobrecarga. */
  maxDailyHours: number;
  sessionMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  /** Intervalos de revisão espaçada, em dias. Padrão 1-3-7-15-30-60. */
  reviewIntervals: number[];
}

export interface NotificationPreferences {
  deadlines: boolean;
  reviews: boolean;
  goalsAtRisk: boolean;
  dailyDigest: boolean;
  digestHour: number;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  course: string;
  university: string;
  currentSemesterId: ID;
  avatarInitials: string;
  preferences: StudyPreferences;
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  createdAt: ISODateTime;
}

export interface Semester {
  id: ID;
  userId: ID;
  label: string;
  startDate: ISODate;
  endDate: ISODate;
}

/* ------------------------------------------------------------------ *
 * Disciplinas
 * ------------------------------------------------------------------ */

export interface Professor {
  id: ID;
  name: string;
  email?: string;
  office?: string;
}

export interface ClassSlot {
  weekday: Weekday;
  start: MinuteOfDay;
  end: MinuteOfDay;
  room?: string;
}

export interface Subject {
  id: ID;
  semesterId: ID;
  professorId: ID | null;
  name: string;
  code: string;
  color: SubjectColor;
  /** Carga horária total da disciplina no semestre. */
  totalHours: number;
  credits: number;
  /** Peso declarado pelo aluno (1 = tranquila, 5 = crítica). */
  weight: 1 | 2 | 3 | 4 | 5;
  /** Média atual (0–10), quando já houver nota lançada. */
  currentGrade: number | null;
  classSlots: ClassSlot[];
  favorite: boolean;
  archived: boolean;
}

/* ------------------------------------------------------------------ *
 * Trabalhos, provas e materiais
 * ------------------------------------------------------------------ */

export type AssignmentStatus = 'todo' | 'doing' | 'review' | 'done';

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Attachment {
  id: ID;
  name: string;
  sizeKb: number;
  kind: 'pdf' | 'doc' | 'slide' | 'image' | 'link';
  url?: string;
}

export interface Assignment {
  id: ID;
  subjectId: ID;
  title: string;
  description?: string;
  dueDate: ISODate;
  dueTime?: MinuteOfDay;
  status: AssignmentStatus;
  /** Esforço estimado, em horas. */
  estimatedHours: number;
  weightInGrade?: number;
  subtasks: Subtask[];
  attachments: Attachment[];
  favorite: boolean;
  createdAt: ISODateTime;
}

export interface Exam {
  id: ID;
  subjectId: ID;
  title: string;
  date: ISODate;
  startTime?: MinuteOfDay;
  room?: string;
  /** Conteúdo programático cobrado. */
  topics: string[];
  weightInGrade?: number;
  grade?: number | null;
  /** Horas de estudo que o aluno julga necessárias até a prova. */
  targetHours: number;
}

export type MaterialKind = 'pdf' | 'video' | 'reading';

/**
 * Arquivo real associado a um material, armazenado via função serverless
 * (Netlify Function + Netlify Blobs). Sem isso, Material é só metadado.
 */
export interface MaterialFile {
  /** Chave do blob — usada para montar a URL de streaming/leitura. */
  id: ID;
  mimeType: string;
  name: string;
  sizeBytes: number;
  /** Texto extraído (hoje só para PDF) — base para o assistente de IA real na v2. */
  hasText: boolean;
  uploadedAt: ISODateTime;
}

/**
 * Marcação de marca-texto sobre uma página de PDF. Posição em percentual
 * relativo à página renderizada (0–1), para continuar correta em qualquer
 * nível de zoom ou tamanho de tela.
 */
export interface PdfHighlight {
  id: ID;
  page: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  color: string;
  createdAt: ISODateTime;
}

export interface Material {
  id: ID;
  subjectId: ID;
  kind: MaterialKind;
  title: string;
  tags: string[];
  favorite: boolean;
  /** Progresso 0–100 (páginas lidas, minutos assistidos, etc). */
  progress: number;
  /** pdf: nº de páginas | video: minutos | reading: nº de páginas. */
  size?: number;
  /** Posição atual (página ou minuto), para retomar. */
  position?: number;
  author?: string;
  sourceUrl?: string;
  addedAt: ISODateTime;
  /** Preenchido quando o aluno marca como estudado — dispara as revisões. */
  studiedAt?: ISODateTime | null;
  /** Arquivo enviado de verdade (PDF/vídeo/outro). Ausente nos materiais só-metadado. */
  file?: MaterialFile | null;
  /** Marca-texto sobre as páginas do PDF (só faz sentido para kind: 'pdf'). */
  highlights?: PdfHighlight[];
  /** Saída do assistente de IA (stub na Etapa 2). */
  aiSummary?: AiSummary | null;
  aiFlashcards?: Flashcard[];
  aiQuiz?: QuizQuestion[];
}

/* ------------------------------------------------------------------ *
 * Assistente de IA sobre o material do aluno
 * ------------------------------------------------------------------ */

export interface AiSummary {
  generatedAt: ISODateTime;
  /** 'mock' na Etapa 2; 'anthropic' quando a API for plugada (v2). */
  source: 'mock' | 'anthropic';
  headline: string;
  keyPoints: string[];
  glossary: { term: string; definition: string }[];
}

export interface Flashcard {
  id: ID;
  front: string;
  back: string;
  materialId: ID;
  /** Já enviado para a fila de revisão espaçada? */
  queued: boolean;
}

export interface QuizQuestion {
  id: ID;
  question: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

/* ------------------------------------------------------------------ *
 * Estudo, planejamento e revisão
 * ------------------------------------------------------------------ */

export type SessionStatus = 'planned' | 'done' | 'missed' | 'skipped';
export type SessionOrigin = 'auto' | 'manual' | 'redistributed';

export interface StudySession {
  id: ID;
  subjectId: ID;
  materialId?: ID | null;
  assignmentId?: ID | null;
  reviewId?: ID | null;
  date: ISODate;
  start: MinuteOfDay;
  /** Duração planejada, em minutos. */
  minutes: number;
  /** Minutos efetivamente cumpridos (pode divergir do planejado). */
  actualMinutes?: number;
  status: SessionStatus;
  origin: SessionOrigin;
  note?: string;
  pomodoros?: number;
}

export type ReviewGrade = 'forgot' | 'hard' | 'easy';

export interface Review {
  id: ID;
  subjectId: ID;
  /** Toda revisão nasce de um Material ou de uma Prova. */
  sourceType: 'material' | 'exam' | 'flashcard';
  sourceId: ID;
  title: string;
  /** Posição na escala 1-3-7-15-30-60. */
  step: number;
  scheduledFor: ISODate;
  completedAt?: ISODateTime | null;
  lastGrade?: ReviewGrade;
  /** Repetições feitas, usado no ajuste do próximo intervalo. */
  repetitions: number;
}

/* ------------------------------------------------------------------ *
 * Metas, notificações e gamificação
 * ------------------------------------------------------------------ */

export type GoalPeriod = 'weekly' | 'monthly';
export type GoalMetric = 'studyHours' | 'sessions' | 'reviews' | 'assignments' | 'materials';

export interface Goal {
  id: ID;
  userId: ID;
  subjectId?: ID | null;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  startDate: ISODate;
  endDate: ISODate;
  archived: boolean;
}

export type NotificationKind =
  | 'deadline'
  | 'exam'
  | 'reviewDue'
  | 'goalAtRisk'
  | 'overload'
  | 'conflict'
  | 'streak'
  | 'system';

export interface AppNotification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: ISODateTime;
  read: boolean;
  /** Rota interna para onde o alerta leva. */
  link?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface XpEvent {
  id: ID;
  date: ISODate;
  amount: number;
  reason: 'session' | 'assignment' | 'review' | 'goal' | 'streak';
  label: string;
}

export interface Gamification {
  xp: number;
  events: XpEvent[];
  /** Dias com pelo menos uma sessão concluída — base do streak. */
  activeDays: ISODate[];
}

/* ------------------------------------------------------------------ *
 * Saídas do motor de regras (v1, determinístico)
 * ------------------------------------------------------------------ */

export interface SubjectPriority {
  subjectId: ID;
  /** 0–100. */
  score: number;
  level: 'critical' | 'high' | 'normal' | 'low';
  reasons: string[];
  hoursRemaining: number;
  daysToNextExam: number | null;
}

export interface ScheduleConflict {
  id: string;
  date: ISODate;
  kind: 'overlap' | 'classClash' | 'overload' | 'deadlineCollision';
  message: string;
  sessionIds: ID[];
  severity: 'warning' | 'critical';
}

export interface DayLoad {
  date: ISODate;
  plannedMinutes: number;
  doneMinutes: number;
  capacityMinutes: number;
  overloaded: boolean;
}
