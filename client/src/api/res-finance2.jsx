// Finances — engagements (cotisations + promesses fusionnées) et paiements
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format.js';
import { Link } from 'react-router-dom';
import { HandCoins } from 'lucide-react';
import { ROLES } from './resdefs.js';

export const FINANCE2_R = {
  'finance/engagements': {
    path: '/finance/engagements',
    label: 'Engagements',
    singular: 'Engagement',
    icon: 'Handshake',
    searchPlaceholder: 'Nom, description…',
    roles: ROLES,
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Département', render: (r) => name1(r.department) },
      { title: 'Projet', render: (r) => name1(r.project) },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Paiements', render: (r) => (r._count?.payments || 0) },
      { title: 'Périodicité', render: (r) => <BadgeEnum group="Periodicity" value={r.periodicity} /> },
      { title: 'Échéance', render: (r) => fmtDate(r.dueDate) },
      { title: 'Statut', render: (r) => <BadgeEnum group="EngagementStatus" value={r.status} /> },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: 'EngagementStatus' },
      { name: 'periodicity', label: 'Périodicité', options: 'Periodicity' },
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
      { name: 'departmentId', label: 'Département', source: '/departments', optionLabel: name1 },
      { name: 'projectId', label: 'Projet', source: '/projects', optionLabel: name1 },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true, hint: 'Ex : Cotisation annuelle 2026, Promesse de don…' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { ...F.person() },
      F.department(),
      { name: 'projectId', label: 'Projet', type: 'async', source: '/projects', optionLabel: name1 },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      { name: 'periodicity', label: 'Périodicité', type: 'select', options: 'Periodicity' },
      { name: 'periodStart', label: 'Début de période', type: 'date' },
      { name: 'periodEnd', label: 'Fin de période', type: 'date' },
      { name: 'dueDate', label: 'Échéance', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: 'EngagementStatus' },
      F.notes('Notes'),
    ],
    rowActions: (row, { canEdit }) => (
      <>
        {canEdit && (
          <Link className="row-action" to={`/finance/engagement-payments?engagementId=${row.id}`} title="Voir / saisir les paiements">
            <HandCoins size={16} />
          </Link>
        )}
      </>
    ),
  },

  'finance/engagement-payments': {
    path: '/finance/engagement-payments',
    label: "Paiements d'engagements",
    singular: 'Paiement',
    icon: 'HandCoins',
    roles: ROLES,
    search: false,
    queryFilters: ['engagementId'],
    queryDefaults: { engagementId: 'engagementId' },
    columns: [
      { title: 'Engagement', render: (r) => name1(r.engagement) },
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Payé le', render: (r) => fmtDateTime(r.paidAt) },
      { title: 'Période', render: (r) => r.periodLabel || '—' },
    ],
    filters: [
      { name: 'engagementId', label: 'Engagement', source: '/finance/engagements', optionLabel: name1 },
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'engagementId', label: 'Engagement', type: 'async', source: '/finance/engagements', optionLabel: name1, required: true },
      { ...F.person() },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'paidAt', label: 'Payé le', type: 'datetime', required: true },
      { name: 'periodLabel', label: 'Période (ex: 2026)', type: 'text' },
      F.notes('Notes'),
    ],
  },
};
