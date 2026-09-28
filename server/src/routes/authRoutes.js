// ============================================================
// Authentification : login, profil, changement de mot de passe
// ============================================================
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AppError, asyncHandler } from '../lib/http.js';
import { auth, hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { validateBody } from '../lib/validate.js';
import { audit } from '../lib/audit.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' } },
});

// Le changement de mot de passe ne doit pas servir de porte de derrière
// pour deviner un mot de passe sans déclencher le limiteur de connexion.
const changeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' } },
});

// Comparé lorsque l'e-mail est inconnu : le temps de réponse reste le même
// et ne révèle pas l'existence du compte.
const DUMMY_HASH = hashPassword('placeholder-timing-only');

const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
}).strict();

function publicUser(user) {
  const { passwordHash: _p, ...rest } = user;
  return rest;
}

export function authRoutes() {
  const router = Router();

  router.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await prisma.user.findFirst({ where: { email } });
    const matches = verifyPassword(req.body.password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !user.isActive || !matches) {
      if (user) {
        // Journalise la connexion refusée (traçabilité). Rien n'est journalisé
        // pour un e-mail inconnu : le journal est cloisonné par église.
        req.churchId = user.churchId;
        audit(req, 'auth.login_failed', 'User', user.id, { email });
      }
      throw new AppError(401, 'Adresse e-mail ou mot de passe incorrect.');
    }
    req.churchId = user.churchId;
    audit(req, 'auth.login', 'User', user.id);
    const token = signToken(user);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json({ token, user: publicUser(user) });
  }));

  router.get('/me', auth, asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }));

  router.post('/change-password', auth, changeLimiter, validateBody(changePasswordSchema), asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!verifyPassword(req.body.currentPassword, user.passwordHash)) {
      audit(req, 'user.change_password_failed', 'User', user.id);
      throw new AppError(400, 'Mot de passe actuel incorrect.');
    }
    if (req.body.currentPassword === req.body.newPassword) {
      throw new AppError(400, 'Le nouveau mot de passe doit être différent.');
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(req.body.newPassword),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    });
    audit(req, 'user.change_password', 'User', user.id);
    const token = signToken(updated);
    res.json({ token, user: publicUser(updated) });
  }));

  return router;
}
