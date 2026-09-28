// ============================================================
// AppLayout — mise en page : barre latérale + barre supérieure
// ============================================================
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, Building2, UserPlus, GraduationCap, ListTodo, CalendarDays, ListChecks,
  BookOpen, Presentation, BookMarked, ListVideo, BookOpenText, Link2, UserRound, Droplets,
  BadgeCheck, PieChart, Wallet, PiggyBank, Tags, Banknote, Receipt, HandCoins, Handshake, PartyPopper,
  UserCheck, Hammer, UserCog, ScrollText, Landmark, CalendarRange, PanelsTopLeft, MapPin, FileText,
  Church, LogOut, Menu, Cross,
} from 'lucide-react';
import { useAuth } from '../auth/auth.jsx';
import { list } from '../api/http.js';
import { setNetworkStatusHandler } from '../api/client.js';
import { Badge, Alert } from '../components/ui.jsx';

const ICON = {
  LayoutDashboard, Users, Home, Building2, UserPlus, GraduationCap, ListTodo,
  CalendarDays, ListChecks, BookOpen, Presentation, BookMarked, ListVideo, BookOpenText,
  Link2, UserRound, Droplets, BadgeCheck, PieChart, Wallet, PiggyBank, Tags, Banknote, Receipt,
  HandCoins, Handshake, PartyPopper, UserCheck, Hammer, UserCog, ScrollText, Landmark, CalendarRange,
  PanelsTopLeft, MapPin, FileText, Church,
};

const NAV = [
  { section: 'Pilotage', items: [
    { to: '/', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/finance', label: 'Synthèse financière', icon: 'PieChart' },
  ]},
  { section: 'Annuaire', items: [
    { to: '/persons', label: 'Annuaire', icon: 'Users', resource: 'persons' },
    { to: '/families', label: 'Familles', icon: 'Home', resource: 'families' },
  ]},
  { section: 'Ministères', items: [
    { to: '/departments', label: 'Départements', icon: 'Building2', resource: 'departments' },
    { to: '/department-members', label: 'Membres de départements', icon: 'UserPlus', resource: 'department-members' },
    { to: '/department-stats', label: 'Effectifs', icon: 'PieChart', resource: 'department-stats' },
    { to: '/activity-types', label: "Types d'activités", icon: 'ListTodo', resource: 'activity-types' },
    { to: '/activities', label: 'Activités', icon: 'CalendarDays', resource: 'activities' },
    { to: '/attendance-records', label: 'Présences', icon: 'ListChecks', resource: 'attendance-records' },
    { to: '/sunday-school/classes', label: 'École du dimanche', icon: 'GraduationCap', resource: 'sunday-school/classes' },
    { to: '/sunday-school/sessions', label: 'Séances du dimanche', icon: 'Presentation', resource: 'sunday-school/sessions' },
  ]},
  { section: 'Formations', items: [
    { to: '/formations/programs', label: 'Programmes', icon: 'BookOpen', resource: 'formations/programs' },
    { to: '/formations/sessions', label: 'Sessions', icon: 'Presentation', resource: 'formations/sessions' },
    { to: '/formations/lessons', label: 'Leçons', icon: 'BookMarked', resource: 'formations/lessons' },
    { to: '/formations/session-lessons', label: 'Séances enseignées', icon: 'ListVideo', resource: 'formations/session-lessons' },
    { to: '/formations/verses', label: 'Versets', icon: 'BookOpenText', resource: 'formations/verses' },
  ]},
  { section: 'Baptêmes', items: [
    { to: '/baptisms/candidates', label: 'Candidats', icon: 'UserRound', resource: 'baptisms/candidates' },
    { to: '/baptisms/evaluations', label: 'Évaluations', icon: 'ListChecks', resource: 'baptisms/evaluations' },
    { to: '/baptisms/baptisms', label: 'Baptêmes', icon: 'Droplets', resource: 'baptisms/baptisms' },
    { to: '/baptisms/certificates', label: 'Certificats', icon: 'BadgeCheck', resource: 'baptisms/certificates' },
  ]},
  { section: 'Finances', items: [
    { to: '/finance/accounts', label: 'Comptes', icon: 'Wallet', resource: 'finance/accounts' },
    { to: '/finance/funds', label: 'Fonds', icon: 'PiggyBank', resource: 'finance/funds' },
    { to: '/finance/categories', label: 'Catégories', icon: 'Tags', resource: 'finance/categories' },
    { to: '/finance/revenues', label: 'Recettes', icon: 'Banknote', resource: 'finance/revenues' },
    { to: '/finance/expenses', label: 'Dépenses', icon: 'Receipt', resource: 'finance/expenses' },
    { to: '/finance/contributions', label: 'Cotisations', icon: 'HandCoins', resource: 'finance/contributions' },
    { to: '/finance/contribution-payments', label: 'Paiements de cotisations', icon: 'HandCoins', resource: 'finance/contribution-payments' },
    { to: '/finance/commitments', label: 'Engagements', icon: 'Handshake', resource: 'finance/commitments' },
    { to: '/finance/commitment-payments', label: "Paiements d'engagements", icon: 'HandCoins', resource: 'finance/commitment-payments' },
  ]},
  { section: 'Événements & projets', items: [
    { to: '/events', label: 'Événements', icon: 'PartyPopper', resource: 'events' },
    { to: '/event-participants', label: 'Participants', icon: 'UserCheck', resource: 'event-participants' },
    { to: '/projects', label: 'Projets', icon: 'Hammer', resource: 'projects' },
  ]},
  { section: 'Documents', items: [
    { to: '/documents', label: 'Documents', icon: 'FileText' },
  ]},
  { section: 'Administration', roles: ['ADMIN', 'PASTOR', 'SECRETARY'], items: [
    { to: '/users', label: 'Utilisateurs', icon: 'UserCog', resource: 'users', roles: ['ADMIN', 'PASTOR', 'SECRETARY'] },
    { to: '/audit-logs', label: "Journal d'audit", icon: 'ScrollText', resource: 'audit-logs', roles: ['ADMIN', 'PASTOR'] },
    { to: '/church', label: 'Église & paramètres', icon: 'Church', roles: ['ADMIN', 'PASTOR'] },
  ]},
  { section: 'Contexte AD', roles: ['ADMIN', 'PASTOR'], items: [
    { to: '/admin/offices', label: 'Sièges nationaux', icon: 'Landmark', resource: 'admin/offices', roles: ['ADMIN', 'PASTOR'] },
    { to: '/admin/sessions', label: "Sessions de l'Union", icon: 'CalendarRange', resource: 'admin/sessions', roles: ['ADMIN', 'PASTOR'] },
    { to: '/admin/departments', label: 'Sections', icon: 'PanelsTopLeft', resource: 'admin/departments', roles: ['ADMIN', 'PASTOR'] },
    { to: '/admin/localities', label: 'Localités', icon: 'MapPin', resource: 'admin/localities', roles: ['ADMIN', 'PASTOR'] },
  ]},
];
const ROLE_BADGE = { ADMIN: 'red', PASTOR: 'purple', SECRETARY: 'blue', TREASURER: 'amber', VIEWER: 'gray' };
const ROLE_LABEL = { ADMIN: 'Administrateur', PASTOR: 'Pasteur', SECRETARY: 'Secrétaire', TREASURER: 'Trésorier', VIEWER: 'Consultation' };

export function AppLayout({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [churchName, setChurchName] = useState('');

  useEffect(() => {
    // Fiche de l'église courante — endpoint dédié (pas de liste à parcourir).
    list('/churches/me')
      .then((ch) => setChurchName(ch ? (ch.shortName || ch.name) : ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNetworkStatusHandler(setOffline);
    return () => setNetworkStatusHandler(null);
  }, []);

  // Le menu latéral se ferme aussi avec Échap (mobile).
  useEffect(() => {
    if (!open) return undefined;
    function onKey(ev) { if (ev.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="app-shell">
      {open && (
        <button type="button" className="sidebar-backdrop" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
      )}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Cross size={20} /></div>
          <div>
            <strong>AD Gestion</strong>
            <span>{churchName || 'Église'}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV
            .filter((sec) => !sec.roles || sec.roles.includes(role))
            .map((sec) => (
              <div key={sec.section} className="nav-section">
                <p>{sec.section}</p>
                {sec.items
                  .filter((item) => !item.roles || item.roles.includes(role))
                  .map((item) => {
                    const I = ICON[item.icon] || LayoutDashboard;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      >
                        <I size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
              </div>
            ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-link" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={17} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="btn-ghost btn-square menu-toggle"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <div className="avatar">{String((user.fullName || 'U')[0]).toUpperCase()}</div>
            <div className="topbar-user-text">
              <strong>{user.fullName}</strong>
              <span><Badge tone={ROLE_BADGE[role] || 'gray'}>{ROLE_LABEL[role] || role}</Badge></span>
            </div>
          </div>
        </header>
        <main className="content">
          {offline && (
            <Alert tone="warning" className="offline-bar">
              Connexion au serveur perdue : vérifiez votre réseau. Les données affichées peuvent être obsolètes.
            </Alert>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}