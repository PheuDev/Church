// ============================================================
// Saisie des présences — compteurs + observations
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { PageHeader, Button, Card, Alert, Spinner, Field, Input, Textarea } from '../components/ui.jsx';

const COUNT_FIELDS = [
  { name: 'presentCount', label: 'Présents' },
  { name: 'absentCount', label: 'Absents' },
  { name: 'excusedCount', label: 'Excusés' },
  { name: 'lateCount', label: 'En retard' },
  { name: 'visitorCount', label: 'Visiteurs' },
];

const BLANK = { presentCount: 0, absentCount: 0, excusedCount: 0, lateCount: 0, visitorCount: 0, notes: '' };

export function AttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, saving: false, activity: null, counts: BLANK, error: null, notice: null });

  useEffect(() => {
    api
      .get(`/activities/${id}`)
      .then((r) => {
        const stat = r.data?.attendanceStats?.[0] || {};
        setState((prev) => ({
          ...prev,
          loading: false,
          activity: r.data,
          counts: {
            presentCount: stat.presentCount || 0,
            absentCount: stat.absentCount || 0,
            excusedCount: stat.excusedCount || 0,
            lateCount: stat.lateCount || 0,
            visitorCount: stat.visitorCount || 0,
            notes: stat.notes || '',
          },
        }));
      })
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) })));
  }, [id]);

  function setCount(name, value) {
    const n = value === '' ? 0 : Math.max(0, Number(value) || 0);
    setState((prev) => ({ ...prev, counts: { ...prev.counts, [name]: n } }));
  }

  async function handleSave() {
    setState((prev) => ({ ...prev, saving: true }));
    try {
      const c = state.counts;
      await api.put(`/activities/${id}/attendance`, {
        presentCount: c.presentCount,
        absentCount: c.absentCount,
        excusedCount: c.excusedCount,
        lateCount: c.lateCount,
        visitorCount: c.visitorCount,
        notes: c.notes || null,
      });
      setState((prev) => ({ ...prev, saving: false, notice: { tone: 'success', text: 'Présences enregistrées.' } }));
      setTimeout(() => setState((prev) => ({ ...prev, notice: null })), 4000);
    } catch (err) {
      setState((prev) => ({ ...prev, saving: false, notice: { tone: 'error', text: getErrorMessage(err) } }));
      setTimeout(() => setState((prev) => ({ ...prev, notice: null })), 5000);
    }
  }

  if (state.error) {
    return (
      <div className="page">
        <PageHeader title="Présences" />
        <Alert tone="error">{state.error}</Alert>
        <Button variant="ghost" onClick={() => navigate('/activities')}>Retour aux activités</Button>
      </div>
    );
  }
  if (state.loading) return <Spinner label="Chargement de l'activité…" />;

  const a = state.activity;
  return (
    <div className="page">
      <PageHeader
        title="Saisie des présences"
        subtitle={`${a.title} — ${a.type?.name || ''}`}
        actions={<Button variant="primary" icon="Save" loading={state.saving} onClick={handleSave}>Enregistrer</Button>}
      />
      {state.notice && <Alert tone={state.notice.tone === 'error' ? 'error' : 'success'}>{state.notice.text}</Alert>}

      <Card title="Effectifs">
        <div className="form-grid">
          {COUNT_FIELDS.map((f) => (
            <Field key={f.name} label={f.label}>
              <Input type="number" min={0} value={state.counts[f.name]} onChange={(ev) => setCount(f.name, ev.target.value)} />
            </Field>
          ))}
        </div>
        <Field label="Observations" hint="Noms des absents / excusés, remarques…">
          <Textarea
            rows={5} full
            value={state.counts.notes || ''}
            placeholder="Ex : Absents : Marie, Paul (excusé, voyage)…"
            onChange={(ev) => setState((prev) => ({ ...prev, counts: { ...prev.counts, notes: ev.target.value } }))}
          />
        </Field>
      </Card>
    </div>
  );
}
