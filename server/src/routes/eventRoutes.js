// ============================================================
// Événements & participants
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const eventShape = {
  name: z.string().min(1).max(200),
  type: z.enum(['FETE', 'DEPT_DAY', 'OUTING', 'CONFERENCE', 'CAMPAIGN', 'RETREAT', 'OTHER']).default('OTHER').optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  responsibleId: z.string().nullable().optional(),
  budget: z.number().min(0).nullable().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'DONE', 'CANCELLED']).default('PLANNED').optional(),
  reportNote: z.string().max(5000).nullable().optional(),
};

const participantShape = {
  eventId: z.string().min(1),
  personId: z.string().min(1),
  role: z.string().max(200).nullable().optional(),
  isConfirmed: z.boolean().default(false).optional(),
  note: z.string().max(1000).nullable().optional(),
};

export function eventRoutes() {
  const events = crudRouter({
    model: 'churchEvent',
    label: 'Événement',
    searchFields: ['name', 'location'],
    filters: ['type', 'status', 'responsibleId'],
    orderBy: { startDate: 'desc' },
    include: {
      responsible: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
    createSchema: z.object(eventShape).strict(),
    updateSchema: z.object(eventShape).strict().partial(),
  });

  const participants = crudRouter({
    model: 'eventParticipant',
    label: 'Participant à un événement',
    filters: ['eventId', 'personId', 'isConfirmed'],
    include: {
      event: { select: { id: true, name: true, startDate: true } },
      person: { select: { id: true, firstName: true, lastName: true } },
    },
    createSchema: z.object(participantShape).strict(),
    updateSchema: z.object(participantShape).strict().partial(),
  });

  return { events, participants };
}