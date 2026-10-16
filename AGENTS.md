# AGENTS.md

pnpm + Turborepo monorepo for a storage-drive inventory app. Workspaces (dirs != package names):

- `drives-server` → `@drives/drives-server` — NestJS 12 API, Sequelize/Postgres
- `drives-ui` → `@drives/drives-ui` — Next.js 16 + Refine + Ant Design
- `drives-policy` → `@drives/policy` — Cerbos authorization policies (YAML, no build)

Node 24 / pnpm 11.14.0 are pinned (`packageManager`, `.node-version`). Use `pnpm`, never `npm`; the root `README.md` is stale (`server` dir / npm instructions).

## Commands (run from root)

```bash
pnpm install
pnpm turbo run <task>                      # dev | build | lint | format | test
pnpm --filter @drives/drives-server test   # one workspace
pnpm --filter @drives/drives-server exec vitest run src/modules/physical-drive/physical-drive.service.spec.ts   # one test file
pnpm --filter @drives/drives-server start:dev   # nest start --watch
pnpm --filter @drives/drives-ui start:dev       # refine dev (not `next dev`)
```

CI (`.github/workflows/ci.yml`) runs `lint --filter='!@drives/drives-ui'` → `build` → `test`. UI lint is excluded because it uses `next lint`, which Next 16 removed — don't rely on it.

Tests use **Vitest everywhere** (not Jest). `drives-server/test/jest-e2e.json` is stale. Server Vitest needs `unplugin-swc` (decorators) — keep the plugin when editing `vitest.config.mts`. Server specs import from `vitest` explicitly; UI uses jsdom + `src/test/setup.ts`.

## Backend (`drives-server`)

- Global route prefix `api` + URI versioning default `v1` → `/api/v1/...`. Exceptions: `/system/version`, `/system/status`, `/health*` (`VERSION_NEUTRAL`). Swagger only in `development` at `/api/docs`.
- IDs are **UUIDv7** (DB default `uuidv7()`); use `ParseUUIDPipe({ version: '7' })` and `@IsUUID('7')`.
- Modules live in `src/modules/<resource>` with `controller` / `service` / `dto` / `entities`. Register new modules in `src/app.module.ts`.
- Controllers are guarded by `@UseGuards(KeycloakAuthGuard, CerbosGuard)`, both `@Public()` and `@CheckPolicy(...)` decorators control access. Global `APP_GUARD` is `KeycloakAuthGuard`. Both guards short-circuit when `DRIVES_BACKEND_AUTH_ENABLED=false` (set in local `.env`), which is why almost every route carries `@Public()`.
- Server tests run with `NODE_ENV=test`, so `database.config.ts` switches to in-memory sqlite — unit tests need no Postgres. Specs mock models with `getModelToken`.
- Responses: annotate controllers with `@Serialize(SomeResponseDto)`; DTOs must use `@Expose()` (extraneous fields are stripped). List endpoints return `PaginatedResponse` `{ data, meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }`.
- Entities extend `shared/entities/base.model.ts` (UUIDv7 `id` + auto-increment `displayKey`), use `underscored: true`.
- Query params: `pageNumber`, `pageSize`, `sortField`, `sortOrder`, `filterField`, `filterOperator`, `filterValue` (see `PaginationQueryDto`). `@Public()` GET-list/create/update/delete is common.

### Database

- Dev config has `synchronize: true` (auto-syncs schema); prod is `synchronize: false` and relies on migrations.
- Migrations/seeders: `src/database/migrations|seeders`, run via sequelize-cli with `node --env-file=.env`:
  `pnpm --filter @drives/drives-server migration:run`, `migration:generate --name <name>`, `seed:run`. Also `db:sync` (`scripts/sync-database.ts`, dev-only schema sync).
- Local infra via `docker compose up` (`compose.yaml`): Postgres 18 on 5432, Adminer on 8080, Cerbos on 3592 (HTTP) / 3593 (gRPC).
- Cerbos reads policies from `drives-policy/policies/` (`cerbos.yaml`, mounted in compose). Add a `.yaml` policy there for a new protected resource.

## Frontend (`drives-ui`)

- `src/proxy.ts` is Next 16's renamed middleware: rewrites `/api/proxy/*` to `DRIVES_FRONTEND_API_URL`, serves `/api/health`, and resolves `/qrl/*` QR links via the backend.
- Data access goes through `src/providers/data-provider` → `/api/proxy` (auth via NextAuth session token; auto-retries on 401/403). REST resources map 1:1 to backend routes.
- Path alias `@*` → `src/*` (plus `@allocations/*`, `@products/*`, `@purchase-orders/*`).
- Formatting: UI uses default Prettier (double quotes); server has `.prettierrc` with `singleQuote`/`trailingComma: all`. Run `turbo run format` or per-package `format`.

## Env & deployment

- Env prefixes: backend `DRIVES_BACKEND_*`, frontend `DRIVES_FRONTEND_*`. Real `.env` files are gitignored; `drives-server/.env` and `drives-ui/.env` are local-only. `drives-ui/.env.development` / `.env.production` are tracked but are placeholders for the CI build.
- `build:image` package scripts call `task` (go-task) but **no Taskfile exists in this repo** — images are built directly by `deploy.yml` Docker Buildx on `master` pushes and `v*` tags. Don't run `pnpm build:image` locally.
- `api-tests/` is a Bruno collection for manual API checks; no npm scripts.
