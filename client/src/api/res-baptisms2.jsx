// Baptêmes (2/2) — actes de baptême + certificat intégré + téléchargement PDF
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel } from './resdefs.js';
import { fmtDate } from '../lib/format.js';
import { put } from './http.js';
import { candidateLabel } from './res-baptisms1.jsx';
import { api } from './client.js';

/** Déclenche le téléchargement du certificat PDF via le navigateur. */
function downloadCertificate(baptismId) {
  const link = document.createElement('a');
  link.href = `/api/baptisms/baptisms/${baptismId}/certificate/download`;
  link.download = `certificat-bapteme-${baptismId}.pdf`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const BAPTISMS2_R = {
  'baptisms/baptisms': {
    path: '/baptisms/baptisms',
    label: 'Baptêmes célébrés',
    singular: 'Baptême',
    icon: 'Droplets',
    stripKeys: ['certType', 'certTitle', 'certReference', 'certIssuedAt'],
    formInitial: (row) => {
      const c = row?.certificate;
      return {
        ...(row || {}),
        certType:      c?.type            || 'BAPTISM',
        certTitle:     c?.title           || '',
        certReference: c?.referenceNumber || '',
        certIssuedAt:  c?.issuedAt        || '',
      };
    },
    afterSave: async (saved, extras, { put: putFn }) => {
      const save = putFn || put;
      if (!extras.certReference && !extras.certIssuedAt && !extras.certTitle) return;
      await save('/baptisms/baptisms', saved.id, 'certificate', {
        type:            extras.certType      || 'BAPTISM',
        title:           extras.certTitle     || null,
        referenceNumber: extras.certReference || null,
        issuedAt:        extras.certIssuedAt  || null,
      });
    },
    columns: [
      { title: 'Personne',    render: (r) => <b>{r.person ? `${r.person.firstName} ${r.person.lastName}` : '—'}</b> },
      { title: 'Date',        render: (r) => fmtDate(r.baptismDate), sortKey: 'baptismDate' },
      { title: 'Officiant',   render: (r) => (r.officiant ? `${r.officiant.firstName} ${r.officiant.lastName}` : '—') },
      { title: 'Lieu',        render: (r) => r.location || '—' },
      { title: 'Certificat',  render: (r) => (r.certificate?.referenceNumber || '—') },
    ],
    // rowActions : bouton téléchargement PDF certificat
    rowActions: (row, { canEdit }, refresh) => (
      row.certificate ? (
        <button
          type="button"
          className="row-action"
          title="Télécharger le certificat PDF"
          onClick={() => downloadCertificate(row.id)}
        >
          {/* Icône inline — FileDown n'est pas dans le ICONS map, on utilise ↓ */}
          <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>↓</span>
        </button>
      ) : null
    ),
    filters: [
      { name: 'officiantId', label: 'Officiant', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'personId',    label: 'Personne baptisée', type: 'async', source: '/persons', optionLabel: personLabel, required: true },
      { name: 'candidateId', label: 'Lier au dossier candidat (optionnel)', type: 'async',
        source: '/baptisms/candidates', optionLabel: candidateLabel },
      { name: 'baptismDate', label: 'Date du baptême', type: 'date', required: true },
      { name: 'officiantId', label: 'Officiant', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'location',    label: 'Lieu',  type: 'text' },
      { name: 'notes',       label: 'Notes', type: 'textarea', full: true },
      { name: 'certType',      label: 'Certificat — type',      type: 'select', options: 'CertificateType' },
      { name: 'certTitle',     label: 'Certificat — titre',     type: 'text' },
      { name: 'certReference', label: 'Certificat — référence', type: 'text' },
      { name: 'certIssuedAt',  label: 'Certificat — délivré le', type: 'date' },
    ],
  },
};
