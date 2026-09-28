// ============================================================
// Assemblage des routes de l'API
// ============================================================
import { Router } from 'express';
import { auth } from '../lib/auth.js';
import { authRoutes } from './authRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { userRoutes } from './userRoutes.js';
import { personRoutes } from './personRoutes.js';
import { familyRoutes } from './familyRoutes.js';
import { departmentRoutes } from './departmentRoutes.js';
import { activityRoutes } from './activityRoutes.js';
import { sundaySchoolRoutes } from './sundaySchoolRoutes.js';
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

  const admin = adminRoutes();
  const church = churchRoutes();
  const departments = departmentRoutes();
  const activities = activityRoutes();
  const sundaySchool = sundaySchoolRoutes();
  const formations = formationRoutes();
  const baptisms = baptismRoutes();
  const finance = financeRoutes();
  const events = eventRoutes();

  api.use('/auth', authRoutes());

  // Toutes les routes métier exigent un jeton valide.
  api.use(auth);

  api.use('/admin/offices', admin.offices);
  api.use('/admin/sessions', admin.sessions);
  api.use('/admin/departments', admin.departments);
  api.use('/admin/localities', admin.localities);

  // Les paramètres d'église doivent être montés AVANT /churches/:id pour
  // ne pas être capturés par la route parametrée.
  api.use('/churches/settings', church.settings);
  api.use('/churches', church.churches);
  api.use('/users', userRoutes());

  api.use('/persons', personRoutes());

  api.use('/families', familyRoutes());

  api.use('/departments', departments.departments);
  api.use('/department-members', departments.members);
  api.use('/department-stats', departments.stats);

  api.use('/activity-types', activities.types);
  api.use('/activities', activities.activities);
  api.use('/attendance-records', activities.records);
  api.use('/attendance-stats', activities.stats);

  api.use('/sunday-school/classes', sundaySchool.classes);
  api.use('/sunday-school/sessions', sundaySchool.sessions);
  api.use('/sunday-school/participants', sundaySchool.participants);

  api.use('/formations/programs', formations.programs);
  api.use('/formations/sessions', formations.sessions);
  api.use('/formations/lessons', formations.lessons);
  api.use('/formations/verses', formations.verses);
  api.use('/formations/lesson-verses', formations.lessonVerses);
  api.use('/formations/session-lessons', formations.sessionLessons);

  api.use('/baptisms/candidates', baptisms.candidates);
  api.use('/baptisms/evaluations', baptisms.evaluations);
  api.use('/baptisms/baptisms', baptisms.baptisms);
  api.use('/baptisms/certificates', baptisms.certificates);

  api.use('/finance/accounts', finance.accounts);
  api.use('/finance/funds', finance.funds);
  api.use('/finance/categories', finance.categories);
  api.use('/finance/revenues', finance.revenues);
  api.use('/finance/expenses', finance.expenses);
  api.use('/finance/contributions', finance.contributions);
  api.use('/finance/contribution-payments', finance.contributionPayments);
  api.use('/finance/commitments', finance.commitments);
  api.use('/finance/commitment-payments', finance.commitmentPayments);
  api.use('/finance/summary', finance.summary);

  api.use('/events', events.events);
  api.use('/event-participants', events.participants);

  api.use('/projects', projectRoutes());

  api.use('/documents', documentRoutes());

  api.use('/audit-logs', auditRoutes().auditLogs);

  api.use('/dashboard', dashboardRoutes());

  return api;
}