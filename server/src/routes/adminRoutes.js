// ============================================================
// Contexte administratif : bureau national, sessions, sections,
// localités — CRUD unicorporel (église scopé) + versions
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const def = (shape) => ({
  createSchema: z.object(shape).strict(),
  updateSchema: z.object(shape).strict().partial(),
});

const officeShape = { name: z.string().min(1).max(200), code: z.string().min(1).max(50) };
const sessionShape = { name: z.string().min(1).max(200), code: z.string().min(1).max(50), officeId: z.string().min(1) };
const adminDepartmentShape = { name: z.string().min(1).max(200), sessionId: z.string().min(1) };
const localityShape = {
  name: z.string().min(1).max(200),
  departmentId: z.string().min(1).nullable().optional(),
};

export function adminRoutes() {
  const offices = crudRouter({
    model: 'nationalOffice',
    label: 'Siège national',
    searchFields: ['name', 'code'],
    filters: [],
    churchScoped: false,
    ...def(officeShape),
  });

  const sessions = crudRouter({
    model: 'aduSession',
    label: 'Session de l\'Union',
    searchFields: ['name', 'code'],
    filters: ['officeId'],
    include: { office: { select: { id: true, name: true } } },
    churchScoped: false,
    ...def(sessionShape),
  });

  const departments = crudRouter({
    model: 'adminDepartment',
    label: 'Section administrative',
    searchFields: ['name'],
    filters: ['sessionId'],
    include: { session: { select: { id: true, name: true } } },
    churchScoped: false,
    ...def(adminDepartmentShape),
  });

  const localities = crudRouter({
    model: 'locality',
    label: 'Localité',
    searchFields: ['name'],
    filters: ['departmentId'],
    include: { department: { select: { id: true, name: true } } },
    churchScoped: false,
    ...def(localityShape),
  });

  return {
    offices,
    sessions,
    departments,
    localities,
  };
}