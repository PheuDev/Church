// Finances — comptes, catégories, recettes, dépenses
import React from 'react';
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F, FLT } from './resdefs.js';
import { fmtDateTime, fmtMoney } from '../lib/format.js';
import { ROLES } from './resdefs.js';
import { ENUMS } from '../lib/enums.js';
import { list } from './http.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Formate les sources associées à un compte. */
const sourcesLabel = (r) => {
  if (!r.purpose || !Array.isArray(r.purpose) || !r.purpose.length) return '—';
  return r.purpose.map((s) => ENUMS.RevenueSource?.[s]?.label || s).join(', ');
};

/**
 * Options RevenueSource pour le multiselect du champ "sources associées".
 * Retournées comme tableau [{value, label}].
 */
const SOURCE_OPTIONS = Object.entries(ENUMS.RevenueSource || {}).map(([value, { label }]) => ({ value, label }));

// ── Ressources ────────────────────────────────────────────────────────────────

export const FINANCE1_R = {
  'finance/accounts': {
    path: '/finance/accounts',
    label: 'Comptes',
    singular: 'Compte',
    icon: 'Wallet',
    searchPlaceholder: 'Nom, banque…',
    roles: {
      read:   ROLES.readAll,
      write:  ['ADMIN', 'PASTOR', 'TREASURER'],
      delete: ['ADMIN'],
    },
    columns: [
      { title: 'Nom',       render: (r) => <b>{r.name}</b> },
      { title: 'Type',      render: (r) => <BadgeEnum group="AccountType" value={r.type} /> },
      { title: 'Sources associées', render: (r) => <span style={{ fontSize: 12 }}>{sourcesLabel(r)}</span> },
      { title: 'Banque',    render: (r) => r.bankName || '—' },
      { title: 'Devise',    render: (r) => r.currency || 'XOF' },
    ],
    form: [
      { name: 'name',   label: 'Nom du compte', type: 'text', required: true },
      { name: 'type',   label: 'Type', type: 'select', options: 'AccountType' },
      {
        // Multiselect des sources de revenus associées à ce compte
        name: 'purpose', label: 'Sources de revenus associées', type: 'multiselect',
        options: SOURCE_OPTIONS, full: true,
        hint: 'Sélectionnez les types d\'entrées qui doivent aller dans ce compte par défaut.',
      },
      { name: 'accountNumber',  label: 'N° de compte', type: 'text' },
      { name: 'bankName',       label: 'Banque',        type: 'text' },
      { name: 'phoneNumber',    label: 'Téléphone',     type: 'text' },
      { name: 'currency',       label: 'Code devise',   type: 'text', placeholder: 'XOF', omitWhenEmpty: true },
      { name: 'initialBalance', label: 'Solde initial', type: 'number', min: 0, step: 'any' },
      { name: 'description',    label: 'Description',   type: 'textarea', full: true },
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
      { title: 'Nom',  render: (r) => <b>{r.name}</b> },
      { title: 'Type', render: (r) => <BadgeEnum group="CategoryKind" value={r.kind} /> },
    ],
    filters: [{ name: 'kind', label: 'Type', options: 'CategoryKind' }],
    form: [
      { name: 'name',        label: 'Nom',  type: 'text', required: true },
      { name: 'kind',        label: 'Type', type: 'select', options: 'CategoryKind' },
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
    // Pré-remplissage du compte selon la source sélectionnée
    // accountId sera injecté via queryDefaults si ?source= est dans l'URL,
    // mais le mécanisme principal est côté formulaire (onChange source → compte).
    columns: [
      { title: 'Description', render: (r) => <b>{r.description}</b> },
      { title: 'Source',      render: (r) => <BadgeEnum group="RevenueSource" value={r.source} /> },
      { title: 'Montant',     render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Compte',      render: (r) => name1(r.account) },
      { title: 'Reçue le',   render: (r) => fmtDateTime(r.receivedAt) },
    ],
    filters: [
      FLT.source(),
      { name: 'accountId',  label: 'Compte',    source: '/finance/accounts',    optionLabel: name1 },
      { name: 'categoryId', label: 'Catégorie', source: '/finance/categories',  optionLabel: name1 },
    ],
    form: [
      // La source est en premier : quand elle change, le compte se pré-sélectionne
      { name: 'source', label: 'Source', type: 'select', options: 'RevenueSource',
        hint: 'Le compte associé à cette source se sélectionne automatiquement si configuré.' },
      F.account({ hint: 'Pré-sélectionné selon la source ci-dessus.' }),
      F.category(),
      { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
      { name: 'amount',      label: 'Montant',      type: 'number',   min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'payerId',       label: 'Donateur / payeur', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'receivedAt',    label: 'Reçue le', type: 'datetime', required: true },
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
      { title: 'Catégorie',   render: (r) => name1(r.category) },
      { title: 'Montant',     render: (r) => <b>{fmtMoney(r.amount)}</b>, align: 'right' },
      { title: 'Compte',      render: (r) => name1(r.account) },
      { title: 'Date',        render: (r) => fmtDateTime(r.expenseDate) },
    ],
    filters: [
      { name: 'accountId',  label: 'Compte',    source: '/finance/accounts',   optionLabel: name1 },
      { name: 'categoryId', label: 'Catégorie', source: '/finance/categories', optionLabel: name1 },
    ],
    form: [
      F.account(),
      F.category(),
      { name: 'description',  label: 'Description', type: 'textarea', required: true, full: true },
      { name: 'amount',       label: 'Montant',      type: 'number',  min: 0, step: 'any', required: true },
      F.paymentMethod(),
      { name: 'beneficiary',  label: 'Bénéficiaire',  type: 'text' },
      { name: 'expenseDate',  label: 'Date',           type: 'datetime', required: true },
      { name: 'receiptNumber', label: 'N° de reçu',   type: 'text' },
      F.notes('Notes'),
    ],
  },
};
