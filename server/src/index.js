// ============================================================
// Point d'entrée du serveur
// ============================================================
import { env } from './config/env.js';
import { createApp } from './app.js';
import prisma from './lib/prisma.js';

const app = createApp();

let server;
try {
  server = app.listen(env.port, () => {
    console.log(`[AD Gestion] API démarrée sur http://localhost:${env.port} (${env.nodeEnv})`);
  });
} catch (err) {
  console.error('[AD Gestion] Échec du démarrage :', err);
  process.exit(1);
}

async function shutdown(signal) {
  console.log(`[AD Gestion] ${signal} reçu, arrêt en cours…`);
  server?.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGQUIT', () => shutdown('SIGQUIT'));

export { app, server };