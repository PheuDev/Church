// ============================================================
// Libellés et couleurs des valeurs énumérées (frontend)
// ============================================================

const e = (label, color) => ({ label, color });

export const ENUMS = {
  Gender: {
    MALE: e('Homme', 'blue'),
    FEMALE: e('Femme', 'pink'),
  },
  PersonStatus: {
    MEMBER: e('Membre', 'green'),
    ATTENDEE: e('Fidèle', 'blue'),
    CANDIDATE: e('Candidat', 'amber'),
    VISITOR: e('Visiteur', 'gray'),
    FORMER: e('Ancien membre', 'slate'),
    DECEASED: e('Décédé', 'dark'),
  },
  MaritalStatus: {
    SINGLE: e('Célibataire'),
    MARRIED: e('Marié(e)'),
    DIVORCED: e('Divorcé(e)'),
    WIDOWED: e('Veuf / veuve'),
  },
  UserRole: {
    ADMIN: e('Administrateur', 'red'),
    PASTOR: e('Pasteur', 'purple'),
    SECRETARY: e('Secrétaire', 'blue'),
    TREASURER: e('Trésorier', 'amber'),
    VIEWER: e('Consultation', 'gray'),
  },
  DepartmentType: {
    MEN: e('Hommes', 'blue'),
    WOMEN: e('Femmes', 'pink'),
    YOUTH: e('Jeunesse', 'amber'),
    TEENAGERS: e('Adolescents', 'purple'),
    CHILDREN: e('Enfants', 'green'),
    PRAYER: e('Prière', 'slate'),
    WORSHIP: e('Louange', 'cyan'),
    EDUCATION: e('Enseignement', 'teal'),
    MUSIC: e('Musique', 'indigo'),
    OTHER: e('Autre', 'gray'),
  },
  DepartmentMemberRole: {
    LEADER: e('Responsable', 'red'),
    ASSISTANT: e('Adjoint', 'amber'),
    TREASURER: e('Trésorier', 'green'),
    SECRETARY: e('Secrétaire', 'blue'),
    MEMBER: e('Membre', 'gray'),
  },
  ActivityStatus: {
    PLANNED: e('Planifiée', 'blue'),
    ONGOING: e('En cours', 'amber'),
    DONE: e('Terminée', 'green'),
    CANCELLED: e('Annulée', 'red'),
  },
  FormationStatus: {
    PLANNED: e('Planifiée', 'blue'),
    ONGOING: e('En cours', 'amber'),
    COMPLETED: e('Terminée', 'green'),
    CANCELLED: e('Annulée', 'red'),
  },
  SeanceType: {
    NEW_LESSON: e('Nouvelle leçon', 'blue'),
    SUITE: e('Suite', 'teal'),
    REVISION: e('Révision', 'green'),
    RAPPEL: e('Rappel', 'amber'),
    EVALUATION: e('Évaluation', 'red'),
    SYNTHESE: e('Synthèse', 'purple'),
    AUTRE: e('Autre', 'gray'),
  },
  GradingMode: {
    PERCENT: e('Pourcentage (%)'),
    SCORE_20: e('Note sur 20'),
    SCORE_100: e('Note sur 100'),
  },
  CandidateStatus: {
    ENROLLED: e('Inscrit', 'blue'),
    IN_FORMATION: e('En formation', 'amber'),
    EVALUATED: e('Évalué', 'teal'),
    VALIDATED: e('Validé', 'green'),
    APPROVED: e('Approuvé', 'indigo'),
    BAPTIZED: e('Baptisé', 'purple'),
    WITHDRAWN: e('Retiré', 'red'),
    DEFERRED: e('Reporté', 'gray'),
  },
  AccountType: {
    CASH: e('Espèces', 'green'),
    BANK: e('Banque', 'blue'),
    MOBILE_MONEY: e('Mobile Money', 'amber'),
  },
  RevenueSource: {
    QUETE: e('Quête', 'slate'),
    OFFER: e('Offrande', 'teal'),
    TITHE: e('Dîme', 'purple'),
    CONTRIBUTION: e('Cotisation', 'blue'),
    DONATION: e('Don', 'green'),
    EVENT: e('Événement', 'amber'),
    PROJECT: e('Projet', 'indigo'),
    OTHER: e('Autre', 'gray'),
  },
  PaymentMethod: {
    CASH: e('Espèces'),
    MOBILE_MONEY: e('Mobile Money'),
    BANK: e('Banque'),
    IN_KIND: e('En nature'),
  },
  Periodicity: {
    ONE_TIME: e('Unique'),
    MONTHLY: e('Mensuelle'),
    QUARTERLY: e('Trimestrielle'),
    SEMI_ANNUAL: e('Semestrielle'),
    ANNUAL: e('Annuelle'),
  },
  EngagementStatus: {
    OPEN: e('En cours', 'blue'),
    PARTIAL: e('Partiel', 'amber'),
    FULFILLED: e('Honoré', 'green'),
    CANCELLED: e('Annulé', 'red'),
  },
  EventType: {
    FETE: e('Fête', 'red'),
    DEPT_DAY: e('Journée de département', 'blue'),
    OUTING: e('Sortie', 'green'),
    CONFERENCE: e('Conférence', 'purple'),
    CAMPAIGN: e('Campagne', 'amber'),
    RETREAT: e('Retraite', 'teal'),
    OTHER: e('Autre', 'gray'),
  },
  ProjectType: {
    CONSTRUCTION: e('Construction', 'amber'),
    RENOVATION: e('Rénovation', 'blue'),
    EQUIPMENT: e('Équipement', 'teal'),
    EVANGELIZATION: e('Évangélisation', 'green'),
    SOCIAL: e('Social', 'pink'),
    OTHER: e('Autre', 'gray'),
  },
  ProjectStatus: {
    PLANNED: e('Planifié', 'blue'),
    ONGOING: e('En cours', 'amber'),
    COMPLETED: e('Terminé', 'green'),
    HALTED: e('Suspendu', 'red'),
  },
  CertificateType: {
    BAPTISM: e('Baptême', 'purple'),
    MEMBERSHIP: e('Appartenance', 'blue'),
    CONFIRMATION: e('Confirmation', 'teal'),
    COURSE: e('Cours', 'green'),
    ATTENDANCE: e('Présence', 'amber'),
  },
  CategoryKind: {
    INCOME: e('Recette', 'green'),
    EXPENSE: e('Dépense', 'red'),
  },
};

/** Renvoie {label, color} ou le texte brut si inconnu. */
export function enumOf(group, value) {
  const mapping = ENUMS[group];
  if (!mapping || !mapping[value]) return { label: value, color: 'gray' };
  return mapping[value];
}