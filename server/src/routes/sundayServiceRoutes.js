// ============================================================
// Culte du dimanche — service principal (offrandes, MC, prédicateur)
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const serviceShape = {
  serviceDate:     z.coerce.date(),
  mcPersonId:      z.string().nullable().optional(),
  preacherId:      z.string().nullable().optional(),
  theme:           z.string().max(300).nullable().optional(),
  offering:        z.coerce.number().min(0).default(0).optional(),
  specialOffering: z.coerce.number().min(0).default(0).optional(),
  eventId:         z.string().nullable().optional(),
  notes:           z.string().max(2000).nullable().optional(),
};

export function sundayServiceRoutes() {
  const services = crudRouter({
    model: 'sundayService',
    label: 'Culte du dimanche',
    searchFields: ['theme'],
    filters: ['preacherId', 'mcPersonId', 'eventId'],
    orderBy: { serviceDate: 'desc' },
    include: {
      mc:      { select: { id: true, firstName: true, lastName: true } },
      preacher: { select: { id: true, firstName: true, lastName: true } },
      event:   { select: { id: true, name: true } },
    },
    createSchema: z.object(serviceShape).strict(),
    updateSchema: z.object(serviceShape).strict().partial(),
  });

  return { services };
}
