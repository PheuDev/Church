// ============================================================
// Départements internes + membres + effectifs
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const departmentShape = {
  name: z.string().min(1).max(200),
  type: z.enum(['MEN', 'WOMEN', 'YOUTH', 'TEENAGERS', 'CHILDREN', 'PRAYER', 'WORSHIP', 'EDUCATION', 'MUSIC', 'OTHER']).default('OTHER').optional(),
  leaderPersonId: z.string().nullable().optional(),
  color: z.string().max(30).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const memberShape = {
  departmentId: z.string().min(1),
  personId: z.string().min(1),
  role: z.enum(['LEADER', 'ASSISTANT', 'TREASURER', 'SECRETARY', 'MEMBER']).default('MEMBER').optional(),
  joinedAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
  notes: z.string().max(1000).nullable().optional(),
};

const statShape = {
  departmentId: z.string().min(1),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  effectiveCount: z.number().int().min(0),
  maleCount: z.number().int().min(0).nullable().optional(),
  femaleCount: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
};

export function departmentRoutes() {
  const departments = crudRouter({
    model: 'department',
    label: 'Département',
    searchFields: ['name'],
    filters: ['type', 'leaderPersonId'],
    orderBy: { name: 'asc' },
    include: {
      leader: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, stats: true, contributions: true } },
    },
    createSchema: z.object(departmentShape).strict(),
    updateSchema: z.object(departmentShape).strict().partial(),
  });

  const members = crudRouter({
    model: 'departmentMember',
    label: 'Membre de département',
    filters: ['departmentId', 'personId', 'role'],
    include: {
      department: { select: { id: true, name: true } },
      person: { select: { id: true, firstName: true, lastName: true, status: true } },
    },
    createSchema: z.object(memberShape).strict(),
    updateSchema: z.object(memberShape).strict().partial(),
  });

  const stats = crudRouter({
    model: 'departmentStat',
    label: 'Effectif de département',
    filters: ['departmentId'],
    orderBy: { periodStart: 'desc' },
    include: { department: { select: { id: true, name: true } } },
    createSchema: z.object(statShape).strict(),
    updateSchema: z.object(statShape).strict().partial(),
  });

  return { departments, members, stats };
}