// ============================================================
// Tests de fumée API — aucun accès base de données nécessaire
// ============================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

test('GET /api/health répond 200 avec les en-têtes de sécurité', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('les routes métier exigent un jeton', async () => {
  const res = await request(app).get('/api/persons');
  assert.equal(res.status, 401);
  assert.match(res.body.error.message, /Authentification/);
});

test('le dossier /uploads n est plus servi publiquement', async () => {
  const res = await request(app).get('/uploads/confidentiel.pdf');
  assert.equal(res.status, 404);
  assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
});

test('les routes inconnues hors API renvoient l enveloppe JSON 404', async () => {
  const res = await request(app).get('/route-inconnue');
  assert.equal(res.status, 404);
  assert.ok(res.body.error.message);
});

test('les routes inconnues sous /api restent protégées (401 avant 404)', async () => {
  const res = await request(app).get('/api/ressource-inconnue');
  assert.equal(res.status, 401);
});

test('le login refuse un corps invalide avant tout accès base', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'pas-une-adresse' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error.message);
});
