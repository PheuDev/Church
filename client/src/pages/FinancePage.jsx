// ============================================================
// Synthèse financière — totaux, soldes par compte, accès rapides
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, PiggyBank, Tags, Banknote, Receipt, HandCoins, Handshake, PieChart } from 'lucide-react';
import { list } from '../api/http.js';
import { Stat, Card, PageHeader, Spinner, Alert, BadgeEnum, Badge } from '../components/ui.jsx';
import { fmtMoney, toInputDate } from '../lib/format.js';
import { getErrorMessage } from '../api/client.js';

const LINKS = [
  { to: '/finance/revenues', label: 'Recettes', icon: Banknote, tone: 'green' },
  { to: '/finance/expenses', label: 'Dépenses', icon: Receipt, tone: 'red' },
  { to: '/finance/accounts', label: 'Comptes', icon: Wallet, tone: 'blue' },
  { to: '/finance/categories', label: 'Catégories', icon: Tags, tone: 'purple' },
  { to: '/finance/contributions', label: 'Cotisations', icon: HandCoins, tone: 'amber' },
  { to: '/finance/commitments', label: 'Engagements', icon: Handshake, tone: 'teal' },
  { to: '/finance/funds', label: 'Fonds', icon: PiggyBank, tone: 'slate' },
];

export function FinancePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      <PageHeader title="Synthèse financière" subtitle="Recettes, dépenses et soldes" />
      {error && <Alert tone="error">{error}</Alert>}
      {loading && !data ? <Spinner label="Calcul de la synthèse…" /> : null}

      {data && (
        <>
          <div className="finance-period">
            <span>Période</span>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>→</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="stat-grid finance">
            <Stat label="Recettes" value={fmtMoney(data.totalRevenues)} sub={`${data.revenueCount} opérations`} icon="Banknote" tone="green" />
            <Stat label="Dépenses" value={fmtMoney(data.totalExpenses)} sub={`${data.expenseCount} opérations`} icon="Receipt" tone="red" />
            <Stat label="Solde de trésorerie" value={fmtMoney(data.balance)} icon="Scale" tone={data.balance >= 0 ? 'blue' : 'red'} />
          </div>

          <Card title="Soldes par compte">
            <table className="data-table">
              <thead>
                <tr><th>Compte</th><th>Type</th><th>Recettes</th><th>Dépenses</th><th className="th-numeric">Solde</th></tr>
              </thead>
              <tbody>
                {data.accountBalances.map((acc) => (
                  <tr key={acc.id}>
                    <td data-label="Compte"><b>{acc.name}</b></td>
                    <td data-label="Type"><BadgeEnum group="AccountType" value={acc.type} /></td>
                    <td data-label="Recettes">{fmtMoney(acc.revenues)}</td>
                    <td data-label="Dépenses">{fmtMoney(acc.expenses)}</td>
                    <td className="td-numeric" data-label="Solde"><b className={Number(acc.balance) < 0 ? 'text-danger' : 'text-success'}>{fmtMoney(acc.balance)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card title="Accès rapides" pad={false}>
        <div className="quick-links">{LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="quick-link">
            <l.icon size={18} />
            <span>{l.label}</span>
          </Link>
        ))}</div>
      </Card>
    </div>
  );
}