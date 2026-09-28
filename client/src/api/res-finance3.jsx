// Finances (suite) — engagements & paiements d'engagements
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDateTime, fmtMoney } from '../lib/format.js';
import { ROLES } from './resdefs.js';

export const FINANCE3_R = {
  'finance/commitments': {
    path: '/finance/commitments',
    label: 'Engagements / promesses',
    singular: 'Engagement',
    icon: 'Handshake',
    searchPlaceholder: 'Description…',
    roles: ROLES,
    columns: [
      { title: 'Description', render: (r) => <b>{r.description}</b> },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Projet', render: (r) => name1(r.project) },
      { title: 'Type', render: (r) => <BadgeEnum group="CommitmentKind" value={r.kind} /> },
      { title: 'Montant', render: (r) => fmtMoney(r.amount), align: 'right' },
      { title: 'Statut', render: (r) => <BadgeEnum group="CommitmentStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
      { name: 'projectId', label: 'Projet', source: '/projects', optionLabel: name1 },
      { name: 'status', label: 'Statut', options: 'CommitmentStatus' },
      { name: 'kind', label: 'Type', options: 'CommitmentKind' },
    ],
    form: [
      { ...F.person({ required: true }) },
      { name: 'projectId', label: 'Projet', type: 'async', source: '/projects', optionLabel: name1 },
      { name: 'kind', label: 'Type', type: 'select', options: 'CommitmentKind' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any' },
      { name: 'status', label: 'Statut', type: 'select', options: 'CommitmentStatus' },
      { name: 'startDate', label: 'Début', type: 'date' },
      { name: 'dueDate', label: 'Échéance', type: 'date' },
      F.notes('Notes'),
    ],
  },

  'finance/commitment-payments': {
    path: '/finance/commitment-payments',
    label: "Paiements d'engagements",
    singular: 'Paiement',
    icon: 'HandCoins',
    roles: ROLES,
    columns: [
      { title: 'Engagement', render: (r) => (r.commitment ? r.commitment.description : '—') },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Payé le', render: (r) => fmtDateTime(r.paidAt) },
      { title: 'Mode', render: (r) => <BadgeEnum group="PaymentMethod" value={r.paymentMethod} /> },
    ],
    filters: [{ name: 'commitmentId', label: 'Engagement', source: '/finance/commitments', optionLabel: (r) => r.description }],
    form: [
      { name: 'commitmentId', label: 'Engagement', type: 'async', source: '/finance/commitments', optionLabel: (r) => r.description, required: true },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'paidAt', label: 'Payé le', type: 'datetime', required: true },
      { name: 'note', label: 'Note', type: 'textarea', full: true },
    ],
  },
};