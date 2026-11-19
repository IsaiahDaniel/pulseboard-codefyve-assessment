# PulseBoard

Project & Task Management Platform — **Codefyve Tech Hub** Senior Lead Developer assessment (Isaiah Daniel).

Proof-of-capacity submission: NestJS API + MongoDB + Next.js demo UI + Docker Compose + technical decisions doc + automated tests.

## Quick start (local)

### Prerequisites

- Node.js 20+
- MongoDB 7 (or use Compose)

### 1. Database

```bash
docker compose up -d mongo
```

### 2. API

```bash
cd apps/api
cp .env.example .env   # if needed
npm install
npm run start:dev
```

- API: http://127.0.0.1:4200/api/v1  
- Swagger: http://127.0.0.1:4200/docs  
- Health: http://127.0.0.1:4200/api/v1/health  

### 3. Web demo

```bash
cd apps/web
cp .env.local.example .env.local  # or use committed .env.local
npm install
npm run dev
```

Open http://localhost:3000 — register, create a project, add/cycle tasks.

### Tests

```bash
cd apps/api && npm test
```

### Full stack via Docker

```bash
docker compose up --build
```

## Demo flow (for reviewers)

1. Register at the web UI (or `POST /api/v1/auth/register`)
2. Create a project
3. Add tasks; click status badges to cycle `todo → in_progress → done`
4. Optional: `POST /projects/:id/members` with another user’s email (Swagger)

## Repository layout

```
apps/api     NestJS API (auth, projects, tasks, dashboard, search)
apps/web     Next.js demo client (dashboard + scenarios A–C)
docs/        TECHNICAL.md + assessment brief
infra/k8s/   Kubernetes manifests (HPA, probes, PVC)
docker-compose.yml + Dockerfiles
```

## Brief coverage

| Requirement | Status |
|-------------|--------|
| Projects + tasks + assign + priorities | Yes |
| Dashboard / project progress | Yes (`/dashboard`, `/projects/:id/progress`) |
| Search + pagination | Yes (`q`, `page`, `limit`) |
| AuthZ (no cross-project access) | Yes (membership guards) |
| Containerized + K8s path | Yes (Compose + `infra/k8s`) |
| Tests + technical doc | Yes |


## Documentation

- [Technical decisions](./docs/TECHNICAL.md)
- Swagger UI when API is running: `/docs`

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/pulseboard` | API |
| `JWT_SECRET` | (dev default) | **Change in production** |
| `PORT` | `4200` | API |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:4200/api/v1` | Web |

## Status

Working vertical slice submitted as proof of capacity before the stated review window. Happy to extend to any items in the full assessment brief (PDF) during the technical review.
