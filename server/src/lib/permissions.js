// ============================================================
// Permissions dynamiques par rôle — paramètre « rolePermissions »
// ------------------------------------------------------------
// Matrice { [cléRessource]: { read: [rôles], write: [...], delete: [...] } }
// stockée dans ChurchSetting.value. Clé = chemin de montage hors /api,
// identique au chemin client (ex. 'finance/accounts', 'persons').
// ============================================================
import prisma from './prisma.js';
import { AppError, asyncHandler } from './http.js';

const TTL_MS = 15_000;
const cache = new Map();

/** Matrice complète ou null (paramètre absent / illisible). */
export async function getRolePermissions(churchId) {
  if (!churchId) return null;
  const hit = cache.get(churchId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  let value = null;
  try {
    const row = await prisma.churchSetting.findUnique({
      where: { churchId_key: { churchId, key: 'rolePermissions' } },
    });
    value = row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : null;
  } catch {
    value = null;
  }
  cache.set(churchId, { at: Date.now(), value });
  return value;
}

/** À appeler après toute écriture du paramètre rolePermissions. */
export function invalidatePermissions(churchId) {
  cache.delete(churchId);
}

/**
 * Middleware d'accès par rôle, dynamique.
 * - ADMIN : toujours autorisé (accès total).
 * - Sinon : liste du paramètre rolePermissions pour la ressource, à défaut
 *   la liste statique fournie (comportement historique conservé).
 * - Une liste vide (ressource en lecture seule) interdit l'accès aux
 *   non-ADMIN, même si la matrice l'accorderait.
 */
export function access(kind, fallbackRoles = []) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new AppError(401, 'Authentification requise.');
    if (req.user.role === 'ADMIN') return next();
    const key = String(req.baseUrl || '').replace(/^\/api/, '').replace(/^\//, '');
    const perms = key ? await getRolePermissions(req.churchId) : null;
    const list = perms?.[key]?.[kind] ?? fallbackRoles;
    if (!Array.isArray(list)) return next();
    if (list.includes(req.user.role)) return next();
    throw new AppError(403, 'Autorisation insuffisante.');
  });
}
