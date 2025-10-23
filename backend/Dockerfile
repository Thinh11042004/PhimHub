# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS base
WORKDIR /app
ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

FROM base AS build
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
# Use local tsc to avoid network
RUN ./node_modules/.bin/tsc --version && npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY uploads ./uploads
COPY scripts ./scripts
EXPOSE 3001
CMD ["node", "dist/index.js"]
