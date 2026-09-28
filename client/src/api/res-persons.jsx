// Personnes & familles — configuration des ressources
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';

export const PERSONS_R = {
  persons: {
    path: '/persons',
    label: 'Annuaire',
    singular: 'Personne',
    icon: 'Users',
    searchPlaceholder: 'Nom, téléphone, n° de membre…',
    columns: [
      { title: 'Nom', render: (r) => <b>{personLabel(r)}</b> },
      { title: 'Sexe', render: (r) => <BadgeEnum group="Gender" value={r.gender} /> },
      { title: 'Statut', render: (r) => <BadgeEnum group="PersonStatus" value={r.status} /> },
      { title: 'Famille', render: (r) => name1(r.family) },
      { title: 'Téléphone', render: (r) => r.phone || '—' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: 'PersonStatus' },
      { name: 'gender', label: 'Sexe', options: 'Gender' },
    ],
    form: [
      { name: 'lastName', label: 'Nom', type: 'text', required: true },
      { name: 'firstName', label: 'Prénom', type: 'text', required: true },
      { name: 'gender', label: 'Sexe', type: 'select', options: 'Gender' },
      { name: 'birthDate', label: 'Date de naissance', type: 'date' },
      { name: 'birthPlace', label: 'Lieu de naissance', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'phoneAlt', label: 'Téléphone (2)', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'address', label: 'Adresse', type: 'text', full: true },
      { name: 'maritalStatus', label: 'Situation familiale', type: 'select', options: 'MaritalStatus' },
      { name: 'profession', label: 'Profession', type: 'text' },
      { name: 'status', label: 'Statut', type: 'select', options: 'PersonStatus' },
      F.family(),
      { name: 'memberSince', label: 'Membre depuis', type: 'date' },
      { name: 'membershipNumber', label: 'N° de membre', type: 'text' },
      F.notes(),
      F.isActive(),
    ],
    csv: true,
  },

  families: {
    path: '/families',
    label: 'Familles',
    singular: 'Famille',
    icon: 'Home',
    searchPlaceholder: 'Nom, téléphone…',
    columns: [
      { title: 'Nom', render: (r) => <b>{r.name}</b> },
      { title: 'Chef de famille', render: (r) => (r.head ? `${r.head.firstName} ${r.head.lastName}` : '—') },
      { title: 'Adresse', render: (r) => r.address || '—' },
      { title: 'Téléphone', render: (r) => r.phone || '—' },
      { title: 'Membres', render: (r) => (r._count?.members || 0) },
    ],
    form: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'headPersonId', label: 'Chef de famille', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'address', label: 'Adresse', type: 'text', full: true },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      F.notes(),
    ],
    csv: true,
  },
};