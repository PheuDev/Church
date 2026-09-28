// Événements, projets, utilisateurs, audit — configuration
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format.js';
import { ROLES } from './resdefs.js';

export const MISC_R = {
  events: {
    path: '/events',
    label: 'Événements',
    singular: 'Événement',
    icon: 'PartyPopper',
    searchPlaceholder: 'Nom, lieu…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="EventType" value={r.type} /> },
      { title: 'Début', render: (r) => fmtDateTime(r.startDate) },
      { title: 'Lieu', render: (r) => r.location || '—' },
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
    ],
  },

  'event-participants': {
    path: '/event-participants',
    label: 'Participants',
    singular: 'Participant',
    icon: 'UserCheck',
    columns: [
      { title: 'Événement', render: (r) => name1(r.event) },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Rôle', render: (r) => r.role || '—' },
      { title: 'Confirmé', render: (r) => <Badge tone={r.isConfirmed ? 'green' : 'gray'}>{r.isConfirmed ? 'Oui' : 'Non'}</Badge> },
    ],
    filters: [
      { name: 'eventId', label: 'Événement', source: '/events', optionLabel: name1 },
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'eventId', label: 'Événement', type: 'async', source: '/events', optionLabel: name1, required: true },
      { ...F.person({ required: true }) },
      { name: 'role', label: 'Rôle', type: 'text' },
      { name: 'isConfirmed', label: 'Participation confirmée', type: 'boolean' },
      { name: 'note', label: 'Note', type: 'textarea', full: true },
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