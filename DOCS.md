# PhimHub Docs

This single document consolidates setup, troubleshooting, completion notes, and the test checklist.

---

## ✅ Docker Environment Setup - COMPLETE

The Docker environment has been completely configured for easy setup when cloning from GitHub. Here's what was implemented:

### Fixed Issues
1. Missing backend/.env - Created with proper Docker configuration
2. Database dependency issues - Added health checks and proper startup order
3. Missing database backup handling - Created minimal setup option for fresh clones
4. Environment variable mismatches - Aligned all configurations
5. No setup automation - Created automated setup scripts for Windows/Linux/macOS

### New Files Created
- backend/.env - Production environment for Docker containers
- backend/.env.example - Template for users to customize
- docker-compose.minimal.yml - Setup without database seeding
- setup-docker.bat - Windows automated setup script
- setup-docker.ps1 - PowerShell setup script (more robust)
- setup-docker.sh - Linux/macOS setup script
- validate-docker-setup.ps1 - Validation script
- DOCKER_SETUP.md - Complete setup guide
- DOCKER_TROUBLESHOOTING.md - Common issues and solutions

### Docker Improvements
- Added SQL Server health checks
- Fixed service dependencies
- Added profiles for optional database seeding
- Improved error handling and logging
- Created fallback minimal setup

### How To Use (For Anyone Cloning from GitHub)

Option 1: Automated Setup (Recommended)
- Windows PowerShell: `./setup-docker.ps1`
- Windows Command Prompt: `./setup-docker.bat`
- Linux/macOS: `chmod +x setup-docker.sh && ./setup-docker.sh`

Option 2: Manual Setup
- Without database backup: `docker compose -f docker-compose.minimal.yml up -d`
- With database backup (if you have db_moi1.bacpac):
  - Place db_moi1.bacpac in parent directory
  - `docker compose --profile with-seed up -d`

Option 3: Validate Setup First
- `./validate-docker-setup.ps1`

### Services After Setup
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- SQL Server: localhost:1433 (sa/PhimHub123!)

### Key Configuration Points

TMDB API Keys (Important!)
- The app needs TMDB API keys for movie data. Update `backend/.env`:
  - `TMDB_API_KEY=your-api-key-here`
  - `TMDB_READ_TOKEN=your-read-token-here`
- Get keys from: https://www.themoviedb.org/settings/api

JWT Security
- Change the JWT secret for production in `backend/.env`:
  - `JWT_SECRET=your-secure-random-string-here`

### What Happens When Someone Clones
1. Clone repository
2. Run setup script - Automatically creates necessary .env files
3. Script detects missing database - Uses minimal setup automatically
4. Docker builds containers - Creates clean environment
5. Services start - Frontend, backend, and database ready
6. User configures TMDB keys - App becomes fully functional

### Troubleshooting
1. Check troubleshooting section below
2. Run `./validate-docker-setup.ps1`
3. View logs: `docker compose logs -f`
4. Clean restart: `docker compose down -v && docker compose up -d`

### Success Indicators
- All containers show "running" status: `docker compose ps`
- Backend health check responds: http://localhost:3001/api/health
- Frontend loads: http://localhost:8080
- No critical errors in logs: `docker compose logs`

App is fully functional when:
- TMDB API keys are configured
- Movies load on the frontend
- User registration/login works
- Database operations succeed

### Files Safe to Commit
- backend/.env.example - Template (committed)
- backend/.env - Real config (gitignored)
- docker-compose.yml - Main setup (committed)
- setup-docker.* - Setup scripts (committed)
- db_moi1.bacpac - Database backup (gitignored)

### Next Steps
- Development, Testing, Production, Scaling readiness

---

## 🐳 Docker Setup Guide

This guide helps you set up PhimHub using Docker when cloning from GitHub.

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

### Quick Start

Automated Setup (Windows PowerShell): `./setup-docker.ps1`

Manual Setup
1. Clone and setup:
   - `git clone <repository-url>`
   - `cd PhimHub`
2. Start services:
   - Default setup (empty database): `docker compose up -d`
   - With seeding (if you have db_moi1.bacpac in parent directory): `docker compose --profile seed up -d`

### Configuration

Environment Variables
- Create/update `backend/.env` with TMDB API keys:
  - `TMDB_API_KEY=your-api-key-here`
  - `TMDB_READ_TOKEN=your-read-token-here`

### Services
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- SQL Server: localhost:1433 (Username: sa, Password: PhimHub123!)

### Common Commands
- View service status: `docker compose ps`
- View logs: `docker compose logs -f`
- View specific service logs: `docker compose logs -f backend|frontend`
- Stop services: `docker compose down`
- Stop and remove volumes: `docker compose down -v`
- Restart services: `docker compose restart`
- Rebuild and restart: `docker compose up --build -d`

### Troubleshooting (Quick)
- Services won't start: check version/logs, clean restart, `up -d`
- Port conflicts (3001, 8080, 1433): free ports or edit compose
- Build failures: `docker system prune -f`, rebuild without cache
- Database issues: SQL Server may take 1-2 minutes; check logs

### Database Seeding (Optional)
- Place `db_moi1.bacpac` in parent directory and start with profile `seed`

### What Happens
- Clone → Setup → Build → Start → Configure TMDB

---

## 🔧 Docker Troubleshooting Guide

Common issues and solutions when setting up PhimHub with Docker.

### Quick Fixes

Cannot connect to the Docker daemon
- Start Docker Desktop, wait for green tray icon, rerun setup

Port already in use errors
- Check ports: `netstat -ano | findstr :3001|:8080|:1433`
- Kill process: `taskkill /PID <PID> /F`
- Or change ports in docker-compose.yml

Services fail to start
- Clean restart: `docker compose down -v && docker compose up --build -d`
- Check logs: `docker compose logs -f`
- SQL Server may take 1-2 minutes initially

Database connection errors
- Check compose status and SQL Server logs
- Wait 2-3 minutes after first start

Build failures
- `docker system prune -a`
- `docker compose build --no-cache`
- Check disk space: `docker system df`

TMDB API errors
- Get keys from TMDB
- Add to backend/.env, restart backend

Frontend won't build
- Check Node version in container
- Rebuild without cache
- Check TypeScript errors in logs

Database seeding issues
- Ensure `../db_moi1.bacpac` exists
- Use minimal setup if not: `docker compose -f docker-compose.minimal.yml up -d`
- Check seed logs

### Environment Specific
- Windows with WSL2: ensure WSL2 integration, prefer WSL FS
- macOS Apple Silicon: try `--platform linux/amd64` if needed
- Linux permissions: make scripts executable; add user to docker group

### Advanced Debugging
- Logs: `docker logs <container>`
- Inspect: `docker inspect <container>`
- Interactive shell: `docker compose run --rm backend sh`
- Networks: `docker network ls` and inspect
- Connectivity: `docker compose exec backend ping sqlserver`
- Performance: `docker stats`, `docker system df`, `docker system prune -a`

---

## Test Manual Checklist - People Selection Modal

A) Backend API Tests
- Basic functionality: endpoints, response format, timing
- Pagination tests: page correctness, totals
- Search tests: diacritics, case-insensitive, special chars
- Backward compatibility: legacy endpoints

B) Frontend Modal Tests
- Modal open, loading, first page data, progress indicators
- Infinite scroll behavior and fallbacks
- Search behavior and reset
- UI/UX and performance

C) Database Tests
- Index performance, collation, JOIN correctness
- Unicode support and encoding

D) Integration Tests
- End-to-end add actor/director flows
- Error handling and close during loading

E) Performance Benchmarks
- Response times, memory usage, AbortController behavior

F) Browser Compatibility
- Modern browsers and mobile responsiveness

G) Security Tests
- API security, input validation

H) Accessibility Tests
- Keyboard navigation, screen reader support

Test Results Summary template and Notes retained from the original checklist.
