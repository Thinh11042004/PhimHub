# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Copy SQL migrations alongside compiled code
COPY src/migrations ./dist/migrations

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Include uploads dir (for volume bind), and scripts (wait-for)
COPY uploads ./uploads
COPY scripts ./scripts
EXPOSE 3001
CMD ["node", "dist/index.js"]
