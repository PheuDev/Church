// Contexte administratif (bureau national, sessions, sections, localités)
import { name1 } from './resdefs.js';

export const ADMIN_R = {
  'admin/offices': {
    path: '/admin/offices',
    label: "Sièges nationaux",
    singular: 'Siège',
    icon: 'Landmark',
    searchPlaceholder: 'Nom, code…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Code', render: (r) => r.code },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
    ],
    roles: { read: ['ADMIN', 'PASTOR'], write: ['ADMIN'], delete: ['ADMIN'] },
  },

  'admin/sessions': {
    path: '/admin/sessions',
    label: "Sessions de l'Union",
    singular: 'Session',
    icon: 'CalendarRange',
    searchPlaceholder: 'Nom, code…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Code', render: (r) => r.code },
      { title: 'Siège', render: (r) => name1(r.office) },
    ],
    filters: [{ name: 'officeId', label: 'Siège', source: '/admin/offices', optionLabel: name1 }],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'officeId', label: 'Siège', type: 'async', source: '/admin/offices', optionLabel: name1, required: true },
    ],
    roles: { read: ['ADMIN', 'PASTOR'], write: ['ADMIN'], delete: ['ADMIN'] },
  },

  'admin/departments': {
    path: '/admin/departments',
    label: 'Sections administratives',
    singular: 'Section',
    icon: 'PanelsTopLeft',
    searchPlaceholder: 'Nom de la section…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Session', render: (r) => name1(r.session) },
    ],
    filters: [{ name: 'sessionId', label: 'Session', source: '/admin/sessions', optionLabel: name1 }],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'sessionId', label: 'Session', type: 'async', source: '/admin/sessions', optionLabel: name1, required: true },
    ],
    roles: { read: ['ADMIN', 'PASTOR'], write: ['ADMIN'], delete: ['ADMIN'] },
  },

  'admin/localities': {
    path: '/admin/localities',
    label: 'Localités',
    singular: 'Localité',
    icon: 'MapPin',
    searchPlaceholder: 'Nom de la localité…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Section', render: (r) => name1(r.department) },
    ],
    filters: [{ name: 'departmentId', label: 'Section', source: '/admin/departments', optionLabel: name1 }],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'departmentId', label: 'Section', type: 'async', source: '/admin/departments', optionLabel: name1 },
    ],
    roles: { read: ['ADMIN', 'PASTOR'], write: ['ADMIN'], delete: ['ADMIN'] },
  },
};