// ============================================================
// Composants UI réutilisables
// ============================================================
import React from 'react';
import {
  X, Check, ChevronsUpDown, LoaderCircle, AlertCircle, Search, Plus, Download, Pencil, Trash2,
  Users, Home, Building2, Banknote, Receipt, Scale, HandCoins, UserRound, UserCheck, Activity, CalendarDays,
  Save, Upload,
} from 'lucide-react';
import { enumOf } from '../lib/enums.js';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ICONS = {
  X, Check, ChevronsUpDown, LoaderCircle, AlertCircle, Search, Plus, Download, Pencil, Trash2,
  Users, Home, Building2, Banknote, Receipt, Scale, HandCoins, UserRound, UserCheck, Activity, CalendarDays,
  Save, Upload,
};

export function Icon({ name, size = 18, className = '' }) {
  const Cmp = ICONS[name] || X;
  return <Cmp size={size} className={className} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
export function Button({ variant = 'primary', size, icon, children, className = '', loading = false, disabled, ...rest }) {
  const cls = cn('btn', `btn-${variant}`, size && `btn-${size}`, className);
  return (
    <button type={rest.type || 'button'} className={cls} disabled={disabled || loading} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
      {loading && <Icon name="LoaderCircle" size={16} className="spin" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */
export function Card({ title, subtitle, actions, children, className = '', pad = true }) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={cn('card-body', !pad && 'card-body-flat')}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                              */
/* ------------------------------------------------------------------ */
const TONES = {
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  blue: 'badge-blue',
  gray: 'badge-gray',
  slate: 'badge-slate',
  purple: 'badge-purple',
  pink: 'badge-pink',
  teal: 'badge-teal',
  cyan: 'badge-cyan',
  indigo: 'badge-indigo',
  dark: 'badge-dark',
};

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={cn('badge', TONES[tone] || TONES.gray, className)}>{children}</span>;
}

/** Badge construit depuis une énumération : BadgeEnum group="PersonStatus" value=row.status */
export function BadgeEnum({ group, value }) {
  const info = enumOf(group, value);
  return <Badge tone={info.color}>{info.label}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Page header                                                        */
/* ------------------------------------------------------------------ */
export function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        {icon && <div className="page-header-icon"><Icon name={icon} size={22} /></div>}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* Champs de formulaire                                               */
/* ------------------------------------------------------------------ */
export function Field({ label, required, error, hint, children, className = '' }) {
  return (
    <label className={cn('field', className)}>
      {label && (
        <span className="field-label">
          {label}
          {required && <em>*</em>}
        </span>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Input({ invalid, ...rest }) {
  return <input className={cn('input', invalid && 'input-invalid')} {...rest} />;
}

export function Textarea({ invalid, rows = 4, ...rest }) {
  return <textarea className={cn('input', invalid && 'input-invalid')} rows={rows} {...rest} />;
}

export function Select({ options, placeholder, value, onChange, invalid, ...rest }) {
  return (
    <select className={cn('input select', invalid && 'input-invalid')} value={value || ''} onChange={onChange} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

/** Sélecteur « recherche asynchrone » — chargement d'options à la demande. */
export function AsyncSelect({ label, value, onChange, options = [], loading = false, placeholder = 'Sélectionner…', disabled = false, error }) {
  return (
    <Field label={label} error={error}>
      <div className="async-select">
        <select className="input select" value={value || ''} onChange={(ev) => onChange(ev.target.value || null)} disabled={disabled}>
          <option value="">{loading ? 'Chargement…' : placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                              */
/* ------------------------------------------------------------------ */
export function Modal({ open, title, subtitle, onClose, children, footer, wide = false }) {
  const dialogRef = React.useRef(null);
  const restoreFocus = React.useRef(null);
  const onCloseRef = React.useRef(onClose);
  const titleId = React.useId();
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return undefined;

    restoreFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const node = dialogRef.current;
    const focusables = () => (node
      ? node.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
      : []);
    (focusables()[0] || node)?.focus?.();

    function onKeyDown(ev) {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (ev.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onCloseRef.current?.(); }}>
      <div
        ref={dialogRef}
        className={cn('modal', wide && 'modal-wide')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <h3 id={titleId}>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="btn-ghost btn-square" onClick={() => onClose?.()} aria-label="Fermer">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Divers                                                             */
/* ------------------------------------------------------------------ */
export function Spinner({ label = 'Chargement…' }) {
  return (
    <div className="spinner-wrap">
      <Icon name="LoaderCircle" size={28} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Aucune donnée', message, icon = 'ChevronsUpDown' }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={36} />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}

export function Alert({ tone = 'error', children, className = '' }) {
  const tones = { error: 'alert-error', warning: 'alert-warning', info: 'alert-info', success: 'alert-success' };
  return <div className={cn('alert', tones[tone] || tones.info, className)}>{children}</div>;
}

/** Boîte de confirmation de suppression. */
export function ConfirmDialog({ open, title = 'Confirmer la suppression', message, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" icon="Trash2" onClick={onConfirm}>Supprimer</Button>
        </>
      }
    >
      <div className="confirm-text">
        <Icon name="AlertCircle" size={32} />
        <p>{message}</p>
      </div>
    </Modal>
  );
}

/** Carte statistique du tableau de bord. */
export function Stat({ label, value, sub, icon, tone = 'blue' }) {
  const tones = {
    blue: 'stat-blue',
    green: 'stat-green',
    amber: 'stat-amber',
    red: 'stat-red',
    purple: 'stat-purple',
    slate: 'stat-slate',
    teal: 'stat-teal',
    cyan: 'stat-cyan',
    indigo: 'stat-indigo',
  };
  return (
    <div className={cn('stat-card', tones[tone])}>
      <div className="stat-icon"><Icon name={icon} size={22} /></div>
      <div className="stat-body">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}