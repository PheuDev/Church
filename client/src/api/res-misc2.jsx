// Utilisateurs & journal d'audit — configuration
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { ROLES } from './resdefs.js';
import { fmtDateTime } from '../lib/format.js';

export const MISC2_R = {
  users: {
    path: '/users',
    label: 'Utilisateurs',
    singular: 'Utilisateur',
    icon: 'UserCog',
    searchPlaceholder: 'Nom, e-mail…',
    roles: {
      read: ['ADMIN', 'PASTOR', 'SECRETARY'],
      write: ROLES.writeUsers,
      delete: ROLES.deleteAdmin,
    },
    columns: [
      { title: 'Nom', render: (r) => <b>{r.fullName}</b> },
      { title: 'E-mail', render: (r) => r.email },
      { title: 'Rôle', render: (r) => <BadgeEnum group="UserRole" value={r.role} /> },
      { title: 'Téléphone', render: (r) => r.phone || '—' },
      { title: 'Actif', render: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Oui' : 'Non'}</Badge> },
      { title: 'Dernière connexion', render: (r) => (r.lastLoginAt ? fmtDateTime(r.lastLoginAt) : '—') },
    ],
    filters: [{ name: 'role', label: 'Rôle', options: 'UserRole' }],
    form: [
      { name: 'fullName', label: 'Nom complet', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'username', label: 'Nom d’utilisateur', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'role', label: 'Rôle', type: 'select', options: 'UserRole' },
      { name: 'password', label: 'Mot de passe', type: 'password', omitWhenEmpty: true, hint: '8 caractères minimum. Obligatoire à la création.' },
      { name: 'isActive', label: 'Compte actif', type: 'boolean' },
      { name: 'mustChangePassword', label: 'Changement de mot de passe obligatoire', type: 'boolean' },
    ],
  },

  'audit-logs': {
    path: '/audit-logs',
    label: "Journal d'audit",
    singular: "Entrée d'audit",
    icon: 'ScrollText',
    searchPlaceholder: 'Action, entité…',
    readOnly: true,
    roles: { read: ROLES.readAudit, write: ROLES.readAudit, delete: ROLES.readAudit },
    columns: [
      { title: 'Date', render: (r) => fmtDateTime(r.createdAt) },
      { title: 'Action', render: (r) => <b>{r.action}</b> },
      { title: 'Entité', render: (r) => r.entity },
      { title: 'Utilisateur', render: (r) => (r.user ? r.user.fullName : '—') },
      { title: 'Adresse IP', render: (r) => r.ipAddress || '—' },
    ],
    filters: [
      { name: 'entity', label: 'Entité', options: ['person', 'user', 'family', 'department', 'activity', 'activityType', 'sundaySchoolClass', 'sundaySchoolSession', 'formationProgram', 'formationSession', 'lesson', 'bibleVerse', 'sessionLesson', 'baptismCandidate', 'evaluation', 'baptism', 'certificate', 'account', 'fund', 'financialCategory', 'revenue', 'expense', 'contribution', 'contributionPayment', 'commitment', 'commitmentPayment', 'churchEvent', 'eventParticipant', 'project', 'document', 'churchSetting', 'nationalOffice', 'aduSession', 'adminDepartment', 'locality'].map((v) => ({ value: v, label: v })) },
      { name: 'action', label: 'Action', options: ['create', 'update', 'delete', 'user.change_password', 'activity.attendance.bulk', 'document.create', 'document.delete', 'churchSetting.upsert'].map((v) => ({ value: v, label: v })) },
    ],
  },
};