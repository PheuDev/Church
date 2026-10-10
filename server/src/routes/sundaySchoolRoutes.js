// ============================================================
// École du dimanche : classes et séances dimanche
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const classShape = {
  name:        z.string().min(1).max(120),
  teacherId:   z.string().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive:    z.boolean().default(true).optional(),
};

const sessionShape = {
  classId:       z.string().min(1),
  title:         z.string().min(1).max(200),
  sessionDate:   z.coerce.date(),
  teacherId:     z.string().nullable().optional(),
  lessonTopic:   z.string().max(300).nullable().optional(),
  notes:         z.string().max(2000).nullable().optional(),
  status:        z.enum(['PLANNED', 'ONGOING', 'DONE', 'CANCELLED']).default('DONE').optional(),
  presentCount:  z.coerce.number().int().min(0).default(0).optional(),
  absentCount:   z.coerce.number().int().min(0).default(0).optional(),
  bibleCount:    z.coerce.number().int().min(0).default(0).optional(),
  offering:      z.coerce.number().min(0).default(0).optional(),
  attendanceNotes: z.string().max(2000).nullable().optional(),
};

export function sundaySchoolRoutes() {
  const classes = crudRouter({
    model: 'sundaySchoolClass',
    label: 'Classe du dimanche',
    searchFields: ['name'],
    orderBy: { name: 'asc' },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      _count:  { select: { sessions: true } },
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
      class:   { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
    },
    createSchema: z.object(sessionShape).strict(),
    updateSchema: z.object(sessionShape).strict().partial(),
  });

  return { classes, sessions };
}
