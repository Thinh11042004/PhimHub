# 🎬 PhimHub - Professional Movie Streaming Platform

<div align="center">

![PhimHub Banner](https://via.placeholder.com/800x200/1a1a1a/ffffff?text=PhimHub+Movie+Streaming+Platform)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQL Server](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white)](https://www.microsoft.com/en-us/sql-server)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

*A enterprise-grade, full-stack movie streaming platform built with modern technologies and clean architecture principles*

</div>

## 📖 Table of Contents

- [🏗️ Architecture Overview](#️-architecture-overview)
- [🚀 Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏛️ Clean Architecture](#️-clean-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [🗄️ Database Schema](#️-database-schema)
- [📱 API Documentation](#-api-documentation)
- [🔐 Security](#-security)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)

## 🏗️ Architecture Overview

PhimHub follows **Clean Architecture** principles with clear separation of concerns and dependency inversion:

```
┌─────────────────────────────────────────────────────────────┐
│                    🎬 PHIMHUB ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    HTTP/WebSocket    ┌──────────────┐  │
│  │   Frontend UI   │ ◄─────────────────► │   Backend    │  │
│  │   (React SPA)   │                     │   API        │  │
│  └─────────────────┘                     └──────────────┘  │
│           │                                       │         │
│           │                                       │         │
│  ┌─────────────────┐                     ┌──────────────┐  │
│  │  State Store    │                     │  Services    │  │
│  │  (Zustand)      │                     │  Layer       │  │
│  └─────────────────┘                     └──────────────┘  │
│           │                                       │         │
│           │                                       │         │
│  ┌─────────────────┐                     ┌──────────────┐  │
│  │  API Services   │                     │ Repositories │  │
│  │  (Axios)        │                     │              │  │
│  └─────────────────┘                     └──────────────┘  │
│                                                   │         │
│                                          ┌──────────────┐  │
│                                          │  Database    │  │
│                                          │ (SQL Server) │  │
│                                          └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 🏢 System Components

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| **Presentation Layer** | React + TypeScript | UI Components, State Management |
| **API Gateway** | Express.js | Request handling, Middleware |
| **Business Logic** | Service Classes | Domain rules, Use cases |
| **Data Access** | Repository Pattern | Database operations |
| **Database** | SQL Server | Data persistence |
| **External APIs** | TMDB, PhimAPI | Third-party integrations |

## 🚀 Features

### 🎯 Core Features
- **🎬 Movie & Series Streaming** - High-quality HLS video streaming
- **👤 User Management** - Registration, authentication, profiles
- **📺 Content Discovery** - Search, filter, browse by genres
- **📚 Personal Collections** - Favorites, custom lists, watch history
- **🎭 Rich Metadata** - Actor/director profiles, ratings, reviews
- **📱 Responsive Design** - Mobile-first, cross-platform compatibility

### 🔧 Admin Features
- **📤 Content Upload** - Movie/series management
- **👥 User Administration** - User management and analytics
- **📊 Analytics Dashboard** - Usage statistics and insights
- **🔧 System Configuration** - Platform settings and maintenance

### 🌟 Advanced Features
- **🔍 Intelligent Search** - Full-text search with filters
- **💬 Comment System** - User reviews and discussions
- **🎯 Recommendation Engine** - Personalized content suggestions
- **📧 Email Notifications** - Account management and updates

## 🛠️ Technology Stack

### 🎨 Frontend Architecture
```
Frontend (React SPA)
├── 📱 Presentation Layer
│   ├── React 18 + TypeScript
│   ├── Tailwind CSS (Styling)
│   └── Vite (Build Tool)
├── 🗃️ State Management
│   ├── Zustand (Global State)
│   └── React Hook Form (Form State)
├── 🌐 Routing & Navigation
│   └── React Router DOM
├── 📡 Data Fetching
│   ├── Axios (HTTP Client)
│   └── Custom API Services
└── 🎥 Media Streaming
    └── HLS.js (Video Streaming)
```

### ⚙️ Backend Architecture
```
Backend (Node.js API)
├── 🌐 API Layer
│   ├── Express.js (Web Framework)
│   ├── TypeScript (Type Safety)
│   └── Helmet (Security Headers)
├── 🔒 Authentication & Security
│   ├── JWT (Token-based Auth)
│   ├── bcryptjs (Password Hashing)
│   └── CORS (Cross-Origin Requests)
├── 💾 Data Layer
│   ├── SQL Server (Primary Database)
│   ├── Custom Migration System
│   └── Repository Pattern
├── 🔧 Services & Integrations
│   ├── External API Services
│   ├── Email Service (Nodemailer)
│   └── File Upload (Multer)
└── 📊 Infrastructure
    ├── Docker Containerization
    └── Environment Configuration
```

## 🏛️ Clean Architecture

PhimHub implements **Clean Architecture** with the following layers:

### 🎯 Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  CLEAN ARCHITECTURE                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │            🎨 PRESENTATION LAYER                │   │
│  │  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ Controllers │  │ Middlewares │              │   │
│  │  │             │  │             │              │   │
│  │  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │             💼 BUSINESS LOGIC LAYER             │   │
│  │  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  Services   │  │ Use Cases   │              │   │
│  │  │             │  │             │              │   │
│  │  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              💾 DATA ACCESS LAYER               │   │
│  │  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │Repositories │  │   Models    │              │   │
│  │  │             │  │             │              │   │
│  │  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │             🗄️ INFRASTRUCTURE LAYER             │   │
│  │  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  Database   │  │ External    │              │   │
│  │  │             │  │ Services    │              │   │
│  │  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 📋 Functional Components

#### 🎨 Presentation Layer
- **Controllers**: Handle HTTP requests and responses
- **Middlewares**: Authentication, error handling, file uploads
- **Route Handlers**: API endpoint definitions

#### 💼 Business Logic Layer
- **Services**: Core business operations and rules
- **Use Cases**: Application-specific business rules
- **Domain Models**: Business entities and value objects

#### 💾 Data Access Layer
- **Repositories**: Abstract data access operations
- **Models**: Database entity representations
- **Database Migrations**: Schema version control

#### 🗄️ Infrastructure Layer
- **Database Connection**: SQL Server configuration
- **External APIs**: TMDB, PhimAPI integrations
- **Email Service**: Notification system
- **File Storage**: Media upload handling

## 📁 Project Structure

```
🎬 phimhub/
├── 📄 docker-compose.yml          # Container orchestration
├── 📄 README.md                   # Project documentation
├── 📄 start-backend.bat           # Windows backend starter
├── 📄 start-frontend.bat          # Windows frontend starter
├── 📄 TEST_MANUAL_CHECKLIST.md    # QA testing guide
│
├── 🔧 backend/                    # Backend API Server
│   ├── 📄 Dockerfile              # Backend container config
│   ├── 📄 docker-compose.yml      # Backend services
│   ├── 📄 package.json            # Dependencies & scripts
│   ├── 📄 tsconfig.json           # TypeScript configuration
│   │
│   └── 📁 src/                    # Source code
│       ├── 📄 index.ts            # Application entry point
│       │
│       ├── 🎯 controllers/        # 🎨 PRESENTATION LAYER
│       │   ├── actor.controller.ts
│       │   ├── auth.controller.ts
│       │   ├── customList.controller.ts
│       │   ├── director.controller.ts
│       │   ├── favorites.controller.ts
│       │   ├── genre.controller.ts
│       │   ├── movie.controller.ts
│       │   ├── tmdb.controller.ts
│       │   └── watchHistory.controller.ts
│       │
│       ├── 🔧 middlewares/        # Request/Response Pipeline
│       │   ├── auth.middleware.ts
│       │   ├── error.middleware.ts
│       │   └── upload.middleware.ts
│       │
│       ├── 💼 services/           # 💼 BUSINESS LOGIC LAYER
│       │   ├── actor.service.ts
│       │   ├── CustomListService.ts
│       │   ├── director.service.ts
│       │   ├── email.service.ts
│       │   ├── external-api.service.ts
│       │   ├── FavoritesService.ts
│       │   ├── movie-import.service.ts
│       │   ├── tmdb.service.ts
│       │   └── user.service.ts
│       │
│       ├── 💾 models/             # 💾 DATA ACCESS LAYER
│       │   ├── ActorRepository.ts
│       │   └── [other repositories...]
│       │
│       ├── 🗄️ config/             # 🗄️ INFRASTRUCTURE LAYER
│       │   └── database.ts
│       │
│       ├── 🔄 migrations/         # Database Schema Management
│       │   ├── 001_create_database_schema.sql
│       │   ├── 002_add_slug_to_movies.sql
│       │   └── [28+ migration files...]
│       │
│       ├── 🌐 routes/             # API Route Definitions
│       ├── 📝 types/              # TypeScript Type Definitions
│       └── 🛠️ utils/             # Utility Functions
│
├── 🎨 frontend/                   # React Frontend Application
│   ├── 📄 Dockerfile              # Frontend container config
│   ├── 📄 package.json            # Dependencies & scripts
│   ├── 📄 vite.config.ts          # Vite configuration
│   ├── 📄 tailwind.config.js      # Styling configuration
│   │
│   ├── 📁 public/                 # Static assets
│   │   └── assets/
│   │
│   └── 📁 src/                    # Source code
│       ├── 📄 main.tsx            # Application entry point
│       ├── 📄 index.css           # Global styles
│       │
│       ├── 🎯 features/           # Feature-based Architecture
│       │   ├── account/           # User account management
│       │   ├── actors/            # Actor profiles & listings
│       │   ├── admin/             # Admin panel & tools
│       │   ├── auth/              # Authentication flows
│       │   ├── catalog/           # Movie/series browsing
│       │   ├── directors/         # Director profiles
│       │   ├── home/              # Landing page
│       │   ├── interactions/      # User interactions (favorites, etc.)
│       │   └── watch/             # Video streaming interface
│       │
│       ├── 🔗 shared/             # Shared Components & Utilities
│       ├── 📡 services/           # API Service Layer
│       ├── 🗃️ store/              # State Management (Zustand)
│       ├── 🎨 components/         # Reusable UI Components
│       ├── ⚙️ config/             # Configuration files
│       ├── 🪝 hooks/              # Custom React Hooks
│       ├── 📄 pages/              # Page components
│       └── 🛠️ utils/             # Utility functions
│
├── 🌱 seed/                       # Database Seeding
│   ├── 📄 Dockerfile              # Seed container config
│   └── 📄 import.sh               # Database import script
│
└── 📦 db_moi1.bacpac             # Database backup file
```

## 🚀 Quick Start

### 📋 Prerequisites

```bash
# Required Software
Node.js >= 18.0.0
Docker & Docker Compose
SQL Server (or use Docker container)
Git
```

### 🔧 Installation Methods

#### Method 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd phimhub

# Start all services
docker-compose up -d

# Access applications
# Frontend: http://localhost:8080
# API (direct): http://localhost:3001
# API via frontend proxy: http://localhost:8080/api
```

#### Method 2: Manual Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd phimhub

# 2. Backend setup
cd backend
npm install

# Create environment file
cp env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start backend server
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install

# Start frontend server
npm run dev
```

### 🔧 Configuration

#### Backend Environment Variables
Create `.env` file in backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=PhimHub
DB_USER=sa
DB_PASS=YourStrong!Passw0rd
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERT=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# External API Keys
TMDB_API_KEY=your-tmdb-api-key
PHIMAPI_BASE_URL=https://phimapi.com

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=100MB
```

#### Application Access Points
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Database**: localhost:1433 (SQL Server)

## 🗄️ Database Schema

### 📊 Entity Relationship Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │    Users    │    │   Movies    │    │   Episodes  │    │
│  │             │    │             │    │             │    │
│  │ id (PK)     │    │ id (PK)     │    │ id (PK)     │    │
│  │ email       │◄──┐│ title       │    │ movie_id    │    │
│  │ password    │   ││ slug        │    │ episode_num │    │
│  │ name        │   ││ description │    │ season_num  │    │
│  │ avatar      │   ││ poster_url  │    │ title       │    │
│  │ created_at  │   ││ trailer_url │    │ video_url   │    │
│  │ updated_at  │   ││ release_date│    └─────────────┘    │
│  └─────────────┘   ││ rating      │                      │
│                    ││ type        │    ┌─────────────┐    │
│  ┌─────────────┐   ││ created_at  │    │   Genres    │    │
│  │Watch History│   ││ updated_at  │    │             │    │
│  │             │   │└─────────────┘    │ id (PK)     │    │
│  │ id (PK)     │   │                   │ name        │    │
│  │ user_id (FK)│───┘ ┌─────────────┐    │ slug        │    │
│  │ movie_id(FK)│─────│ Favorites   │    │ created_at  │    │
│  │ episode_id  │     │             │    │ updated_at  │    │
│  │ watch_time  │     │ id (PK)     │    └─────────────┘    │
│  │ duration    │     │ user_id (FK)│                      │
│  │ completed   │     │ movie_id(FK)│    ┌─────────────┐    │
│  │ watched_at  │     │ created_at  │    │   Actors    │    │
│  └─────────────┘     └─────────────┘    │             │    │
│                                         │ id (PK)     │    │
│  ┌─────────────┐     ┌─────────────┐    │ name        │    │
│  │Custom Lists │     │  Directors  │    │ bio         │    │
│  │             │     │             │    │ avatar_url  │    │
│  │ id (PK)     │     │ id (PK)     │    │ birth_date  │    │
│  │ user_id (FK)│     │ name        │    │ nationality │    │
│  │ name        │     │ bio         │    │ created_at  │    │
│  │ description │     │ avatar_url  │    │ updated_at  │    │
│  │ is_public   │     │ birth_date  │    └─────────────┘    │
│  │ created_at  │     │ nationality │                      │
│  │ updated_at  │     │ created_at  │    ┌─────────────┐    │
│  └─────────────┘     │ updated_at  │    │  Comments   │    │
│                      └─────────────┘    │             │    │
│                                         │ id (PK)     │    │
│                                         │ user_id (FK)│    │
│                                         │ movie_id(FK)│    │
│                                         │ content     │    │
│                                         │ rating      │    │
│                                         │ created_at  │    │
│                                         │ updated_at  │    │
│                                         └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 🔗 Key Relationships
- **Users** can have multiple **Favorites**, **Watch History**, and **Custom Lists**
- **Movies** can have multiple **Episodes** (for series)
- **Movies** are linked to **Genres**, **Actors**, and **Directors** through junction tables
- **Comments** belong to **Users** and **Movies**

## 📱 API Documentation

### 🌐 REST API Overview

#### Authentication Endpoints
```http
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
POST   /api/auth/refresh       # Refresh JWT token
POST   /api/auth/logout        # User logout
POST   /api/auth/forgot        # Password reset request
POST   /api/auth/reset         # Password reset confirmation
```

#### Movie & Series Endpoints
```http
GET    /api/movies             # List movies (pagination, filters)
GET    /api/movies/:slug       # Get movie details
GET    /api/movies/search      # Search movies
POST   /api/movies             # Create movie (admin)
PUT    /api/movies/:id         # Update movie (admin)
DELETE /api/movies/:id         # Delete movie (admin)

GET    /api/genres             # List genres
GET    /api/actors             # List actors
GET    /api/directors          # List directors
```

#### User Interaction Endpoints
```http
GET    /api/favorites          # Get user favorites
POST   /api/favorites          # Add to favorites
DELETE /api/favorites/:id      # Remove from favorites

GET    /api/watch-history      # Get watch history
POST   /api/watch-history      # Record watch progress
PUT    /api/watch-history/:id  # Update watch progress

GET    /api/custom-lists       # Get user's custom lists
POST   /api/custom-lists       # Create custom list
PUT    /api/custom-lists/:id   # Update custom list
DELETE /api/custom-lists/:id   # Delete custom list
```

#### Admin Endpoints
```http
GET    /api/admin/users        # List all users
GET    /api/admin/analytics    # Platform analytics
POST   /api/admin/import       # Import from external APIs
GET    /api/admin/logs         # System logs
```

### 📊 API Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🔐 Security

### 🛡️ Security Measures Implemented

#### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: User and Admin roles
- **Session Management**: Token expiration and refresh

#### Data Protection
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Cross-origin request control
- **Rate Limiting**: API request throttling
- **Helmet.js**: Security headers

#### File Upload Security
- **File Type Validation**: Allowed extensions only
- **File Size Limits**: Configurable upload limits
- **Path Traversal Protection**: Secure file handling
- **Virus Scanning**: Optional integration support

### 🔒 Environment Security
```bash
# Security checklist
✅ Environment variables for secrets
✅ HTTPS in production
✅ Database connection encryption
✅ Regular security updates
✅ Error message sanitization
✅ Logging and monitoring
```

## 🚀 Deployment

### 🐳 Docker Deployment (Recommended)

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://localhost:3001

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=your-db-host
    depends_on:
      - database

  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - SA_PASSWORD=YourStrongPassword!
      - ACCEPT_EULA=Y
    volumes:
      - db_data:/var/opt/mssql

volumes:
  db_data:
```

### 🛠️ Docker Troubleshooting

- Open the site at: http://localhost:8080 (not 5173)
- Run docker from the folder containing `phimhub/docker-compose.yml`
- Wait for `db-seed` to finish; backend starts after seeding
- Check status: `docker compose ps`
- View logs: `docker compose logs -f frontend backend`
- Ensure ports 8080 and 3001 are free (no conflicts)
- If frontend shows blank, rebuild: `docker compose build --no-cache` then `docker compose up -d`
- If CORS errors appear, ensure backend allowed origin http://localhost:8080 (already configured)

#### Deployment Commands
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### ☁️ Cloud Platform Deployment

#### AWS Deployment
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS ECS or Elastic Beanstalk
- **Database**: AWS RDS SQL Server
- **File Storage**: AWS S3
- **CDN**: CloudFront for media delivery

#### Azure Deployment
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service
- **Database**: Azure SQL Database
- **File Storage**: Azure Blob Storage
- **CDN**: Azure CDN

### 📊 Performance Optimization

#### Backend Optimizations
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient DB connections
- **Caching**: Redis for frequent queries
- **Compression**: Gzip response compression
- **Load Balancing**: Multiple server instances

#### Frontend Optimizations
- **Code Splitting**: Lazy loading components
- **Image Optimization**: WebP format, responsive images
- **Bundle Analysis**: Webpack bundle optimization
- **Service Workers**: Offline functionality
- **CDN Integration**: Static asset delivery

## 🧪 Testing

### 🔬 Testing Strategy

#### Backend Testing
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

#### Frontend Testing
```bash
# Component tests
npm run test

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual
```

### 📝 Test Coverage Goals
- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical API endpoints
- **E2E Tests**: Main user flows
- **Performance Tests**: Load testing

## 🤝 Contributing

### 🔄 Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/phimhub.git
   cd phimhub
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Development Setup**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Start development servers
   npm run dev
   ```

4. **Code Quality**
   ```bash
   # Lint code
   npm run lint
   
   # Format code
   npm run format
   
   # Run tests
   npm run test
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

6. **Create Pull Request**
   - Describe changes thoroughly
   - Include screenshots if UI changes
   - Ensure all tests pass
   - Request code review

### 📋 Coding Standards

#### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Conventional Commits**: Semantic commit messages

#### Best Practices
- **Clean Code**: Readable, maintainable code
- **SOLID Principles**: Object-oriented design
- **DRY**: Don't repeat yourself
- **Testing**: Test-driven development
- **Documentation**: Comprehensive code comments

## 📄 License

### MIT License

```
Copyright (c) 2024 PhimHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support & Community

### 🆘 Getting Help

- **📚 Documentation**: Check this README and code comments
- **🐛 Bug Reports**: Create detailed GitHub issues
- **💡 Feature Requests**: Submit enhancement proposals
- **💬 Discussions**: Join GitHub Discussions
- **📧 Email Support**: support@localhost

### 🌟 Acknowledgments

- **React Team** - Amazing frontend framework
- **Microsoft** - SQL Server and TypeScript
- **TMDB** - Movie database API
- **PhimAPI** - Vietnamese movie data
- **Open Source Community** - All the great libraries used

### 🚀 Roadmap

#### Upcoming Features
- [ ] **Mobile Applications** - React Native apps
- [ ] **Real-time Features** - WebSocket integration
- [ ] **AI Recommendations** - Machine learning suggestions
- [ ] **Social Features** - User reviews and ratings
- [ ] **Multi-language Support** - Internationalization
- [ ] **Analytics Dashboard** - Advanced user insights
- [ ] **Content Moderation** - Automated content filtering
- [ ] **Payment Integration** - Premium subscriptions

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[🏠 Homepage](http://localhost:8080) • [📖 Documentation](./README.md) • [🐛 Report Bug](https://github.com/phimhub/phimhub/issues) • [✨ Request Feature](https://github.com/phimhub/phimhub/issues)

Made with ❤️ by the PhimHub Team

</div>
