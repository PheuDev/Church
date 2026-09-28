// Départements & types d'activités — configuration des ressources
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtDuration } from '../lib/format.js';

export const DEPTS_R = {
  departments: {
    path: '/departments',
    label: 'Départements',
    singular: 'Département',
    icon: 'Building2',
    searchPlaceholder: 'Nom du département…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="DepartmentType" value={r.type} /> },
      { title: 'Responsable', render: (r) => (r.leader ? `${r.leader.firstName} ${r.leader.lastName}` : '—') },
      { title: 'Membres', render: (r) => (r._count?.members || 0) },
      { title: 'Couleur', render: (r) => (r.color ? <span className="color-dot" style={{ background: r.color }} /> : '—') },
    ],
    filters: [{ name: 'type', label: 'Type', options: 'DepartmentType' }],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: 'DepartmentType' },
      F.responsible({ name: 'leaderPersonId', label: 'Responsable' }),
      { name: 'color', label: 'Couleur', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'department-members': {
    path: '/department-members',
    label: 'Membres de départements',
    singular: 'Membre de département',
    icon: 'UserPlus',
    columns: [
      { title: 'Département', render: (r) => name1(r.department) },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Rôle', render: (r) => <BadgeEnum group="DepartmentMemberRole" value={r.role} /> },
      { title: 'Actif', render: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Oui' : 'Non'}</Badge> },
    ],
    filters: [
      { name: 'departmentId', label: 'Département', source: '/departments', optionLabel: name1 },
      { name: 'role', label: 'Rôle', options: 'DepartmentMemberRole' },
    ],
    form: [
      { ...F.department({ required: true }) },
      { ...F.person({ required: true }) },
      { name: 'role', label: 'Rôle', type: 'select', options: 'DepartmentMemberRole' },
      { name: 'joinedAt', label: 'Date d’adhésion', type: 'date' },
      F.isActive(),
      F.notes(),
    ],
  },

  'department-stats': {
    path: '/department-stats',
    label: 'Effectifs de départements',
    singular: 'Effectif',
    icon: 'BarChart3',
    columns: [
      { title: 'Département', render: (r) => name1(r.department) },
      { title: 'Période', render: (r) => `${fmtDate(r.periodStart)} → ${fmtDate(r.periodEnd)}` },
      { title: 'Effectif', render: (r) => <b>{r.effectiveCount}</b> },
      { title: 'H / F', render: (r) => `${r.maleCount ?? '—'} / ${r.femaleCount ?? '—'}` },
    ],
    filters: [{ name: 'departmentId', label: 'Département', source: '/departments', optionLabel: name1 }],
    form: [
      { ...F.department({ required: true }) },
      { name: 'periodStart', label: 'Début de période', type: 'date', required: true },
      { name: 'periodEnd', label: 'Fin de période', type: 'date', required: true },
      { name: 'effectiveCount', label: 'Effectif', type: 'number', min: 0, required: true },
      { name: 'maleCount', label: 'Hommes', type: 'number', min: 0 },
      { name: 'femaleCount', label: 'Femmes', type: 'number', min: 0 },
      F.notes(),
    ],
  },

  'activity-types': {
    path: '/activity-types',
    label: "Types d'activités",
    singular: "Type d'activité",
    icon: 'ListTodo',
    searchPlaceholder: 'Nom du type…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Icône', render: (r) => r.icon || '—' },
      { title: 'Couleur', render: (r) => (r.color ? <span className="color-dot" style={{ background: r.color }} /> : '—') },
      { title: 'Durée défaut', render: (r) => fmtDuration(r.defaultDurationMin) },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'icon', label: 'Icône (lucide)', type: 'text' },
      { name: 'color', label: 'Couleur', type: 'text' },
      { name: 'defaultDurationMin', label: 'Durée par défaut (min)', type: 'number', min: 0 },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },
};