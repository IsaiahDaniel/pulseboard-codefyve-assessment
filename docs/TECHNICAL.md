# PulseBoard — Technical Decisions

**Candidate:** Isaiah Daniel  
**Assessment:** Codefyve — Project & Task Management Platform  
**Brief:** `docs/Practical_Engineering_Assessment.docx`

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| API | NestJS (TypeScript) | Clear modules, DI, guards/pipes, Swagger — maintainable as features grow |
| DB | MongoDB + Mongoose | Flexible project/task docs + embedded membership; indexed queries for search/list |
| Auth | JWT (Bearer) + bcrypt | Stateless API; project membership for AuthZ |
| Web | Next.js App Router | Thin demo of Scenarios A–C against the real API |
| Containers | Docker Compose | Reproducible local deploy |
| Orchestration | Kubernetes manifests | Path to multi-replica, HPA, probes — without requiring a live prod cluster |

## Domain & scenarios

| Scenario | Implementation |
|----------|----------------|
| A — Project creation | `POST /projects`; creator becomes `owner` in `members[]` |
| B — Task assignment | `POST /projects/:id/tasks` with `assigneeId`, `priority`, `dueDate`; status workflow |
| C — Project monitoring | `GET /projects/:id/progress` + dashboard; member list on project |
| D — Growing workload | Paginated list/search (`q`, `page`, `limit`); indexes on project members & task status |

## Authorization

Every project/task read/write calls `assertMembership` with a minimum role (`member` / `admin` / `owner`). Cross-project IDOR is rejected with `403`. Invalid IDs → `400`/`404`. Shared `AppErrorService` keeps error shape consistent.

## API highlights

- Auth: register/login/me (+ reset/verify scaffold)
- Projects: CRUD-ish + invite member by email
- Tasks: CRUD + status/priority/assignee/dueDate + search/pagination
- `GET /dashboard` — org-level activity for the signed-in user
- `GET /projects/:id/progress` — completion, outstanding, status breakdown
- Swagger: `/docs`

## Data reliability

- Validation pipe: whitelist + forbid non-whitelisted
- Membership checked before mutations
- Mongo indexes: `ownerId`, `members.userId`, `projectId+status`, `projectId+assigneeId`
- Schema is document-oriented; for very large teams, membership would move to a join collection (noted trade-off)

## Search & navigation

- Projects: `GET /projects?q=&page=&limit=`
- Tasks: `GET /projects/:id/tasks?q=&status=&assigneeId=&page=&limit=`
- UI exposes project/task search and dashboard cards

## Infrastructure & deployment

1. **Local Compose:** `docker compose up --build` (mongo + api + web)
2. **Kubernetes:** `infra/k8s/*` — namespace, mongo+PVC, api (2 replicas + HPA), web, health probes, Secret for JWT
3. **Scale:** HPA on API CPU; more replicas behind Service; DB → managed Mongo/Atlas under load
4. **Failure:** readiness/liveness; multi-replica; restart policy default
5. **Change:** env/Secret driven config; blue/green or rolling updates on Deployments

Mongo has no SQL migrations; indexes are declared on schemas and created by Mongoose on boot. For SQL ports, TypeORM/Prisma migrations would replace this step.

## Testing

```bash
cd apps/api && npm test
```

Unit coverage on domain enums / membership ranks. Manual demo: register → project → invite → assign task → cycle status → dashboard/progress. Next: supertest e2e against ephemeral Mongo.

## Trade-offs

- Embedded `members[]` = simple reads; less ideal for huge orgs — acceptable for this slice, with a clear migration path
- Demo UI is thin by design; engineering judgment lives in AuthZ, pagination, and deploy artifacts
- Redis/outbox/observability called out as growth steps, not piled into the first cut
