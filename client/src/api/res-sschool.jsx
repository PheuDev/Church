// École du dimanche — configuration des ressources
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate } from '../lib/format.js';

export const SSUNDAY_R = {
  'sunday-school/classes': {
    path: '/sunday-school/classes',
    label: 'Classes du dimanche',
    singular: 'Classe',
    icon: 'GraduationCap',
    searchPlaceholder: 'Nom de la classe…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Enseignant', render: (r) => (r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—') },
      { title: 'Âges', render: (r) => `${r.minAge ?? '—'} – ${r.maxAge ?? '—'}` },
      { title: 'Séances', render: (r) => (r._count?.sessions || 0) },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      F.teacher(),
      { name: 'minAge', label: 'Âge minimum', type: 'number', min: 0 },
      { name: 'maxAge', label: 'Âge maximum', type: 'number', min: 0 },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'sunday-school/sessions': {
    path: '/sunday-school/sessions',
    label: 'Séances du dimanche',
    singular: 'Séance',
    icon: 'Presentation',
    searchPlaceholder: 'Titre, thème…',
    columns: [
      { title: 'Titre', render: (r) => <b>{r.title}</b> },
      { title: 'Classe', render: (r) => name1(r.class) },
      { title: 'Date', render: (r) => fmtDate(r.sessionDate) },
      { title: 'Enseignant', render: (r) => (r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—') },
      { title: 'Statut', render: (r) => <BadgeEnum group="ActivityStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'classId', label: 'Classe', source: '/sunday-school/classes', optionLabel: name1 },
      { name: 'status', label: 'Statut', options: 'ActivityStatus' },
    ],
    form: [
      { name: 'classId', label: 'Classe', type: 'async', source: '/sunday-school/classes', optionLabel: name1, required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'sessionDate', label: 'Date', type: 'date', required: true },
      { name: 'startTime', label: 'Début (HH:MM)', type: 'time' },
      { name: 'endTime', label: 'Fin (HH:MM)', type: 'time' },
      F.teacher(),
      { name: 'lessonTopic', label: 'Leçon / thème', type: 'text', full: true },
      { name: 'status', label: 'Statut', type: 'select', options: 'ActivityStatus' },
      F.notes('Notes'),
    ],
  },

  'sunday-school/participants': {
    path: '/sunday-school/participants',
    label: 'Présences école du dimanche',
    singular: 'Présence',
    icon: 'ClipboardCheck',
    columns: [
      { title: 'Séance', render: (r) => (r.session ? r.session.title : '—') },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Statut', render: (r) => <BadgeEnum group="AttendanceStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'sessionId', label: 'Séance', source: '/sunday-school/sessions', optionLabel: (r) => r.title },
      { name: 'status', label: 'Statut', options: 'AttendanceStatus' },
    ],
    form: [
      { name: 'sessionId', label: 'Séance', type: 'async', source: '/sunday-school/sessions', optionLabel: (r) => r.title, required: true },
      { ...F.person({ required: true }) },
      { name: 'status', label: 'Statut', type: 'select', options: 'AttendanceStatus' },
      { name: 'note', label: 'Note', type: 'textarea', full: true },
    ],
  },
};