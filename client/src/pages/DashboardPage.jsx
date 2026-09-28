// ============================================================
// Tableau de bord — indicateurs, graphiques, activité récente
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Home, Building2, Banknote, Receipt, Scale, HandCoins, CalendarDays, UserRound } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { list } from '../api/http.js';
import { Stat, Card, PageHeader, Spinner, Alert } from '../components/ui.jsx';
import { fmtMoney, fmtDate, fmtDateTime } from '../lib/format.js';
import { enumOf } from '../lib/enums.js';
import { getErrorMessage } from '../api/client.js';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([list('/dashboard'), list('/persons/stats')])
      .then(([dash, st]) => {
        setData(dash);
        setStats(st);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <Spinner label="Chargement du tableau de bord…" />;

  const s = stats || {};
  const statusData = (s.byStatus || []).map((row) => ({
    name: enumOf('PersonStatus', row.status)?.label || row.status,
    value: row._count._all,
  }));
  const genderData = (s.byGender || []).map((row) => ({
    name: enumOf('Gender', row.gender)?.label || row.gender,
    value: row._count._all,
  }));

  return (
    <div className="page dashboard">
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la vie de l'église" />

      <div className="stat-grid">
        <Stat label="Personnes actives" value={data.persons.total} sub={`${data.persons.male} H / ${data.persons.female} F`} icon="Users" tone="blue" />
        <Stat label="Membres" value={data.persons.members} icon="Users" tone="green" />
        <Stat label="Candidats" value={data.persons.candidates} icon="UserRound" tone="amber" />
        <Stat label="Familles" value={data.families} icon="Home" tone="purple" />
        <Stat label="Départements actifs" value={data.departments} icon="Building2" tone="teal" />
      </div>

      <div className="stat-grid finance">
        <Stat label="Recettes ce mois-ci" value={fmtMoney(data.finance.revenuesMonth)} sub={`${data.finance.revenueCountMonth} opérations`} icon="Banknote" tone="green" />
        <Stat label="Dépenses ce mois-ci" value={fmtMoney(data.finance.expensesMonth)} sub={`${data.finance.expenseCountMonth} opérations`} icon="Receipt" tone="red" />
        <Stat label="Solde du mois" value={fmtMoney(data.finance.balanceMonth)} icon="Scale" tone={data.finance.balanceMonth >= 0 ? 'blue' : 'red'} />
        <Stat label="Engagements ouverts" value={data.commitments.open} icon="HandCoins" tone="amber" />
        <Stat label="Cotisations actives" value={data.contributions.active} icon="HandCoins" tone="purple" />
      </div>

      <div className="dash-grid">
        <Card title="Répartition par statut" subtitle="Annuaire de l'église">
          {(s.byStatus || []).length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={88} label paddingAngle={3} cornerRadius={4}>
                  {statusData.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">Aucune donnée</div>}
        </Card>
        <Card title="Part hommes / femmes">
          {(s.byGender || []).length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={88} label paddingAngle={3} cornerRadius={4}>
                  {genderData.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">Aucune donnée</div>}
        </Card>

        <Card title="Prochaines activités" subtitle="Activités planifiées">
          {data.activities.upcoming.length ? (
            <ul className="mini-list">
              {data.activities.upcoming.map((a) => (
                <li key={a.id}>
                  <CalendarDays size={16} />
                  <div>
                    <strong>{a.title}</strong>
                    <span>{fmtDate(a.activityDate)} · {a.type?.name} · {a.location || 'Lieu à définir'}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="empty-small">Aucune activité à venir</div>}
        </Card>

        <Card title="Dernières recettes">
          {data.finance.lastRevenues.length ? (
            <ul className="mini-list money">
              {data.finance.lastRevenues.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.description}</strong>
                    <span>{fmtDateTime(r.receivedAt)} · {enumOf('RevenueSource', r.source)?.label}</span>
                  </div>
                  <em>{fmtMoney(r.amount)}</em>
                </li>
              ))}
            </ul>
          ) : <div className="empty-small">Aucune recette</div>}
        </Card>

        <Card title="Candidats au baptême" subtitle="Par étape du parcours">
          {data.baptisms.candidateFlow.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.baptisms.candidateFlow.map((row) => ({
                name: enumOf('CandidateStatus', row.status)?.label || row.status,
                count: row._count._all,
              }))}>
                <CartesianGrid />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">Aucun candidat</div>}
        </Card>
      </div>

      <Card title="Actions rapides" pad={false}>
        <div className="quick-links">
          <Link to="/persons" className="quick-link"><Users size={18} /><span>Gérer l'annuaire</span></Link>
          <Link to="/activities" className="quick-link"><CalendarDays size={18} /><span>Activités & présences</span></Link>
          <Link to="/finance/revenues" className="quick-link"><Banknote size={18} /><span>Enregistrer une recette</span></Link>
          <Link to="/finance/expenses" className="quick-link"><Receipt size={18} /><span>Enregistrer une dépense</span></Link>
          <Link to="/documents" className="quick-link"><Home size={18} /><span>Documents</span></Link>
        </div>
      </Card>
    </div>
  );
}