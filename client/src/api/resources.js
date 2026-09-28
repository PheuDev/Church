// ============================================================
// Ressources — agrégation de tous les modules CRUD
// ============================================================
import { PERSONS_R } from './res-persons.jsx';
import { DEPTS_R } from './res-depts.jsx';
import { ACTIVITIES_R } from './res-activities.jsx';
import { SSUNDAY_R } from './res-sschool.jsx';
import { FORMATIONS_R } from './res-formations1.jsx';
import { FORMATIONS2_R } from './res-formations2.jsx';
import { BAPTISMS_R } from './res-baptisms1.jsx';
import { BAPTISMS2_R } from './res-baptisms2.jsx';
import { FINANCE1_R } from './res-finance1.jsx';
import { FINANCE2_R } from './res-finance2.jsx';
import { FINANCE3_R } from './res-finance3.jsx';
import { MISC_R } from './res-misc1.jsx';
import { MISC2_R } from './res-misc2.jsx';
import { ADMIN_R } from './res-admin.jsx';

export const RESOURCES = Object.assign(
  {},
  PERSONS_R,
  DEPTS_R,
  ACTIVITIES_R,
  SSUNDAY_R,
  FORMATIONS_R,
  FORMATIONS2_R,
  BAPTISMS_R,
  BAPTISMS2_R,
  FINANCE1_R,
  FINANCE2_R,
  FINANCE3_R,
  MISC_R,
  MISC2_R,
  ADMIN_R,
);

// `ROLES` doit être une liaison locale (et non un simple re-export) :
// `canAccess` ci-dessous l'utilise dans son propre corps.
import { personLabel, name1, ROLES } from './resdefs.js';

export { personLabel, name1, ROLES };

/** Vérifie qu'un rôle appartient à une liste (défauts par défaut). */
export function canAccess(role, roles, kind) {
  const defaults = {
    read: ROLES.readAll,
    write: ROLES.writeDefault,
    delete: ROLES.deleteAdmin,
  };
  const list = roles?.[kind] || defaults[kind];
  return list.includes(role);
}