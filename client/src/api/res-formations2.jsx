// Formations (2/2) — leçons, séances
import { BadgeEnum } from '../components/ui.jsx';
import { name1 } from './resdefs.js';
import { fmtDate } from '../lib/format.js';
import { put } from './http.js';
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
      { title: 'Références', render: (r) => (r.verses && r.verses.length > 50 ? `${r.verses.slice(0, 50)}…` : (r.verses || '—')) },
      { title: 'Durée', render: (r) => (r.durationMin ? `${r.durationMin} min` : '—') },
    ],
    filters: [{ name: 'programId', label: 'Programme', source: '/formations/programs', optionLabel: name1 }],
    form: [
      { name: 'programId', label: 'Programme', type: 'async', source: '/formations/programs', optionLabel: name1, required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'number', label: 'Numéro', type: 'number', min: 0 },
      { name: 'objective', label: 'Objectif', type: 'textarea', full: true },
      { name: 'content', label: 'Contenu', type: 'textarea', full: true },
      { name: 'verses', label: 'Références bibliques', type: 'text', full: true, hint: 'Ex : Jean 3:16 ; Matthieu 28:19' },
      { name: 'durationMin', label: 'Durée (min)', type: 'number', min: 0 },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },
};