// Finances (2/2) — cotisations, engagements, paiements
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format.js';
import { ROLES } from './resdefs.js';

export const FINANCE2_R = {
  'finance/contributions': {
    path: '/finance/contributions',
    label: 'Cotisations',
    singular: 'Cotisation',
    icon: 'HandCoins',
    searchPlaceholder: 'Nom de la cotisation…',
    roles: ROLES,
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Montant', render: (r) => fmtMoney(r.amount), align: 'right' },
      { title: 'Périodicité', render: (r) => <BadgeEnum group="Periodicity" value={r.periodicity} /> },
      { title: 'Période', render: (r) => `${fmtDate(r.periodStart)} → ${fmtDate(r.periodEnd)}` },
      { title: 'Échéance', render: (r) => fmtDate(r.dueDate) },
      { title: 'Statut', render: (r) => <BadgeEnum group="ContributionStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: 'ContributionStatus' },
      { name: 'periodicity', label: 'Périodicité', options: 'Periodicity' },
      { name: 'departmentId', label: 'Département', source: '/departments', optionLabel: name1 },
    ],
    form: [
      F.department(),
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      { name: 'periodicity', label: 'Périodicité', type: 'select', options: 'Periodicity' },
      { name: 'periodStart', label: 'Début de période', type: 'date' },
      { name: 'periodEnd', label: 'Fin de période', type: 'date' },
      { name: 'dueDate', label: 'Date d’échéance', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: 'ContributionStatus' },
    ],
  },

  'finance/contribution-payments': {
    path: '/finance/contribution-payments',
    label: 'Paiements de cotisations',
    singular: 'Paiement',
    icon: 'HandCoins',
    roles: ROLES,
    columns: [
      { title: 'Cotisation', render: (r) => name1(r.contribution) },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Payé le', render: (r) => fmtDateTime(r.paidAt) },
      { title: 'Période', render: (r) => r.periodLabel || '—' },
    ],
    filters: [
      { name: 'contributionId', label: 'Cotisation', source: '/finance/contributions', optionLabel: name1 },
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'contributionId', label: 'Cotisation', type: 'async', source: '/finance/contributions', optionLabel: name1, required: true },
      { ...F.person({ required: true }) },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'paidAt', label: 'Payé le', type: 'datetime', required: true },
      { name: 'periodLabel', label: 'Période (ex: 2026)', type: 'text' },
      F.notes('Notes'),
    ],
  },
};