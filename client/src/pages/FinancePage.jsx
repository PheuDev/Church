// ============================================================
// Synthèse financière — totaux, soldes par compte, accès rapides
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Tags, Banknote, Receipt, HandCoins, PieChart } from 'lucide-react';
import { list } from '../api/http.js';
import { Stat, Card, PageHeader, Spinner, Alert, BadgeEnum, Badge } from '../components/ui.jsx';
import { fmtMoney, toInputDate } from '../lib/format.js';
import { getErrorMessage } from '../api/client.js';
import { useI18n } from '../lib/i18n.jsx';

const LINKS = [
  { to: '/finance/revenues', label: 'Recettes', icon: Banknote, tone: 'green' },
  { to: '/finance/expenses', label: 'Dépenses', icon: Receipt, tone: 'red' },
  { to: '/finance/accounts', label: 'Comptes', icon: Wallet, tone: 'blue' },
  { to: '/finance/categories', label: 'Catégories', icon: Tags, tone: 'purple' },
  { to: '/finance/engagements', label: 'Engagements', icon: HandCoins, tone: 'amber' },
];

/** Date système au format <input type="date"> (yyyy-MM-dd). */
const toInput = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Période par défaut : début du mois courant → aujourd'hui (modifiable).
const TODAY = new Date();
const MONTH_START = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

export function FinancePage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState(() => toInput(MONTH_START));
  const [to, setTo] = useState(() => toInput(TODAY));
  const [loading, setLoading] = useState(true);

  function fetchSummary() {
    setLoading(true);
    const params = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    list('/finance/summary', params)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchSummary(); }, [from, to]);

  return (
    <div className="page">
      <PageHeader title={t('Synthèse financière')} subtitle={t('Recettes, dépenses et soldes')} />
      {error && <Alert tone="error">{error}</Alert>}
      {loading && !data ? <Spinner label={t('Calcul de la synthèse…')} /> : null}

      {data && (
        <>
          <div className="finance-period">
            <span>{t('Période')}</span>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>→</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="stat-grid finance">
            <Stat label={t('Recettes')} value={fmtMoney(data.totalRevenues)} sub={`${data.revenueCount} ${t('opérations')}`} icon="Banknote" tone="green" />
            <Stat label={t('Dépenses')} value={fmtMoney(data.totalExpenses)} sub={`${data.expenseCount} ${t('opérations')}`} icon="Receipt" tone="red" />
            <Stat label={t('Solde de trésorerie')} value={fmtMoney(data.balance)} icon="Scale" tone={data.balance >= 0 ? 'blue' : 'red'} />
          </div>

          <Card title={t('Soldes par compte')}>
            <table className="data-table">
              <thead>
                <tr><th>{t('Compte')}</th><th>{t('Type')}</th><th>{t('Recettes')}</th><th>{t('Dépenses')}</th><th className="th-numeric">{t('Solde')}</th></tr>
              </thead>
              <tbody>
                {data.accountBalances.map((acc) => (
                  <tr key={acc.id}>
                    <td data-label={t('Compte')}><b>{acc.name}</b></td>
                    <td data-label={t('Type')}><BadgeEnum group="AccountType" value={acc.type} /></td>
                    <td data-label={t('Recettes')}>{fmtMoney(acc.revenues)}</td>
                    <td data-label={t('Dépenses')}>{fmtMoney(acc.expenses)}</td>
                    <td className="td-numeric" data-label={t('Solde')}><b className={Number(acc.balance) < 0 ? 'text-danger' : 'text-success'}>{fmtMoney(acc.balance)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card title={t('Accès rapides')} pad={false}>
        <div className="quick-links">{LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="quick-link">
            <l.icon size={18} />
            <span>{t(l.label)}</span>
          </Link>
        ))}</div>
      </Card>
    </div>
  );
}