// ============================================================
// Baptêmes : candidats, évaluations, baptêmes, certificats
// ============================================================
import { z } from 'zod';
import { crudRouter } from '../lib/router.js';

const candidateShape = {
  personId: z.string().min(1),
  sponsorId: z.string().nullable().optional(),
  status: z.enum(['ENROLLED', 'IN_FORMATION', 'EVALUATED', 'VALIDATED', 'APPROVED', 'BAPTIZED', 'WITHDRAWN', 'DEFERRED']).default('ENROLLED').optional(),
  enrolledAt: z.coerce.date().nullable().optional(),
  formationSessionId: z.string().nullable().optional(),
  requestedAt: z.coerce.date().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const evaluationShape = {
  candidateId: z.string().min(1),
  evaluatorId: z.string().nullable().optional(),
  grade: z.number().int().min(0),
  gradingMode: z.enum(['PERCENT', 'SCORE_20', 'SCORE_100']).default('PERCENT').optional(),
  passed: z.boolean().nullable().optional(),
  comments: z.string().max(2000).nullable().optional(),
  evaluatedAt: z.coerce.date().nullable().optional(),
};

const baptismShape = {
  personId: z.string().min(1),
  candidateId: z.string().nullable().optional(),
  baptismDate: z.coerce.date(),
  officiantId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  sponsorName: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const certificateShape = {
  personId: z.string().min(1),
  type: z.enum(['BAPTISM', 'MEMBERSHIP', 'CONFIRMATION', 'COURSE', 'ATTENDANCE']),
  title: z.string().max(200).nullable().optional(),
  referenceNumber: z.string().max(100).nullable().optional(),
  issuedAt: z.coerce.date().nullable().optional(),
  baptismId: z.string().nullable().optional(),
  content: z.unknown().nullable().optional(),
  fileKey: z.string().nullable().optional(),
};

export function baptismRoutes() {
  const candidates = crudRouter({
    model: 'baptismCandidate',
    label: 'Candidat au baptême',
    searchFields: [],
    filters: ['status', 'formationSessionId', 'personId'],
    orderBy: { createdAt: 'desc' },
    include: {
      person: { select: { id: true, firstName: true, lastName: true, birthDate: true } },
      sponsor: { select: { id: true, firstName: true, lastName: true } },
      formationSession: { select: { id: true, name: true } },
      evaluations: { orderBy: { evaluatedAt: 'desc' } },
      baptism: true,
    },
    createSchema: z.object(candidateShape).strict(),
    updateSchema: z.object(candidateShape).strict().partial(),
  });

  const evaluations = crudRouter({
    model: 'evaluation',
    label: 'Évaluation',
    filters: ['candidateId', 'evaluatorId'],
    orderBy: { evaluatedAt: 'desc' },
    include: {
      candidate: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
      evaluator: { select: { id: true, firstName: true, lastName: true } },
    },
    createSchema: z.object(evaluationShape).strict(),
    updateSchema: z.object(evaluationShape).strict().partial(),
  });

  const baptisms = crudRouter({
    model: 'baptism',
    label: 'Baptême',
    searchFields: [],
    filters: ['personId', 'officiantId'],
    orderBy: { baptismDate: 'desc' },
    include: {
      person: { select: { id: true, firstName: true, lastName: true, birthDate: true } },
      officiant: { select: { id: true, firstName: true, lastName: true } },
      candidate: { select: { id: true, status: true } },
      certificate: true,
    },
    createSchema: z.object(baptismShape).strict(),
    updateSchema: z.object(baptismShape).strict().partial(),
  });

  const certificates = crudRouter({
    model: 'certificate',
    label: 'Certificat',
    searchFields: ['referenceNumber', 'title'],
    filters: ['type', 'personId'],
    orderBy: { issuedAt: 'desc' },
    include: {
      person: { select: { id: true, firstName: true, lastName: true } },
      baptism: { select: { id: true, baptismDate: true, location: true } },
    },
    createSchema: z.object(certificateShape).strict(),
    updateSchema: z.object(certificateShape).strict().partial(),
  });

  return { candidates, evaluations, baptisms, certificates };
}