// ============================================================
// Annuaire — ressources personnes + statistiques d'ensemble
// ============================================================
import React, { useState, useEffect } from 'react';
import { list } from '../api/http.js';
import { Stat, Alert, Spinner } from '../components/ui.jsx';
import { GenericResourcePage } from '../components/GenericResourcePage.jsx';
import { RESOURCES } from '../api/resources.js';
import { getErrorMessage } from '../api/client.js';

function PersonStatsBar() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    list('/persons/stats')
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert tone="error">Statistiques indisponibles : {error}</Alert>;
  if (!stats) return <div className="stat-grid"><Spinner label="Chargement…" /></div>;

  const count = (status) => (stats.byStatus.find((row) => row.status === status)?._count?._all || 0);
  const genderCount = (g) => (stats.byGender.find((row) => row.gender === g)?._count?._all || 0);

  return (
    <div className="stat-grid">
      <Stat label="Personnes actives" value={stats.total} sub={`${genderCount('MALE')} H · ${genderCount('FEMALE')} F`} icon="Users" tone="blue" />
      <Stat label="Membres" value={count('MEMBER')} icon="Users" tone="green" />
      <Stat label="Fidèles" value={count('ATTENDEE')} icon="Users" tone="cyan" />
      <Stat label="Candidats" value={count('CANDIDATE')} icon="UserRound" tone="amber" />
      <Stat label="Visiteurs" value={count('VISITOR')} icon="UserCheck" tone="slate" />
    </div>
  );
}

export function PersonPage() {
  return (
    <GenericResourcePage
      resource={RESOURCES.persons}
      topContent={<PersonStatsBar />}
    />
  );
}