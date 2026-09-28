// ============================================================
// Formations : programmes, sessions, leçons, versets
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const programShape = {
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  gradingMode: z.enum(['PERCENT', 'SCORE_20', 'SCORE_100']).default('PERCENT').optional(),
  passThreshold: z.number().int().min(0).max(100).default(70).optional(),
  totalLessons: z.number().int().min(0).nullable().optional(),
  durationWeeks: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const formationSessionShape = {
  programId: z.string().min(1),
  name: z.string().min(1).max(200),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('PLANNED').optional(),
  responsibleId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const lessonShape = {
  programId: z.string().min(1),
  title: z.string().min(1).max(300),
  number: z.number().int().min(0).nullable().optional(),
  objective: z.string().max(2000).nullable().optional(),
  content: z.string().max(10000).nullable().optional(),
  durationMin: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const verseShape = {
  book: z.string().min(1).max(100),
  chapter: z.number().int().min(0),
  verse: z.number().int().min(0),
  text: z.string().min(1).max(2000),
  version: z.string().max(30).nullable().optional(),
};

const lessonVerseShape = {
  lessonId: z.string().min(1),
  verseId: z.string().min(1),
  position: z.number().int().min(0).default(0).optional(),
};

const sessionLessonShape = {
  sessionId: z.string().min(1),
  lessonId: z.string().nullable().optional(),
  seanceType: z.enum(['NEW_LESSON', 'SUITE', 'REVISION', 'RAPPEL', 'EVALUATION', 'SYNTHESE', 'AUTRE']).default('NEW_LESSON').optional(),
  title: z.string().min(1).max(300),
  taughtAt: z.coerce.date().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  objective: z.string().max(2000).nullable().optional(),
  content: z.string().max(10000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

export function formationRoutes() {
  const programs = crudRouter({
    model: 'formationProgram',
    label: 'Programme de formation',
    searchFields: ['name'],
    orderBy: { name: 'asc' },
    include: { _count: { select: { sessions: true, lessons: true } } },
    createSchema: z.object(programShape).strict(),
    updateSchema: z.object(programShape).strict().partial(),
  });

  const sessions = crudRouter({
    model: 'formationSession',
    label: 'Session de formation',
    searchFields: ['name'],
    filters: ['programId', 'status', 'responsibleId'],
    orderBy: { startDate: 'desc' },
    include: {
      program: { select: { id: true, name: true } },
      responsible: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { candidates: true, lessonPlans: true } },
    },
    createSchema: z.object(formationSessionShape).strict(),
    updateSchema: z.object(formationSessionShape).strict().partial(),
  });

  const lessons = crudRouter({
    model: 'lesson',
    label: 'Leçon',
    searchFields: ['title'],
    filters: ['programId'],
    orderBy: [{ number: 'asc' }],
    include: {
      program: { select: { id: true, name: true } },
      _count: { select: { verses: true } },
    },
    createSchema: z.object(lessonShape).strict(),
    updateSchema: z.object(lessonShape).strict().partial(),
  });

  const verses = crudRouter({
    model: 'bibleVerse',
    label: 'Verset biblique',
    searchFields: ['text', 'book'],
    filters: ['book'],
    include: { _count: { select: { lessonLinks: true } } },
    createSchema: z.object(verseShape).strict(),
    updateSchema: z.object(verseShape).strict().partial(),
  });

  const lessonVerses = crudRouter({
    model: 'lessonVerse',
    label: 'Association leçon-verset',
    filters: ['lessonId', 'verseId'],
    orderBy: { position: 'asc' },
    include: {
      lesson: { select: { id: true, title: true } },
      verse: { select: { id: true, book: true, chapter: true, verse: true, text: true } },
    },
    createSchema: z.object(lessonVerseShape).strict(),
    updateSchema: z.object(lessonVerseShape).strict().partial(),
  });

  const sessionLessons = crudRouter({
    model: 'sessionLesson',
    label: 'Séance de formation',
    searchFields: ['title'],
    filters: ['sessionId', 'teacherId', 'seanceType'],
    orderBy: { taughtAt: 'desc' },
    include: {
      session: { select: { id: true, name: true } },
      lesson: { select: { id: true, title: true, number: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
    },
    createSchema: z.object(sessionLessonShape).strict(),
    updateSchema: z.object(sessionLessonShape).strict().partial(),
  });

  return { programs, sessions, lessons, verses, lessonVerses, sessionLessons };
}