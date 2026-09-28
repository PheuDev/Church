// ============================================================
// Familles
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const familyShape = {
  name: z.string().min(1).max(200),
  headPersonId: z.string().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

export function familyRoutes() {
  return crudRouter({
    model: 'family',
    label: 'Famille',
    searchFields: ['name', 'phone', 'address'],
    orderBy: { name: 'asc' },
    include: {
      head: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true } },
    },
    createSchema: z.object(familyShape).strict(),
    updateSchema: z.object(familyShape).strict().partial(),
    csvColumns: ['name', 'address', 'phone', 'notes'],
  });
}