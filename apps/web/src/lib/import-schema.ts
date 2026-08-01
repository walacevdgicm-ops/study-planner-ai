import { z } from 'zod';

/**
 * Valida um arquivo de exportação antes de aplicá-lo ao store. Espelha
 * `AppData` (src/data/seed.ts) e as entidades de `@spa/shared-types`.
 * `.strict()` em cada nível rejeita campos desconhecidos — um JSON malicioso
 * ou de uma versão futura do formato é recusado em vez de aceito às cegas.
 *
 * Isto é validação estrutural (forma e tipo), não regra de negócio: um id
 * apontando para uma disciplina inexistente passa aqui — a integridade
 * referencial entre entidades fica para quando houver back-end.
 */

const id = z.string().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (esperado AAAA-MM-DD)');
const isoDateTime = z.string().min(1);
const weekday = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
const subjectColor = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const timeWindowSchema = z
  .object({ weekday, start: z.number(), end: z.number() })
  .strict();

const studyPreferencesSchema = z
  .object({
    availability: z.array(timeWindowSchema),
    maxDailyHours: z.number(),
    sessionMinutes: z.number(),
    breakMinutes: z.number(),
    longBreakMinutes: z.number(),
    pomodorosUntilLongBreak: z.number(),
    reviewIntervals: z.array(z.number()),
  })
  .strict();

const notificationPreferencesSchema = z
  .object({
    deadlines: z.boolean(),
    reviews: z.boolean(),
    goalsAtRisk: z.boolean(),
    dailyDigest: z.boolean(),
    digestHour: z.number(),
  })
  .strict();

const userSchema = z
  .object({
    id,
    name: z.string(),
    email: z.string(),
    course: z.string(),
    university: z.string(),
    currentSemesterId: id,
    avatarInitials: z.string(),
    preferences: studyPreferencesSchema,
    notifications: notificationPreferencesSchema,
    theme: z.enum(['light', 'dark', 'system']),
    createdAt: isoDateTime,
  })
  .strict();

const semesterSchema = z
  .object({ id, userId: id, label: z.string(), startDate: isoDate, endDate: isoDate })
  .strict();

const professorSchema = z
  .object({ id, name: z.string(), email: z.string().optional(), office: z.string().optional() })
  .strict();

const classSlotSchema = z
  .object({ weekday, start: z.number(), end: z.number(), room: z.string().optional() })
  .strict();

const subjectSchema = z
  .object({
    id,
    semesterId: id,
    professorId: id.nullable(),
    name: z.string(),
    code: z.string(),
    color: subjectColor,
    totalHours: z.number(),
    credits: z.number(),
    weight: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    currentGrade: z.number().nullable(),
    classSlots: z.array(classSlotSchema),
    favorite: z.boolean(),
    archived: z.boolean(),
  })
  .strict();

const subtaskSchema = z.object({ id, title: z.string(), done: z.boolean() }).strict();

const attachmentSchema = z
  .object({
    id,
    name: z.string(),
    sizeKb: z.number(),
    kind: z.enum(['pdf', 'doc', 'slide', 'image', 'link']),
    url: z.string().optional(),
  })
  .strict();

const assignmentSchema = z
  .object({
    id,
    subjectId: id,
    title: z.string(),
    description: z.string().optional(),
    dueDate: isoDate,
    dueTime: z.number().optional(),
    status: z.enum(['todo', 'doing', 'review', 'done']),
    estimatedHours: z.number(),
    weightInGrade: z.number().optional(),
    subtasks: z.array(subtaskSchema),
    attachments: z.array(attachmentSchema),
    favorite: z.boolean(),
    createdAt: isoDateTime,
  })
  .strict();

const examSchema = z
  .object({
    id,
    subjectId: id,
    title: z.string(),
    date: isoDate,
    startTime: z.number().optional(),
    room: z.string().optional(),
    topics: z.array(z.string()),
    weightInGrade: z.number().optional(),
    grade: z.number().nullable().optional(),
    targetHours: z.number(),
  })
  .strict();

const materialFileSchema = z
  .object({
    id,
    mimeType: z.string(),
    name: z.string(),
    sizeBytes: z.number(),
    hasText: z.boolean(),
    uploadedAt: isoDateTime,
  })
  .strict();

const pdfHighlightSchema = z
  .object({
    id,
    page: z.number(),
    xPct: z.number(),
    yPct: z.number(),
    widthPct: z.number(),
    heightPct: z.number(),
    color: z.string(),
    createdAt: isoDateTime,
  })
  .strict();

const aiSummarySchema = z
  .object({
    generatedAt: isoDateTime,
    source: z.enum(['mock', 'anthropic']),
    headline: z.string(),
    keyPoints: z.array(z.string()),
    glossary: z.array(z.object({ term: z.string(), definition: z.string() }).strict()),
  })
  .strict();

const flashcardSchema = z
  .object({ id, front: z.string(), back: z.string(), materialId: id, queued: z.boolean() })
  .strict();

const quizQuestionSchema = z
  .object({
    id,
    question: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    rationale: z.string(),
  })
  .strict();

const materialSchema = z
  .object({
    id,
    subjectId: id,
    kind: z.enum(['pdf', 'video', 'reading']),
    title: z.string(),
    tags: z.array(z.string()),
    favorite: z.boolean(),
    progress: z.number(),
    size: z.number().optional(),
    position: z.number().optional(),
    author: z.string().optional(),
    sourceUrl: z.string().optional(),
    addedAt: isoDateTime,
    studiedAt: isoDateTime.nullable().optional(),
    file: materialFileSchema.nullable().optional(),
    highlights: z.array(pdfHighlightSchema).optional(),
    aiSummary: aiSummarySchema.nullable().optional(),
    aiFlashcards: z.array(flashcardSchema).optional(),
    aiQuiz: z.array(quizQuestionSchema).optional(),
  })
  .strict();

const studySessionSchema = z
  .object({
    id,
    subjectId: id,
    materialId: id.nullable().optional(),
    assignmentId: id.nullable().optional(),
    reviewId: id.nullable().optional(),
    date: isoDate,
    start: z.number(),
    minutes: z.number(),
    actualMinutes: z.number().optional(),
    status: z.enum(['planned', 'done', 'missed', 'skipped']),
    origin: z.enum(['auto', 'manual', 'redistributed']),
    note: z.string().optional(),
    pomodoros: z.number().optional(),
  })
  .strict();

const reviewSchema = z
  .object({
    id,
    subjectId: id,
    sourceType: z.enum(['material', 'exam', 'flashcard']),
    sourceId: id,
    title: z.string(),
    step: z.number(),
    scheduledFor: isoDate,
    completedAt: isoDateTime.nullable().optional(),
    lastGrade: z.enum(['forgot', 'hard', 'easy']).optional(),
    repetitions: z.number(),
  })
  .strict();

const goalSchema = z
  .object({
    id,
    userId: id,
    subjectId: id.nullable().optional(),
    title: z.string(),
    metric: z.enum(['studyHours', 'sessions', 'reviews', 'assignments', 'materials']),
    target: z.number(),
    period: z.enum(['weekly', 'monthly']),
    startDate: isoDate,
    endDate: isoDate,
    archived: z.boolean(),
  })
  .strict();

const notificationSchema = z
  .object({
    id,
    userId: id,
    kind: z.enum(['deadline', 'exam', 'reviewDue', 'goalAtRisk', 'overload', 'conflict', 'streak', 'system']),
    title: z.string(),
    body: z.string(),
    createdAt: isoDateTime,
    read: z.boolean(),
    link: z.string().optional(),
    severity: z.enum(['info', 'warning', 'critical']),
  })
  .strict();

const xpEventSchema = z
  .object({
    id,
    date: isoDate,
    amount: z.number(),
    reason: z.enum(['session', 'assignment', 'review', 'goal', 'streak']),
    label: z.string(),
  })
  .strict();

const gamificationSchema = z
  .object({
    xp: z.number(),
    events: z.array(xpEventSchema),
    activeDays: z.array(isoDate),
  })
  .strict();

export const appDataSchema = z
  .object({
    user: userSchema,
    semesters: z.array(semesterSchema),
    professors: z.array(professorSchema),
    subjects: z.array(subjectSchema),
    assignments: z.array(assignmentSchema),
    exams: z.array(examSchema),
    materials: z.array(materialSchema),
    sessions: z.array(studySessionSchema),
    reviews: z.array(reviewSchema),
    goals: z.array(goalSchema),
    notifications: z.array(notificationSchema),
    gamification: gamificationSchema,
  })
  .strict();

export type AppDataValidated = z.infer<typeof appDataSchema>;

export interface ImportValidationResult {
  ok: boolean;
  data?: AppDataValidated;
  /** Mensagens já em português, prontas para mostrar ao usuário. */
  errors: string[];
}

/**
 * Aceita tanto o formato de exportação (`{ version, exportedAt, data }`)
 * quanto o objeto de dados puro, para compatibilidade com exports antigos.
 */
export function validateImport(json: string): ImportValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, errors: ['O arquivo não é um JSON válido.'] };
  }

  const candidate =
    typeof raw === 'object' && raw !== null && 'data' in raw ? (raw as { data: unknown }).data : raw;

  const result = appDataSchema.safeParse(candidate);
  if (!result.success) {
    const errors = result.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`);
    return { ok: false, errors };
  }

  return { ok: true, data: result.data, errors: [] };
}
