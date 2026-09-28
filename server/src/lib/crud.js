// ============================================================
// Fabrique CRUD générique — CRUD complet, scopé à l'église
// ============================================================
import { Prisma } from '@prisma/client';
import prisma from './prisma.js';
import { AppError, asyncHandler } from './http.js';
import { audit } from './audit.js';

export const DEFAULT_ROLES = {
  read: ['ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'],
  write: ['ADMIN', 'PASTOR', 'SECRETARY'],
  delete: ['ADMIN'],
};

const MAX_PAGE_SIZE = 200;
const MAX_CSV_ROWS = 10000;

/**
 * Champs triables / filtrables par date pour un modèle Prisma (via le DMMF).
 * Retourne null si le modèle est inconnu : les tri et filtres de date sont
 * alors ignorés plutôt que de provoquer une erreur 500 côté Prisma.
 */
function modelFields(model) {
  try {
    const def = Prisma.dmmf?.datamodel.models.find((m) => m.name.toLowerCase() === String(model).toLowerCase());
    if (!def) return null;
    const sort = new Set();
    const date = new Set();
    for (const f of def.fields) {
      if (f.kind === 'scalar' || f.kind === 'enum') sort.add(f.name);
      if (f.type === 'DateTime' || f.type === 'Date') date.add(f.name);
    }
    return { sort, date };
  } catch {
    return null;
  }
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.pageSize || '25', 10) || 25));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function coerceValue(key, value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (key.endsWith('Id') || key === 'id') return value;
  return value;
}

function buildWhere(req, { searchFields = [], filters = [], scoped = true, fields = null } = {}) {
  const where = scoped ? { churchId: req.churchId } : {};
  const q = req.query;
  const or = [];

  if (q.search && searchFields.length) {
    for (const field of searchFields) {
      or.push({ [field]: { contains: q.search, mode: 'insensitive' } });
    }
  }
  if (q.active === 'true' || q.active === 'false') where.isActive = q.active === 'true';

  for (const field of filters) {
    const value = q[field];
    if (value === undefined || value === '') continue;
    where[field] = coerceValue(field, value);
  }

  if (or.length) where.OR = or;
  if (q.from || q.to) {
    const dateField = q.dateField || 'createdAt';
    // Uniquement un champ date réel du modèle, sinon Prisma lèverait une erreur.
    if (fields && fields.date.has(dateField)) {
      const range = {};
      if (q.from) {
        const from = new Date(q.from);
        if (!Number.isNaN(from.getTime())) range.gte = from;
      }
      if (q.to) {
        const to = new Date(q.to);
        if (!Number.isNaN(to.getTime())) range.lte = to;
      }
      if (Object.keys(range).length) where[dateField] = range;
    }
  }
  return where;
}

function orderOf(query, orderBy, fields) {
  if (!query.sort) return orderBy;
  // Champ non reconnu → tri par défaut (évite une erreur 500 Prisma).
  if (!fields || !fields.sort.has(query.sort)) return orderBy;
  const direction = query.order === 'asc' ? 'asc' : 'desc';
  return { [query.sort]: direction };
}

/**
 * Crée un ensemble de contrôleurs CRUD pour un modèle Prisma.
 * @param {object} conf
 * @param {string} conf.model Nom du modèle Prisma (minuscules, ex: 'person')
 * @param {string} conf.label Libellé affiché (ex: 'Personne')
 * @param {object} [conf.include] Include par défaut (liste/détail)
 * @param {string[]} [conf.searchFields] Champs de recherche
 * @param {object} [conf.orderBy] Tri par défaut
 * @param {string[]} [conf.filters] Filtres exacts autorisés
 * @param {function} [conf.pick] Transformation du corps avant écriture
 * @param {string[]} [conf.csvColumns] Colonnes pour l'export CSV
 */
export function createCrudResource({
  model,
  label,
  include,
  searchFields = [],
  orderBy = { createdAt: 'desc' },
  filters = [],
  pick = (data) => data,
  csvColumns,
  churchScoped = true,
}) {
  if (!prisma[model]) throw new Error(`Modèle Prisma inconnu : ${model}`);
  const db = () => prisma[model];
  const fields = modelFields(model);

  return {
    /** GET / → liste paginée (+ ?format=csv) */
    list: asyncHandler(async (req, res) => {
      const where = buildWhere(req, { searchFields, filters, scoped: churchScoped, fields });
      if (req.query.format === 'csv' && csvColumns) {
        // Export borné : évite de charger une table entière en mémoire.
        const items = await db().findMany({ where, include, orderBy: orderOf(req.query, orderBy, fields), take: MAX_CSV_ROWS });
        const rows = items.map((item) => csvColumns.map((col) => columnValue(item, col)));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${model}-${Date.now()}.csv"`);
        return res.send(csvFromRows(csvColumns, rows));
      }
      const { page, pageSize, skip, take } = parsePagination(req.query);
      const [items, total] = await Promise.all([
        db().findMany({ where, include, orderBy: orderOf(req.query, orderBy, fields), skip, take }),
        db().count({ where }),
      ]);
      res.json({ items, total, page, pageSize });
    }),

    /** GET /:id → détail */
    get: asyncHandler(async (req, res) => {
      const item = await db().findFirst({ where: { id: req.params.id, ...(churchScoped ? { churchId: req.churchId } : {}) }, include });
      if (!item) throw new AppError(404, `${label} introuvable.`);
      res.json(item);
    }),

    /** POST / → création */
    create: asyncHandler(async (req, res) => {
      const data = pick(req.body);
      const item = await db().create({ data: { ...data, ...(churchScoped ? { churchId: req.churchId } : {}) }, include });
      audit(req, `${model}.create`, model, item.id, data);
      res.status(201).json(item);
    }),

    /** PATCH /:id → mise à jour */
    update: asyncHandler(async (req, res) => {
      const current = await db().findFirst({ where: { id: req.params.id, ...(churchScoped ? { churchId: req.churchId } : {}) } });
      if (!current) throw new AppError(404, `${label} introuvable.`);
      const data = pick(req.body);
      const item = await db().update({ where: { id: current.id }, data, include });
      audit(req, `${model}.update`, model, item.id, data);
      res.json(item);
    }),

    /** DELETE /:id → suppression */
    remove: asyncHandler(async (req, res) => {
      const current = await db().findFirst({ where: { id: req.params.id, ...(churchScoped ? { churchId: req.churchId } : {}) } });
      if (!current) throw new AppError(404, `${label} introuvable.`);
      try {
        await db().delete({ where: { id: current.id } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
          throw new AppError(409, `${label} référencé(e), suppression impossible.`);
        }
        throw err;
      }
      audit(req, `${model}.delete`, model, current.id);
      res.status(204).end();
    }),
  };
}

function columnValue(item, col) {
  const value = col.split('.').reduce((acc, part) => acc?.[part], item);
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function csvFromRows(columns, rows) {
  const escape = (value) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return '\uFEFF' + columns.map(escape).join(';') + '\r\n' + rows.map((row) => row.map(escape).join(';')).join('\r\n');
}