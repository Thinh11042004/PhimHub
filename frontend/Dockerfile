FROM node:20-alpine AS builder
WORKDIR /app

# Accept build-time API base URL (used by Vite at build time)
ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci

COPY . .

# Ensure terser is available for minification
RUN npm i -D terser && npx vite build

# Use nginx to serve SPA with history fallback
FROM nginx:alpine AS runner

# Simple SPA fallback: route all to index.html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


