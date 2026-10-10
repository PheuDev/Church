// ============================================================
// AppLayout — mise en page : barre latérale + barre supérieure
// ============================================================
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, GraduationCap, CalendarDays, ListTodo,
  Presentation, UserRound, Droplets,
  PieChart, Wallet, Tags, Banknote, Receipt, HandCoins, Handshake, PartyPopper,
  Hammer, UserCog, ScrollText, FileText,
  Church, LogOut, Menu, BookOpen,
} from 'lucide-react';
import { useAuth } from '../auth/auth.jsx';
import { list } from '../api/http.js';
import { setNetworkStatusHandler } from '../api/client.js';
import { can, useRolePermissions } from '../api/permissions.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { Badge, Alert } from '../components/ui.jsx';

const ICON = {
  LayoutDashboard, Users, Building2, GraduationCap,
  CalendarDays, ListTodo, Presentation,
  UserRound, Droplets, PieChart, Wallet, Tags, Banknote, Receipt,
  HandCoins, Handshake, PartyPopper, Hammer, UserCog, ScrollText,
  FileText, Church, BookOpen,
};

const NAV = [
  { section: 'Pilotage', items: [
    { to: '/',        label: 'Tableau de bord',    icon: 'LayoutDashboard' },
    { to: '/finance', label: 'Synthèse financière', icon: 'PieChart' },
  ]},
  { section: 'Annuaire', items: [
    { to: '/persons', label: 'Annuaire', icon: 'Users', resource: 'persons' },
  ]},
  { section: 'Culte & activités', items: [
    { to: '/sunday-services',  label: 'Cultes du dimanche',  icon: 'Church',        resource: 'sunday-services' },
    { to: '/activities',       label: 'Activités',           icon: 'CalendarDays',  resource: 'activities' },
    { to: '/activity-types',   label: "Types d'activités",   icon: 'ListTodo',      resource: 'activity-types' },
  ]},
  { section: 'Ministères', items: [
    { to: '/departments',      label: 'Départements',        icon: 'Building2',     resource: 'departments' },
    { to: '/department-stats', label: 'Effectifs',           icon: 'PieChart',      resource: 'department-stats' },
  ]},
  { section: 'École du dimanche', items: [
    { to: '/sunday-school/classes',  label: 'Classes',  icon: 'GraduationCap', resource: 'sunday-school/classes' },
    { to: '/sunday-school/sessions', label: 'Séances',  icon: 'Presentation',  resource: 'sunday-school/sessions' },
  ]},
  { section: 'Baptêmes', items: [
    { to: '/baptisms/sessions',   label: 'Sessions',   icon: 'BookOpen',   resource: 'baptisms/sessions' },
    { to: '/baptisms/candidates', label: 'Candidats',  icon: 'UserRound',  resource: 'baptisms/candidates' },
    { to: '/baptisms/baptisms',   label: 'Actes',      icon: 'Droplets',   resource: 'baptisms/baptisms' },
  ]},
  { section: 'Finances', items: [
    { to: '/finance/accounts',          label: 'Comptes',              icon: 'Wallet',   resource: 'finance/accounts' },
    { to: '/finance/categories',        label: 'Catégories',           icon: 'Tags',     resource: 'finance/categories' },
    { to: '/finance/revenues',          label: 'Recettes',             icon: 'Banknote', resource: 'finance/revenues' },
    { to: '/finance/expenses',          label: 'Dépenses',             icon: 'Receipt',  resource: 'finance/expenses' },
    { to: '/finance/engagements',       label: 'Engagements',          icon: 'Handshake',resource: 'finance/engagements' },
    { to: '/finance/engagement-payments', label: "Paiements d'engag.", icon: 'HandCoins',resource: 'finance/engagement-payments' },
  ]},
  { section: 'Événements & projets', items: [
    { to: '/events',   label: 'Événements', icon: 'PartyPopper', resource: 'events' },
    { to: '/projects', label: 'Projets',    icon: 'Hammer',      resource: 'projects' },
  ]},
  { section: 'Administration', roles: ['ADMIN', 'PASTOR', 'SECRETARY'], items: [
    { to: '/documents',  label: 'Documents',          icon: 'FileText',  roles: ['ADMIN', 'PASTOR', 'SECRETARY'] },
    { to: '/users',      label: 'Utilisateurs',       icon: 'UserCog',   resource: 'users', roles: ['ADMIN', 'PASTOR', 'SECRETARY'] },
    { to: '/audit-logs', label: "Journal d'audit",    icon: 'ScrollText',resource: 'audit-logs', roles: ['ADMIN', 'PASTOR'] },
    { to: '/church',     label: 'Église & paramètres',icon: 'Church',    roles: ['ADMIN', 'PASTOR'] },
  ]},
];
const ROLE_BADGE = { ADMIN: 'red', PASTOR: 'purple', SECRETARY: 'blue', TREASURER: 'amber', VIEWER: 'gray' };
const ROLE_LABEL = { ADMIN: 'Administrateur', PASTOR: 'Pasteur', SECRETARY: 'Secrétaire', TREASURER: 'Trésorier', VIEWER: 'Consultation' };

export function AppLayout({ children }) {
  const { user, role, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const matrix = useRolePermissions();
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
          <div className="brand-mark">
            <img src="/logo-ad.svg" alt="AD" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </div>
          <div>
            <strong>AD Gestion</strong>
            <span>{churchName || t('Église')}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV
            .filter((sec) => !sec.roles || sec.roles.includes(role))
            .map((sec) => (
              <div key={sec.section} className="nav-section">
                <p>{t(sec.section)}</p>
                {sec.items
                  .filter((item) => {
                    // Matrice enregistrée pour la ressource : elle prime.
                    if (item.roles && !(item.resource && matrix?.[item.resource])) {
                      if (!item.roles.includes(role)) return false;
                    }
                    if (item.resource) return can(role, item.resource, 'read', null);
                    return true;
                  })
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
                        <span>{t(item.label)}</span>
                      </NavLink>
                    );
                  })}
              </div>
            ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-link" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={17} />
            <span>{t('Se déconnecter')}</span>
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
          <div className="lang-switch" role="group" aria-label="Langue / Language">
            <button
              type="button"
              className={lang === 'fr' ? 'active' : ''}
              aria-pressed={lang === 'fr'}
              onClick={() => setLang('fr')}
            >FR</button>
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
          <div className="topbar-user">
            <div className="avatar">{String((user.fullName || 'U')[0]).toUpperCase()}</div>
            <div className="topbar-user-text">
              <strong>{user.fullName}</strong>
              <span><Badge tone={ROLE_BADGE[role] || 'gray'}>{t(ROLE_LABEL[role] || role)}</Badge></span>
            </div>
          </div>
        </header>
        <main className="content">
          {offline && (
            <Alert tone="warning" className="offline-bar">
              {t('Connexion au serveur perdue : vérifiez votre réseau. Les données affichées peuvent être obsolètes.')}
            </Alert>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}