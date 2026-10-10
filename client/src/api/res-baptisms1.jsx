// Baptêmes (1/3) — sessions de baptême + candidats
// La création d'un candidat crée simultanément sa fiche dans l'annuaire.
import { Badge, BadgeEnum } from '../components/ui.jsx';
import { fmtDate, fmtMoney } from '../lib/format.js';

export const candidateLabel = (r) =>
  r?.person ? `${r.person.firstName} ${r.person.lastName}` : '—';

const sessionName = (r) => r?.name || '—';

// ── Sessions de baptême (promotions / cohortes) ──────────────────
export const BAPTISM_SESSIONS_R = {
  'baptisms/sessions': {
    path: '/baptisms/sessions',
    label: 'Sessions de baptême',
    singular: 'Session',
    icon: 'BookOpen',
    searchPlaceholder: 'Nom de la session…',
    columns: [
      { title: 'Nom',     render: (r) => <b>{r.name}</b> },
      { title: 'Début',   render: (r) => fmtDate(r.startDate) },
      { title: 'Fin',     render: (r) => fmtDate(r.endDate) },
      { title: 'Statut',  render: (r) => <BadgeEnum group="ActivityStatus" value={r.status} /> },
    ],
    form: [
      { name: 'name',      label: 'Nom (ex : Juin 2026)', type: 'text', required: true,
        hint: 'Identifie la promotion de baptême.' },
      { name: 'startDate', label: 'Date de début', type: 'date' },
      { name: 'endDate',   label: 'Date de fin',   type: 'date' },
      { name: 'status',    label: 'Statut', type: 'select', options: 'ActivityStatus' },
      { name: 'notes',     label: 'Notes', type: 'textarea', full: true },
    ],
  },
};

// ── Candidats ────────────────────────────────────────────────────
// Formulaire en deux parties :
//  1. Informations personnelles → crée la Person dans l'annuaire
//  2. Suivi candidat (session, souscription, documents, évaluation)
export const BAPTISM_CANDIDATES_R = {
  'baptisms/candidates': {
    path: '/baptisms/candidates',
    label: 'Candidats au baptême',
    singular: 'Candidat',
    icon: 'UserRound',
    // Filtrage URL : ?baptismSessionId=xxx depuis la page session
    queryFilters: ['baptismSessionId'],
    columns: [
      { title: 'Nom',      render: (r) => <b>{candidateLabel(r)}</b> },
      { title: 'Sexe',     render: (r) => (r.person?.gender ? <BadgeEnum group="Gender" value={r.person.gender} /> : '—') },
      { title: 'Statut',   render: (r) => <BadgeEnum group="CandidateStatus" value={r.status} /> },
      { title: 'Session',  render: (r) => sessionName(r.baptismSession) },
      { title: 'Souscription', render: (r) => (r.subscriptionAmount != null ? fmtMoney(r.subscriptionAmount) : '—') },
      { title: 'Payé',     render: (r) => <Badge tone={r.subscriptionPaid ? 'green' : 'red'}>{r.subscriptionPaid ? 'Oui' : 'Non'}</Badge> },
      { title: 'Photo',    render: (r) => <Badge tone={r.hasIdPhoto ? 'green' : 'gray'}>{r.hasIdPhoto ? '✓' : '—'}</Badge> },
      { title: 'Acte nais.', render: (r) => <Badge tone={r.hasBirthCertificate ? 'green' : 'gray'}>{r.hasBirthCertificate ? '✓' : '—'}</Badge> },
      { title: 'Note',     render: (r) => (r.grade != null ? <b>{r.grade}</b> : '—') },
      { title: 'Inscrit le', render: (r) => fmtDate(r.enrolledAt) },
    ],
    filters: [
      { name: 'status',           label: 'Statut',  options: 'CandidateStatus' },
      { name: 'baptismSessionId', label: 'Session', source: '/baptisms/sessions', optionLabel: sessionName },
    ],
    form: [
      // ── Informations personnelles ──────────────────────────────
      { name: 'firstName',  label: 'Prénom',         type: 'text', required: true },
      { name: 'lastName',   label: 'Nom de famille', type: 'text', required: true },
      { name: 'gender',     label: 'Sexe',           type: 'select', options: 'Gender' },
      { name: 'birthDate',  label: 'Date de naissance', type: 'date' },
      { name: 'birthPlace', label: 'Lieu de naissance', type: 'text' },
      { name: 'phone',      label: 'Téléphone', type: 'text' },
      { name: 'address',    label: 'Adresse',   type: 'text', full: true },
      // ── Suivi candidat ─────────────────────────────────────────
      { name: 'baptismSessionId', label: 'Session de baptême', type: 'async',
        source: '/baptisms/sessions', optionLabel: sessionName },
      { name: 'status',           label: 'Statut', type: 'select', options: 'CandidateStatus' },
      { name: 'enrolledAt',       label: 'Date d\'inscription', type: 'date',
        hint: 'Se remplit automatiquement à aujourd\'hui si laissé vide.' },
      { name: 'subscriptionAmount', label: 'Souscription (FCFA)', type: 'number', min: 0, step: 'any' },
      { name: 'subscriptionPaid',   label: 'Souscription payée',  type: 'boolean' },
      { name: 'hasIdPhoto',         label: 'Photo d\'identité fournie',  type: 'boolean' },
      { name: 'hasBirthCertificate', label: 'Acte de naissance fourni', type: 'boolean' },
      // ── Évaluation ─────────────────────────────────────────────
      { name: 'grade',        label: 'Note d\'évaluation', type: 'number', min: 0,
        hint: 'Laisser vide pour ne pas évaluer.' },
      { name: 'gradingMode',  label: 'Mode de notation',   type: 'select', options: 'GradingMode' },
      { name: 'evalPassed',   label: 'Évaluation réussie', type: 'boolean' },
      { name: 'evalDate',     label: 'Date d\'évaluation', type: 'date' },
      { name: 'evalComments', label: 'Commentaires',       type: 'textarea', full: true },
      { name: 'notes',        label: 'Notes générales',    type: 'textarea', full: true },
    ],
  },
};
