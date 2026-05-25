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
- Important : ce projet utilise un backend Express + SQLite. Pour un déploiement complet en production, Render est une bonne option car vous pouvez ajouter un disque persistant pour `logistics.db`.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
