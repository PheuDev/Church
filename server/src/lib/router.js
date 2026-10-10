// ============================================================
// Générateur de routeur CRUD (validation zod + rôles)
// ============================================================
import { Router } from 'express';
import { createCrudResource, DEFAULT_ROLES } from './crud.js';
import { access } from './permissions.js';
import { asyncHandler } from './http.js';
import { validateBody } from './validate.js';

/**
 * Monte un CRUD complet pour une ressource église-scopée.
 * @param {object} conf Même configuration que createCrudResource, plus :
 * @param {object} [conf.createSchema] Schéma zod strict pour POST
 * @param {object} [conf.updateSchema] Schéma zod strict (partiel) pour PATCH
 * @param {string[]} [conf.readRoles] Rôles autorisés à lire
 * @param {string[]} [conf.writeRoles] Rôles autorisés à écrire/créer
 * @param {string[]} [conf.deleteRoles] Rôles autorisés à supprimer
 * @param {function} [conf.transform] Ajout de routes personnalisées (router, ctx)
 */
export function crudRouter(conf) {
  const router = Router();
  const resource = createCrudResource(conf);
  const read = conf.readRoles || DEFAULT_ROLES.read;
  const write = conf.writeRoles || DEFAULT_ROLES.write;
  // La suppression est toujours réservée à l'ADMIN, quelles que soient
  // les options passées — seul l'administrateur peut supprimer des données.
  const del = ['ADMIN'];

  router.get('/', access('read', read), asyncHandler(resource.list));
  router.post('/', access('write', write), conf.createSchema ? validateBody(conf.createSchema) : (req, _res, next) => next(), asyncHandler(resource.create));

  // Routes personnalisées AVANT /:id pour éviter les collisions de chemins.
  if (conf.transform) conf.transform(router, resource);

  router.get('/:id', access('read', read), asyncHandler(resource.get));
  router.patch('/:id', access('write', write), conf.updateSchema ? validateBody(conf.updateSchema) : (req, _res, next) => next(), asyncHandler(resource.update));
  router.delete('/:id', access('delete', del), asyncHandler(resource.remove));

  return router;
}