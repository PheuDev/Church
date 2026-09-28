// ============================================================
// Authentification : hachage, jeton JWT, middlewares
// ============================================================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { AppError } from './http.js';
import prisma from './prisma.js';

export const ROLE_ORDER = ['VIEWER', 'TREASURER', 'SECRETARY', 'PASTOR', 'ADMIN'];
export const ALL_ROLES = ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'];

export const hashPassword = (plain) => bcrypt.hashSync(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compareSync(plain, hash);

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, churchId: user.churchId, role: user.role, tv: user.tokenVersion },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

/** Authentifie l'utilisateur à partir du Bearer token. */
export async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError(401, 'Authentification requise.');
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError(401, 'Jeton invalide ou expiré.');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new AppError(401, 'Compte inactif ou supprimé.');
    if (user.tokenVersion !== payload.tv) throw new AppError(401, 'Session révoquée, reconnectez-vous.');
    if (user.churchId !== payload.churchId) throw new AppError(401, 'Session invalide.');
    // Tant que le mot de passe initial n'est pas changé, seules les routes
    // de profil et de changement de mot de passe restent accessibles.
    const pathOnly = (req.originalUrl || '').split('?')[0];
    const passwordFlow = pathOnly === '/api/auth/me' || pathOnly === '/api/auth/change-password';
    if (user.mustChangePassword && !passwordFlow) {
      throw new AppError(403, 'Vous devez changer votre mot de passe avant de continuer.', 'PASSWORD_CHANGE_REQUIRED');
    }
    req.churchId = user.churchId;
    req.user = {
      id: user.id,
      churchId: user.churchId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Restreint l'accès à certains rôles. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentification requise.'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'Autorisation insuffisante.'));
    next();
  };
}