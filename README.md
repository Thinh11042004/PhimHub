# 🎬 PhimHub — Professional Movie Streaming Platform

<div align="center">

<!-- Hero Banner using project images (dark/light) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/assets/branding/phimhub-logo-light.png" />
  <img src="frontend/public/assets/branding/phimhub-logo-dark.png" alt="PhimHub Banner" width="900" />
</picture>

<br />

<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /></a>
<a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /></a>
<a href="https://nodejs.org/"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" /></a>
<a href="https://www.microsoft.com/en-us/sql-server"><img alt="SQL Server" src="https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white" /></a>
<a href="https://www.docker.com/"><img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /></a>

<p><em>An enterprise-grade, full‑stack movie streaming platform with Clean Architecture and a modern, maintainable codebase.</em></p>

<!-- App Preview using project images (dark/light) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/assets/branding/phimhub-logo-light.png" />
  <img src="frontend/public/assets/branding/phimhub-logo-dark.png" alt="PhimHub Preview" width="700" />
</picture>

</div>

---

## 📌 Highlights

- Clean Architecture (Presentation, Business, Data, Infrastructure)
- React 18 + TypeScript, Zustand, Tailwind CSS, Vite
- Node.js + Express + TypeScript API with JWT auth
- SQL Server with migrations and repository pattern
- HLS streaming, external API integrations (TMDB, PhimAPI)
- Docker-first development and deployment

## 🗂️ Table of Contents

- Architecture Overview
- Clean Architecture (Explained)
- Functional Component (Explained)
- Features
- Technology Stack
- Project Structure
- Quick Start
- Configuration
- API Overview
- Security
- Deployment
- Testing
- Contributing
- License

---

## 🏗️ Architecture Overview

PhimHub is designed for scalability and long-term maintainability. The frontend and backend communicate via REST APIs, with clear boundaries between presentation and business concerns.

<div align="center">

<!-- Architecture Diagram (replace with your own diagram when available) -->
<img src="https://via.placeholder.com/1200x600/111111/a7f3d0?text=PhimHub+Clean+Architecture+Diagram" alt="Architecture Diagram" />

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                    🎬 PHIMHUB ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React SPA)  ◄──────►  Backend API (Express)      │
│       Zustand / Axios                Services / Repos       │
│                                          SQL Server         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Clean Architecture (Explained)

Clean Architecture separates code into concentric layers with one core rule: inner layers must not depend on outer layers. This makes the system easier to test, evolve, and replace parts without ripple effects.

- Presentation Layer: Controllers, middlewares, request/response models
- Business Logic Layer: Services, use cases, domain rules
- Data Access Layer: Repositories, models, migrations
- Infrastructure Layer: DB connections, external services, email, file storage

Dependency rule: Presentation → Business → Data → Infrastructure (only inward dependencies).

```
┌─────────────────────────────────────────────────────────┐
│                  CLEAN ARCHITECTURE                     │
├─────────────────────────────────────────────────────────┤
│  🎨 Presentation  →  💼 Business  →  💾 Data  →  🗄️ Infra │
└─────────────────────────────────────────────────────────┘
```

Why it matters
- Testability: Business rules are framework-agnostic
- Maintainability: Isolated changes with minimal coupling
- Replaceability: Swap frameworks or IO details without touching core logic

---

## ⚛️ Functional Component (Explained)

A Functional Component is a plain JavaScript/TypeScript function that returns UI (JSX). It is stateless by default but can use React Hooks for state, side effects, and lifecycle.

- Simple: A function that returns JSX
- Hooks-based: useState, useEffect, useMemo, etc.
- Encourages composition over inheritance
- Preferred in modern React over class components

Example

```tsx
import { useEffect, useState } from 'react';

type Props = { title: string };

export function ExampleCard({ title }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Side effect example (e.g., analytics or data fetch)
  }, []);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button onClick={() => setCount(c => c + 1)}>Clicked {count} times</button>
    </div>
  );
}
```

---

## 🚀 Features

- Movie & Series Streaming (HLS)
- User Accounts, Profiles, JWT Authentication
- Search & Discover (genres, actors, directors)
- Favorites, Watch History, Custom Lists
- Admin Tools, Analytics (extensible)
- Email notifications and external API importers

---

## 🛠️ Technology Stack

Frontend
- React 18 + TypeScript, Vite, Tailwind CSS
- Zustand (state), React Hook Form, React Router DOM
- HLS.js for streaming

Backend
- Node.js + Express + TypeScript
- JWT auth, bcrypt, Helmet, CORS
- SQL Server, repository pattern, custom migrations
- Multer (file upload), Nodemailer (email), external APIs (TMDB/PhimAPI)

Infrastructure
- Docker & Docker Compose, environment-based config

---

## 📁 Project Structure

```
phimhub/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/        # Presentation
│  │  ├─ services/           # Business
│  │  ├─ models/             # Data
│  │  ├─ config/             # Infrastructure
│  │  ├─ migrations/         # Database schema
│  │  └─ index.ts            # API entrypoint
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ features/           # Feature-based UI
│  │  ├─ shared/ components/ services/ store/ utils/
│  │  └─ main.tsx
│  └─ package.json
├─ docker-compose.yml
└─ README.md
```

---

## ⚡ Quick Start

Prerequisites
- Node.js ≥ 18
- Docker & Docker Compose
- SQL Server (local or Docker)

Method 1 — Docker (recommended)

```bash
# From repo root
docker compose up -d
# Frontend: http://localhost:8080
# Backend:  http://localhost:3001
```

Method 2 — Manual

```bash
# Backend
cd backend && npm install
cp env.example .env
npm run migrate
npm run dev

# Frontend (new terminal)
cd frontend && npm install
npm run dev
```

---

## 🔧 Configuration

Backend .env

```env
DB_HOST=localhost
DB_NAME=PhimHub
DB_USER=sa
DB_PASS=YourStrong!Passw0rd
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERT=true

JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

TMDB_API_KEY=your-tmdb-api-key
PHIMAPI_BASE_URL=https://phimapi.com

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=100MB
```

Access Points
- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- Database: localhost:1433 (SQL Server)

---

## 📱 API Overview

Auth
- POST /api/auth/register — Register
- POST /api/auth/login — Login
- POST /api/auth/refresh — Refresh token
- POST /api/auth/logout — Logout

Movies & People
- GET /api/movies — List (pagination, filters)
- GET /api/movies/:slug — Details
- GET /api/movies/search — Search
- GET /api/genres | /api/actors | /api/directors

User Interactions
- GET/POST/DELETE /api/favorites
- GET/POST/PUT /api/watch-history
- GET/POST/PUT/DELETE /api/custom-lists

Admin
- GET /api/admin/users
- GET /api/admin/analytics
- POST /api/admin/import
- GET /api/admin/logs

Standard Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  }
}
```

---

## 🔐 Security

- JWT tokens, role-based access (User/Admin)
- Password hashing (bcrypt), token expiry & refresh
- Input validation, parameterized queries
- CORS, Helmet, basic rate limiting

---

## 🚢 Deployment

Docker (production)

```bash
docker compose -f docker-compose.prod.yml up -d
```

Cloud (suggested)
- AWS: S3 + CloudFront (frontend), ECS/Beanstalk (API), RDS (SQL Server)
- Azure: Static Web Apps (frontend), App Service (API), Azure SQL

Performance
- DB indexing, connection pooling
- Caching (e.g., Redis), compression, horizontal scaling

---

## 🧪 Testing

Backend
- npm run test:unit | test:integration | test:e2e | test:coverage

Frontend
- npm run test | test:e2e | test:visual

Targets
- Unit > 80%, key integration flows covered, E2E main user paths

---

## 🤝 Contributing

- Conventional Commits, ESLint (Airbnb), Prettier, TS strict
- Create feature branch, open PR with screenshots (if UI)

Quick Dev Workflow

```bash
npm run install:all
npm run dev
npm run lint && npm run format && npm run test
```

---

## 📄 License

MIT © 2024 PhimHub

---

## 📞 Support

- Issues & Feature Requests: GitHub Issues
- Discussions: GitHub Discussions
- Email: support@localhost

<div align="center">

⭐ Star this repo if it helps you.

<a href="http://localhost:8080">Homepage</a> • <a href="./README.md">Documentation</a> • <a href="https://github.com/Thinh11042004/PhimHub/issues">Report Bug</a>

</div>
