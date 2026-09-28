// ============================================================
// Helpers de validation (zod)
// ============================================================
import { badRequest } from './http.js';

export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`)
      .join(' ; ');
    return next(badRequest(message));
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return next(badRequest('Paramètres de requête invalides.'));
  }
  req.query = result.data;
  next();
};