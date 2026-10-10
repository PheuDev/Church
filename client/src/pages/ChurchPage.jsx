// ============================================================
// Église & paramètres — fiche, clé/valeur, création d'utilisateur
// et matrice des accès par rôle (paramètre « rolePermissions »)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { api, getErrorMessage } from '../api/client.js';
import { list } from '../api/http.js';
import { useAuth } from '../auth/auth.jsx';
import { PageHeader, Card, Button, Alert, Spinner, Field, Input, Textarea, Modal, EmptyState, ConfirmDialog } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import { ResourceForm } from '../components/ResourceForm.jsx';
import { fmtDate } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';
import { RESOURCES } from '../api/resources.js';
import { ROLES } from '../api/resdefs.js';
import { setRolePermissions } from '../api/permissions.jsx';

const CHURCH_FIELDS = [
  { name: 'name', label: 'Nom officiel', type: 'text', required: true },
  { name: 'shortName', label: 'Nom court / sigle', type: 'text' },
  { name: 'code', label: 'Code', type: 'text', required: true },
  { name: 'city', label: 'Ville / localité', type: 'text' },
  { name: 'phone', label: 'Téléphone', type: 'text' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'website', label: 'Site web', type: 'text' },
  { name: 'foundedAt', label: 'Fondée le', type: 'date' },
  { name: 'pastorName', label: 'Pasteur', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea', full: true },
  { name: 'isActive', label: 'Active', type: 'boolean' },
];

const USER_FIELDS = [
  { name: 'username', label: 'Pseudo', type: 'text', required: true },
  { name: 'fullName', label: 'Nom complet', type: 'text' },
  { name: 'email', label: 'E-mail (optionnel)', type: 'email' },
  { name: 'password', label: 'Mot de passe', type: 'password', required: true, hint: '8 caractères minimum.' },
  { name: 'role', label: 'Rôle', type: 'select', options: 'UserRole' },
];

const MATRIX_ROLES = ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'];
const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  PASTOR: 'Pasteur',
  SECRETARY: 'Secrétaire',
  TREASURER: 'Trésorier',
  VIEWER: 'Consultation',
};
const KINDS = [['read', 'Lecture'], ['write', 'Écriture'], ['delete', 'Suppression']];
const HIDDEN_KEYS = new Set(['rolePermissions']); // géré par sa propre section

/**
 * Accès par défaut = comportement serveur historique :
 * - ressources en lecture seule → aucune écriture/suppression ;
 * - raccourci `roles: ROLES` (finances) → listes FINANCE_ROLES du serveur ;
 * - sinon → défauts génériques (lecture tous, écriture ADMIN/PASTOR/SECRETARY,
 *   suppression ADMIN).
 */
function defaultMatrix() {
  const m = {};
  for (const [key, res] of Object.entries(RESOURCES)) {
    if (res.readOnly) {
      m[key] = { read: res.roles?.read || ROLES.readAll, write: [], delete: [] };
    } else if (res.roles === ROLES) {
      m[key] = { read: ROLES.readAll, write: ROLES.writeFinance, delete: ROLES.deleteFinance };
    } else {
      m[key] = {
        read: res.roles?.read || ROLES.readAll,
        write: res.roles?.write || ROLES.writeDefault,
        delete: res.roles?.delete || ROLES.deleteAdmin,
      };
    }
  }
  return m;
}

const visibleSettings = (items) => items.filter((s) => !HIDDEN_KEYS.has(s.key));

export function ChurchPage() {
  const toast = useToast();
  const { t } = useI18n();
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'PASTOR';

  const [state, setState] = useState({ loading: true, church: null, settings: [], error: null });
  const [editing, setEditing] = useState(null);            // fiche église
  const [deleting, setDeleting] = useState(null);          // paramètre à supprimer
  const [editingSetting, setEditingSetting] = useState(null); // paramètre à éditer { key, value }
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [userFormKey, setUserFormKey] = useState(0);       // remont le formulaire utilisateur
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [activeRole, setActiveRole] = useState('PASTOR');

  function loadSettings() {
    return list('/churches/settings').then((res) => {
      const rp = (res.items || []).find((s) => s.key === 'rolePermissions');
      if (rp?.value && typeof rp.value === 'object') {
        setMatrix({ ...defaultMatrix(), ...rp.value });
      }
      setState((prev) => ({ ...prev, settings: visibleSettings(res.items || []) }));
      return res.items || [];
    });
  }

  useEffect(() => {
    Promise.all([list('/churches'), list('/churches/settings')])
      .then(([churches, settings]) => {
        const rp = (settings.items || []).find((s) => s.key === 'rolePermissions');
        if (rp?.value && typeof rp.value === 'object') {
          setMatrix({ ...defaultMatrix(), ...rp.value });
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          church: churches.items[0],
          settings: visibleSettings(settings.items || []),
        }));
      })
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) })));
  }, []);

  // — Fiche église —
  async function saveChurch(payload) {
    try {
      const updated = await api.patch(`/churches/${state.church.id}`, payload).then((r) => r.data);
      setState((prev) => ({ ...prev, church: updated }));
      toast.success(t('Fiche église enregistrée.'));
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // — Paramètres clé/valeur —
  async function addSetting() {
    if (!newKey.trim()) return;
    try {
      await api.post('/churches/settings', { key: newKey.trim(), value: newValue.trim() });
      await loadSettings();
      setNewKey('');
      setNewValue('');
      toast.success(t('Paramètre enregistré.'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function saveSettingValue() {
    const { key, value } = editingSetting;
    let parsed = value;
    if (typeof value === 'string' && /^[[{]/.test(value.trim())) {
      try { parsed = JSON.parse(value); } catch { parsed = value; }
    }
    try {
      await api.patch(`/churches/settings/${encodeURIComponent(key)}`, { value: parsed });
      await loadSettings();
      setEditingSetting(null);
      toast.success(t('Paramètre enregistré.'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeSetting() {
    try {
      await api.delete(`/churches/settings/${encodeURIComponent(deleting.key)}`);
      await loadSettings();
      toast.success(t('Paramètre supprimé.'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  // — Création d'utilisateur (pseudo + mot de passe + rôle) —
  async function createUser(payload) {
    try {
      await api.post('/users', {
        username: payload.username?.trim() || undefined,
        fullName: payload.fullName?.trim() || undefined,
        email: payload.email?.trim() || undefined,
        password: payload.password,
        role: payload.role || 'VIEWER',
      });
      setUserFormKey((k) => k + 1);
      toast.success(t('Utilisateur créé.'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // — Matrice des accès par rôle —
  function toggleAccess(resKey, kind, checked) {
    setMatrix((prev) => {
      const entry = prev[resKey] || { read: [], write: [], delete: [] };
      const list = entry[kind] || [];
      const next = checked
        ? [...new Set([...list, activeRole])]
        : list.filter((r) => r !== activeRole);
      return { ...prev, [resKey]: { ...entry, [kind]: next } };
    });
  }

  async function saveMatrix() {
    try {
      await api.post('/churches/settings', { key: 'rolePermissions', value: matrix });
      setRolePermissions(matrix); // application immédiate côté client
      await loadSettings();
      toast.success(t('Accès enregistrés.'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (state.loading) return <Spinner label={t('Chargement de l\'église…')} />;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;

  const ch = state.church;
  return (
    <div className="page">
      <PageHeader
        title={t('Église & paramètres')}
        subtitle={ch ? `${ch.name} — ${ch.code}` : ''}
        actions={canManage && (
          <Button variant="primary" icon="Plus" onClick={() => setEditing(ch)}>{t('Modifier la fiche')}</Button>
        )}
      />

      <Card title={t('Informations')}>
        <dl className="detail-list">
          <div><dt>{t('Nom')}</dt><dd>{ch.name}</dd></div>
          <div><dt>{t('Sigle')}</dt><dd>{ch.shortName || '—'}</dd></div>
          <div><dt>{t('Code')}</dt><dd>{ch.code}</dd></div>
          <div><dt>{t('Ville / localité')}</dt><dd>{ch.city || '—'}</dd></div>
          <div><dt>{t('Téléphone')}</dt><dd>{ch.phone || '—'}</dd></div>
          <div><dt>{t('E-mail')}</dt><dd>{ch.email || '—'}</dd></div>
          <div><dt>{t('Site web')}</dt><dd>{ch.website || '—'}</dd></div>
          <div><dt>{t('Fondée le')}</dt><dd>{fmtDate(ch.foundedAt)}</dd></div>
          <div><dt>{t('Pasteur')}</dt><dd>{ch.pastorName || '—'}</dd></div>
          <div><dt>{t('Description')}</dt><dd>{ch.description || '—'}</dd></div>
        </dl>
      </Card>

      <Card title={t('Paramètres (clé / valeur)')} subtitle={t("Configuration de l'église")}>
        {state.settings.length === 0 ? (
          <EmptyState title={t('Aucun paramètre')} message={t('Ajoutez des paramètres clé/valeur ci-dessous.')} />
        ) : (
          <table className="data-table">
            <thead><tr><th>{t('Clé')}</th><th>{t('Valeur')}</th><th className="th-actions" /></tr></thead>
            <tbody>
              {state.settings.map((s) => (
                <tr key={s.key}>
                  <td data-label={t('Clé')}><b>{s.key}</b></td>
                  <td data-label={t('Valeur')}>
                    {typeof s.value === 'object'
                      ? JSON.stringify(s.value).slice(0, 80)
                      : String(s.value).slice(0, 120)}
                  </td>
                  <td className="td-actions">
                    <div className="setting-actions">
                      {canManage && (
                        <button
                          type="button"
                          className="row-action"
                          title={t('Modifier')}
                          onClick={() => setEditingSetting({
                            key: s.key,
                            value: typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value ?? ''),
                          })}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {role === 'ADMIN' && (
                        <button type="button" className="row-action danger" title={t('Supprimer')} onClick={() => setDeleting(s)}>×</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {canManage && (
          <div className="settings-add-row" style={{ marginTop: 14 }}>
            <Field label={t('Clé')}>
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ex : emailContact" />
            </Field>
            <Field label={t('Valeur')}>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="ex : contact@eglise.org" />
            </Field>
            <Button variant="primary" onClick={addSetting}>{t('Ajouter')}</Button>
          </div>
        )}
      </Card>


      {canManage && (
        <Card title={t('Créer un utilisateur')} subtitle={t('Pseudo, mot de passe et rôle — la connexion se fait par pseudo ou e-mail.')}>
          <ResourceForm
            key={userFormKey}
            fields={USER_FIELDS}
            initial={{ role: 'VIEWER' }}
            onSubmit={createUser}
            submitLabel={t('Créer')}
          />
        </Card>
      )}

      {canManage && (
        <Card title={t('Rôles & accès')} subtitle={t("Définissez, pour chaque rôle, les ressources consultables, modifiables et supprimables. L'administrateur a toujours accès total.")}>
          <div className="role-matrix-tabs" role="tablist">
            {MATRIX_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={activeRole === r}
                className={activeRole === r ? 'active' : ''}
                onClick={() => setActiveRole(r)}
              >
                {t(ROLE_LABELS[r])}
              </button>
            ))}
          </div>

          <div className="table-wrap role-matrix" style={{ overflowX: 'auto' }}>
            <table className="data-table role-matrix">
              <thead>
                <tr>
                  <th>{t('Ressource')}</th>
                  {KINDS.map(([, label]) => <th key={label} style={{ textAlign: 'center' }}>{t(label)}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(RESOURCES).map(([key, res]) => (
                  <tr key={key}>
                    <td data-label={t('Ressource')}>
                      <b>{t(res.label)}</b>
                      <span className="muted" style={{ marginLeft: 8, fontSize: 11 }}>/{key}</span>
                    </td>
                    {KINDS.map(([kind, label]) => {
                      const isAdmin = activeRole === 'ADMIN';
                      const checked = isAdmin || Boolean(matrix[key]?.[kind]?.includes(activeRole));
                      return (
                        <td key={kind} className="matrix-cell" data-label={t(label)}>
                          <label className="matrix-check">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isAdmin}
                              onChange={(e) => toggleAccess(key, kind, e.target.checked)}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: 14 }}>
            <p className="muted" style={{ marginRight: 'auto', fontSize: 12.5 }}>
              {t("L'administrateur a toujours accès total. Les changements sont appliqués immédiatement, menu et API compris.")}
            </p>
            <Button variant="primary" icon="Check" onClick={saveMatrix}>{t('Enregistrer')}</Button>
          </div>
        </Card>
      )}

      <Modal open={editing !== null} title={t('Modifier la fiche église')} onClose={() => setEditing(null)} wide>
        <ResourceForm fields={CHURCH_FIELDS} initial={editing || {}} onSubmit={saveChurch} onCancel={() => setEditing(null)} submitLabel={t('Enregistrer')} />
      </Modal>

      <Modal
        open={editingSetting !== null}
        title={`${t('Modifier')} — ${editingSetting?.key || ''}`}
        onClose={() => setEditingSetting(null)}
      >
        <div className="resource-form">
          <Field label={t('Valeur du paramètre')} hint={t('Texte libre — un objet JSON est accepté.')}>
            <Textarea
              rows={6}
              full
              value={editingSetting?.value ?? ''}
              onChange={(e) => setEditingSetting((prev) => ({ ...prev, value: e.target.value }))}
            />
          </Field>
          <div className="form-actions">
            <Button variant="primary" icon="Check" onClick={saveSettingValue}>{t('Enregistrer')}</Button>
            <Button variant="ghost" onClick={() => setEditingSetting(null)}>{t('Annuler')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t('Supprimer le paramètre')}
        message={`${t('Voulez-vous vraiment supprimer cette clé ?')} « ${deleting?.key || ''} »`}
        onConfirm={removeSetting}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

