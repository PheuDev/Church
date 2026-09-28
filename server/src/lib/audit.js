// ============================================================
// Journal d'audit
// ============================================================
import prisma from './prisma.js';

/**
 * Enregistre une action dans le journal d'audit de l'église.
 * Ne lève jamais d'erreur (l'audit ne doit pas faire échouer l'action).
 */
export function audit(req, action, entity, entityId, changes = undefined) {
  try {
    const jsonChanges = changes === undefined ? undefined : JSON.parse(JSON.stringify(changes));
    return prisma.auditLog.create({
      data: {
        churchId: req.churchId,
        userId: req.user?.id,
        action,
        entity,
        entityId,
        changes: jsonChanges,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    }).catch((err) => {
      console.error('[audit] Échec de journalisation :', err);
      return undefined;
    });
  } catch {
    return undefined;
  }
}