// ResourceForm — formulaire générique piloté par configuration
import React, { useState } from 'react';
import { Field, Input, Textarea, Select, Button, cn } from './ui.jsx';
import { toInputDate, toInputDateTime } from '../lib/format.js';
import { ENUMS } from '../lib/enums.js';
import { useI18n } from '../lib/i18n.jsx';
import { list } from '../api/http.js';

/**
 * Options d'un <select> à partir d'une définition de champ.
 * - `options` tableau  → [{ value, label }] utilisés tels quels
 * - `options` chaîne   → nom d'un groupe de `lib/enums.js` (ex. 'PersonStatus')
 */
export function optionsOf(field) {
  if (Array.isArray(field.options)) return field.options;
  if (typeof field.options === 'string') {
    const map = ENUMS[field.options] || {};
    return Object.entries(map)
      .map(([value, info]) => ({ value, label: info.label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }
  return [];
}

function toRawValue(field, value) {
  if (value === null || value === undefined) {
    // Pré-remplissage automatique : date et datetime → aujourd'hui/maintenant
    if (field.type === 'date')     return toInputDate(new Date());
    if (field.type === 'datetime') return toInputDateTime(new Date());
    return '';
  }
  switch (field.type) {
    case 'date': return toInputDate(value);
    case 'datetime': return toInputDateTime(value);
    case 'time': return typeof value === 'string' ? value.slice(0, 5) : '';
    case 'number': return value === '' ? '' : String(value);
    case 'boolean': return Boolean(value);
    default: return value;
  }
}

function toPayloadValue(field, raw) {
  const empty = raw === '' || raw === null || raw === undefined;
  switch (field.type) {
    case 'date': return empty ? null : raw; // "yyyy-MM-dd" accepté par z.coerce.date()
    case 'datetime': return empty ? null : new Date(raw).toISOString();
    case 'time': return empty ? null : raw;
    case 'number': {
      if (empty) return null;
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    }
    case 'boolean': return Boolean(raw);
    default: {
      if (empty && field.omitWhenEmpty) return undefined;
      return empty ? null : String(raw).trim();
    }
  }
}

export function ResourceForm({ fields, initial = {}, onSubmit, onCancel, submitLabel = 'Enregistrer', submitting = false }) {
  const { t } = useI18n();
  const values = {};
  fields.forEach((f) => { values[f.name] = f.type === 'multiselect' ? (Array.isArray(initial[f.name]) ? initial[f.name] : []) : toRawValue(f, initial[f.name]); });
  const [state, setState] = useState(values);
  const [errors, setErrors] = useState({});
  const [asyncOptions, setAsyncOptions] = useState({});
  const [asyncLoading, setAsyncLoading] = useState({});
  const setValue = (name, value) => setState((prev) => ({ ...prev, [name]: value }));

  const loadAsync = (field) => {
    if (asyncOptions[field.name] || !field.source) return;
    setAsyncLoading((prev) => ({ ...prev, [field.name]: true }));
    list(field.source, { pageSize: 200, ...(field.sourceParams || {}) })
      .then((res) => setAsyncOptions((prev) => ({
        ...prev,
        [field.name]: res.items.map((row) => ({
          value: row.id,
          label: field.optionLabel ? field.optionLabel(row) : (row.name || row.label || row.id),
        })),
      })))
      .catch(() => setAsyncOptions((prev) => ({ ...prev, [field.name]: [] })))
      .finally(() => setAsyncLoading((prev) => ({ ...prev, [field.name]: false })));
  };

  const toggleMulti = (field, value) => {
    const current = state[field.name] || [];
    setValue(field.name, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const nextErrors = {};
    fields.forEach((f) => {
      const raw = state[f.name];
      if (f.required && (raw === '' || raw === null || raw === undefined || (Array.isArray(raw) && !raw.length))) nextErrors[f.name] = 'Ce champ est obligatoire.';
    });
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    const payload = {};
    fields.forEach((f) => {
      payload[f.name] = f.type === 'multiselect' ? (state[f.name] || []) : toPayloadValue(f, state[f.name]);
    });
    onSubmit(payload);
  };

  const renderField = (field) => {
    const error = errors[field.name];
    const common = { id: `f-${field.name}`, name: field.name, disabled: field.readonly, required: field.required };
    const cls = field.full ? 'field-full' : '';
    const value = state[field.name] ?? '';
    switch (field.type) {
      case 'textarea':
        return (
          <Field key={field.name} label={field.label} required={field.required} error={error} hint={field.hint} className={cls}>
            <Textarea rows={field.rows || 4} placeholder={field.placeholder} {...common}
              value={value}
              onChange={(ev) => setValue(field.name, ev.target.value)} />
          </Field>
        );
      case 'select':
        return (
          <Field key={field.name} label={field.label} required={field.required} error={error} hint={field.hint} className={cls}>
            <Select options={optionsOf(field)} placeholder={field.placeholder || '— Sélectionner —'} {...common}
              value={value}
              onChange={(ev) => setValue(field.name, ev.target.value)} />
          </Field>
        );
      case 'boolean':
        return (
          <label key={field.name} className="field field-check">
            <input type="checkbox" {...common}
              checked={Boolean(state[field.name])}
              onChange={(ev) => setValue(field.name, ev.target.checked)} />
            <span>{field.label}</span>
          </label>
        );
      case 'async': {
        const opts = asyncOptions[field.name];
        if (!opts && !asyncLoading[field.name]) loadAsync(field);
        return (
          <Field key={field.name} label={field.label} required={field.required} error={error} hint={field.hint} className={cls}>
            <Select options={opts || []} placeholder={asyncLoading[field.name] ? 'Chargement…' : (field.placeholder || '— Sélectionner —')} {...common}
              value={value}
              onChange={(ev) => setValue(field.name, ev.target.value)} />
          </Field>
        );
      }
      case 'multiselect': {
        // Options statiques (tableau) ou asynchrones (source HTTP)
        const staticOpts = Array.isArray(field.options) ? field.options : null;
        const asyncOpts  = staticOpts ? null : asyncOptions[field.name];
        if (!staticOpts && !asyncOpts && !asyncLoading[field.name]) loadAsync(field);
        const opts = staticOpts || asyncOpts;
        const selected = state[field.name] || [];
        return (
          <Field key={field.name} label={field.label} required={field.required} error={error} hint={field.hint} className={cls}>
            {!staticOpts && asyncLoading[field.name] && !asyncOpts && <span className="muted">{t('Chargement…')}</span>}
            <div className="multiselect-list">
              {(opts || []).map((o) => (
                <label key={o.value} className="field-check multiselect-item">
                  <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggleMulti(field, o.value)} />
                  <span>{t(o.label)}</span>
                </label>
              ))}
              {opts && !opts.length && <span className="muted">{t('Aucun choix disponible.')}</span>}
            </div>
            <span className="muted">{selected.length} {t('sélectionné(s)')}</span>
          </Field>
        );
      }
      default:
        return (
          <Field key={field.name} label={field.label} required={field.required} error={error} hint={field.hint} className={cls}>
            <Input
              type={
                field.type === 'email' ? 'email'
                : field.type === 'password' ? 'password'
                : field.type === 'number' ? 'number'
                : field.type === 'date' ? 'date'
                : field.type === 'datetime' ? 'datetime-local'
                : field.type === 'time' ? 'time'
                : 'text'
              }
              placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} {...common}
              value={value}
              onChange={(ev) => setValue(field.name, ev.target.value)} />
          </Field>
        );
    }
  };

  return (
    <form className="resource-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">{fields.map(renderField)}</div>
      <div className="form-actions">
        <Button type="submit" variant="primary" icon="Check" loading={submitting}>{t(submitLabel)}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>{t('Annuler')}</Button>}
      </div>
    </form>
  );
}