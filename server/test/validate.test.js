// ============================================================
// Validation zod et gestion des erreurs HTTP
// ============================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validateBody } from '../src/lib/validate.js';
import { AppError, errorHandler } from '../src/lib/http.js';

const schema = z.object({ name: z.string().min(1) }).strict();

function apply(body) {
  const req = { body };
  let error = null;
  validateBody(schema)(req, {}, (err) => { error = err; });
  return { req, error };
}

test('validateBody accepte un corps valide et le remplace par la donnée parsée', () => {
  const { req, error } = apply({ name: 'Église' });
  assert.equal(error, undefined);
  assert.deepEqual(req.body, { name: 'Église' });
});

test('validateBody rejette les champs inconnus (schéma strict)', () => {
  const { error } = apply({ name: 'Église', hamecon: true });
  assert.ok(error instanceof AppError);
  assert.equal(error.status, 400);
});

test('validateBody produit un message lisible', () => {
  const { error } = apply({});
  assert.match(error.message, /name/);
});

test('les erreurs internes ne divulguent pas leur détail', () => {
  const original = console.error;
  console.error = () => {};
  const res = {
    code: null,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  try {
    errorHandler(new Error('Prisma: colonne "secret" introuvable'), {}, res, () => {});
  } finally {
    console.error = original;
  }
  assert.equal(res.code, 500);
  assert.equal(res.body.error.message, 'Erreur interne du serveur.');
});

test('les erreurs applicatives gardent leur message', () => {
  const res = {
    code: null,
    body: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  errorHandler(new AppError(409, 'Élément référencé.'), {}, res, () => {});
  assert.equal(res.code, 409);
  assert.equal(res.body.error.message, 'Élément référencé.');
});
