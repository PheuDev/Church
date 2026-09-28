// ============================================================
// Documents (téléversement / téléchargement)
// ============================================================
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import prisma from '../lib/prisma.js';
import { requireRole } from '../lib/auth.js';
import { asyncHandler, AppError, routeNotFound } from '../lib/http.js';
import { validateBody } from '../lib/validate.js';
import { audit } from '../lib/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', 'storage', 'uploads');

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});
// Whitelist d'extensions : pas de HTML/SVG/JS téléversable (vecteur de XSS
// stocké sur l'origine de l'API), et aucun fichier exécutable accepté.
const ALLOWED_EXT = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
  '.zip', '.rar', '.7z',
]);

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new AppError(415, 'Type de fichier non autorisé (' + (ext || 'inconnu') + ').'));
    }
    cb(null, true);
  },
});

const metadataSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(100).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  personId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
}).strict();

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().max(100).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  personId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
}).strict();

const pick = (data) => data;

export function documentRoutes() {
  const router = Router();
  const base = ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'];
  const writers = ['ADMIN', 'PASTOR', 'SECRETARY'];

  router.get('/', requireRole(...base), asyncHandler(async (req, res) => {
    const where = { churchId: req.churchId };
    if (req.query.personId) where.personId = req.query.personId;
    if (req.query.projectId) where.projectId = req.query.projectId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) where.OR = [{ title: { contains: req.query.search, mode: 'insensitive' } }];
    const skip = Math.max(0, Number(req.query.skip ?? 0) || 0);
    const take = Math.min(200, Math.max(1, Number(req.query.take ?? 100) || 100));
    const [items, total] = await Promise.all([
      prisma.document.findMany({ where, orderBy: { uploadedAt: 'desc' }, skip, take }),
      prisma.document.count({ where }),
    ]);
    res.json({ items, total });
  }));

  router.post('/', requireRole(...writers), upload.single('file'), validateBody(metadataSchema), asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'Fichier requis (champ "file").');
    const doc = await prisma.document.create({
      data: {
        churchId: req.churchId,
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        fileName: req.file.originalname,
        fileKey: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        personId: req.body.personId,
        projectId: req.body.projectId,
        createdById: req.user.id,
      },
    });
    audit(req, 'document.create', 'Document', doc.id, { fileName: doc.fileName });
    res.status(201).json(doc);
  }));

  router.get('/:id/download', requireRole(...base), asyncHandler(async (req, res) => {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
    if (!doc) throw new AppError(404, 'Document introuvable.');
    const filePath = path.join(UPLOAD_ROOT, doc.fileKey);
    // fileKey provient de la base mais reste vérifié : jamais hors du dossier
    // d'uploads.
    if (!filePath.startsWith(UPLOAD_ROOT + path.sep)) throw new AppError(404, 'Fichier physique introuvable.');
    if (!fs.existsSync(filePath)) throw new AppError(404, 'Fichier physique introuvable.');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    audit(req, 'document.download', 'Document', doc.id, { fileName: doc.fileName });
    // Toujours en disposition « attachment » : un fichier téléversé ne peut
    // pas être rendu comme du HTML/SVG dans le navigateur.
    res.download(filePath, doc.fileName);
  }));

  router.get('/:id', requireRole(...base), asyncHandler(async (req, res) => {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, churchId: req.churchId },
      include: {
        person: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!doc) throw new AppError(404, 'Document introuvable.');
    res.json(doc);
  }));

  router.patch('/:id', requireRole(...writers), validateBody(patchSchema), asyncHandler(async (req, res) => {
    const current = await prisma.document.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
    if (!current) throw new AppError(404, 'Document introuvable.');
    const doc = await prisma.document.update({ where: { id: current.id }, data: pick(req.body) });
    res.json(doc);
  }));

  router.delete('/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    const current = await prisma.document.findFirst({ where: { id: req.params.id, churchId: req.churchId } });
    if (!current) throw new AppError(404, 'Document introuvable.');
    await prisma.document.delete({ where: { id: current.id } });
    try { fs.unlinkSync(path.join(UPLOAD_ROOT, current.fileKey)); } catch { /* fichier déjà absent */ }
    audit(req, 'document.delete', 'Document', current.id);
    res.status(204).end();
  }));

  // En cas d'échec (type refusé, validation zod…), supprime le fichier déjà
  // téléversé pour ne pas laisser d'orphelin sur le disque.
  router.use((err, req, _res, next) => {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch { /* déjà absent */ }
    }
    next(err);
  });

  router.use(routeNotFound);
  return router;
}

export { UPLOAD_ROOT };