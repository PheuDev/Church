// Formations (2/2) — leçons, séances, versets
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1 } from './resdefs.js';
import { fmtDate } from '../lib/format.js';

export const FORMATIONS2_R = {
  'formations/lessons': {
    path: '/formations/lessons',
    label: 'Leçons',
    singular: 'Leçon',
    icon: 'BookMarked',
    searchPlaceholder: 'Titre de la leçon…',
    columns: [
      { title: 'N°', render: (r) => r.number ?? '—' },
      { title: 'Titre', render: (r) => <b>{r.title}</b> },
      { title: 'Programme', render: (r) => name1(r.program) },
      { title: 'Versets', render: (r) => (r._count?.verses || 0) },
      { title: 'Durée', render: (r) => (r.durationMin ? `${r.durationMin} min` : '—') },
    ],
    filters: [{ name: 'programId', label: 'Programme', source: '/formations/programs', optionLabel: name1 }],
    form: [
      { name: 'programId', label: 'Programme', type: 'async', source: '/formations/programs', optionLabel: name1, required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'number', label: 'Numéro', type: 'number', min: 0 },
      { name: 'objective', label: 'Objectif', type: 'textarea', full: true },
      { name: 'content', label: 'Contenu', type: 'textarea', full: true },
      { name: 'durationMin', label: 'Durée (min)', type: 'number', min: 0 },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  'formations/session-lessons': {
    path: '/formations/session-lessons',
    label: 'Séances de formation',
    singular: 'Séance',
    icon: 'ListVideo',
    searchPlaceholder: 'Titre de la séance…',
    columns: [
      { title: 'Titre', render: (r) => <b>{r.title}</b> },
      { title: 'Session', render: (r) => name1(r.session) },
      { title: 'Leçon', render: (r) => (r.lesson ? r.lesson.title : '—') },
      { title: 'Type', render: (r) => <BadgeEnum group="SeanceType" value={r.seanceType} /> },
      { title: 'Date', render: (r) => fmtDate(r.taughtAt) },
    ],
    filters: [
      { name: 'sessionId', label: 'Session', source: '/formations/sessions', optionLabel: name1 },
      { name: 'seanceType', label: 'Type', options: 'SeanceType' },
    ],
    form: [
      { name: 'sessionId', label: 'Session de formation', type: 'async', source: '/formations/sessions', optionLabel: name1, required: true },
      { name: 'lessonId', label: 'Leçon (optionnel)', type: 'async', source: '/formations/lessons', optionLabel: (r) => r.title },
      { name: 'seanceType', label: 'Type de séance', type: 'select', options: 'SeanceType' },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'taughtAt', label: 'Enseignée le', type: 'date' },
      { name: 'teacherId', label: 'Enseignant', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'objective', label: 'Objectif', type: 'textarea', full: true },
      { name: 'content', label: 'Contenu', type: 'textarea', full: true },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  'formations/verses': {
    path: '/formations/verses',
    label: 'Versets bibliques',
    singular: 'Verset',
    icon: 'BookOpenText',
    searchPlaceholder: 'Texte, livre…',
    columns: [
      { title: 'Référence', render: (r) => <b>{r.book} {r.chapter}:{r.verse}</b> },
      { title: 'Texte', render: (r) => (r.text.length > 70 ? `${r.text.slice(0, 70)}…` : r.text) },
      { title: 'Version', render: (r) => r.version || '—' },
    ],
    form: [
      { name: 'book', label: 'Livre', type: 'text', required: true },
      { name: 'chapter', label: 'Chapitre', type: 'number', min: 0, required: true },
      { name: 'verse', label: 'Verset', type: 'number', min: 0, required: true },
      { name: 'text', label: 'Texte', type: 'textarea', required: true, full: true },
      { name: 'version', label: 'Version', type: 'text' },
    ],
  },

  'formations/lesson-verses': {
    path: '/formations/lesson-verses',
    label: 'Associations leçon–verset',
    singular: 'Association',
    icon: 'Link2',
    columns: [
      { title: 'Leçon', render: (r) => (r.lesson ? r.lesson.title : '—') },
      { title: 'Verset', render: (r) => (r.verse ? `${r.verse.book} ${r.verse.chapter}:${r.verse.verse}` : '—') },
      { title: 'Position', render: (r) => r.position ?? '—' },
    ],
    filters: [
      { name: 'lessonId', label: 'Leçon', source: '/formations/lessons', optionLabel: (r) => r.title },
      { name: 'verseId', label: 'Verset', source: '/formations/verses', optionLabel: (r) => r.id },
    ],
    form: [
      { name: 'lessonId', label: 'Leçon', type: 'async', source: '/formations/lessons', optionLabel: (r) => r.title, required: true },
      { name: 'verseId', label: 'Verset', type: 'async', source: '/formations/verses', optionLabel: (r) => `${r.book} ${r.chapter}:${r.verse}`, required: true },
      { name: 'position', label: 'Position', type: 'number', min: 0 },
    ],
  },
};