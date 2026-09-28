// ============================================================
// Application Express (séparée pour les tests)
// ============================================================
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { routeNotFound, errorHandler } from './lib/http.js';
import { buildRoutes } from './routes/index.js';

// Limiteur global : limite le scraping et les tentatives en rafale.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { error: { message: 'Trop de requêtes. Réessayez dans quelques minutes.' } },
});

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  if (!env.isTest) app.use(morgan('dev'));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Les fichiers téléversés ne sont plus exposés via un statique public
  // (/uploads) : ils restent accessibles uniquement par
  // GET /api/documents/:id/download, protégé par jeton.
  app.use('/api', apiLimiter, buildRoutes());

  app.get('/', (_req, res) => res.json({ name: 'AD Gestion API', version: '1.0.0', docs: '/api/health' }));

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
