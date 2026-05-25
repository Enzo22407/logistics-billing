# Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY vite.config.js .
COPY public ./public
COPY src ./src
RUN npm install
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/server.js ./backend/
COPY backend/logistics.db ./backend/
COPY --from=builder /app/dist ./dist
WORKDIR /app/backend
RUN cd /app/backend && npm install --production
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
