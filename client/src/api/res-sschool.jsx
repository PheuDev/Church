// École du dimanche — classes et séances dimanche enrichies
import { BadgeEnum } from '../components/ui.jsx';
import { name1, F } from './resdefs.js';
import { fmtDate, fmtMoney } from '../lib/format.js';
import { toInputDate } from '../lib/format.js';

export const SSUNDAY_R = {
  'sunday-school/classes': {
    path: '/sunday-school/classes',
    label: 'Classes (École du dimanche)',
    singular: 'Classe',
    icon: 'GraduationCap',
    searchPlaceholder: 'Nom de la classe…',
    columns: [
      { title: 'Nom',        render: (r) => <b>{r.name}</b> },
      { title: 'Enseignant', render: (r) => (r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—') },
      { title: 'Séances',    render: (r) => (r._count?.sessions || 0) },
      { title: 'Actif',      render: (r) => <BadgeEnum group="ActivityStatus" value={r.isActive ? 'DONE' : 'CANCELLED'} /> },
    ],
    form: [
      { name: 'name', label: 'Nom de la classe', type: 'text', required: true },
      F.teacher(),
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'sunday-school/sessions': {
    path: '/sunday-school/sessions',
    label: 'Séances (École du dimanche)',
    singular: 'Séance',
    icon: 'Presentation',
    searchPlaceholder: 'Titre, thème…',
    columns: [
      { title: 'Date',       render: (r) => fmtDate(r.sessionDate), sortKey: 'sessionDate' },
      { title: 'Classe',     render: (r) => name1(r.class) },
      { title: 'Thème',      render: (r) => r.lessonTopic || r.title },
      { title: 'Enseignant', render: (r) => (r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—') },
      { title: 'Effectif',   render: (r) => <b>{r.presentCount ?? 0}</b> },
      { title: 'Bibles',     render: (r) => r.bibleCount ?? 0 },
      { title: 'Offrande',   render: (r) => fmtMoney(r.offering ?? 0) },
    ],
    filters: [
      { name: 'classId', label: 'Classe', source: '/sunday-school/classes', optionLabel: name1 },
    ],
    // Valeurs par défaut à la création : date = aujourd'hui
    queryDefaults: {},
    form: [
      { name: 'classId',     label: 'Classe',    type: 'async', source: '/sunday-school/classes', optionLabel: name1, required: true },
      { name: 'sessionDate', label: 'Date du dimanche', type: 'date', required: true,
        hint: 'La date du dimanche concerné.' },
      { name: 'title',       label: 'Titre / leçon', type: 'text', required: true,
        hint: 'Ex : Leçon 5 — La foi' },
      F.teacher({ hint: 'Sélectionner dans l\'annuaire.' }),
      { name: 'lessonTopic', label: 'Thème ou texte de base', type: 'text', full: true },
      { name: 'presentCount', label: 'Effectif présent',  type: 'number', min: 0 },
      { name: 'absentCount',  label: 'Absents',           type: 'number', min: 0 },
      { name: 'bibleCount',   label: 'Bibles apportées',  type: 'number', min: 0 },
      { name: 'offering',     label: 'Offrande (FCFA)',   type: 'number', min: 0, step: 'any' },
      { name: 'attendanceNotes', label: 'Observations', type: 'textarea', full: true,
        hint: 'Noms des absents, remarques diverses…' },
    ],
  },
};
