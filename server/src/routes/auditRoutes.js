// ============================================================
// Journal d'audit (lecture seule)
// ============================================================
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';

export function auditRoutes() {
  const auditLogs = crudRouter({
    model: 'auditLog',
    label: "Journal d'audit",
    searchFields: ['action', 'entity'],
    filters: ['entity', 'userId', 'action'],
    readRoles: ['ADMIN', 'PASTOR'],
    // Pas de writeRoles ni deleteRoles : le journal d'audit est en lecture seule
    writeRoles: [],
    deleteRoles: [],
  });

  return { auditLogs };
}