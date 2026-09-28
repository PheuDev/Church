// ============================================================
// Utilisateurs (gestion des comptes, rôles, mot de passe)
// ============================================================
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { createCrudResource } from '../lib/crud.js';
import { requireRole, hashPassword, ROLE_ORDER } from '../lib/auth.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';

const roleEnum = z.enum(['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER']);

const createSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  fullName: z.string().min(1).max(200),
  username: z.string().max(60).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  role: roleEnum.default('VIEWER'),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(true),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
}).strict();

const updateSchema = z.object({
  email: z.string().trim().email().optional(),
  fullName: z.string().min(1).max(200).optional(),
  username: z.string().max(60).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  password: z.string().min(8).optional(),
}).strict();

const pick = (data) => {
  const { password, ...rest } = data;
  const out = { ...rest };
  if (out.email) out.email = out.email.toLowerCase();
  if (password) out.passwordHash = hashPassword(password);
  return out;
};

export function userRoutes() {
  const router = Router();
  const resource = createCrudResource({
    model: 'user',
    label: 'Utilisateur',
    searchFields: ['email', 'fullName', 'username'],
    filters: ['role', 'isActive'],
    orderBy: { fullName: 'asc' },
    pick,
    csvColumns: ['fullName', 'email', 'username', 'phone', 'role', 'isActive', 'createdAt'],
  });

  /** Seul un ADMIN peut manipuler des comptes ADMIN. */
  const guardAdminTarget = (req, _res, next) => {
    const target = typeof req.body?.role === 'string' ? req.body.role : null;
    if (target === 'ADMIN' && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'Seul un administrateur peut gérer des comptes administrateur.'));
    }
    next();
  };

  /**
   * Interdit de modifier son propre compte (évite auto-désactivation ou
   * auto-rétrogradation) et d'agir sur un compte de rang égal ou supérieur.
   */
  const guardTarget = async (req, _res, next) => {
    try {
      if (req.params.id === req.user.id) {
        return next(new AppError(403, 'Vous ne pouvez pas modifier votre propre compte ici.'));
      }
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!target) return next();
      const ownRank = ROLE_ORDER.indexOf(req.user.role);
      const targetRank = ROLE_ORDER.indexOf(target.role);
      if (req.user.role !== 'ADMIN' && targetRank >= ownRank) {
        return next(new AppError(403, 'Vous ne pouvez pas modifier un compte de rang égal ou supérieur.'));
      }
      next();
    } catch (err) {
      next(err);
    }
  };

  router.get('/', requireRole('ADMIN', 'PASTOR', 'SECRETARY'), asyncHandler(resource.list));
  router.post('/', requireRole('ADMIN', 'PASTOR'), guardAdminTarget, validateBody(createSchema), asyncHandler(resource.create));
  router.get('/:id', requireRole('ADMIN', 'PASTOR', 'SECRETARY'), asyncHandler(resource.get));
  router.patch('/:id', requireRole('ADMIN', 'PASTOR'), guardAdminTarget, guardTarget, validateBody(updateSchema), asyncHandler(resource.update));
  router.delete('/:id', requireRole('ADMIN'), guardTarget, asyncHandler(resource.remove));

  return router;
}