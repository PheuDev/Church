// ============================================================
// Église : fiche + paramètres clé/valeur
// ============================================================
import { z } from 'zod';
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { requireRole } from '../lib/auth.js';
import { validateBody } from '../lib/validate.js';
import { audit } from '../lib/audit.js';

const churchShape = {
  name: z.string().min(1).max(200),
  shortName: z.string().max(80).nullable().optional(),
  code: z.string().min(1).max(50).optional(),
  localityId: z.string().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  foundedAt: z.coerce.date().nullable().optional(),
  pastorName: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
};

const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
}).strict();
const settingPatchSchema = z.object({ value: z.unknown() }).strict();

export function churchRoutes() {
  const churches = crudRouter({
    model: 'church',
    label: 'Église',
    searchFields: ['name', 'shortName', 'code', 'city'],
    orderBy: { name: 'asc' },
    pick: (data) => data,
    churchScoped: false,
    createSchema: z.object(churchShape).strict(),
    updateSchema: z.object(churchShape).strict().partial(),
    // Monté AVANT /:id grâce à conf.transform (voir lib/router.js).
    transform: (router) => {
      router.get('/me', asyncHandler(async (req, res) => {
        const church = await prisma.church.findUnique({ where: { id: req.churchId } });
        if (!church) throw notFound('Église introuvable.');
        res.json(church);
      }));
    },
  });

  const settings = (function buildSettings() {
    const router = Router();

    router.get('/', requireRole(...['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER']), asyncHandler(async (req, res) => {
      const settings = await prisma.churchSetting.findMany({ where: { churchId: req.churchId }, orderBy: { key: 'asc' } });
      res.json({ items: settings });
    }));

    router.post('/', requireRole(...['ADMIN', 'PASTOR']), validateBody(settingSchema), asyncHandler(async (req, res) => {
      const setting = await prisma.churchSetting.upsert({
        where: { churchId_key: { churchId: req.churchId, key: req.body.key } },
        create: { churchId: req.churchId, ...req.body },
        update: { value: req.body.value },
      });
      audit(req, 'churchSetting.upsert', 'ChurchSetting', setting.id, req.body);
      res.status(201).json(setting);
    }));

    router.patch('/:key', requireRole(...['ADMIN', 'PASTOR']), validateBody(settingPatchSchema), asyncHandler(async (req, res) => {
      const setting = await prisma.churchSetting.findFirst({ where: { churchId: req.churchId, key: req.params.key } });
      if (!setting) throw notFound('Paramètre introuvable.');
      const updated = await prisma.churchSetting.update({ where: { id: setting.id }, data: { value: req.body.value } });
      res.json(updated);
    }));

    router.delete('/:key', requireRole('ADMIN'), asyncHandler(async (req, res) => {
      const setting = await prisma.churchSetting.findFirst({ where: { churchId: req.churchId, key: req.params.key } });
      if (!setting) throw notFound('Paramètre introuvable.');
      await prisma.churchSetting.delete({ where: { id: setting.id } });
      res.status(204).end();
    }));
    return router;
  })();

  return { churches, settings };
}