// ============================================================
// Ressources — agrégation de tous les modules CRUD
// ============================================================
import { PERSONS_R } from './res-persons.jsx';
import { DEPTS_R } from './res-depts.jsx';
import { ACTIVITIES_R } from './res-activities.jsx';
import { SSUNDAY_R } from './res-sschool.jsx';
import { SUNDAY_SERVICE_R } from './res-sunday-service.jsx';
import { BAPTISM_SESSIONS_R, BAPTISM_CANDIDATES_R } from './res-baptisms1.jsx';
import { BAPTISMS2_R } from './res-baptisms2.jsx';
import { FINANCE1_R } from './res-finance1.jsx';
import { FINANCE2_R } from './res-finance2.jsx';
import { MISC_R } from './res-misc1.jsx';
import { MISC2_R } from './res-misc2.jsx';

export const RESOURCES = Object.assign(
  {},
  PERSONS_R,
  DEPTS_R,
  ACTIVITIES_R,
  SSUNDAY_R,
  SUNDAY_SERVICE_R,
  BAPTISM_SESSIONS_R,
  BAPTISM_CANDIDATES_R,
  BAPTISMS2_R,
  FINANCE1_R,
  FINANCE2_R,
  MISC_R,
  MISC2_R,
);

import { personLabel, name1, ROLES } from './resdefs.js';
export { personLabel, name1, ROLES };
