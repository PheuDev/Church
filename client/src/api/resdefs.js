// ============================================================
// Définitions partagées pour la configuration des ressources
// ============================================================
import { fmtDate } from '../lib/format.js';

export const personLabel = (row) => (row ? `${row.firstName} ${row.lastName}` : '—');
export const name1 = (row) => (row?.name || '—');
export const dateRange = (a, b) => `${fmtDate(a)} → ${fmtDate(b)}`;

export const ROLES = {
  readAll: ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'],
  writeDefault: ['ADMIN', 'PASTOR', 'SECRETARY'],
  deleteAdmin: ['ADMIN'],
  writeFinance: ['ADMIN', 'PASTOR', 'TREASURER', 'SECRETARY'],
  deleteFinance: ['ADMIN', 'TREASURER'],
  readAudit: ['ADMIN', 'PASTOR'],
  writeUsers: ['ADMIN', 'PASTOR'],
};

// Champs récurrents
export const F = {
  person: (extra = {}) => ({ name: 'personId', label: 'Personne', type: 'async', source: '/persons', optionLabel: personLabel, ...extra }),
  department: (extra = {}) => ({ name: 'departmentId', label: 'Département', type: 'async', source: '/departments', optionLabel: name1, ...extra }),
  responsible: (extra = {}) => ({ name: 'responsibleId', label: 'Responsable', type: 'async', source: '/persons', optionLabel: personLabel, ...extra }),
  teacher: (extra = {}) => ({ name: 'teacherId', label: 'Enseignant', type: 'async', source: '/persons', optionLabel: personLabel, ...extra }),
  notes: (label = 'Notes') => ({ name: 'notes', label, type: 'textarea', full: true }),
  isActive: () => ({ name: 'isActive', label: 'Actif', type: 'boolean' }),
  account: (extra = {}) => ({ name: 'accountId', label: 'Compte', type: 'async', source: '/finance/accounts', optionLabel: name1, ...extra }),
  category: (extra = {}) => ({ name: 'categoryId', label: 'Catégorie', type: 'async', source: '/finance/categories', optionLabel: name1, ...extra }),
  paymentMethod: () => ({ name: 'paymentMethod', label: 'Mode de paiement', type: 'select', options: 'PaymentMethod' }),
};

// Filtres récurrents
export const FLT = {
  status: (label = 'Statut', options = 'ActivityStatus') => ({ name: 'status', label, options }),
  source: () => ({ name: 'source', label: 'Source', options: 'RevenueSource' }),
};