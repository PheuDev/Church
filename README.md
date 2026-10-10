# AD Gestion — Plateforme de gestion d'église

Système de gestion opérationnelle pour les Assemblées de Dieu.  
Stack : **Node.js 20 / Express** (API) + **React 18 / Vite** (interface) + **PostgreSQL** (base de données).

---

## Structure du projet

```
Church/
├── client/          # Frontend React (Vite)
├── server/          # Backend Node.js (Express + Prisma)
│   ├── prisma/      # Schéma et migrations
│   ├── src/         # Code source API
│   └── storage/     # Fichiers uploadés (hors git)
└── README.md
```

---

## Développement local

### Prérequis
- Node.js ≥ 20
- PostgreSQL ≥ 14
- npm ≥ 9

### Installation

```bash
# Backend
cd server
cp .env.example .env        # Renseigner DATABASE_URL et JWT_SECRET
npm install
npm run db:setup             # Génère le client Prisma + applique le schéma + seed

# Frontend
cd ../client
npm install
```

### Lancement

```bash
# Terminal 1 — API (port 4000)
cd server && npm run dev

# Terminal 2 — Interface (port 5173)
cd client && npm run dev
```

Accéder à : http://localhost:5173

---

## Déploiement en production

### Option recommandée : **Railway** ✅

Railway propose un plan Starter gratuit avec PostgreSQL inclus, déploiement depuis GitHub, variables d'environnement dans l'interface, et persistance des volumes pour les uploads.

**Étapes :**
1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → "Deploy from GitHub repo"
3. Ajouter un service PostgreSQL → copier `DATABASE_URL`
4. Configurer les variables d'environnement (voir `server/.env.example`)
5. Build command : `cd server && npm install && npm run db:migrate`
6. Start command : `cd server && npm start`
7. Pour le frontend : second service ou déploiement statique sur **Netlify / Vercel**

### Autres options gratuites

| Hébergeur | Backend | Base de données | Limite gratuite |
|-----------|---------|-----------------|-----------------|
| **Railway** | ✅ Node.js | ✅ PostgreSQL inclus | 500h/mois, 1 GB DB |
| **Render** | ✅ Node.js | ✅ PostgreSQL 1 Go | Sleep après 15 min d'inactivité |
| **Fly.io** | ✅ Node.js | ✅ PostgreSQL via Supabase | 3 machines partagées |
| **Supabase** | ❌ (DB uniquement) | ✅ PostgreSQL 500 MB | Pause après 1 semaine inactivité |
| **Vercel** | ⚠️ Serverless uniquement | ❌ | Pas adapté à cette API Express |

> **Recommandation** : Railway pour un déploiement simple tout-en-un, ou Render (gratuit avec les limitations de sleep) + Supabase pour la base de données.

### Variables d'environnement requises (production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL complète |
| `JWT_SECRET` | Chaîne aléatoire ≥ 64 caractères |
| `CLIENT_ORIGIN` | URL du frontend (ex: `https://mon-app.netlify.app`) |
| `NODE_ENV` | `production` |
| `PORT` | Port d'écoute (souvent fourni automatiquement) |

### Frontend (React)

Déployer le build statique sur **Netlify** ou **Vercel** :

```bash
cd client
npm run build          # Génère client/dist/
```

Pointer le service sur le dossier `client/dist`.  
Configurer la variable d'environnement `VITE_API_URL` si l'API est sur un autre domaine, et mettre à jour `client/vite.config.js` en conséquence.

> ⚠️ Ne pas oublier d'ajouter l'URL Netlify/Vercel dans `CLIENT_ORIGIN` côté serveur.

---

## Sécurité

- Authentification JWT avec expiration configurable
- Rate limiting sur toutes les routes (500 req/15min) + 20 tentatives de login max
- En-têtes de sécurité via Helmet (CSP, HSTS en production, nosniff, etc.)
- CORS strict sur les origines déclarées
- Mots de passe hachés avec bcrypt (coût 10)
- Suppression réservée au rôle ADMIN
- Audit log de toutes les opérations critiques
- Uploads : validation d'extension, limite 20 Mo, accès uniquement via JWT

---

## Première connexion

Après `npm run db:seed`, un compte administrateur est créé :
- Identifiant : voir `server/prisma/seed.js` ou configurer `ADMIN_EMAIL` / `ADMIN_PASSWORD` en variable d'environnement
- Le mot de passe doit être changé à la première connexion (`mustChangePassword: true`)
