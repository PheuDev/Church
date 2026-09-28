// ============================================================
// Documents — téléversement, recherche, téléchargement
// ============================================================
import React, { useState, useEffect } from 'react';
import { Download, Trash2, Search, Plus, Upload } from 'lucide-react';
import { useAuth } from '../auth/auth.jsx';
import { api, getErrorMessage } from '../api/client.js';
import { list, remove } from '../api/http.js';
import { PageHeader, Card, Button, Alert, Spinner, Field, Input, Textarea, Modal, ConfirmDialog, Badge, EmptyState } from '../components/ui.jsx';
import { fmtDateTime, fmtBytes } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';

export function DocumentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN';
  const [state, setState] = useState({ loading: true, items: [], total: 0, search: '', error: null });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  function fetchDocs() {
    const params = { take: 100 };
    if (state.search) params.search = state.search;
    list('/documents', params)
      .then((res) => setState((prev) => ({ ...prev, loading: false, items: res.items, total: res.total })))
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) })));
  }
  useEffect(() => { fetchDocs(); }, [state.search]);

  async function handleUpload(formData) {
    setUploading(true);
    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document téléversé.');
      setState((prev) => ({ ...prev, showUpload: false }));
      fetchDocs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      const blob = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' }).then((r) => r.data);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName || 'document';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    try {
      await remove('/documents', deleting.id);
      toast.success('Document supprimé.');
      setDeleting(null);
      fetchDocs();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Documents"
        subtitle="Archives et pièces jointes"
        actions={<Button variant="primary" icon="Plus" onClick={() => setState((prev) => ({ ...prev, showUpload: true }))}>Téléverser un fichier</Button>}
      />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Card pad={false}>
        <div className="table-toolbar doc-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input className="input" value={state.search} onChange={(e) => setState((prev) => ({ ...prev, search: e.target.value }))} placeholder="Rechercher un document…" />
          </div>
          <span className="toolbar-count">{state.total} document(s)</span>
        </div>
        {state.loading ? <Spinner /> : (state.items.length === 0 ? (
          <EmptyState title="Aucun document" message="Téléversez le premier document de l'église." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Titre</th><th>Catégorie</th><th>Fichier</th><th>Taille</th><th>Téléversé le</th><th>Par</th><th className="th-actions" /></tr>
            </thead>
            <tbody>
              {state.items.map((doc) => (
                <tr key={doc.id}>
                  <td data-label="Titre"><b>{doc.title}</b>{doc.description ? <p className="td-sub">{doc.description.slice(0, 50)}</p> : null}</td>
                  <td data-label="Catégorie">{doc.category ? <Badge>{doc.category}</Badge> : '—'}</td>
                  <td data-label="Fichier">{doc.fileName}</td>
                  <td data-label="Taille">{fmtBytes(doc.fileSize)}</td>
                  <td data-label="Téléversé le">{fmtDateTime(doc.uploadedAt)}</td>
                  <td data-label="Par">{doc.createdBy?.fullName || '—'}</td>
                  <td className="td-actions">
                    <button type="button" className="row-action" title="Télécharger" onClick={() => handleDownload(doc)}><Download size={16} /></button>
                    {isAdmin && <button type="button" className="row-action danger" title="Supprimer" onClick={() => setDeleting(doc)}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </Card>

      <UploadModal open={state.showUpload} onSubmit={handleUpload} onClose={() => setState((prev) => ({ ...prev, showUpload: false }))} uploading={uploading} />

      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer le document"
        message={`Voulez-vous vraiment supprimer « ${deleting?.title || ''} » ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
function UploadModal({ open, onSubmit, onClose, uploading }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(ev) {
    setFile(ev.target.files?.[0] || null);
    if (!title && ev.target.files?.[0]) setTitle(ev.target.files[0].name.replace(/\.[^.]+$/, ''));
  }

  function submit(ev) {
    ev.preventDefault();
    if (!file) { setError('Veuillez choisir un fichier.'); return; }
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (category.trim()) formData.append('category', category.trim());
    if (description.trim()) formData.append('description', description.trim());
    onSubmit(formData);
  }

  return (
    <Modal open={open} title="Téléverser un document" onClose={onClose}>
      <form className="resource-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Fichier" required className="field-full">
            <input type="file" className="input" onChange={handleFile} />
          </Field>
          <Field label="Titre" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : PV du conseil d'église" />
          </Field>
          <Field label="Catégorie">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex : Administratif" />
          </Field>
          <Field label="Description" className="field-full">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte…" />
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="form-actions">
          <Button type="submit" variant="primary" icon="Upload" loading={uploading}>Téléverser</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </form>
    </Modal>
  );
}