// ============================================================
// Projets & engagements
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const projectShape = {
  name: z.string().min(1).max(200),
  type: z.enum(['CONSTRUCTION', 'RENOVATION', 'EQUIPMENT', 'EVANGELIZATION', 'SOCIAL', 'OTHER']).default('OTHER').optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'HALTED']).default('PLANNED').optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  targetAmount: z.number().min(0).nullable().optional(),
  responsibleId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
};

export function projectRoutes() {
  return crudRouter({
    model: 'project',
    label: 'Projet',
    searchFields: ['name', 'location'],
    filters: ['type', 'status', 'responsibleId'],
    orderBy: { createdAt: 'desc' },
    include: {
      responsible: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { engagements: true, documents: true } },
    },
    createSchema: z.object(projectShape).strict(),
    updateSchema: z.object(projectShape).strict().partial(),
  });
}