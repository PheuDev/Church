// Départements & types d'activités — configuration des ressources
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { name1, F } from './resdefs.js';
import { fmtDuration } from '../lib/format.js';

export const DEPTS_R = {
  departments: {
    path: '/departments',
    label: 'Départements',
    singular: 'Département',
    icon: 'Building2',
    searchPlaceholder: 'Nom du département…',
    columns: [
      { title: 'Nom',         render: (r) => <b>{r.name}</b> },
      { title: 'Type',        render: (r) => <BadgeEnum group="DepartmentType" value={r.type} /> },
      { title: 'Responsable', render: (r) => (r.leader ? `${r.leader.firstName} ${r.leader.lastName}` : '—') },
      { title: 'Effectif',    render: (r) => (r.headcount != null ? <b>{r.headcount}</b> : '—') },
      { title: 'H / F',       render: (r) => (r.headcountMale != null ? `${r.headcountMale} / ${r.headcountFemale ?? '—'}` : '—') },
      { title: 'Couleur',     render: (r) => (r.color ? <span className="color-dot" style={{ background: r.color }} /> : '—') },
    ],
    filters: [{ name: 'type', label: 'Type', options: 'DepartmentType' }],
    form: [
      { name: 'name',  label: 'Nom',  type: 'text', required: true },
      { name: 'type',  label: 'Type', type: 'select', options: 'DepartmentType' },
      F.responsible({ name: 'leaderPersonId', label: 'Responsable' }),
      { name: 'headcount',       label: 'Effectif total',   type: 'number', min: 0,
        hint: 'Nombre total de membres de ce département.' },
      { name: 'headcountMale',   label: 'Dont hommes',      type: 'number', min: 0 },
      { name: 'headcountFemale', label: 'Dont femmes',      type: 'number', min: 0 },
      { name: 'color',       label: 'Couleur (hex)',    type: 'text', hint: 'Ex : #2563eb' },
      { name: 'description', label: 'Description',      type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'department-stats': {
    path: '/department-stats',
    label: 'Effectifs par département',
    singular: 'Effectif',
    icon: 'BarChart3',
    readOnly: true,
    search: false,
    emptyTitle: 'Aucun département',
    emptyMessage: 'Créez des départements et renseignez leur effectif.',
    columns: [
      { title: 'Département', render: (r) => name1(r.department) },
      { title: 'Effectif saisi',   render: (r) => <b>{r.effectiveCount}</b> },
      { title: 'H / F',            render: (r) => `${r.maleCount ?? '—'} / ${r.femaleCount ?? '—'}` },
      { title: 'Membres annuaire', render: (r) => r.registeredCount ?? '—',
        // info complémentaire : membres effectivement dans l'annuaire
      },
      { title: 'Actif', render: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Oui' : 'Non'}</Badge> },
    ],
    filters: [{ name: 'departmentId', label: 'Département', source: '/departments', optionLabel: name1 }],
    form: [],
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