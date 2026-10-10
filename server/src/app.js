// ============================================================
// Application Express — sécurité renforcée pour production
// ============================================================
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { routeNotFound, errorHandler, AppError } from './lib/http.js';
import { buildRoutes } from './routes/index.js';

// ── Rate limiters ──────────────────────────────────────────────────────────

/** Limiteur global : bloque le scraping et les rafales. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { error: { message: 'Trop de requêtes. Réessayez dans quelques minutes.' } },
  keyGenerator: (req) => req.ip,
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Middleware : refuse les requêtes JSON dont le Content-Type est absent
 * ou mal formé (protection contre les attaques CSRF JSON et injections
 * de type MIME).
 */
function requireJsonContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    // Autorise multipart (uploads) et JSON.
    if (!ct.includes('application/json') && !ct.includes('multipart/form-data')) {
      return next(new AppError(415, 'Content-Type non supporté. Utilisez application/json.'));
    }
  }
  next();
}

// ── Création de l'application ──────────────────────────────────────────────

export function createApp() {
  const app = express();

  // Masque le serveur sous-jacent
  app.disable('x-powered-by');

  // Nécessaire derrière un reverse-proxy (Render, Railway, Fly.io…)
  app.set('trust proxy', 1);

  // ── Helmet — en-têtes de sécurité ──────────────────────────────────────
  app.use(helmet({
    // Politique de sécurité du contenu : limite les origines autorisées.
    contentSecurityPolicy: {
      directives: {
        defaultSrc:   ["'self'"],
        scriptSrc:    ["'self'"],
        styleSrc:     ["'self'", "'unsafe-inline'"],
        imgSrc:       ["'self'", 'data:', 'blob:'],
        fontSrc:      ["'self'", 'data:'],
        connectSrc:   ["'self'"],
        frameSrc:     ["'none'"],
        objectSrc:    ["'none'"],
        upgradeInsecureRequests: env.nodeEnv === 'production' ? [] : null,
      },
    },
    // Empêche le navigateur de sniff le MIME-type
    noSniff: true,
    // Pas de mise en cache des réponses sensibles
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // HSTS uniquement en production
    hsts: env.nodeEnv === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginOpenerPolicy:   { policy: 'same-origin' },
  }));

  // ── CORS — origines autorisées ─────────────────────────────────────────
  const allowedOrigins = env.clientOrigin
    ? env.clientOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173'];

  app.use(cors({
    origin: (origin, cb) => {
      // Autorise les requêtes sans origine (curl, Postman en dev, health checks)
      const sameOrigin = origin === `${process.env.RENDER_EXTERNAL_URL || `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.HOST || 'localhost'}:${env.port}`}`;
      if (!origin || allowedOrigins.includes(origin) || sameOrigin) return cb(null, true);
      cb(new AppError(403, `Origine CORS refusée : ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 600,
  }));

  // ── Logs (uniquement hors test) ─────────────────────────────────────────
  if (!env.isTest) {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // ── Parsers ──────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ── Routes ───────────────────────────────────────────────────────────────
  app.use('/api', apiLimiter, requireJsonContentType, buildRoutes());

  // Health check racine (utile pour les hébergeurs)
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });

  // 404 + gestionnaire d'erreurs centralisé
  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
