// Finances (1/2) — comptes, fonds, catégories, recettes, dépenses
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F, FLT } from './resdefs.js';
import { fmtDateTime, fmtMoney } from '../lib/format.js';
import { ROLES } from './resdefs.js';

export const FINANCE1_R = {
  'finance/accounts': {
    path: '/finance/accounts',
    label: 'Comptes',
    singular: 'Compte',
    icon: 'Wallet',
    searchPlaceholder: 'Nom, banque…',
    roles: ROLES,
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="AccountType" value={r.type} /> },
      { title: 'N° compte', render: (r) => r.accountNumber || '—' },
      { title: 'Banque', render: (r) => r.bankName || '—' },
      { title: 'Devise', render: (r) => r.currency || 'XAF' },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: 'AccountType' },
      { name: 'accountNumber', label: 'N° de compte', type: 'text' },
      { name: 'bankName', label: 'Banque', type: 'text' },
      { name: 'phoneNumber', label: 'Téléphone', type: 'text' },
      { name: 'currency', label: 'Devise', type: 'text' },
      { name: 'initialBalance', label: 'Solde initial', type: 'number', min: 0, step: 'any' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'finance/funds': {
    path: '/finance/funds',
    label: 'Fonds',
    singular: 'Fonds',
    icon: 'PiggyBank',
    searchPlaceholder: 'Nom du fonds…',
    roles: ROLES,
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Description', render: (r) => (r.description ? r.description.slice(0, 60) : '—') },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'finance/categories': {
    path: '/finance/categories',
    label: 'Catégories financières',
    singular: 'Catégorie',
    icon: 'Tags',
    searchPlaceholder: 'Nom de la catégorie…',
    roles: ROLES,
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="CategoryKind" value={r.kind} /> },
    ],
    filters: [{ name: 'kind', label: 'Type', options: 'CategoryKind' }],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'kind', label: 'Type', type: 'select', options: 'CategoryKind' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      F.isActive(),
    ],
  },

  'finance/revenues': {
    path: '/finance/revenues',
    label: 'Recettes',
    singular: 'Recette',
    icon: 'Banknote',
    searchPlaceholder: 'Description, reçu…',
    roles: ROLES,
    csv: true,
    columns: [
      { title: 'Description', render: (r) => <b>{r.description}</b> },
      { title: 'Source', render: (r) => <BadgeEnum group="RevenueSource" value={r.source} /> },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Compte', render: (r) => name1(r.account) },
      { title: 'Reçue le', render: (r) => fmtDateTime(r.receivedAt) },
    ],
    filters: [
      FLT.source(),
      { name: 'accountId', label: 'Compte', source: '/finance/accounts', optionLabel: name1 },
      { name: 'categoryId', label: 'Catégorie', source: '/finance/categories', optionLabel: name1 },
    ],
    form: [
      F.account(),
      F.fund(),
      F.category(),
      { name: 'source', label: 'Source', type: 'select', options: 'RevenueSource' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'payerId', label: 'Donateur / payeur', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'receivedAt', label: 'Reçue le', type: 'datetime', required: true },
      { name: 'receiptNumber', label: 'N° de reçu', type: 'text' },
      F.notes('Notes'),
    ],
  },

  'finance/expenses': {
    path: '/finance/expenses',
    label: 'Dépenses',
    singular: 'Dépense',
    icon: 'Receipt',
    searchPlaceholder: 'Description, reçu…',
    roles: ROLES,
    csv: true,
    columns: [
      { title: 'Description', render: (r) => <b>{r.description}</b> },
      { title: 'Catégorie', render: (r) => name1(r.category) },
      { title: 'Montant', render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Compte', render: (r) => name1(r.account) },
      { title: 'Date', render: (r) => fmtDateTime(r.expenseDate) },
    ],
    filters: [
      { name: 'accountId', label: 'Compte', source: '/finance/accounts', optionLabel: name1 },
      { name: 'categoryId', label: 'Catégorie', source: '/finance/categories', optionLabel: name1 },
    ],
    form: [
      F.account(),
      F.category(),
      { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
      { name: 'amount', label: 'Montant', type: 'number', min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'beneficiary', label: 'Bénéficiaire', type: 'text' },
      { name: 'expenseDate', label: 'Date', type: 'datetime', required: true },
      { name: 'receiptNumber', label: 'N° de reçu', type: 'text' },
      F.notes('Notes'),
    ],
  },
};