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
- Query params: `pageNumber`, `pageSize`, `sortField`, `sortOrder`, `filterField`, `filterOperator`, `filterValue` (see `PaginationQueryDto`). `filterOperator` accepts `eq|ne|gt|gte|lt|lte|in|like|between` (`select.operators.builder.ts`; `like` is a case-sensitive `%value%` match, unknown operators fall back to it). `pageSize` has no max. `@Public()` GET-list/create/update/delete is common.
- Binary memory-unit conversion lives in `src/lib/utils/human.readable.bytes.converter.ts` (`toBytes`/`fromBytes`/`isBinaryUnit`); RAM is stored as a value + binary unit and mirrored into a denormalised `absolute_*memory` BIGINT via a `@BeforeSave` hook (the getter coerces back to `number` because `pg` returns BIGINT as a string).

### Physical servers & server slots

- `PhysicalServer` (`physical_servers`): `hostname` (unique), `memoryValue` + `memoryUnit` (`MiB|GiB|TiB`, default `GiB`), denormalised `absoluteMemory` (BIGINT, `@BeforeSave`/`toBytes`), `cpuCount`, `rackUnitPosition` (unique per rack), FKs `operatingSystemId`, `cpuModelId`, `rackId`. `@HasMany ServerSlot`.
- `ServerSlot` now lives inside this module (`entities/server-slot.entity.ts`, table `server_slots`): `slotLabel`, optional `pcieBusAddress`, FK `serverId`, FK `supportedInterfaceId`; composite unique `(server_id, slot_label)` (`server_slots_label_unique_idx`). It has **no REST resource of its own** — slots are created/updated only through the owning `physical-servers` payload via `ServerSlotService.syncForServer`. The standalone `server-slot` module/controller/DTOs were deleted.
- `PhysicalServer` list/create/update eager-load `slots` (with `supportedInterfaceId`/`pcieBusAddress`) so consumers get the slot tree in one request.
- `CpuModel` (`cpu_models`) holds `physicalCores` and `threads` (per socket); `PhysicalServer.cpuCount` is the socket count.

### Virtual servers (guests)

- Module `src/modules/virtual-server` — `VirtualServerController`/`VirtualServerService`/`dto`/`entities` plus the nested `PassthroughSlotService`. Registered in `app.module.ts`; `CpuModel` is in its `SequelizeModule.forFeature` list (needed for the vCPU-capacity include).
- `VirtualServer` (`virtual_servers`): `vmid` (nullable; partial unique `(host_server_id, vmid)` where `vmid IS NOT NULL` → `virtual_servers_vmid_unique_idx`), `hostname` (globally unique), `type` ENUM `VM|CONTAINER` (default `VM`), `allocatedVcpus`, `allocatedMemoryValue` DECIMAL(10,2) + `allocatedMemoryUnit` ENUM `MiB|GiB|TiB` (default `GiB`), denormalised `absoluteAllocatedMemory` (BIGINT, `@BeforeSave`/`toBytes`), `isActive` BOOLEAN default `true`, `notes`, FKs `hostServerId` (→ `PhysicalServer`, RESTRICT) and `operatingSystemId` (→ `OperatingSystem`, RESTRICT). Indexes `virtual_servers_host_server_idx`, `virtual_servers_operating_system_id_idx`.
- Reads (`findAll`/`findOne`) eager-load `PhysicalServer`, `OperatingSystem`, and the guest's passthrough slots (each with its `ServerSlot`) via `readIncludes`.
- create/update run inside a transaction and enforce two host-capacity rules (both throw `ConflictException`):
  - **Memory — aggregate, active guests only** (`assertWithinHostCapacity`): locks the host `PhysicalServer` row (`LOCK.UPDATE`) so concurrent writes on one host serialize, sums `absoluteAllocatedMemory` over the host's **active** guests (`isActive: true`, excluding the row being updated), and adds the requested bytes only when the guest being saved is active (create defaults to active; update uses `updateDto.isActive ?? existing.isActive`). The total must be ≤ host `absoluteMemory`. Inactive guests are powered off and reserve no RAM.
  - **vCPU — per-VM, NOT aggregate** (`assertWithinHostThreadCapacity`): a single guest's `allocatedVcpus` must be ≤ the host's total hardware threads = `cpuCount × cpuModel.threads`. Loads the host with `include: [CpuModel]`; the check is skipped when `totalThreads` is `0` (incomplete CPU data) so it never blocks on missing specs. Over-subscription **between** guests is intentionally allowed (e.g. two 64-vCPU guests on a 64-thread host).

### Passthrough slots

- Maps a host backplane slot (`server_slots`) through to a guest as hardware passthrough. Table `passthrough_slots` (migration `20261017150000-create-passthrough-slots.js`); entity `PassthroughSlot` (`entities/passthrough-slot.entity.ts`), service `PassthroughSlotService` (`passthrough-slot.service.ts`), request DTO `PassthroughSlotDto` (`dto/passthrough-slot.dto.ts`), response `PassthroughSlotResponseDto`. Naming deliberately dropped the earlier `VirtualServer`-prefixed classes and `virtual_server_passthrough_slots` table to match the `server-slot.*` convention.
- Columns `virtual_server_id` (FK → `virtual_servers`, ON DELETE CASCADE) and `server_slot_id` (FK → `server_slots`, ON DELETE CASCADE); index `passthrough_slots_virtual_server_id_idx` plus **unique** `passthrough_slots_server_slot_id_unique_idx` which enforces "one host slot → at most one guest" globally.
- **Not a standalone REST resource** — carried as the nested `passthroughSlots` array on virtual-server create/update. `PassthroughSlotService.syncForVirtualServer(virtualServerId, hostServerId, slots, transaction?)` reconciles the full desired set: rejects duplicate slot refs in the payload, verifies every slot belongs to the host, rejects slots already mapped to another guest, then deletes removed and inserts new mappings.
- **Guests of `type: CONTAINER` may not have passthrough slots.** `create`/`update` throw `BadRequestException` when a container is given a non-empty payload; converting a VM → CONTAINER clears the guest's existing mappings even when `passthroughSlots` is omitted. On host change, stale mappings are likewise cleared (an omitted payload during a host change is treated as "clear all").
- No Cerbos policy of its own (it is governed by the `virtual-servers` resource).

### Database

- Dev config has `synchronize: true` (auto-syncs schema); prod is `synchronize: false` and relies on migrations.
- Migrations/seeders: `src/database/migrations|seeders`, run via sequelize-cli with `node --env-file=.env`:
  `pnpm --filter @drives/drives-server migration:run`, `migration:generate --name <name>`, `seed:run`. Also `db:sync` (`scripts/sync-database.ts`, dev-only schema sync).
- **Test fixtures** live in `src/database/test-seeders/` (separate from production `seeders/`): `pnpm --filter @drives/drives-server seed:test` (`db:seed:all --seeders-path src/database/test-seeders`) and `seed:test:undo` (undoes by basename of every file in that dir). Files run in filename order: datacenters → cpu-models → storage-models → racks → physical-servers → physical-drives → server-slots (`…140600`) → virtual-servers (`…140700`) → passthrough-slots (`…140800`). `lib/lookups.js` exposes `idMap(queryInterface, table, keyColumn='name')` / `required(map, key, table)` to resolve FKs by business key; ids are deterministic UUIDv7-shaped values; `bulkInsert` bypasses model hooks so denormalised `absolute_*memory` columns must be set explicitly. sequelize-cli's loader is **non-recursive** (so `lib/` is safe) and `db:seed:undo --seed` matches by **basename**; `executed()` lists ALL executed seeders.
- Local infra via `docker compose up` (`compose.yaml`): Postgres 18 on 5432, Adminer on 8080, Cerbos on 3592 (HTTP) / 3593 (gRPC).
- Cerbos reads policies from `drives-policy/policies/` (`cerbos.yaml`, mounted in compose). Add a `.yaml` policy there for a new protected resource.

## Frontend (`drives-ui`)

- `src/proxy.ts` is Next 16's renamed middleware: rewrites `/api/proxy/*` to `DRIVES_FRONTEND_API_URL`, serves `/api/health`, and resolves `/qrl/*` QR links via the backend.
- Data access goes through `src/providers/data-provider` → `/api/proxy` (auth via NextAuth session token; auto-retries on 401/403). REST resources map 1:1 to backend routes.
- Reference-data dropdowns (countries, vendors, bus-protocols, currencies, …): use `@components/lookup-select` (`LookupSelect`) in forms and `@hooks/use-lookup-options` (`useLookupOptions`) in list-page filters/renders. Both fetch the resource's rows up front (one server page, default 100) and let Ant Design filter client-side. Avoid Refine's `useSelect` — its `pagination.mode` defaults to `"off"`, so the API falls back to `pageSize: 10` and typing never filters.
- Foreign-key columns/fields that have their own show page use `@components/linked-label` (`LinkedLabel`): pass `resource` + `value` (plus `options` to resolve the label, or an explicit `label`). It renders a `Typography.Link` opening `/{resource}/show/{value}` in a new tab with an `ExportOutlined` cue, falling back to `Loading...`/`-` when the value or label is unresolved. Used by the CPU-models, datacenters, interfaces, physical-drives, physical-servers, racks, storage-models, vendors, and virtual-servers list/show pages.
- Theme: `src/contexts/color-mode` holds both the light/dark `mode` and a user-selectable `colorPrimary` (`PRIMARY_COLOR_PRESETS`); both persist in `theme`/`primaryColor` cookies, are seeded on the server in `src/app/layout.tsx`, and are toggled from `src/components/header` (dark-mode `Switch` + color `Dropdown`). The sidebar/login title icon (`AppLogo` in `src/app/_refine_context.tsx`) is a `lucide-react` `HardDrive` tinted with the active `colorPrimary` via `theme.useToken()`, matching the `favicon.svg` drive glyph.
- Path alias `@*` → `src/*` (plus `@allocations/*`, `@products/*`, `@purchase-orders/*`).
- Formatting: UI uses default Prettier (double quotes); server has `.prettierrc` with `singleQuote`/`trailingComma: all`. Run `turbo run format` or per-package `format`.
- Virtual-servers form (`src/app/virtual-servers/_components/virtual-server-form.tsx`) demonstrates the guest conventions: it fetches `physical-servers` whole (with `slots`) to scope the passthrough editor, and `cpu-models` to derive the host's total threads (`cpuCount × threads`) and cap the Allocated vCPUs field; it clears passthrough rows on host change and hides the editor (showing a notice) for `type: CONTAINER`. Passthrough rows use `EditableProTable` — add an explicit `valueType: "option"` column, since it does not auto-generate one (while editing it is replaced by the built-in Save/Delete/Cancel actions).

## Env & deployment

- Env prefixes: backend `DRIVES_BACKEND_*`, frontend `DRIVES_FRONTEND_*`. Real `.env` files are gitignored; `drives-server/.env` and `drives-ui/.env` are local-only. `drives-ui/.env.development` / `.env.production` are tracked but are placeholders for the CI build.
- `build:image` package scripts call `task` (go-task) but **no Taskfile exists in this repo** — images are built directly by `deploy.yml` Docker Buildx on `master` pushes and `v*` tags. Don't run `pnpm build:image` locally.
- `api-tests/` is a Bruno collection for manual API checks; no npm scripts.
