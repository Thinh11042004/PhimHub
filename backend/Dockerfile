FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source
COPY src ./src

# Build TypeScript and include SQL migrations in dist
RUN npm run build \
  && mkdir -p dist/migrations \
  && if [ -d "src/migrations" ]; then cp -r src/migrations/* dist/migrations/ || true; fi

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Uploads directory for user content
RUN mkdir -p /app/uploads/avatars

EXPOSE 3001
# Run DB migrations then start API. Allow migration to fail on first attempts.
CMD ["sh", "-c", "sleep 10; node dist/db/migrator.js run || true; node dist/index.js"]


