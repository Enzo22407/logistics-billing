# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Déploiement

Ce projet contient un frontend React/Vite et un backend Express dans `backend/`.

- Le frontend utilise maintenant la variable d'environnement `VITE_API_URL` pour appeler l'API.
- Ajoutez un fichier `.env` avec `VITE_API_URL=https://votre-backend.example.com` ou configurez cette variable dans votre hébergeur.
- Le backend peut être lancé avec `cd backend && npm install && npm start`.
- Pour exécuter localement avec Docker, utilisez :
  - `docker compose up --build`
- Pour déployer avec Docker, construisez l'image : `docker build -t logistics-billing .`
- Pour déployer le frontend sur Vercel :
  1. Créez un compte Vercel et installez le CLI (`npm i -g vercel` ou `npx vercel`).
  2. Depuis le dossier racine du projet, lancez `npx vercel`.
  3. Dans les paramètres du projet Vercel, ajoutez la variable d'environnement `VITE_API_URL` avec l'URL de votre backend.
  4. Vercel utilisera `vercel.json` pour builder le frontend et rediriger toutes les routes vers `index.html`.
- Pour déployer le projet complet (frontend + backend), utilisez Render ou un autre service Docker avec disque persistant. Voici un exemple Render :
  1. Sur render.com, connectez votre repo GitHub/GitLab.
  2. Créez un service Web en mode Docker.
  3. Pointez `Dockerfile` comme Dockerfile du service.
  4. Ajoutez ces variables d'environnement dans Render :
     - `NODE_ENV=production`
     - `PORT=10000`
     - `DB_PATH=/app/backend/data/logistics.db`
  5. Montez un disque persistant sur `/app/backend/data` (Render Disk) pour conserver la base SQLite.
- Alternative : Fly.io, qui accepte aussi un service Docker avec volume persistant. Utilise le fichier `fly.toml` déjà présent.
  1. Installe `flyctl` : `curl -L https://fly.io/install.sh | sh` ou `npm install -g flyctl`.
  2. Connecte-toi : `flyctl auth login`.
  3. Depuis le dossier racine du projet, lance : `flyctl launch --copy-config --name logistics-billing-fullstack --region fra --dockerfile Dockerfile`.
  4. Crée un volume persistant : `flyctl volumes create logistics-db --region fra --size 1`.
  5. Associe le volume à l’application : il est déjà défini dans `fly.toml` sur `/app/backend/data`.
  6. Déploie : `flyctl deploy`.
- Important : ce projet utilise un backend Express + SQLite. Fly.io est une bonne option si tu ne peux pas utiliser Render ou Railway, car il gère Docker et le stockage persistant pour la base.

## Migration vers Supabase (Postgres) — option recommandée

- Crée un projet Supabase gratuit et ouvre l'éditeur SQL.
- Dans l'éditeur SQL, exécute le fichier `backend/supabase_schema.sql` pour créer les tables.
- Depuis le dossier `backend`, installe les dépendances pour la migration :

```bash
cd backend
npm install @supabase/supabase-js sqlite3
```

- Exporte/pose ta base SQLite locale dans `backend/logistics.db` (ou indique un chemin explicite).
- Défini les variables d'environnement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (clé service_role depuis Supabase Project Settings → API).
- Puis lance la migration :

```bash
node migrate-to-supabase.js path/to/logistics.db
```

Après migration, adapte le backend pour utiliser Postgres (je peux générer un wrapper `backend/db.js` pour basculer automatiquement vers Postgres si tu veux).  


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
