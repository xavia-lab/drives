# Drives

**Drives** is a self-hosted inventory and lifecycle-management application for storage hardware. It replaces spreadsheets and markdown notes with a structured system for tracking physical drives, servers, racks, storage pools, virtual guests, warranty claims, and the events that happen to them over time.

The project is a pnpm + Turborepo monorepo with a NestJS API, a Next.js/Refine frontend, PostgreSQL, Cerbos authorization policies, and optional Valkey caching.

> For deeper implementation notes, see [`AGENTS.md`](./AGENTS.md).

## Features

- **Drive inventory** — manufacturer, model, serial number, capacity, form factor, interface, purchase details, warranty dates, cost, and currency.
- **Lifecycle tracking** — append-only events for acquisition, provisioning, degradation, failure, RMA, retirement, scrap, loss, inspection, and notes. Current state is derived from the newest event.
- **Locations** — append-only datacenter history per drive, including relocations and an "unassigned" state.
- **Server and slot management** — racks, physical servers, CPUs, server slots, and drive-to-slot assignments with mount/unmount history.
- **Virtual servers** — VMs and containers with host capacity checks, vCPU allocation, and hardware passthrough slots.
- **Storage pools** — pool types, encryption state, and import/export host history.
- **Warranty and RMA** — warranty claims with independent tracking timelines, replacement-drive links, and derived claim status.
- **Media attachments** — photos, invoices, certificates, and documents attached to drives, deduplicated by content hash.
- **Dashboards** — fleet distribution, lifecycle health, slot utilization, warranty watchlist, RMA pipeline, capital/age analysis, datacenter health, and recent activity.
- **Guided workflows** — drive acquisition, relocation, allocation, media management, and warranty claim creation/progression.
- **Role-based access** — `admin`, `user`, and `viewer` roles enforced by Cerbos and mirrored in the UI.
- **Background tasks** — scheduled exchange-rate sync, exchange-rate housekeeping, content-store cleanup, and content-store garbage collection, with run history in the UI.

## Tech stack

| Layer | Technology |
| --- | --- |
| Monorepo | pnpm workspaces, Turborepo |
| API | NestJS 12, Sequelize, PostgreSQL |
| Frontend | Next.js 16, React 19, Refine, Ant Design 5 |
| Authorization | Cerbos policies |
| Authentication | Keycloak / NextAuth |
| Cache | Valkey (Redis-compatible) |
| File storage | S3-compatible storage or local filesystem |
| Tests | Vitest everywhere |

## Repository layout

```text
.
├── drives-server/   # NestJS API, Sequelize models, migrations, seeders
├── drives-ui/       # Next.js + Refine frontend
├── drives-policy/   # Cerbos resource policies (YAML)
├── api-tests/       # Bruno collection for manual API checks
├── compose.yaml     # Local Postgres, Valkey, Adminer, Cerbos
└── AGENTS.md        # Detailed architecture and maintenance notes
```

## Requirements

- Node.js **24** (pinned in `.node-version`)
- pnpm **11.14.0** (pinned via `packageManager`)
- Docker with Compose, for local PostgreSQL/Valkey/Cerbos

```bash
node --version   # v24.x
pnpm --version   # 11.14.x
```

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

The real `.env` files are gitignored. For local development, create:

- A **root `.env`** for Docker Compose.
- **`drives-server/.env`** for the API.
- **`drives-ui/.env.local`** for the frontend.

Minimal server configuration:

```dotenv
NODE_ENV=development
DRIVES_BACKEND_DATABASE_DIALECT=postgres
DRIVES_BACKEND_DATABASE_HOST=localhost
DRIVES_BACKEND_DATABASE_PORT=5432
DRIVES_BACKEND_DATABASE_NAME=test
DRIVES_BACKEND_DATABASE_USERNAME=test
DRIVES_BACKEND_DATABASE_PASSWORD=change-me
DRIVES_BACKEND_PORT=5000
DRIVES_BACKEND_CERBOS_URL=localhost:3593
DRIVES_BACKEND_AUTH_ENABLED=false
```

Minimal frontend configuration:

```dotenv
DRIVES_FRONTEND_API_URL=http://localhost:5000/api/v1
DRIVES_FRONTEND_CERBOS_URL=http://localhost:3592
DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID=your-client-id
DRIVES_FRONTEND_KEYCLOAK_ISSUER=https://your-keycloak/realms/your-realm
DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=replace-with-a-secret
NEXTAUTH_URL=http://localhost:3000
```

Root `.env` values are consumed by `compose.yaml` (for example `DRIVES_BACKEND_DATABASE_*`, `CERBOS_ALLOWED_ORIGIN`, and Cerbos admin credentials).

Optional services are configured with `DRIVES_BACKEND_*` variables: Valkey caching, exchange-rate syncing, and local/S3 content storage. See `drives-server/src/config/` for the full list.

### 3. Start local infrastructure

```bash
docker compose up -d postgres valkey adminer policy
```

Local services:

| Service | URL / port |
| --- | --- |
| PostgreSQL | `localhost:5432` |
| Valkey | `localhost:6379` |
| Adminer | <http://localhost:8080> |
| Cerbos HTTP / gRPC | `localhost:3592` / `localhost:3593` |

### 4. Prepare the database

```bash
pnpm --filter @drives/drives-server migration:run
pnpm --filter @drives/drives-server seed:run
```

For a clean, reproducible local dataset:

```bash
pnpm --filter @drives/drives-server seed:test:reset
```

### 5. Run the apps

Start both apps from the repository root:

```bash
pnpm dev
```

Or run them independently:

```bash
pnpm --filter @drives/drives-server start:dev
pnpm --filter @drives/drives-ui start:dev
```

Open:

- UI: <http://localhost:3000>
- API: <http://localhost:5000/api/v1>
- Swagger (development only): <http://localhost:5000/api/docs>
- Health: <http://localhost:5000/health>
- System status: <http://localhost:5000/system/status>

> The UI uses `refine dev`, not `next dev`.

## Common commands

Run from the repository root:

```bash
pnpm install                    # install dependencies
pnpm dev                        # run all dev servers
pnpm turbo run build            # build all workspaces
pnpm turbo run lint             # lint all workspaces
pnpm turbo run test             # run all tests
pnpm turbo run format           # format all workspaces
```

Target one workspace:

```bash
pnpm --filter @drives/drives-server test
pnpm --filter @drives/drives-server exec vitest run src/modules/physical-drive/physical-drive.service.spec.ts
pnpm --filter @drives/drives-ui test
```

Database commands:

```bash
pnpm --filter @drives/drives-server migration:run
pnpm --filter @drives/drives-server migration:undo
pnpm --filter @drives/drives-server seed:run
pnpm --filter @drives/drives-server seed:test:reset
pnpm --filter @drives/drives-server exchange-rate:sync
```

## API and authorization

- API routes are prefixed with `/api/v1`.
- IDs are UUIDv7 values.
- List endpoints support pagination, sorting, and structured `filters` parameters.
- Authentication is handled by Keycloak; `DRIVES_BACKEND_AUTH_ENABLED=false` attaches a local mock user for development.
- Cerbos policies live in [`drives-policy/policies`](./drives-policy/policies).
- Roles:
  - `admin` — full management, reference data, tasks, audit logs, and users.
  - `user` — read access plus guided workflows; no direct create/edit/delete.
  - `viewer` — read-only, including dashboards and inventory screens.

Public endpoints include health checks, system status/version, file downloads, and managed-resource metadata. The UI system health page is intentionally public.

## Development notes

- Tests use **Vitest** (not Jest). Server tests run against in-memory SQLite when `NODE_ENV=test`.
- Server migrations and seeders use `sequelize-cli`; filenames use `YYYYMMDDHHMMSS-...` and are spaced 1000 seconds apart.
- Cerbos reads policies from `drives-policy/policies/`.
- The UI uses a flat ESLint config (`drives-ui/eslint.config.mjs`); do not use the removed `next lint` command.
- Content attachments are content-addressed and deduplicated. The local provider writes under `data/content-store`; production can use S3-compatible storage.

## CI

GitHub Actions runs, in order:

```bash
pnpm turbo run lint
pnpm turbo run build
pnpm turbo run test
```

The workflow is defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).
