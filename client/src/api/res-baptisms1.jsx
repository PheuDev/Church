// Baptêmes — configuration des ressources
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel } from './resdefs.js';
import { fmtDate } from '../lib/format.js';

const candidateLabel = (r) => (r.person ? `${r.person.firstName} ${r.person.lastName}` : '—');

export const BAPTISMS_R = {
  'baptisms/candidates': {
    path: '/baptisms/candidates',
    label: 'Candidats au baptême',
    singular: 'Candidat',
    icon: 'UserRound',
    columns: [
      { title: 'Personne', render: (r) => <b>{candidateLabel(r)}</b> },
      { title: 'Statut', render: (r) => <BadgeEnum group="CandidateStatus" value={r.status} /> },
      { title: 'Parrain', render: (r) => (r.sponsor ? `${r.sponsor.firstName} ${r.sponsor.lastName}` : '—') },
      { title: 'Formation', render: (r) => (r.formationSession ? r.formationSession.name : '—') },
      { title: 'Inscrit le', render: (r) => fmtDate(r.enrolledAt) },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: 'CandidateStatus' },
      { name: 'formationSessionId', label: 'Formation', source: '/formations/sessions', optionLabel: (r) => r.name },
    ],
    form: [
      { name: 'personId', label: 'Personne', type: 'async', source: '/persons', optionLabel: personLabel, required: true },
      { name: 'sponsorId', label: 'Parrain / marraine', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'status', label: 'Statut', type: 'select', options: 'CandidateStatus' },
      { name: 'enrolledAt', label: 'Inscrit le', type: 'date' },
      { name: 'formationSessionId', label: 'Session de formation', type: 'async', source: '/formations/sessions', optionLabel: (r) => r.name },
      { name: 'requestedAt', label: 'Demandé le', type: 'date' },
      { name: 'approvedAt', label: 'Approuvé le', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
  },

  'baptisms/evaluations': {
    path: '/baptisms/evaluations',
    label: 'Évaluations',
    singular: 'Évaluation',
    icon: 'ListChecks',
    columns: [
      { title: 'Candidat', render: (r) => candidateLabel(r.candidate) },
      { title: 'Note', render: (r) => <b>{r.grade}</b> },
      { title: 'Mode', render: (r) => <BadgeEnum group="GradingMode" value={r.gradingMode} /> },
      { title: 'Réussi', render: (r) => (r.passed === null ? '—' : (r.passed ? 'Oui' : 'Non')) },
      { title: 'Date', render: (r) => fmtDate(r.evaluatedAt) },
    ],
    filters: [
      { name: 'candidateId', label: 'Candidat', source: '/baptisms/candidates', optionLabel: candidateLabel },
      { name: 'evaluatorId', label: 'Évaluateur', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'candidateId', label: 'Candidat', type: 'async', source: '/baptisms/candidates', optionLabel: candidateLabel, required: true },
      { name: 'evaluatorId', label: 'Évaluateur', type: 'async', source: '/persons', optionLabel: personLabel },
      { name: 'grade', label: 'Note', type: 'number', min: 0, required: true },
      { name: 'gradingMode', label: 'Mode de notation', type: 'select', options: 'GradingMode' },
      { name: 'passed', label: 'Réussi', type: 'boolean' },
      { name: 'comments', label: 'Commentaires', type: 'textarea', full: true },
      { name: 'evaluatedAt', label: 'Date', type: 'date' },
    ],
  },
};