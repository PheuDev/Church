// ============================================================
// Helpers HTTP — appels vers l'API
// ============================================================
import { api } from './client.js';

/** Liste paginée : GET /path?page=&pageSize=&search=&filtres… */
export function list(path, params = {}) {
  return api.get(path, { params }).then((r) => r.data);
}

/** Détail : GET /path/:id */
export function getOne(path, id) {
  return api.get(`${path}/${id}`).then((r) => r.data);
}

/** Création : POST /path */
export function create(path, data) {
  return api.post(path, data).then((r) => r.data);
}

/** Mise à jour complète : PATCH /path/:id (reçoit un objet plein) */
export function update(path, id, data) {
  return api.patch(`${path}/${id}`, data).then((r) => r.data);
}

/** Remplacement : PUT /path/:id/suffixe (sync de relations…) */
export function put(path, id, suffix, data) {
  return api.put(`${path}/${id}/${suffix}`, data).then((r) => r.data);
}

/** Suppression : DELETE /path/:id */
export function remove(path, id) {
  return api.delete(`${path}/${id}`).then((r) => r.data);
}

/** Export CSV : GET /path?format=csv */
export function exportCsv(path, params = {}) {
  return api
    .get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' })
    .then((r) => r.data);
}