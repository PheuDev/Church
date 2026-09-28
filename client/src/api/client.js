// ============================================================
// Client API — axios avec jeton JWT, gestion 401/403 et réseau
// ============================================================
import axios from 'axios';

export const TOKEN_KEY = 'adgestion.token';
export const USER_KEY = 'adgestion.user';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

let onPasswordChangeRequired = null;
export function setPasswordChangeRequiredHandler(fn) {
  onPasswordChangeRequired = fn;
}

// true = API joignable, false = coupure réseau / timeout.
let onNetworkStatus = null;
export function setNetworkStatusHandler(fn) {
  onNetworkStatus = fn;
}

api.interceptors.response.use(
  (res) => {
    onNetworkStatus?.(true);
    return res;
  },
  (err) => {
    onNetworkStatus?.(Boolean(err?.response));
    if (err?.response?.status === 401 && err.config?.url !== '/auth/login') {
      onUnauthorized?.();
    }
    if (err?.response?.status === 403 && err.response.data?.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
      onPasswordChangeRequired?.();
    }
    return Promise.reject(err);
  },
);

/** Extrait un message d'erreur lisible depuis une exception. */
export function getErrorMessage(err) {
  if (!err?.response) return 'Connexion au serveur impossible. Vérifiez votre réseau.';
  return (
    err.response.data?.error?.message
    || err.response.data?.message
    || err.message
    || 'Erreur inconnue.'
  );
}
