# syntax=docker/dockerfile:1.7

# Stage 1: Prune the monorepo to the frontend workspace
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY . .
RUN npm install --global turbo@2.11.10 --no-fund --no-audit
RUN turbo prune --scope=@drives/drives-ui --docker

# Stage 2: Install workspace dependencies
FROM node:24-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Stage 3: Build the Next.js standalone output
FROM installer AS builder
ENV NEXT_TELEMETRY_DISABLED=1 \
    # Build-time placeholders only. `src/utils/config` validates these while
    # collecting page data; real values are supplied by the runtime container.
    DRIVES_FRONTEND_CERBOS_URL=http://localhost:3592 \
    DRIVES_FRONTEND_API_URL=http://localhost:5000/api/v1 \
    DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID=build-placeholder \
    DRIVES_FRONTEND_KEYCLOAK_ISSUER=http://localhost:8080/realms/build \
    NEXTAUTH_URL=http://localhost:3000 \
    DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET=build-placeholder \
    NEXTAUTH_SECRET=build-placeholder
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@drives/drives-ui

# Stage 4: Production runner
FROM node:24-alpine AS runner

ARG UID=1010
ARG GID=1010
ARG PORT=3000

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT} \
    HOSTNAME=0.0.0.0

WORKDIR /app

RUN addgroup -g "${GID}" -S nodejs && \
    adduser -S -u "${UID}" -G nodejs nextjs

# Next's standalone output is rooted at the repository root (see
# next.config.mjs), so the server entrypoint lives under drives-ui/.
COPY --from=builder --chown=nextjs:nodejs /app/drives-ui/public ./drives-ui/public
COPY --from=builder --chown=nextjs:nodejs /app/drives-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/drives-ui/.next/static ./drives-ui/.next/static

USER nextjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "drives-ui/server.js"]
