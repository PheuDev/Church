// ============================================================
// Assemblage des routes de l'API
// ============================================================
import { Router } from 'express';
import { auth } from '../lib/auth.js';
import { authRoutes } from './authRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { userRoutes } from './userRoutes.js';
import { personRoutes } from './personRoutes.js';
import { departmentRoutes } from './departmentRoutes.js';
import { activityRoutes } from './activityRoutes.js';
import { sundaySchoolRoutes } from './sundaySchoolRoutes.js';
import { sundayServiceRoutes } from './sundayServiceRoutes.js';
import { formationRoutes } from './formationRoutes.js';
import { baptismRoutes } from './baptismRoutes.js';
import { financeRoutes } from './financeRoutes.js';
import { eventRoutes } from './eventRoutes.js';
import { projectRoutes } from './projectRoutes.js';
import { documentRoutes } from './documentRoutes.js';
import { auditRoutes } from './auditRoutes.js';
import { dashboardRoutes } from './dashboardRoutes.js';

export function buildRoutes() {
  const api = Router();

  // Santé (publique)
  api.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  const church = churchRoutes();
  const departments = departmentRoutes();
  const activities = activityRoutes();
  const sundaySchool = sundaySchoolRoutes();
  const sundayServices = sundayServiceRoutes();
  const formations = formationRoutes();
  const baptisms = baptismRoutes();
  const finance = financeRoutes();
  const events = eventRoutes();

  api.use('/auth', authRoutes());

  // Toutes les routes métier exigent un jeton valide.
  api.use(auth);

  // Les paramètres d'église doivent être montés AVANT /churches/:id pour
  // ne pas être capturés par la route parametrée.
  api.use('/churches/settings', church.settings);
  api.use('/churches', church.churches);
  api.use('/users', userRoutes());

  api.use('/persons', personRoutes());

  api.use('/departments', departments.departments);
  api.use('/department-stats', departments.stats);

  api.use('/activity-types', activities.types);
  api.use('/activities', activities.activities);

  api.use('/sunday-school/classes', sundaySchool.classes);
  api.use('/sunday-school/sessions', sundaySchool.sessions);
  api.use('/sunday-services', sundayServices.services);

  // Formations : routes conservées pour les données existantes mais
  // retirées de la navigation principale.
  api.use('/formations/programs', formations.programs);
  api.use('/formations/sessions', formations.sessions);
  api.use('/formations/lessons', formations.lessons);

  api.use('/baptisms/sessions', baptisms.sessions);
  api.use('/baptisms/candidates', baptisms.candidates);
  api.use('/baptisms/baptisms', baptisms.baptisms);

  api.use('/finance/accounts', finance.accounts);
  api.use('/finance/categories', finance.categories);
  api.use('/finance/revenues', finance.revenues);
  api.use('/finance/expenses', finance.expenses);
  api.use('/finance/engagements', finance.engagements);
  api.use('/finance/engagement-payments', finance.engagementPayments);
  api.use('/finance/summary', finance.summary);

  api.use('/events', events.events);

  api.use('/projects', projectRoutes());

  api.use('/documents', documentRoutes());

  api.use('/audit-logs', auditRoutes().auditLogs);

  api.use('/dashboard', dashboardRoutes());

  return api;
}