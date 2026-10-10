// ============================================================
// Départements internes + membres + effectifs (calculés)
// ============================================================
import { z } from 'zod';
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { access } from '../lib/permissions.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';
import { audit } from '../lib/audit.js';

const departmentShape = {
  name: z.string().min(1).max(200),
  type: z.enum(['MEN', 'WOMEN', 'YOUTH', 'TEENAGERS', 'CHILDREN', 'PRAYER', 'WORSHIP', 'EDUCATION', 'MUSIC', 'OTHER']).default('OTHER').optional(),
  leaderPersonId: z.string().nullable().optional(),
  color: z.string().max(30).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
  headcount: z.number().int().min(0).nullable().optional(),
  headcountMale: z.number().int().min(0).nullable().optional(),
  headcountFemale: z.number().int().min(0).nullable().optional(),
};

const membersSyncShape = z.object({
  personIds: z.array(z.string().min(1)).max(1000),
}).strict();

export function departmentRoutes() {
  const departments = crudRouter({
    model: 'department',
    label: 'Département',
    searchFields: ['name'],
    filters: ['type', 'leaderPersonId'],
    orderBy: { name: 'asc' },
    include: {
      leader: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true } },
    },
    createSchema: z.object(departmentShape).strict(),
    updateSchema: z.object(departmentShape).strict().partial(),
    transform: (router) => {
      // Remplace la liste des membres (gérée depuis le formulaire département).
      router.put('/:id/members', access('write', ['ADMIN', 'PASTOR', 'SECRETARY']),
        validateBody(membersSyncShape), asyncHandler(async (req, res) => {
          const department = await prisma.department.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
          if (!department) throw new AppError(404, 'Département introuvable.');

          const target = new Set(req.body.personIds);
          const current = await prisma.departmentMember.findMany({
            where: { departmentId: department.id, churchId: req.churchId },
            select: { id: true, personId: true },
          });
          const currentIds = new Set(current.map((m) => m.personId));

          const toAdd = [...target].filter((id) => !currentIds.has(id));
          const toRemove = current.filter((m) => !target.has(m.personId)).map((m) => m.id);

          await Promise.all(toAdd.map((personId) =>
            prisma.departmentMember.upsert({
              where: { departmentId_personId: { departmentId: department.id, personId } },
              create: { churchId: req.churchId, departmentId: department.id, personId, joinedAt: new Date() },
              update: { isActive: true },
            }),
          ));
          if (toRemove.length) {
            await prisma.departmentMember.deleteMany({ where: { id: { in: toRemove }, churchId: req.churchId } });
          }
          audit(req, 'department.update', 'Department', department.id, { memberCount: target.size });
          res.json({ saved: target.size });
        }));
    },
  });

  // Effectifs : priorité aux chiffres saisis manuellement ; membres de l'annuaire en info complémentaire.
  const stats = (() => {
    const router = Router();
    router.get('/', access('read', ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER']), asyncHandler(async (req, res) => {
      const departments = await prisma.department.findMany({
        where: { churchId: req.churchId, ...(req.query.departmentId ? { id: req.query.departmentId } : {}) },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true, isActive: true, headcount: true, headcountMale: true, headcountFemale: true },
      });
      const rows = await prisma.departmentMember.findMany({
        where: { churchId: req.churchId, isActive: true },
        select: { departmentId: true, person: { select: { gender: true, isActive: true } } },
      });
      const countFor = (deptId) => rows.filter((r) => r.departmentId === deptId && r.person?.isActive !== false);
      const items = departments.map((d) => {
        const members = countFor(d.id);
        return {
          departmentId: d.id,
          department: { id: d.id, name: d.name, type: d.type },
          isActive: d.isActive,
          // Effectif saisi en priorité ; membres annuaire en fallback
          effectiveCount:  d.headcount     ?? members.length,
          maleCount:       d.headcountMale ?? members.filter((r) => r.person?.gender === 'MALE').length,
          femaleCount:     d.headcountFemale ?? members.filter((r) => r.person?.gender === 'FEMALE').length,
          // Toujours exposé pour info
          registeredCount: members.length,
        };
      });
      res.json({ items, total: items.length, page: 1, pageSize: items.length });
    }));
    return router;
  })();

  return { departments, stats };
}