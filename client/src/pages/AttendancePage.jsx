// ============================================================
// Saisie des présences — pointage groupé d'une activité
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Check, Users as UsersIcon } from 'lucide-react';
import { api, getErrorMessage } from '../api/client.js';
import { list } from '../api/http.js';
import { PageHeader, Button, Card, Alert, Spinner, Badge } from '../components/ui.jsx';
const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Présent' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'EXCUSED', label: 'Excusé' },
  { value: 'LATE', label: 'En retard' },
  { value: 'VISITOR', label: 'Visiteur' },
];
const STATUS_COLORS = { PRESENT: 'green', ABSENT: 'red', EXCUSED: 'amber', LATE: 'blue', VISITOR: 'purple' };

export function AttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    saving: false,
    activity: null,
    persons: [],
    records: {}, // personId -> { status, note }
    error: null,
    notice: null,
  });

  useEffect(() => {
    Promise.all([
      api.get(`/activities/${id}`).then((r) => r.data),
      list('/persons', { pageSize: 200, active: 'true' }),
      list('/attendance-records', { activityId: id, pageSize: 200 }),
    ])
      .then(([activity, persons, attendance]) => {
        const records = {};
        (attendance.items || []).forEach((rec) => {
          records[rec.personId] = { status: rec.status, note: rec.note };
        });
        setState((prev) => ({ ...prev, loading: false, activity, persons: persons.items, records }));
      })
      .catch((err) => setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) })));
  }, [id]);

  function setStatus(personId, status) {
    setState((prev) => {
      const records = { ...prev.records };
      records[personId] = { ...(records[personId] || {}), status };
      return { ...prev, records };
    });
  }

  function setNote(personId, note) {
    setState((prev) => {
      const records = { ...prev.records };
      records[personId] = { ...(records[personId] || {}), note };
      return { ...prev, records };
    });
  }

  function markAll(status) {
    setState((prev) => {
      const records = { ...prev.records };
      prev.persons.forEach((p) => { records[p.id] = { ...(records[p.id] || {}), status }; });
      return { ...prev, records };
    });
  }

  function computeStats(records, persons) {
    const c = { presentCount: 0, absentCount: 0, excusedCount: 0, lateCount: 0, visitorCount: 0, maleCount: 0, femaleCount: 0, adultCount: 0, childCount: 0, totalCount: 0 };
    const now = new Date();
    persons.forEach((p) => {
      const rec = records[p.id];
      if (!rec?.status) return;
      c[`${rec.status.toLowerCase()}Count`] = (c[`${rec.status.toLowerCase()}Count`] || 0) + 1;
      if (rec.status !== 'ABSENT' && rec.status !== 'EXCUSED') {
        if (p.gender === 'MALE') c.maleCount += 1;
        if (p.gender === 'FEMALE') c.femaleCount += 1;
        if (p.birthDate) {
          const agYears = (now - new Date(p.birthDate)) / (1000 * 60 * 60 * 24 * 365.25);
          if (agYears < 18) c.childCount += 1;
          else c.adultCount += 1;
        } else {
          // Sans date de naissance, on compte comme adulte par défaut
          c.adultCount += 1;
        }
        c.totalCount += 1;
      }
    });
    return c;
  }

  async function handleSave() {
    const records = Object.entries(state.records)
      .filter(([, rec]) => rec?.status)
      .map(([personId, rec]) => ({ personId, status: rec.status, note: rec.note || null }));
    const stats = computeStats(state.records, state.persons);
    setState((prev) => ({ ...prev, saving: true }));
    try {
      await api.put(`/activities/${id}/attendance`, { records, stats });
      setState((prev) => ({ ...prev, saving: false, notice: { tone: 'success', text: `${records.length} présences enregistrées.` } }));
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

      <div className="attendance-toolbar">
        <Button variant="ghost" size="sm" icon="Check" onClick={() => markAll('PRESENT')}>Tous présents</Button>
        <Button variant="ghost" size="sm" onClick={() => markAll('ABSENT')}>Tous absents</Button>
        <Button variant="ghost" size="sm" onClick={() => markAll('EXCUSED')}>Tous excusés</Button>
        <span className="toolbar-count"><UsersIcon size={16} /> {state.persons.length} personnes</span>
      </div>

      <Card pad={false}>
        <table className="data-table attendance-table">
          <thead>
            <tr><th>Personne</th><th>Statut</th><th>Note</th></tr>
          </thead>
          <tbody>
            {state.persons.map((p) => {
              const rec = state.records[p.id] || {};
              return (
                <tr key={p.id}>
                  <td data-label="Personne">
                    <strong>{p.firstName} {p.lastName}</strong>{' '}
                    <Badge tone={STATUS_COLORS[rec.status] || 'gray'} className="badge-inline">
                      {STATUS_OPTIONS.find((o) => o.value === rec.status)?.label || 'Non pointé'}
                    </Badge>
                  </td>
                  <td data-label="Statut">
                    <select className="input select" value={rec.status || ''} onChange={(ev) => setStatus(p.id, ev.target.value)}>
                      <option value="">—</option>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td data-label="Note">
                    <input className="input" value={rec.note || ''} onChange={(ev) => setNote(p.id, ev.target.value)} placeholder="Remarque…" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}