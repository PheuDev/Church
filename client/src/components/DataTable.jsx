// ============================================================
// DataTable — tableau paginé, triable, avec recherche
// ============================================================
import React from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { EmptyState, Spinner, cn } from './ui.jsx';
import { useI18n } from '../lib/i18n.jsx';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function DataTable({
  columns,
  rows = [],
  total = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  search,
  onSearch,
  searchPlaceholder = 'Rechercher…',
  loading = false,
  emptyTitle,
  emptyMessage,
  rowActions,       // (row) => ReactNode
  onRowClick,       // (row) => void
  footer,           // ReactNode (ex. : compteur)
  actionsColumnLabel = '',
  sort,             // nom du champ trié
  order,            // 'asc' | 'desc'
  onSortChange,     // (field) => void — tri serveur
}) {
  const { t } = useI18n();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const sortableOf = (col) => Boolean(
    onSortChange && col.sortKey && /^[A-Za-z0-9_]+$/.test(col.sortKey),
  );

  const headContent = (col) => {
    if (!sortableOf(col)) return t(col.title);
    const active = sort === col.sortKey;
    const Ico = !active ? ChevronsUpDown : (order === 'asc' ? ChevronUp : ChevronDown);
    return (
      <button type="button" className="th-sortable" onClick={() => onSortChange(col.sortKey)}>
        {t(col.title)}
        <Ico size={13} className="sort-indicator" aria-hidden="true" />
      </button>
    );
  };

  const ariaSortOf = (col) => {
    if (!sortableOf(col)) return undefined;
    if (sort !== col.sortKey) return 'none';
    return order === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="data-table-wrap">
      <div className="table-toolbar">
        {onSearch ? (
          <div className="table-search">
            <Search size={16} />
            <input
              className="input"
              type="search"
              aria-label={t('Rechercher')}
              value={search || ''}
              onChange={(ev) => onSearch(ev.target.value)}
              placeholder={searchPlaceholder ? t(searchPlaceholder) : t('Rechercher…')}
            />
          </div>
        ) : <div />}
        {footer}
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle || t('Aucun résultat')} message={emptyMessage} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.title}
                  className={cn('th-numeric', col.align === 'right')}
                  aria-sort={ariaSortOf(col)}
                >
                  {headContent(col)}
                </th>
              ))}
              {rowActions && <th className="th-actions">{actionsColumnLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'clickable' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key || col.title}
                    className={cn('td-numeric', col.align === 'right')}
                    data-label={t(col.title)}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
                {rowActions && (
                  <td className="td-actions" data-label={actionsColumnLabel}>{rowActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="table-pagination" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="page-info" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            {total > 0
              ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} ${t('sur')} ${total}`
              : t('Aucun élément')}
          </span>
          {onPageSizeChange && (
            <label className="page-size">
              {t('Par page')}
              <select value={pageSize} onChange={(ev) => onPageSizeChange(Number(ev.target.value))}>
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="page-buttons">
          <button
            type="button"
            className="btn-ghost btn-sm"
            aria-label={t('Page précédente')}
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>{t('Page')} {page} / {pageCount}</span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            aria-label={t('Page suivante')}
            disabled={page >= pageCount}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
