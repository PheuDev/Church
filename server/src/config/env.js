// ============================================================
// Configuration de l'environnement (chargée depuis .env)
// ============================================================
import 'dotenv/config';

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];

export function loadEnv() {
  for (const key of REQUIRED) {
    if (!process.env[key]) {
      throw new Error(`Variable d'environnement manquante : ${key}`);
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isTest: process.env.NODE_ENV === 'test',
    port: Number(process.env.PORT || 4000),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || 'storage/uploads',
  };
}

export const env = loadEnv();