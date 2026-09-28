// ============================================================
// Erreurs applicatives et helpers HTTP
// ============================================================

/** Erreur applicative portant un statut HTTP et un code métier. */
export class AppError extends Error {
  constructor(status, message, code = undefined) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new AppError(400, message);
export const unauthorized = (message = 'Authentification requise.') => new AppError(401, message);
export const forbidden = (message = 'Autorisation insuffisante.') => new AppError(403, message);
export const notFound = (message = 'Ressource introuvable.') => new AppError(404, message);

/** Enveloppe un contrôleur asynchrone pour propager les erreurs vers le middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Gestionnaire de routes inconnues. */
export const routeNotFound = (_req, _res, next) => next(notFound('Route introuvable.'));

/** Middleware de gestion d'erreurs (dernier). */
export function errorHandler(err, _req, res, _next) {
  // multer : ses codes sont traduits en erreurs HTTP lisibles.
  if (err && err.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    const message = tooLarge
      ? 'Fichier trop volumineux (50 Mo maximum).'
      : 'Téléversement invalide (' + err.code + ').';
    return res.status(tooLarge ? 413 : 400).json({ error: { message, code: err.code } });
  }
  // Corps JSON illisible (body-parser).
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Corps JSON invalide.', code: 'INVALID_JSON' } });
  }
  const status = err.status || 500;
  const internal = status >= 500;
  // Les erreurs internes (Prisma, réseau…) ne doivent pas fuiter vers le client.
  const message = internal ? 'Erreur interne du serveur.' : (err.message || 'Erreur.');
  if (internal) console.error(err);
  res.status(status).json({
    error: {
      message,
      code: err.code,
    },
  });
}