// ============================================================
// Activités & présences (nominatif + quantitatif)
// ============================================================
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { requireRole } from '../lib/auth.js';
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

const recordShape = {
  activityId: z.string().min(1),
  personId: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'VISITOR']).default('PRESENT').optional(),
  cameAt: z.coerce.date().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
};

const statShape = {
  activityId: z.string().min(1),
  presentCount: z.number().int().min(0).default(0).optional(),
  absentCount: z.number().int().min(0).default(0).optional(),
  excusedCount: z.number().int().min(0).default(0).optional(),
  lateCount: z.number().int().min(0).default(0).optional(),
  visitorCount: z.number().int().min(0).default(0).optional(),
  childCount: z.number().int().min(0).default(0).optional(),
  adultCount: z.number().int().min(0).default(0).optional(),
  maleCount: z.number().int().min(0).default(0).optional(),
  femaleCount: z.number().int().min(0).default(0).optional(),
  totalCount: z.number().int().min(0).default(0).optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const bulkAttendanceShape = z.object({
  records: z.array(z.object({
    personId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'VISITOR']).default('PRESENT').optional(),
    cameAt: z.coerce.date().nullable().optional(),
    note: z.string().max(1000).nullable().optional(),
  })).max(500),
  stats: z.object({
    presentCount: z.number().int().min(0).optional(),
    absentCount: z.number().int().min(0).optional(),
    excusedCount: z.number().int().min(0).optional(),
    lateCount: z.number().int().min(0).optional(),
    visitorCount: z.number().int().min(0).optional(),
    childCount: z.number().int().min(0).optional(),
    adultCount: z.number().int().min(0).optional(),
    maleCount: z.number().int().min(0).optional(),
    femaleCount: z.number().int().min(0).optional(),
    totalCount: z.number().int().min(0).optional(),
    notes: z.string().max(2000).nullable().optional(),
  }).optional(),
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
      _count: { select: { attendanceRecords: true } },
    },
    createSchema: z.object(activityShape).strict(),
    updateSchema: z.object(activityShape).strict().partial(),
    transform: (router) => {
      // Saisie de présence groupée : remplace les présences d'une activité.
      router.put('/:id/attendance', requireRole('ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER'),
        validateBody(bulkAttendanceShape), asyncHandler(async (req, res) => {
          const activity = await prisma.activity.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
          if (!activity) throw new AppError(404, 'Activité introuvable.');
          const { records, stats } = req.body;

          if (records) {
            const current = await prisma.attendanceRecord.findMany({
              where: { activityId: activity.id, churchId: req.churchId },
              select: { personId: true },
            });
            const currentIds = new Set(current.map((r) => r.personId));
            const targetIds = new Set(records.map((r) => r.personId));

            await Promise.all(records.map((r) =>
              prisma.attendanceRecord.upsert({
                where: { activityId_personId: { activityId: activity.id, personId: r.personId } },
                create: { churchId: req.churchId, activityId: activity.id, ...r },
                update: { status: r.status, cameAt: r.cameAt, note: r.note },
              }),
            ));

            const removed = [...currentIds].filter((id) => !targetIds.has(id));
            if (removed.length) {
              await prisma.attendanceRecord.deleteMany({
                where: { activityId: activity.id, churchId: req.churchId, personId: { in: removed } },
              });
            }
          }

          let stat = null;
          if (stats) {
            stat = await prisma.attendanceStat.upsert({
              where: { activityId: activity.id },
              create: { churchId: req.churchId, activityId: activity.id, ...stats },
              update: stats,
            });
          }
          audit(req, 'activity.attendance.bulk', 'Activity', activity.id, { recordCount: records?.length });
          res.json({ saved: records?.length ?? 0, stat });
        }));
    },
  });

  const records = crudRouter({
    model: 'attendanceRecord',
    label: 'Présence',
    filters: ['activityId', 'personId', 'status'],
    include: {
      person: { select: { id: true, firstName: true, lastName: true, status: true } },
      activity: { select: { id: true, title: true, activityDate: true } },
    },
    createSchema: z.object(recordShape).strict(),
    updateSchema: z.object(recordShape).strict().partial(),
  });

  const stats = crudRouter({
    model: 'attendanceStat',
    label: 'Statistiques de présence',
    filters: ['activityId'],
    include: { activity: { select: { id: true, title: true, activityDate: true } } },
    createSchema: z.object(statShape).strict(),
    updateSchema: z.object(statShape).strict().partial(),
  });

  return { types, activities, records, stats };
}