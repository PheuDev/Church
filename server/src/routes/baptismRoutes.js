// ============================================================
// Baptêmes : sessions, candidats (création personne intégrée),
//            présences dimanche, évaluation, actes + certificat
// ============================================================
import { z } from 'zod';
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { access } from '../lib/permissions.js';
import { validateBody } from '../lib/validate.js';
import { asyncHandler, AppError } from '../lib/http.js';
import { audit } from '../lib/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', 'storage', 'uploads');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf']);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new AppError(415, `Type non autorisé (${ext || 'inconnu'}). Acceptés : jpg, png, pdf.`));
    cb(null, true);
  },
});

// ---- Schémas Zod ----

const baptismSessionShape = {
  name:      z.string().min(1).max(200),
  startDate: z.coerce.date().nullable().optional(),
  endDate:   z.coerce.date().nullable().optional(),
  status:    z.enum(['PLANNED', 'ONGOING', 'DONE', 'CANCELLED']).default('ONGOING').optional(),
  notes:     z.string().max(2000).nullable().optional(),
};

// Création d'un candidat = création simultanée d'une Person dans l'annuaire
const candidateCreateShape = {
  // Informations personnelles (créent la Person)
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  gender:      z.enum(['MALE', 'FEMALE']).nullable().optional(),
  birthDate:   z.coerce.date().nullable().optional(),
  birthPlace:  z.string().max(200).nullable().optional(),
  phone:       z.string().max(50).nullable().optional(),
  address:     z.string().max(500).nullable().optional(),
  // Fiche candidat
  baptismSessionId:   z.string().nullable().optional(),
  status:             z.enum(['ENROLLED','IN_FORMATION','EVALUATED','VALIDATED','APPROVED','BAPTIZED','WITHDRAWN','DEFERRED']).default('ENROLLED').optional(),
  enrolledAt:         z.coerce.date().nullable().optional(),
  subscriptionAmount: z.coerce.number().min(0).nullable().optional(),
  subscriptionPaid:   z.boolean().default(false).optional(),
  hasIdPhoto:         z.boolean().default(false).optional(),
  hasBirthCertificate: z.boolean().default(false).optional(),
  notes:              z.string().max(2000).nullable().optional(),
};

const candidateUpdateShape = {
  baptismSessionId:   z.string().nullable().optional(),
  status:             z.enum(['ENROLLED','IN_FORMATION','EVALUATED','VALIDATED','APPROVED','BAPTIZED','WITHDRAWN','DEFERRED']).optional(),
  enrolledAt:         z.coerce.date().nullable().optional(),
  subscriptionAmount: z.coerce.number().min(0).nullable().optional(),
  subscriptionPaid:   z.boolean().optional(),
  hasIdPhoto:         z.boolean().optional(),
  hasBirthCertificate: z.boolean().optional(),
  grade:              z.number().int().min(0).nullable().optional(),
  gradingMode:        z.enum(['PERCENT','SCORE_20','SCORE_100']).optional(),
  evalPassed:         z.boolean().nullable().optional(),
  evalComments:       z.string().max(2000).nullable().optional(),
  evalDate:           z.coerce.date().nullable().optional(),
  notes:              z.string().max(2000).nullable().optional(),
};

const attendanceShape = z.object({
  records: z.array(z.object({
    candidateId:  z.string().min(1),
    present:      z.boolean().default(false),
    excused:      z.boolean().default(false),
    biblePresent: z.boolean().default(false),
    notes:        z.string().max(500).nullable().optional(),
  })).max(500),
  attendDate: z.coerce.date(),
}).strict();

const evalInlineShape = z.object({
  evaluatorId: z.string().nullable().optional(),
  grade:       z.number().int().min(0),
  gradingMode: z.enum(['PERCENT','SCORE_20','SCORE_100']).default('PERCENT').optional(),
  passed:      z.boolean().nullable().optional(),
  comments:    z.string().max(2000).nullable().optional(),
  evaluatedAt: z.coerce.date().nullable().optional(),
}).strict();

const certInlineShape = z.object({
  type:            z.enum(['BAPTISM','MEMBERSHIP','CONFIRMATION','COURSE','ATTENDANCE']).default('BAPTISM').optional(),
  title:           z.string().max(200).nullable().optional(),
  referenceNumber: z.string().max(100).nullable().optional(),
  issuedAt:        z.coerce.date().nullable().optional(),
}).strict();

const baptismShape = {
  personId:   z.string().min(1),
  candidateId: z.string().nullable().optional(),
  baptismDate: z.coerce.date(),
  officiantId: z.string().nullable().optional(),
  location:    z.string().max(200).nullable().optional(),
  notes:       z.string().max(2000).nullable().optional(),
};

const CANDIDATE_INCLUDE = {
  person: { select: { id: true, firstName: true, lastName: true, gender: true, birthDate: true, phone: true, address: true } },
  baptismSession: { select: { id: true, name: true } },
  evaluations: { orderBy: { evaluatedAt: 'desc' }, take: 1 },
  baptism: { select: { id: true, baptismDate: true } },
  attendances: { orderBy: { attendDate: 'asc' } },
};

export function baptismRoutes() {

  // ── Sessions de baptême (promotions / cohortes) ──────────────────
  const sessions = crudRouter({
    model: 'baptismSession',
    label: 'Session de baptême',
    searchFields: ['name'],
    filters: ['status'],
    orderBy: { startDate: 'desc' },
    createSchema: z.object(baptismSessionShape).strict(),
    updateSchema: z.object(baptismSessionShape).strict().partial(),
  });

  // ── Candidats ────────────────────────────────────────────────────
  const candidatesRouter = (() => {
    const r = Router();
    const write = ['ADMIN', 'PASTOR', 'SECRETARY'];
    const read  = ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'];
    const del   = ['ADMIN'];

    // GET / — liste
    r.get('/', access('read', read), asyncHandler(async (req, res) => {
      const where = { churchId: req.churchId };
      if (req.query.status) where.status = req.query.status;
      if (req.query.baptismSessionId) where.baptismSessionId = req.query.baptismSessionId;
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '25', 10)));
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        prisma.baptismCandidate.findMany({ where, include: CANDIDATE_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
        prisma.baptismCandidate.count({ where }),
      ]);
      res.json({ items, total, page, pageSize });
    }));

    // POST / — crée Person + Candidat en une transaction
    r.post('/', access('write', write),
      validateBody(z.object(candidateCreateShape).strict()),
      asyncHandler(async (req, res) => {
        const {
          firstName, lastName, gender, birthDate, birthPlace, phone, address,
          ...candidateData
        } = req.body;

        const result = await prisma.$transaction(async (tx) => {
          const person = await tx.person.create({
            data: {
              churchId: req.churchId, firstName, lastName,
              gender: gender || null,
              birthDate: birthDate || null,
              birthPlace: birthPlace || null,
              phone: phone || null,
              address: address || null,
              status: 'CANDIDATE',
            },
          });
          const candidate = await tx.baptismCandidate.create({
            data: { churchId: req.churchId, personId: person.id, ...candidateData },
            include: CANDIDATE_INCLUDE,
          });
          return candidate;
        });

        audit(req, 'baptismCandidate.create', 'BaptismCandidate', result.id, { personId: result.personId });
        res.status(201).json(result);
      }));

    // GET /:id
    r.get('/:id', access('read', read), asyncHandler(async (req, res) => {
      const item = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId }, include: CANDIDATE_INCLUDE });
      if (!item) throw new AppError(404, 'Candidat introuvable.');
      res.json(item);
    }));

    // PATCH /:id — mise à jour candidat (pas recréation Person)
    r.patch('/:id', access('write', write),
      validateBody(z.object(candidateUpdateShape).strict()),
      asyncHandler(async (req, res) => {
        const current = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
        if (!current) throw new AppError(404, 'Candidat introuvable.');
        const item = await prisma.baptismCandidate.update({ where: { id: current.id }, data: req.body, include: CANDIDATE_INCLUDE });
        audit(req, 'baptismCandidate.update', 'BaptismCandidate', item.id, req.body);
        res.json(item);
      }));

    // DELETE /:id — ADMIN seulement
    r.delete('/:id', access('delete', del), asyncHandler(async (req, res) => {
      const current = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
      if (!current) throw new AppError(404, 'Candidat introuvable.');
      await prisma.baptismCandidate.delete({ where: { id: current.id } });
      audit(req, 'baptismCandidate.delete', 'BaptismCandidate', current.id);
      res.status(204).end();
    }));

    // PUT /:id/evaluation — note d'évaluation
    r.put('/:id/evaluation', access('write', write),
      validateBody(evalInlineShape),
      asyncHandler(async (req, res) => {
        const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
        if (!candidate) throw new AppError(404, 'Candidat introuvable.');
        const [latest] = await prisma.evaluation.findMany({
          where: { candidateId: candidate.id, churchId: req.churchId },
          orderBy: { evaluatedAt: 'desc' }, take: 1,
        });
        const evaluation = latest
          ? await prisma.evaluation.update({ where: { id: latest.id }, data: req.body })
          : await prisma.evaluation.create({ data: { churchId: req.churchId, candidateId: candidate.id, ...req.body } });
        // Mise à jour inline sur le candidat pour lisibilité
        await prisma.baptismCandidate.update({
          where: { id: candidate.id },
          data: {
            grade: req.body.grade,
            gradingMode: req.body.gradingMode || 'PERCENT',
            evalPassed: req.body.passed ?? null,
            evalComments: req.body.comments ?? null,
            evalDate: req.body.evaluatedAt ?? null,
          },
        });
        audit(req, 'evaluation.update', 'Evaluation', evaluation.id, { candidateId: candidate.id });
        res.json({ evaluation });
      }));

    // PUT /:sessionId/attendance — présences d'une session entière (1 dimanche)
    r.put('/:sessionId/attendance', access('write', write),
      validateBody(attendanceShape),
      asyncHandler(async (req, res) => {
        const { records, attendDate } = req.body;
        // Vérifie que la session existe dans cette église
        const session = await prisma.baptismSession.findFirst({ where: { id: req.params.sessionId, churchId: req.churchId } });
        if (!session) throw new AppError(404, 'Session de baptême introuvable.');

        // Upsert pour chaque candidat
        const ops = records.map((rec) =>
          prisma.candidateAttendance.upsert({
            where: { candidateId_attendDate: { candidateId: rec.candidateId, attendDate: new Date(attendDate) } },
            create: {
              churchId: req.churchId,
              candidateId: rec.candidateId,
              attendDate: new Date(attendDate),
              present:      rec.present      ?? false,
              excused:      rec.excused      ?? false,
              biblePresent: rec.biblePresent ?? false,
              notes:        rec.notes        ?? null,
            },
            update: {
              present:      rec.present      ?? false,
              excused:      rec.excused      ?? false,
              biblePresent: rec.biblePresent ?? false,
              notes:        rec.notes        ?? null,
            },
          })
        );
        const saved = await prisma.$transaction(ops);
        audit(req, 'candidateAttendance.batch', 'CandidateAttendance', req.params.sessionId, { count: saved.length, attendDate });
        res.json({ saved: saved.length });
      }));

    // POST /:id/upload/photo — upload photo d'identité
    r.post('/:id/upload/photo', access('write', write), upload.single('file'),
      asyncHandler(async (req, res) => {
        if (!req.file) throw new AppError(400, 'Fichier requis (champ "file").');
        const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
        if (!candidate) { fs.unlinkSync(req.file.path); throw new AppError(404, 'Candidat introuvable.'); }
        // Supprime l'ancien fichier si existant
        if (candidate.idPhotoKey) {
          try { fs.unlinkSync(path.join(UPLOAD_ROOT, candidate.idPhotoKey)); } catch { /* déjà absent */ }
        }
        const updated = await prisma.baptismCandidate.update({
          where: { id: candidate.id },
          data: { hasIdPhoto: true, idPhotoKey: req.file.filename },
          include: CANDIDATE_INCLUDE,
        });
        audit(req, 'baptismCandidate.uploadPhoto', 'BaptismCandidate', candidate.id);
        res.json(updated);
      }));

    // POST /:id/upload/birth-certificate — upload acte de naissance
    r.post('/:id/upload/birth-certificate', access('write', write), upload.single('file'),
      asyncHandler(async (req, res) => {
        if (!req.file) throw new AppError(400, 'Fichier requis (champ "file").');
        const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
        if (!candidate) { fs.unlinkSync(req.file.path); throw new AppError(404, 'Candidat introuvable.'); }
        if (candidate.birthCertificateKey) {
          try { fs.unlinkSync(path.join(UPLOAD_ROOT, candidate.birthCertificateKey)); } catch { /* déjà absent */ }
        }
        const updated = await prisma.baptismCandidate.update({
          where: { id: candidate.id },
          data: { hasBirthCertificate: true, birthCertificateKey: req.file.filename },
          include: CANDIDATE_INCLUDE,
        });
        audit(req, 'baptismCandidate.uploadBirthCert', 'BaptismCandidate', candidate.id);
        res.json(updated);
      }));

    // PATCH /:id/set-baptized — marquer baptisé (PASTOR/ADMIN uniquement)
    r.patch('/:id/set-baptized', access('write', ['ADMIN', 'PASTOR']),
      asyncHandler(async (req, res) => {
        const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
        if (!candidate) throw new AppError(404, 'Candidat introuvable.');
        if (candidate.status === 'BAPTIZED') {
          return res.json({ message: 'Déjà marqué baptisé.', candidate });
        }
        const updated = await prisma.baptismCandidate.update({
          where: { id: candidate.id },
          data: { status: 'BAPTIZED' },
          include: CANDIDATE_INCLUDE,
        });
        // Mettre à jour le statut de la personne dans l'annuaire
        await prisma.person.update({ where: { id: candidate.personId }, data: { status: 'MEMBER' } });
        audit(req, 'baptismCandidate.setBaptized', 'BaptismCandidate', candidate.id);
        res.json(updated);
      }));

    // GET /:id/download/photo
    r.get('/:id/download/photo', access('read', read), asyncHandler(async (req, res) => {
      const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
      if (!candidate?.idPhotoKey) throw new AppError(404, 'Aucune photo enregistrée.');
      const filePath = path.join(UPLOAD_ROOT, candidate.idPhotoKey);
      if (!fs.existsSync(filePath)) throw new AppError(404, 'Fichier introuvable.');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.download(filePath);
    }));

    // GET /:id/download/birth-certificate
    r.get('/:id/download/birth-certificate', access('read', read), asyncHandler(async (req, res) => {
      const candidate = await prisma.baptismCandidate.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
      if (!candidate?.birthCertificateKey) throw new AppError(404, 'Aucun acte de naissance enregistré.');
      const filePath = path.join(UPLOAD_ROOT, candidate.birthCertificateKey);
      if (!fs.existsSync(filePath)) throw new AppError(404, 'Fichier introuvable.');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.download(filePath);
    }));

    return r;
  })();

  // ── Baptêmes célébrés ────────────────────────────────────────────
  const baptisms = crudRouter({
    model: 'baptism',
    label: 'Baptême',
    searchFields: [],
    filters: ['personId', 'officiantId'],
    orderBy: { baptismDate: 'desc' },
    include: {
      person:     { select: { id: true, firstName: true, lastName: true, birthDate: true } },
      officiant:  { select: { id: true, firstName: true, lastName: true } },
      candidate:  { select: { id: true, status: true } },
      certificate: true,
    },
    createSchema: z.object(baptismShape).strict(),
    updateSchema: z.object(baptismShape).strict().partial(),
    transform: (router) => {
      // Certificat 1:1 géré depuis la fiche baptême
      router.put('/:id/certificate', access('write', ['ADMIN', 'PASTOR', 'SECRETARY']),
        validateBody(certInlineShape),
        asyncHandler(async (req, res) => {
          const baptism = await prisma.baptism.findFirst({ where: { id: req.params.id, churchId: req.churchId }, include: { certificate: true } });
          if (!baptism) throw new AppError(404, 'Baptême introuvable.');
          const certificate = baptism.certificate
            ? await prisma.certificate.update({ where: { id: baptism.certificate.id }, data: req.body })
            : await prisma.certificate.create({ data: { churchId: req.churchId, personId: baptism.personId, baptismId: baptism.id, ...req.body } });
          audit(req, 'certificate.update', 'Certificate', certificate.id, { baptismId: baptism.id });
          res.json({ certificate });
        }));

      // GET /:id/certificate/download — génère un PDF simple du certificat de baptême
      router.get('/:id/certificate/download', access('read', ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER']),
        asyncHandler(async (req, res) => {
          const baptism = await prisma.baptism.findFirst({
            where: { id: req.params.id, churchId: req.churchId },
            include: {
              person:      { select: { firstName: true, lastName: true, birthDate: true } },
              officiant:   { select: { firstName: true, lastName: true } },
              certificate: true,
              church:      { select: { name: true, pastorName: true, city: true } },
            },
          });
          if (!baptism) throw new AppError(404, 'Baptême introuvable.');

          // Import dynamique pour ne pas alourdir le démarrage
          const { default: PDFDocument } = await import('pdfkit');
          const doc = new PDFDocument({ size: 'A4', margin: 60 });

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="certificat-bapteme-${baptism.id}.pdf"`);
          res.setHeader('X-Content-Type-Options', 'nosniff');
          doc.pipe(res);

          const ch = baptism.church;
          const p  = baptism.person;
          const c  = baptism.certificate;

          // En-tête
          doc.fontSize(18).font('Helvetica-Bold').text(ch?.name || 'Assemblées de Dieu', { align: 'center' });
          doc.fontSize(11).font('Helvetica').text(ch?.city || '', { align: 'center' });
          doc.moveDown(2);

          // Titre
          doc.fontSize(22).font('Helvetica-Bold').text('CERTIFICAT DE BAPTÊME', { align: 'center', underline: true });
          doc.moveDown(2);

          // Corps
          const fullName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim();
          const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

          doc.fontSize(13).font('Helvetica')
            .text(`Nous soussignés, certifions que :`, { align: 'center' })
            .moveDown(0.5)
            .font('Helvetica-Bold').fontSize(17).text(fullName, { align: 'center' })
            .moveDown(0.5)
            .font('Helvetica').fontSize(13)
            .text(`a été baptisé(e) par immersion le`, { align: 'center' })
            .font('Helvetica-Bold').text(`${fmtD(baptism.baptismDate)}`, { align: 'center' })
            .moveDown(0.5)
            .font('Helvetica').text(`en présence de l'assemblée, par ${baptism.officiant ? `${baptism.officiant.firstName} ${baptism.officiant.lastName}` : ch?.pastorName || '—'}.`, { align: 'center' });

          if (c?.referenceNumber) {
            doc.moveDown(0.5).text(`Référence : ${c.referenceNumber}`, { align: 'center' });
          }

          // Pied
          doc.moveDown(3);
          const dateEmission = fmtD(c?.issuedAt || new Date());
          doc.fontSize(11).text(`Fait le ${dateEmission}`, { align: 'right' });
          doc.moveDown(1);
          doc.text('Signature du Pasteur : ___________________________', { align: 'right' });

          doc.end();
        }));
    },
  });

  return { sessions, candidates: candidatesRouter, baptisms };
}
