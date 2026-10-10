// ============================================================
// Activités & présences (mode quantitatif : compteurs + observations)
// ============================================================
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { access } from '../lib/permissions.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';
import { audit } from '../lib/audit.js';

const activityTypeShape = {
  name: z.string().min(1).max(120),
  icon: z.string().max(60).nullable().optional(),
  color: z.string().max(30).nullable().optional(),
  defaultDurationMin: z.number().int().min(0).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const activityShape = {
  typeId: z.string().min(1),
  title: z.string().min(1).max(200),
  activityDate: z.coerce.date(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  responsibleId: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'DONE', 'CANCELLED']).default('PLANNED').optional(),
  reportNote: z.string().max(5000).nullable().optional(),
};

const attendanceShape = z.object({
  presentCount: z.number().int().min(0).default(0).optional(),
  absentCount: z.number().int().min(0).default(0).optional(),
  excusedCount: z.number().int().min(0).default(0).optional(),
  lateCount: z.number().int().min(0).default(0).optional(),
  visitorCount: z.number().int().min(0).default(0).optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

export function activityRoutes() {
  const types = crudRouter({
    model: 'activityType',
    label: "Type d'activité",
    searchFields: ['name'],
    orderBy: { name: 'asc' },
    createSchema: z.object(activityTypeShape).strict(),
    updateSchema: z.object(activityTypeShape).strict().partial(),
  });

  const activities = crudRouter({
    model: 'activity',
    label: 'Activité',
    searchFields: ['title', 'location'],
    filters: ['typeId', 'status', 'responsibleId'],
    orderBy: { activityDate: 'desc' },
    include: {
      type: { select: { id: true, name: true, icon: true, color: true } },
      responsible: { select: { id: true, firstName: true, lastName: true } },
      attendanceStats: true,
    },
    createSchema: z.object(activityShape).strict(),
    updateSchema: z.object(activityShape).strict().partial(),
    transform: (router) => {
      // Saisie de présence : compteurs + observations (une ligne par activité).
      router.put('/:id/attendance', access('write', ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER']),
        validateBody(attendanceShape), asyncHandler(async (req, res) => {
          const activity = await prisma.activity.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
          if (!activity) throw new AppError(404, 'Activité introuvable.');

          const stat = await prisma.attendanceStat.upsert({
            where: { activityId: activity.id },
            create: { churchId: req.churchId, activityId: activity.id, ...req.body },
            update: req.body,
          });
          audit(req, 'activity.attendance.bulk', 'Activity', activity.id, req.body);
          res.json({ stat });
        }));
    },
  });

  return { types, activities };
}