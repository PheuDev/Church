// ============================================================
// GenericResourcePage — page CRUD générique pour toute ressource
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/auth.jsx';
import { list, create, update, remove, exportCsv } from '../api/http.js';
import { canAccess } from '../api/resources.js';
import { getErrorMessage } from '../api/client.js';
import { DataTable } from './DataTable.jsx';
import { ResourceForm, optionsOf } from './ResourceForm.jsx';
import { Modal, Button, PageHeader, Alert, ConfirmDialog } from './ui.jsx';
import { useToast } from './Toast.jsx';

const DEBOUNCE_MS = 350;

export function GenericResourcePage({ resource, extraActions, topContent }) {
  const { role } = useAuth();
  const toast = useToast();
  const canWrite = canAccess(role, resource.roles, 'write');
  const canDelete = canAccess(role, resource.roles, 'delete');
  const readOnly = resource.readOnly || !canWrite;

  const [state, setState] = useState({
    loading: true, items: [], total: 0, page: 1, pageSize: 25,
    search: '', filters: {}, filterOptions: {}, error: null,
    sort: null, order: 'asc',
  });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const searchTimer = useRef(null);

  function set(partial) { setState((prev) => ({ ...prev, ...partial })); }

  async function fetchData() {
    const params = { page: state.page, pageSize: state.pageSize };
    if (state.search) params.search = state.search;
    if (state.sort) { params.sort = state.sort; params.order = state.order; }
    for (const [k, v] of Object.entries(state.filters)) {
      if (v) params[k] = v;
    }
    set({ loading: true, error: null });
    try {
      const data = await list(resource.path, params);
      set({ items: data.items, total: data.total, loading: false });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.pageSize, state.search, state.sort, state.order, JSON.stringify(state.filters)]);

  function loadFilterOptions() {
    const asyncFilters = (resource.filters || []).filter((f) => f.source);
    if (!asyncFilters.length) return;
    Promise.all(
      asyncFilters.map((f) =>
        list(f.source, { pageSize: 200 }).then((res) => ({
          name: f.name,
          options: res.items.map((row) => ({ value: row.id, label: f.optionLabel ? f.optionLabel(row) : (row.name || row.id) })),
        })),
      ),
    )
      .then((results) => {
        const map = {};
        results.forEach((r) => { map[r.name] = r.options; });
        set({ filterOptions: map });
      })
      .catch(() => {});
  }

  useEffect(() => { loadFilterOptions(); }, [resource.path]);

  function onSearch(value) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { set({ search: value, page: 1 }); }, DEBOUNCE_MS);
  }

  function onFilter(name, value) {
    set((prev) => ({ ...prev, filters: { ...prev.filters, [name]: value }, page: 1 }));
  }

  function onSortChange(field) {
    set((prev) => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  function onPageSizeChange(size) {
    set({ pageSize: size, page: 1 });
  }

  async function handleSubmit(payload) {
    try {
      if (editing?.id) {
        await update(resource.path, editing.id, payload);
      } else {
        await create(resource.path, payload);
      }
      toast.success(editing?.id ? 'Enregistré avec succès.' : 'Créé avec succès.');
      setEditing(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    try {
      await remove(resource.path, deleting.id);
      toast.success('Supprimé.');
      setDeleting(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    }
  }

  async function handleCsv() {
    try {
      const params = {};
      if (state.search) params.search = state.search;
      for (const [k, v] of Object.entries(state.filters)) {
        if (v) params[k] = v;
      }
      const blob = await exportCsv(resource.path, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource.path.replace(/\W+/g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // Une colonne devient triable si son libellé correspond à un champ du
  // formulaire : le serveur n'accepte en tri que les champs réels du modèle.
  const tableColumns = (resource.columns || []).map((col) => {
    if (col.sortKey) return col;
    const field = (resource.form || []).find(
      (f) => f.label === col.title && /^[A-Za-z0-9_]+$/.test(f.name || ''),
    );
    return field ? { ...col, sortKey: field.name } : col;
  });

  const rowActions = (row) => (
    <>
      {!readOnly && canWrite && (
        <button type="button" className="row-action" title="Modifier" onClick={() => setEditing(row)}>
          <Pencil size={16} />
        </button>
      )}
      {!readOnly && resource.rowActions?.(row, { canEdit: canWrite })}
      {!readOnly && canDelete && (
        <button type="button" className="row-action danger" title="Supprimer" onClick={() => setDeleting(row)}>
          <Trash2 size={16} />
        </button>
      )}
    </>
  );
  const headerActions = (
    <>
      {resource.csv && (
        <Button variant="ghost" icon="Download" onClick={handleCsv}>CSV</Button>
      )}
      {extraActions}
      {!readOnly && canWrite && (
        <Button variant="primary" icon="Plus" onClick={() => setEditing({})}>
          {`Nouveau ${(resource.singular || 'élément').toLowerCase()}`}
        </Button>
      )}
    </>
  );

  const filterSelect = (f) => {
    const opts = f.source ? (state.filterOptions[f.name] || []) : optionsOf(f);
    return (
      <div className="filter-item" key={f.name}>
        <span>{f.label}</span>
        <select className="input select" value={state.filters[f.name] || ''} onChange={(ev) => onFilter(f.name, ev.target.value)}>
          <option value="">Tous</option>
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  };

  return (
    <div className="page">
      <PageHeader title={resource.label} subtitle={resource.description} actions={headerActions} />
      {topContent}
      {(resource.filters || []).length > 0 && (
        <div className="filter-bar">{(resource.filters || []).map(filterSelect)}</div>
      )}

      <DataTable
        columns={tableColumns}
        rows={state.items}
        total={state.total}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={(page) => set({ page })}
        onPageSizeChange={onPageSizeChange}
        sort={state.sort}
        order={state.order}
        onSortChange={onSortChange}
        search={state.search}
        onSearch={resource.search !== false ? onSearch : null}
        searchPlaceholder={resource.searchPlaceholder || 'Rechercher…'}
        loading={state.loading}
        emptyTitle={resource.emptyTitle}
        emptyMessage={resource.emptyMessage}
        rowActions={readOnly ? null : rowActions}
      />

      <Modal
        open={editing !== null}
        title={editing?.id ? `Modifier ${(resource.singular || 'élément').toLowerCase()}` : `Nouveau ${(resource.singular || 'élément').toLowerCase()}`}
        onClose={() => setEditing(null)}
        wide={resource.wide}
      >
        <ResourceForm
          fields={resource.form}
          initial={editing || {}}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          submitLabel={editing?.id ? 'Enregistrer' : 'Créer'}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Supprimer ${(resource.singular || 'élément').toLowerCase()}`}
        message={`Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}