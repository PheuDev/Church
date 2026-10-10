// ============================================================
// Tableau de bord — indicateurs, graphiques, activité récente
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Building2, Banknote, Receipt, Scale, HandCoins, CalendarDays, UserRound, GraduationCap, Church } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { list } from '../api/http.js';
import { Stat, Card, PageHeader, Spinner, Alert } from '../components/ui.jsx';
import { fmtMoney, fmtDate, fmtDateTime } from '../lib/format.js';
import { enumOf } from '../lib/enums.js';
import { getErrorMessage } from '../api/client.js';
import { useI18n } from '../lib/i18n.jsx';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0f766e','#0e7490','#be185d'];

export function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([list('/dashboard'), list('/persons/stats')])
      .then(([dash, st]) => { setData(dash); setStats(st); })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data)  return <Spinner label="Chargement du tableau de bord…" />;

  const s = stats || {};
  const statusData = (s.byStatus || []).map((row) => ({
    name: t(enumOf('PersonStatus', row.status)?.label || row.status),
    value: row._count._all,
  }));
  const genderData = (s.byGender || []).map((row) => ({
    name: t(enumOf('Gender', row.gender)?.label || row.gender),
    value: row._count._all,
  }));

  // Graphe école du dimanche — 12 dernières séances (toutes classes)
  const ssData = (data.sundaySchool?.lastSessions || [])
    .slice(0, 12).reverse()
    .map((ss) => ({
      date:     fmtDate(ss.sessionDate),
      Effectif: ss.presentCount ?? 0,
      Bibles:   ss.bibleCount   ?? 0,
    }));

  return (
    <div className="page dashboard">
      <PageHeader title={t('Tableau de bord')} subtitle={t("Vue d'ensemble de la vie de l'église")} />

      <div className="stat-grid">
        <Stat label={t('Personnes actives')}   value={data.persons.total}      sub={`${data.persons.male} H / ${data.persons.female} F`} icon="Users"     tone="blue"  />
        <Stat label={t('Membres')}             value={data.persons.members}    icon="Users"      tone="green" />
        <Stat label={t('Candidats baptême')}   value={data.persons.candidates} icon="UserRound"  tone="amber" />
        <Stat label={t('Départements actifs')} value={data.departments}        icon="Building2"  tone="teal"  />
      </div>

      <div className="stat-grid finance">
        <Stat label={t('Recettes ce mois')}    value={fmtMoney(data.finance.revenuesMonth)} sub={`${data.finance.revenueCountMonth} op.`} icon="Banknote" tone="green" />
        <Stat label={t('Dépenses ce mois')}    value={fmtMoney(data.finance.expensesMonth)} sub={`${data.finance.expenseCountMonth} op.`} icon="Receipt"  tone="red"   />
        <Stat label={t('Solde du mois')}       value={fmtMoney(data.finance.balanceMonth)}  icon="Scale"     tone={data.finance.balanceMonth >= 0 ? 'blue' : 'red'} />
        <Stat label={t('Engagements ouverts')} value={data.engagements.open}                icon="HandCoins" tone="amber" />
      </div>

      <div className="dash-grid">
        {/* Répartition par statut */}
        <Card title={t('Répartition par statut')} subtitle={t('Annuaire')}>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={88} label paddingAngle={3} cornerRadius={4}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">{t('Aucune donnée')}</div>}
        </Card>

        {/* Hommes / Femmes */}
        <Card title={t('Part hommes / femmes')}>
          {genderData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={88} label paddingAngle={3} cornerRadius={4}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">{t('Aucune donnée')}</div>}
        </Card>

        {/* École du dimanche */}
        <Card title={t('École du dimanche')} subtitle={t('Effectif & bibles — 12 dernières séances')}>
          {ssData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ssData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Effectif" fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="Bibles"   fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">{t('Aucune séance enregistrée')}</div>}
        </Card>

        {/* Candidats au baptême */}
        <Card title={t('Candidats au baptême')} subtitle={t('Par étape du parcours')}>
          {data.baptisms.candidateFlow.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.baptisms.candidateFlow.map((row) => ({
                name: t(enumOf('CandidateStatus', row.status)?.label),
                count: row._count._all,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-small">{t('Aucun candidat')}</div>}
        </Card>

        {/* Prochaines activités */}
        <Card title={t('Prochaines activités')}>
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
          ) : <div className="empty-small">{t('Aucune activité à venir')}</div>}
        </Card>

        {/* Dernières recettes */}
        <Card title={t('Dernières recettes')}>
          {data.finance.lastRevenues.length ? (
            <ul className="mini-list money">
              {data.finance.lastRevenues.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.description}</strong>
                    <span>{fmtDateTime(r.receivedAt)} · {t(enumOf('RevenueSource', r.source)?.label)}</span>
                  </div>
                  <em>{fmtMoney(r.amount)}</em>
                </li>
              ))}
            </ul>
          ) : <div className="empty-small">{t('Aucune recette')}</div>}
        </Card>
      </div>

      <Card title={t('Actions rapides')} pad={false}>
        <div className="quick-links">
          <Link to="/persons"                className="quick-link"><Users         size={18} /><span>{t("Annuaire")}</span></Link>
          <Link to="/sunday-services"        className="quick-link"><Church        size={18} /><span>{t("Enregistrer un culte")}</span></Link>
          <Link to="/sunday-school/sessions" className="quick-link"><GraduationCap size={18} /><span>{t("Séance école du dimanche")}</span></Link>
          <Link to="/finance/revenues"       className="quick-link"><Banknote      size={18} /><span>{t("Recette")}</span></Link>
          <Link to="/finance/expenses"       className="quick-link"><Receipt       size={18} /><span>{t("Dépense")}</span></Link>
          <Link to="/documents"              className="quick-link"><FileText      size={18} /><span>{t("Documents")}</span></Link>
        </div>
      </Card>
    </div>
  );
}
