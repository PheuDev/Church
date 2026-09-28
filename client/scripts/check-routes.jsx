// ============================================================
// Vérification du rendu de TOUTES les routes (sans navigateur)
// ------------------------------------------------------------
// Usage :  npm run check:routes -w client
//          $env:ADG_ROLE='VIEWER'; npm run check:routes -w client
//
// Rend chaque page avec renderToString : détecte immédiatement
// toute erreur de rendu (composant non défini, propriété
// inexistante…) qui, faute d'ErrorBoundary, produisait une
// page blanche totale dans le navigateur.
// ============================================================
import React from 'react';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
store.set('adgestion.token', 'jeton-de-test');
store.set('adgestion.user', JSON.stringify({
  id: 'u1', churchId: 'c1', role: process.env.ADG_ROLE || 'ADMIN',
  email: 'admin@ad-yaounde.org', fullName: 'Admin Test', mustChangePassword: false,
}));

const { renderToString } = await import('react-dom/server');
const { MemoryRouter } = await import('react-router-dom');
const { AuthProvider } = await import('../src/auth/auth.jsx');
const { App } = await import('../src/app.jsx');
const { RESOURCES } = await import('../src/api/resources.js');

const ROUTES = [
  '/',
  '/finance',
  '/documents',
  '/church',
  '/activities/abc/attendance',
  '/route-inexistante',
  ...Object.keys(RESOURCES).map((k) => `/${k}`),
];

const onlyFailures = process.argv.includes('--quiet');
let fails = 0;
for (const route of ROUTES) {
  const expectNotFound = route === '/route-inexistante';
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );
    const len = html.length;
    const hasErrorScreen = html.includes('Une erreur est survenue');
    const hasNotFound = html.includes('Page introuvable');
    if (hasErrorScreen) {
      fails += 1;
      console.log(`FAIL  ${route.padEnd(34)} ecran d'erreur ErrorBoundary`);
    } else if (hasNotFound && !expectNotFound) {
      fails += 1;
      console.log(`FAIL  ${route.padEnd(34)} route non montee (Page introuvable)`);
    } else if (!onlyFailures) {
      console.log(`PASS  ${route.padEnd(34)} taille=${len}`);
    }
  } catch (err) {
    fails += 1;
    console.log(`CRASH ${route.padEnd(34)} ${err.constructor.name}: ${err.message}`);
  }
}

console.log(`\nRESULTAT: ${ROUTES.length - fails}/${ROUTES.length} routes OK (role=${process.env.ADG_ROLE || 'ADMIN'})`);
process.exit(fails ? 1 : 0);
