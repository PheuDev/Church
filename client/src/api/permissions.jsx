// ============================================================
// Permissions — matrice « rolePermissions » (paramètre d'église)
// ------------------------------------------------------------
// Clé = chemin de ressource sans « / » (ex. 'finance/accounts'),
// identique au serveur. ADMIN a toujours accès total.
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/auth.jsx';
import { list } from './http.js';
import { ROLES } from './resdefs.js';

/** Replis statiques (comportement historique). */
export const DEFAULT_ACCESS = {
  read: ROLES.readAll,
  write: ROLES.writeDefault,
  delete: ROLES.deleteAdmin,
};

let matrix = null;
const listeners = new Set();

/** Remplace la matrice et notifie les abonnés (menu, pages). */
export function setRolePermissions(next) {
  matrix = next && typeof next === 'object' && !Array.isArray(next) ? next : null;
  listeners.forEach((fn) => fn());
}

export function getRolePermissions() {
  return matrix;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * can(role, key, kind, fallbackRoles) — kind ∈ read | write | delete.
 * - ADMIN : toujours autorisé (accès total).
 * - Matrice enregistrée pour la ressource : liste de la matrice.
 * - Sinon : fallbackRoles[kind] (config de la ressource), puis défauts.
 */
export function can(role, key, kind, fallbackRoles) {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  const list = matrix?.[key]?.[kind] ?? fallbackRoles?.[kind] ?? DEFAULT_ACCESS[kind];
  return Array.isArray(list) ? list.includes(role) : false;
}

const PermissionsContext = createContext(null);

/**
 * Charge la matrice depuis /churches/settings et re-rend les consommateurs
 * (AppLayout, GenericResourcePage) à chaque changement.
 */
export function PermissionsProvider({ children }) {
  const { session } = useAuth();
  const [current, setCurrent] = useState(matrix);

  useEffect(() => subscribe(() => setCurrent(getRolePermissions())), []);

  useEffect(() => {
    if (!session || typeof document === 'undefined') return;
    list('/churches/settings')
      .then((res) => {
        const row = (res.items || []).find((s) => s.key === 'rolePermissions');
        setRolePermissions(row ? row.value : null);
      })
      .catch(() => { /* lecture non bloquante : repli statique */ });
  }, [session]);

  return <PermissionsContext.Provider value={current}>{children}</PermissionsContext.Provider>;
}

/** Force l'abonnement du composant aux changements de matrice. */
export function useRolePermissions() {
  return useContext(PermissionsContext);
}
