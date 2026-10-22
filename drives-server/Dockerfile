# syntax=docker/dockerfile:1.7

# Stage 1: Prune the monorepo to the backend workspace
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY . .
RUN npm install --global turbo@2.11.10 --no-fund --no-audit
RUN turbo prune --scope=@drives/drives-server --docker

# Stage 2: Install workspace dependencies
FROM node:24-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Stage 3: Build the API and produce a production-only deployment
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@drives/drives-server
RUN pnpm --filter @drives/drives-server deploy --prod /prod

# Stage 4: Production runner
FROM node:24-alpine AS runner

ARG UID=1010
ARG GID=1010
ARG PORT=5000

ENV NODE_ENV=production \
    PORT=${PORT} \
    DRIVES_BACKEND_PORT=${PORT}

WORKDIR /app

RUN addgroup -g "${GID}" -S nodejs && \
    adduser -S -u "${UID}" -G nodejs nestjs

# `pnpm deploy` keeps production dependencies, compiled output, migrations and
# seeders together without shipping the workspace's dev dependencies.
COPY --from=builder --chown=nestjs:nodejs /prod ./
COPY --chown=nestjs:nodejs ./drives-server/docker-entrypoint.sh ./docker-entrypoint.sh

USER nestjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${DRIVES_BACKEND_PORT}/system/status" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
