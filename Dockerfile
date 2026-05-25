# --- Étape 1 : Construction du Frontend ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Étape 2 : Serveur de Production ---
FROM node:20-alpine AS runtime
WORKDIR /app

# Installation des dépendances backend uniquement
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --production

# Création du dossier pour la base de données SQLite
RUN mkdir -p /app/backend/data

# Copie du code backend et des fichiers frontend compilés
COPY backend/server.js ./backend/
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 10000

WORKDIR /app/backend
CMD ["node", "server.js"]
