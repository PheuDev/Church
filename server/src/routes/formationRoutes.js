// ============================================================
// Formations : programmes, sessions, leçons
// ============================================================
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { access } from '../lib/permissions.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';
import { audit } from '../lib/audit.js';

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
  verses: z.string().max(1000).nullable().optional(),
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
      lessonPlans: { where: { lessonId: { not: null } }, select: { lessonId: true } },
      _count: { select: { candidates: true, lessonPlans: true } },
    },
    createSchema: z.object(formationSessionShape).strict(),
    updateSchema: z.object(formationSessionShape).strict().partial(),
    transform: (router) => {
      // Leçons dispensées : cases à cocher gérées depuis le formulaire session.
      router.put('/:id/lessons', access('write', ['ADMIN', 'PASTOR', 'SECRETARY']),
        validateBody(z.object({ lessonIds: z.array(z.string().min(1)).max(200) }).strict()),
        asyncHandler(async (req, res) => {
          const session = await prisma.formationSession.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
          if (!session) throw new AppError(404, 'Session introuvable.');

          const target = new Set(req.body.lessonIds);
          const current = await prisma.sessionLesson.findMany({
            where: { sessionId: session.id, churchId: req.churchId, lessonId: { not: null } },
            select: { id: true, lessonId: true },
          });
          const currentIds = new Set(current.map((s) => s.lessonId));

          const toAdd = [...target].filter((id) => !currentIds.has(id));
          const toRemove = current.filter((s) => !target.has(s.lessonId)).map((s) => s.id);

          if (toAdd.length) {
            const lessons = await prisma.lesson.findMany({ where: { id: { in: toAdd }, churchId: req.churchId }, select: { id: true, title: true } });
            await prisma.sessionLesson.createMany({
              data: lessons.map((l) => ({ churchId: req.churchId, sessionId: session.id, lessonId: l.id, title: l.title })),
              skipDuplicates: true,
            });
          }
          if (toRemove.length) {
            await prisma.sessionLesson.deleteMany({ where: { id: { in: toRemove }, churchId: req.churchId } });
          }
          audit(req, 'formationSession.update', 'FormationSession', session.id, { lessonCount: target.size });
          res.json({ saved: target.size });
        }));
    },
  });

  const lessons = crudRouter({
    model: 'lesson',
    label: 'Leçon',
    searchFields: ['title'],
    filters: ['programId'],
    orderBy: [{ number: 'asc' }],
    include: {
      program: { select: { id: true, name: true } },
    },
    createSchema: z.object(lessonShape).strict(),
    updateSchema: z.object(lessonShape).strict().partial(),
  });

  return { programs, sessions, lessons };
}