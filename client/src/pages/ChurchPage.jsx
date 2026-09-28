// ============================================================
// Église & paramètres — fiche de l'église + clés/valeurs
// ============================================================
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api, getErrorMessage } from '../api/client.js';
import { list } from '../api/http.js';
import { PageHeader, Card, Button, Alert, Spinner, Field, Input, Modal, EmptyState, ConfirmDialog } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import { ResourceForm } from '../components/ResourceForm.jsx';
import { fmtDate } from '../lib/format.js';

const CHURCH_FIELDS = [
  { name: 'name', label: 'Nom officiel', type: 'text', required: true },
  { name: 'shortName', label: 'Nom court / sigle', type: 'text' },
  { name: 'code', label: 'Code', type: 'text', required: true },
  { name: 'localityId', label: 'Localité', type: 'async', source: '/admin/localities', optionLabel: (r) => r.name },
  { name: 'address', label: 'Adresse', type: 'text', full: true },
  { name: 'city', label: 'Ville', type: 'text' },
  { name: 'phone', label: 'Téléphone', type: 'text' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'website', label: 'Site web', type: 'text' },
  { name: 'foundedAt', label: 'Fondée le', type: 'date' },
  { name: 'pastorName', label: 'Pasteur', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea', full: true },
  { name: 'isActive', label: 'Active', type: 'boolean' },
];

export function ChurchPage() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, church: null, settings: [], error: null });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    Promise.all([list('/churches'), list('/churches/settings')])
      .then(([churches, settings]) => {
        setState((prev) => ({ ...prev, loading: false, church: churches.items[0], settings: settings.items }));
      })
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) })));
  }, []);

  async function saveChurch(payload) {
    try {
      const updated = await api.patch(`/churches/${state.church.id}`, payload).then((r) => r.data);
      setState((prev) => ({ ...prev, church: updated }));
      toast.success('Fiche église enregistrée.');
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function addSetting() {
    if (!newKey.trim()) return;
    try {
      await api.post('/churches/settings', { key: newKey.trim(), value: newValue.trim() });
      const settings = await list('/churches/settings');
      setState((prev) => ({ ...prev, settings: settings.items }));
      setNewKey('');
      setNewValue('');
      toast.success('Paramètre enregistré.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeSetting() {
    try {
      await api.delete(`/churches/settings/${encodeURIComponent(deleting.key)}`);
      const settings = await list('/churches/settings');
      setState((prev) => ({ ...prev, settings: settings.items }));
      toast.success('Paramètre supprimé.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  if (state.loading) return <Spinner label="Chargement de l'église…" />;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;

  const ch = state.church;
  return (
    <div className="page">
      <PageHeader
        title="Église & paramètres"
        subtitle={ch ? `${ch.name} — ${ch.code}` : ''}
        actions={<Button variant="primary" icon="Plus" onClick={() => setEditing(ch)}>Modifier la fiche</Button>}
      />

      <Card title="Informations">
        <dl className="detail-list">
          <div><dt>Nom</dt><dd>{ch.name}</dd></div>
          <div><dt>Sigle</dt><dd>{ch.shortName || '—'}</dd></div>
          <div><dt>Code</dt><dd>{ch.code}</dd></div>
          <div><dt>Localité</dt><dd>{ch.locality?.name || '—'}</dd></div>
          <div><dt>Adresse</dt><dd>{ch.address || '—'}</dd></div>
          <div><dt>Ville</dt><dd>{ch.city || '—'}</dd></div>
          <div><dt>Téléphone</dt><dd>{ch.phone || '—'}</dd></div>
          <div><dt>E-mail</dt><dd>{ch.email || '—'}</dd></div>
          <div><dt>Site web</dt><dd>{ch.website || '—'}</dd></div>
          <div><dt>Fondée le</dt><dd>{fmtDate(ch.foundedAt)}</dd></div>
          <div><dt>Pasteur</dt><dd>{ch.pastorName || '—'}</dd></div>
          <div><dt>Description</dt><dd>{ch.description || '—'}</dd></div>
        </dl>
      </Card>

      <Card title="Paramètres (clé / valeur)" subtitle="Configuration de l'église">
        {state.settings.length === 0 ? (
          <EmptyState title="Aucun paramètre" message="Ajoutez des paramètres clé/valeur ci-dessous." />
        ) : (
          <table className="data-table">
            <thead><tr><th>Clé</th><th>Valeur</th><th className="th-actions" /></tr></thead>
            <tbody>
              {state.settings.map((s) => (
                <tr key={s.key}>
                  <td data-label="Clé"><b>{s.key}</b></td>
                  <td data-label="Valeur">{typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}</td>
                  <td className="td-actions">
                    <button type="button" className="row-action danger" title="Supprimer" onClick={() => setDeleting(s)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="setting-add">
          <Field label="Clé">
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ex : emailContact" />
          </Field>
          <Field label="Valeur">
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="ex : contact@eglise.org" />
          </Field>
          <Button variant="primary" onClick={addSetting}>Ajouter</Button>
        </div>
      </Card>

      <Modal open={editing !== null} title="Modifier la fiche église" onClose={() => setEditing(null)} wide>
        <ResourceForm fields={CHURCH_FIELDS} initial={editing || {}} onSubmit={saveChurch} onCancel={() => setEditing(null)} submitLabel="Enregistrer" />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer le paramètre"
        message={`Voulez-vous vraiment supprimer la clé « ${deleting?.key || ''} » ?`}
        onConfirm={removeSetting}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}