// Baptêmes (2/2) — baptêmes & certificats
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel } from './resdefs.js';
import { fmtDate } from '../lib/format.js';

const candidateLabel = (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—');

export const BAPTISMS2_R = {
  'baptisms/baptisms': {
    path: '/baptisms/baptisms',
    label: 'Baptêmes célébrés',
    singular: 'Baptême',
    icon: 'Droplets',
    columns: [
      { title: 'Personne', render: (r) => <b>{candidateLabel(r)}</b> },
      { title: 'Date', render: (r) => fmtDate(r.baptismDate) },
      { title: 'Officiant', render: (r) => (r.officiant ? `${r.officiant.firstName} ${r.officiant.lastName}` : '—') },
      { title: 'Lieu', render: (r) => r.location || '—' },
    ],
    filters: [
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
      { name: 'officiantId', label: 'Officiant', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'personId', label: 'Personne', type: 'async', source: '/persons', optionLabel: personLabel, required: true },
      { name: 'candidateId', label: 'Candidat (optionnel)', type: 'async', source: '/baptisms/candidates', optionLabel: candidateLabel },
      { name: 'baptismDate', label: 'Date', type: 'date', required: true },
      { name: 'officiantId', label: 'Officiant', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'sponsorName', label: 'Parrain (nom)', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  'baptisms/certificates': {
    path: '/baptisms/certificates',
    label: 'Certificats',
    singular: 'Certificat',
    icon: 'BadgeCheck',
    searchPlaceholder: 'Référence, titre…',
    columns: [
      { title: 'Personne', render: (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—') },
      { title: 'Type', render: (r) => <BadgeEnum group="CertificateType" value={r.type} /> },
      { title: 'Référence', render: (r) => r.referenceNumber || '—' },
      { title: 'Délivré le', render: (r) => fmtDate(r.issuedAt) },
    ],
    filters: [
      { name: 'type', label: 'Type', options: 'CertificateType' },
      { name: 'personId', label: 'Personne', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'personId', label: 'Personne', type: 'async', source: '/persons', optionLabel: personLabel, required: true },
      { name: 'type', label: 'Type', type: 'select', options: 'CertificateType', required: true },
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'referenceNumber', label: 'Référence', type: 'text' },
      { name: 'issuedAt', label: 'Délivré le', type: 'date' },
      { name: 'baptismId', label: 'Baptême lié', type: 'async', source: '/baptisms/baptisms', optionLabel: (r) => `Baptême du ${fmtDate(r.baptismDate)}` },
    ],
  },
};