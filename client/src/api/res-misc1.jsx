// Événements, projets, participants — configuration
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format.js';
import { put } from './http.js';

export const MISC_R = {
  events: {
    path: '/events',
    label: 'Événements',
    singular: 'Événement',
    icon: 'PartyPopper',
    searchPlaceholder: 'Nom, lieu…',
    stripKeys: ['participantIds'],
    formInitial: (row) => ({
      ...(row || {}),
      participantIds: (row?.participants || []).map((p) => p.personId),
    }),
    afterSave: async (saved, extras, { put: putFn }) => {
      await (putFn || put)('/events', saved.id, 'participants', { personIds: extras.participantIds || [] });
    },
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="EventType" value={r.type} /> },
      { title: 'Début', render: (r) => fmtDateTime(r.startDate) },
      { title: 'Lieu', render: (r) => r.location || '—' },
      { title: 'Participants', render: (r) => (r._count?.participants || 0) },
      { title: 'Budget', render: (r) => fmtMoney(r.budget), align: 'right' },
      { title: 'Statut', render: (r) => <BadgeEnum group="ActivityStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'type', label: 'Type', options: 'EventType' },
      { name: 'status', label: 'Statut', options: 'ActivityStatus' },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: 'EventType' },
      { name: 'startDate', label: 'Début', type: 'date', required: true },
      { name: 'endDate', label: 'Fin', type: 'date' },
      { name: 'location', label: 'Lieu', type: 'text' },
      F.responsible(),
      { name: 'budget', label: 'Budget', type: 'number', min: 0, step: 'any' },
      { name: 'status', label: 'Statut', type: 'select', options: 'ActivityStatus' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'reportNote', label: 'Rapport', type: 'textarea', full: true },
      {
        name: 'participantIds', label: 'Participants', type: 'multiselect', full: true,
        source: '/persons', sourceParams: { active: 'true' }, optionLabel: personLabel,
        hint: "Cochez les personnes inscrites à cet événement.",
      },
    ],
  },

  projects: {
    path: '/projects',
    label: 'Projets',
    singular: 'Projet',
    icon: 'Hammer',
    searchPlaceholder: 'Nom, lieu…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="ProjectType" value={r.type} /> },
      { title: 'Statut', render: (r) => <BadgeEnum group="ProjectStatus" value={r.status} /> },
      { title: 'Engagements', render: (r) => (r._count?.engagements || 0) },
      { title: 'Cible', render: (r) => fmtMoney(r.targetAmount), align: 'right' },
      { title: 'Début', render: (r) => fmtDate(r.startDate) },
      { title: 'Responsable', render: (r) => (r.responsible ? `${r.responsible.firstName} ${r.responsible.lastName}` : '—') },
    ],
    filters: [
      { name: 'type', label: 'Type', options: 'ProjectType' },
      { name: 'status', label: 'Statut', options: 'ProjectStatus' },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: 'ProjectType' },
      { name: 'status', label: 'Statut', type: 'select', options: 'ProjectStatus' },
      { name: 'startDate', label: 'Début', type: 'date' },
      { name: 'endDate', label: 'Fin', type: 'date' },
      { name: 'targetAmount', label: 'Montant cible', type: 'number', min: 0, step: 'any' },
      F.responsible(),
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },
};