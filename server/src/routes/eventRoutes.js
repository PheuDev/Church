// ============================================================
// Événements & participants (gérés depuis le formulaire événement)
// ============================================================
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { access } from '../lib/permissions.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';
import { audit } from '../lib/audit.js';

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

export function eventRoutes() {
  const events = crudRouter({
    model: 'churchEvent',
    label: 'Événement',
    searchFields: ['name', 'location'],
    filters: ['type', 'status', 'responsibleId'],
    orderBy: { startDate: 'desc' },
    include: {
      responsible: { select: { id: true, firstName: true, lastName: true } },
      participants: { select: { personId: true } },
      _count: { select: { participants: true } },
    },
    createSchema: z.object(eventShape).strict(),
    updateSchema: z.object(eventShape).strict().partial(),
    transform: (router) => {
      // Inscriptions gérées depuis le formulaire événement (rôles conservés).
      router.put('/:id/participants', access('write', ['ADMIN', 'PASTOR', 'SECRETARY']),
        validateBody(z.object({ personIds: z.array(z.string().min(1)).max(1000) }).strict()),
        asyncHandler(async (req, res) => {
          const event = await prisma.churchEvent.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
          if (!event) throw new AppError(404, 'Événement introuvable.');

          const target = new Set(req.body.personIds);
          const current = await prisma.eventParticipant.findMany({
            where: { eventId: event.id, churchId: req.churchId },
            select: { id: true, personId: true },
          });
          const currentIds = new Set(current.map((p) => p.personId));
          const toAdd = [...target].filter((id) => !currentIds.has(id));
          const toRemove = current.filter((p) => !target.has(p.personId)).map((p) => p.id);

          await Promise.all(toAdd.map((personId) =>
            prisma.eventParticipant.upsert({
              where: { eventId_personId: { eventId: event.id, personId } },
              create: { churchId: req.churchId, eventId: event.id, personId },
              update: {},
            }),
          ));
          if (toRemove.length) {
            await prisma.eventParticipant.deleteMany({ where: { id: { in: toRemove }, churchId: req.churchId } });
          }
          audit(req, 'churchEvent.update', 'ChurchEvent', event.id, { participantCount: target.size });
          res.json({ saved: target.size });
        }));
    },
  });

  return { events };
}