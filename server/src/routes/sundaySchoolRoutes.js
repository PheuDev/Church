// ============================================================
// École du dimanche : classes, séances, participants
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const classShape = {
  name: z.string().min(1).max(120),
  teacherId: z.string().nullable().optional(),
  minAge: z.number().int().min(0).nullable().optional(),
  maxAge: z.number().int().min(0).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const sessionShape = {
  classId: z.string().min(1),
  title: z.string().min(1).max(200),
  sessionDate: z.coerce.date(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  teacherId: z.string().nullable().optional(),
  lessonTopic: z.string().max(300).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'DONE', 'CANCELLED']).default('PLANNED').optional(),
};

const participantShape = {
  sessionId: z.string().min(1),
  personId: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'VISITOR']).default('PRESENT').optional(),
  note: z.string().max(1000).nullable().optional(),
};

export function sundaySchoolRoutes() {
  const classes = crudRouter({
    model: 'sundaySchoolClass',
    label: 'Classe du dimanche',
    searchFields: ['name'],
    orderBy: { name: 'asc' },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { sessions: true } },
    },
    createSchema: z.object(classShape).strict(),
    updateSchema: z.object(classShape).strict().partial(),
  });

  const sessions = crudRouter({
    model: 'sundaySchoolSession',
    label: 'Séance du dimanche',
    searchFields: ['title', 'lessonTopic'],
    filters: ['classId', 'status', 'teacherId'],
    orderBy: { sessionDate: 'desc' },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
    createSchema: z.object(sessionShape).strict(),
    updateSchema: z.object(sessionShape).strict().partial(),
  });

  const participants = crudRouter({
    model: 'sundaySchoolParticipant',
    label: 'Présence école du dimanche',
    filters: ['sessionId', 'personId', 'status'],
    include: {
      session: { select: { id: true, title: true, sessionDate: true } },
      person: { select: { id: true, firstName: true, lastName: true } },
    },
    createSchema: z.object(participantShape).strict(),
    updateSchema: z.object(participantShape).strict().partial(),
  });

  return { classes, sessions, participants };
}