// ============================================================
// Page candidats au baptême — liste + uploads + marquer baptisé
// ============================================================
import React, { useRef } from 'react';
import { Upload, Download, CheckCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api/client.js';
import { GenericResourcePage } from '../components/GenericResourcePage.jsx';
import { RESOURCES } from '../api/resources.js';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../auth/auth.jsx';

/** Bouton upload inline — ouvre le sélecteur de fichier au clic. */
function UploadBtn({ candidateId, field, label, hasFile, onDone }) {
  const inputRef = useRef(null);
  const toast = useToast();

  async function handleFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/baptisms/candidates/${candidateId}/upload/${field}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${label} enregistré.`);
      onDone?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    ev.target.value = '';
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <button
        type="button"
        className={`row-action${hasFile ? '' : ''}`}
        title={`Envoyer ${label}`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} />
      </button>
      {hasFile && (
        <a
          href={`/api/baptisms/candidates/${candidateId}/download/${field}`}
          target="_blank"
          rel="noreferrer"
          className="row-action"
          title={`Télécharger ${label}`}
          style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, color: 'var(--primary)' }}
        >
          <Download size={14} />
        </a>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </span>
  );
}

export function BaptismCandidatePage() {
  const { role } = useAuth();
  const canBaptize = role === 'ADMIN' || role === 'PASTOR';
  const toast = useToast();

  async function setBaptized(candidateId, refresh) {
    try {
      await api.patch(`/baptisms/candidates/${candidateId}/set-baptized`);
      toast.success('Candidat marqué comme baptisé. Son statut dans l\'annuaire est passé à Membre.');
      refresh?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const resource = {
    ...RESOURCES['baptisms/candidates'],
    rowActions: (row, { canEdit }, refresh) => (
      <>
        <UploadBtn
          candidateId={row.id}
          field="photo"
          label="Photo d'identité"
          hasFile={row.hasIdPhoto}
          onDone={refresh}
        />
        <UploadBtn
          candidateId={row.id}
          field="birth-certificate"
          label="Acte de naissance"
          hasFile={row.hasBirthCertificate}
          onDone={refresh}
        />
        {canBaptize && row.status !== 'BAPTIZED' && (
          <button
            type="button"
            className="row-action"
            title="Marquer comme baptisé(e)"
            style={{ color: 'var(--success)' }}
            onClick={() => setBaptized(row.id, refresh)}
          >
            <CheckCircle size={15} />
          </button>
        )}
      </>
    ),
  };

  return <GenericResourcePage resource={resource} />;
}
