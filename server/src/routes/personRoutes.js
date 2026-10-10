// ============================================================
// Personnes (annuaire) + statistiques
// ============================================================
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { asyncHandler } from '../lib/http.js';
import { access } from '../lib/permissions.js';

const personInclude = {
  departmentMemberships: {
    where: { isActive: true },
    include: { department: { select: { id: true, name: true, type: true } } },
  },
  candidateRecords: { select: { id: true, status: true, enrolledAt: true } },
  baptisms: { select: { id: true, baptismDate: true, location: true } },
  certificates: { select: { id: true, type: true, issuedAt: true } },
  eventRoles: {
    include: { event: { select: { id: true, name: true, startDate: true } } },
  },
};

const genderEnum = z.enum(['MALE', 'FEMALE']);
const maritalEnum = z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']);
const statusEnum = z.enum(['MEMBER', 'ATTENDEE', 'CANDIDATE', 'VISITOR', 'FORMER', 'DECEASED']);

const personShape = {
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  gender: genderEnum.nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  birthPlace: z.string().max(200).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  phoneAlt: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  maritalStatus: maritalEnum.nullable().optional(),
  profession: z.string().max(200).nullable().optional(),
  status: statusEnum.default('ATTENDEE').optional(),
  memberSince: z.coerce.date().nullable().optional(),
  membershipNumber: z.string().max(60).nullable().optional(),
  photoKey: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

export function personRoutes() {
  const crud = crudRouter({
    model: 'person',
    label: 'Personne',
    include: personInclude,
    searchFields: ['firstName', 'lastName', 'phone', 'membershipNumber'],
    filters: ['status', 'gender'],
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    createSchema: z.object(personShape).strict(),
    updateSchema: z.object(personShape).strict().partial(),
    csvColumns: ['lastName', 'firstName', 'gender', 'status', 'phone', 'email', 'membershipNumber', 'address', 'profession'],
    transform: (router) => {
      // Statistiques de l'annuaire (enregistrées avant /:id)
      router.get('/stats', access('read', ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER']), asyncHandler(async (req, res) => {
        const where = { churchId: req.churchId, isActive: true };
        const byStatus = await prisma.person.groupBy({ by: ['status'], where, _count: { _all: true } });
        const byGender = await prisma.person.groupBy({ by: ['gender'], where, _count: { _all: true } });
        const byDept = await prisma.departmentMember.groupBy({
          by: ['departmentId'],
          where: { churchId: req.churchId, isActive: true },
          _count: { _all: true },
        });
        const departments = byDept.length
          ? await prisma.department.findMany({ where: { id: { in: byDept.map((d) => d.departmentId) } }, select: { id: true, name: true } })
          : [];
        res.json({
          total: await prisma.person.count({ where }),
          byStatus,
          byGender,
          byDepartment: byDept.map((d) => ({
            departmentId: d.departmentId,
            departmentName: departments.find((dep) => dep.id === d.departmentId)?.name,
            count: d._count._all,
          })),
        });
      }));
    },
  });

  return crud;
}

export { personInclude };