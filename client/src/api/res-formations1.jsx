// Formations (1/2) — programmes & sessions (leçons dispensées intégrées)
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1 } from './resdefs.js';
import { fmtDate } from '../lib/format.js';
import { put } from './http.js';

export const FORMATIONS_R = {
  'formations/programs': {
    path: '/formations/programs',
    label: 'Programmes de formation',
    singular: 'Programme',
    icon: 'BookOpen',
    searchPlaceholder: 'Nom du programme…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Notation', render: (r) => <BadgeEnum group="GradingMode" value={r.gradingMode} /> },
      { title: 'Seuil', render: (r) => (r.passThreshold ? `${r.passThreshold} %` : '—') },
      { title: 'Leçons', render: (r) => (r._count?.lessons || 0) },
      { title: 'Sessions', render: (r) => (r._count?.sessions || 0) },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'gradingMode', label: 'Mode de notation', type: 'select', options: 'GradingMode' },
      { name: 'passThreshold', label: 'Seuil de réussite (%)', type: 'number', min: 0, max: 100 },
      { name: 'totalLessons', label: 'Total de leçons', type: 'number', min: 0 },
      { name: 'durationWeeks', label: 'Durée (semaines)', type: 'number', min: 0 },
      { name: 'isActive', label: 'Actif', type: 'boolean' },
    ],
  },

  'formations/sessions': {
    path: '/formations/sessions',
    label: 'Sessions de formation',
    singular: 'Session',
    icon: 'Presentation',
    searchPlaceholder: 'Nom de la session…',
    stripKeys: ['lessonIds'],
    formInitial: (row) => ({
      ...(row || {}),
      lessonIds: (row?.lessonPlans || []).map((l) => l.lessonId),
    }),
    afterSave: async (saved, extras, { put: putFn }) => {
      await (putFn || put)('/formations/sessions', saved.id, 'lessons', { lessonIds: extras.lessonIds || [] });
    },
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Programme', render: (r) => name1(r.program) },
      { title: 'Début', render: (r) => fmtDate(r.startDate) },
      { title: 'Statut', render: (r) => <BadgeEnum group="FormationStatus" value={r.status} /> },
      { title: 'Leçons dispensées', render: (r) => (r._count?.lessonPlans || 0) },
    ],
    filters: [
      { name: 'programId', label: 'Programme', source: '/formations/programs', optionLabel: name1 },
      { name: 'status', label: 'Statut', options: 'FormationStatus' },
    ],
    form: [
      { name: 'programId', label: 'Programme', type: 'async', source: '/formations/programs', optionLabel: name1, required: true },
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'startDate', label: 'Début', type: 'date' },
      { name: 'endDate', label: 'Fin', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: 'FormationStatus' },
      { name: 'responsibleId', label: 'Responsable', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      {
        name: 'lessonIds', label: 'Leçons dispensées', type: 'multiselect', full: true,
        source: '/formations/lessons', optionLabel: (r) => r.title,
        hint: 'Cochez les leçons dispensées pendant cette session.',
      },
    ],
  },
};
