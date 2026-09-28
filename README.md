# AD Gestion

Plateforme de gestion opérationnelle d'église (Assemblées de Dieu) — API Node/Express + interface React.

---

## 1. Prérequis

| Outil | Version minimale | Vérifier |
|---|---|---|
| Node.js | 18 (testé sur 24) | `node --version` |
| npm | 9 | `npm --version` |
| PostgreSQL | 14 (testé sur 18) | service `postgresql-x64-18` démarré |

Le service PostgreSQL doit être **démarré** avant de lancer le serveur :

```powershell
Get-Service postgresql-x64-18
# Si arrêté (en administrateur) :
Start-Service postgresql-x64-18
```

---

## 2. Installation (une seule fois)

```powershell
cd f:\Projets\Church
npm install
```

`npm install` à la racine installe **tout** (workspaces `server` et `client` + `concurrently`).

### Variables d'environnement

Le fichier `server\.env` est déjà présent en développement. Pour repartir de zéro :

```powershell
Copy-Item f:\Projets\Church\server\.env.example f:\Projets\Church\server\.env
```

Contenu :

```ini
DATABASE_URL="postgresql://church_app:church_dev_2026@localhost:5432/church_db"
PORT=4000
NODE_ENV=development
JWT_SECRET="<chaîne aléatoire longue>"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"
UPLOAD_DIR="storage/uploads"
```

### Base de données

```powershell
# Création du schéma + données de démonstration
npm run setup:db
```

Équivalent de `prisma generate && prisma db push && node prisma/seed.js`.

Commandes séparées si besoin :

```powershell
npm run db:push    # synchronise le schéma Prisma
npm run db:seed    # (re)charge les données de démo
```

---

## 3. Lancement

### Mode développement (recommandé)

```powershell
cd f:\Projets\Church
npm run dev
```

Démarre les deux services en parallèle avec `concurrently` :

| Service | URL | Rechargement |
|---|---|---|
| API Express | http://localhost:4000 | `node --watch` |
| Interface React (Vite) | **http://localhost:5173** | HMR |

**Ouvrez http://localhost:5173 dans le navigateur.** Le client redirige `/api`
vers le port 4000 (proxy Vite), donc aucune configuration CORS n'est nécessaire côté navigateur.

Lancer un seul service :

```powershell
npm run dev:server   # API uniquement (port 4000)
npm run dev:client   # Vite uniquement (port 5173)
```

Vérifier que l'API répond :

```powershell
Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing
# {"status":"ok","time":"..."}
```

### Mode production

```powershell
cd f:\Projets\Church
npm run build      # génère client\dist
npm run start      # démarre l'API
```

Le serveur ne sert pas `client\dist` : servez le build avec un hébergeur statique
(IIS, Nginx, `npm run preview -w client`) et pointez `CLIENT_ORIGIN` vers son URL.

---

## 4. Comptes de démonstration

Mot de passe commun : **`ChangeMe123!`**

| Rôle | Email | Accès |
|---|---|---|
| `ADMIN` | admin@ad-yaounde.org | tout, y compris administration et journaux d'audit |
| `PASTOR` | pastor@ad-yaounde.org | lecture large, écriture sur les modules métier |
| `SECRETARY` | secretaire@ad-yaounde.org | personnes, familles, activités, présences |
| `TREASURER` | tresorier@ad-yaounde.org | finances, contributions, engagements |
| `VIEWER` | lecteur@ad-yaounde.org | consultation seule |

> À la première connexion, l'API renvoie `mustChangePassword: true` et l'interface
> redirige vers `/change-password` : le mot de passe doit être changé avant tout autre accès.

---

## 5. Structure du dépôt

```
Church/
├─ package.json            # workspaces + scripts racine
├─ server/
│  ├─ prisma/
│  │  ├─ schema.prisma     # ~40 modèles : personnes, familles, finances, formation…
│  │  └─ seed.js           # jeu de données de démonstration (église de Yaoundé)
│  ├─ src/
│  │  ├─ index.js          # point d'entrée HTTP
│  │  ├─ app.js            # application Express (helmet, cors, morgan, rate-limit)
│  │  ├─ config/env.js     # chargement/validation des variables d'environnement
│  │  ├─ lib/              # auth (JWT+rôles), crud (fabrique CRUD), validate (zod),
│  │  │                    # http (erreurs/codes), audit, prisma
│  │  └─ routes/           # 17 modules de routes REST
│  └─ storage/uploads/     # fichiers téléversés (documents)
└─ client/
   └─ src/
      ├─ app.jsx           # routes React + garde d'authentification
      ├─ api/              # client axios, 39 définitions de ressources
      ├─ auth/auth.jsx     # contexte de session (localStorage)
      ├─ components/       # ui.jsx (design system), DataTable, ResourceForm, page générique
      ├─ layout/           # coquille applicative (sidebar + topbar)
      ├─ lib/              # enums (libellés FR), formatage (dates, XAF, tailles)
      └─ pages/            # Dashboard, Personnes, Présences, Finances, Documents, Église
```

---

## 6. Modules fonctionnels

### Pages dédiées

| Page | Route | Contenu |
|---|---|---|
| Tableau de bord | `/` | indicateurs clés, graphiques de répartition et d'activité, finances du mois |
| Personnes | `/persons` | annuaire avec bandeau statistique et filtres |
| Présences | `/activities/:id/attendance` | saisie groupée (tous présents / absents / excusés) |
| Finances | `/finance` | synthèse recettes/dépenses/soldes par compte, filtres par période |
| Documents | `/documents` | téléversement multipart, recherche, téléchargement |
| Église | `/church` | fiche de l'église et paramètres clé/valeur |

### Ressources CRUD génériques (39)

Chaque entrée est déclarée dans `client/src/api/res-*.jsx` (colonnes, formulaire, rôles) et
rendue par `GenericResourcePage` : recherche, tri, pagination, filtres, export CSV,
création/édition/suppression modales.

- **Personnes / familles** : `/persons`, `/families`
- **Départements** : `/departments`, `/department-members`, `/department-stats`
- **Activités** : `/activities`, `/activity-types`, `/attendance-records`
- **École du dimanche** : `/sunday-school/classes`, `/sunday-school/sessions`, `/sunday-school/participants`
- **Formation** : `/formations/programs`, `/formations/sessions`, `/formations/lessons`,
  `/formations/verses`, `/formations/lesson-verses`, `/formations/session-lessons`
- **Baptêmes** : `/baptisms/candidates`, `/baptisms/evaluations`, `/baptisms/baptisms`, `/baptisms/certificates`
- **Finances** : `/finance/accounts`, `/finance/funds`, `/finance/categories`, `/finance/revenues`,
  `/finance/expenses`, `/finance/contributions`, `/finance/contribution-payments`,
  `/finance/commitments`, `/finance/commitment-payments`
- **Événements / projets** : `/events`, `/event-participants`, `/projects`
- **Administration et union** : `/admin/offices`, `/admin/sessions`, `/admin/departments`,
  `/admin/localities`, `/users`, `/audit-logs`

---

## 7. API REST

Toutes les routes sous `/api` (sauf `/api/health` et `/api/auth/login`) exigent l'en-tête
`Authorization: Bearer <token>`.

Conventions :

| Verbe | Chemin | Effet |
|---|---|---|
| `GET` | `/api/<ressource>` | liste paginée (`?page`, `?pageSize`, `?search`, filtres) |
| `GET` | `/api/<ressource>/:id` | lecture d'un enregistrement |
| `POST` | `/api/<ressource>` | création |
| `PUT` | `/api/<ressource>/:id` | mise à jour |
| `DELETE` | `/api/<ressource>/:id` | suppression |

Routes d'authentification : `POST /api/auth/login`, `GET /api/auth/me`,
`POST /api/auth/change-password`.

Agrégats : `GET /api/dashboard`, `GET /api/finance/summary`, `GET /api/department-stats`,
`GET /api/attendance-stats`.

Le cloisonnement par église est automatique : `req.churchId` est déduit du jeton et appliqué
à toutes les requêtes. Les modèles globaux (Church, NationalOffice, AduSession,
AdminDepartment, Locality) en sont exemptés.

Routes spécifiques : `GET /api/churches/me` (fiche de l'église de l'utilisateur connecté)
et `GET /api/documents/:id/download` (téléchargement protégé, disposition
`attachment`). Il n'y a **plus de dossier `/uploads` public** : les fichiers
téléversés ne sont accessibles que par cette route authentifiée.

---

## 8. Tests

```powershell
npm run test
```

Exécute `node --test --test-concurrency=1 "test/*.test.js"` (dossier `server/test/`).

Les tests sont volontairement **sans base de données** : en-têtes de sécurité,
authentification obligatoire, absence d'un `/uploads` public, validation zod et
gestion des erreurs HTTP (11 tests).

---

## 9. Sécurité

| Mesure | Mise en œuvre |
|---|---|
| Authentification | JWT (`JWT_SECRET`), hachage bcrypt, `tokenVersion` pour révoquer les sessions |
| Mot de passe initial | Refus côté **serveur** (`403 PASSWORD_CHANGE_REQUIRED`) de toute route tant que `mustChangePassword` est vrai |
| Rate limiting | Global sur `/api` (1000/15 min), strict sur `/api/auth/login` (20/15 min) et `/api/auth/change-password` (10/15 min) |
| Fichiers téléversés | Whitelist d'extensions (pas de HTML/SVG/JS), 50 Mo, téléchargement exclusivement par `/api/documents/:id/download` en `Content-Disposition: attachment` |
| Erreurs | Les erreurs 5xx renvoient un message générique (aucun détail Prisma/SQL) |
| Tri et filtres | `sort`, `order`, `dateField` validés contre le schéma Prisma (DMMF) : pas d'erreur 500 sur un champ inconnu |
| Comptes | Impossible de modifier son propre compte ni un compte de rang égal ou supérieur (hors `ADMIN`) |
| Exports | CSV borné à 10 000 lignes, `pageSize` plafonné à 200 |
| Journal d'audit | Connexions réussies/refusées, changements de mot de passe, CRUD, téléchargements de documents |
| CORS et en-têtes | Origine unique (`CLIENT_ORIGIN`), `helmet` (nosniff, CSP…), `x-powered-by` désactivé |

---
## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Variable d'environnement manquante : DATABASE_URL` | `server\.env` absent | copier `.env.example` |
| `ECONNREFUSED ::1:5432` | PostgreSQL arrêté | `Start-Service postgresql-x64-18` |
| `EADDRINUSE` sur 4000 ou 5173 | instance déjà lancée | `Get-Process node \| Stop-Process -Force` |
| Page blanche sur 5173 | API non démarrée | lancer `npm run dev` (les deux services) |
| Erreur Prisma `P1001` | URL de base invalide | vérifier `DATABASE_URL` |
| Aucune donnée affichée | base non peuplée | `npm run db:seed` |
| Identifiants refusés | mots de passe modifiés | `npm run db:seed` pour les réinitialiser |

---

## 11. Raccourci : tout démarrer

```powershell
cd f:\Projets\Church
npm install          # si node_modules absent
npm run setup:db     # si la base n'est pas initialisée
npm run dev          # puis ouvrir http://localhost:5173
```


