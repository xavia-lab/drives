# Stage 1: Prune the monorepo
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Enable Corepack to dynamically read the pnpm version from package.json
RUN corepack enable
COPY . .
# Run turbo via npx to match your workspace engines
RUN npx turbo prune drives-ui --docker

# Stage 2: Install dependencies
FROM node:24-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable

# Copy the pruned pnpm workspace structure and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install utilizing pnpm's strict frozen lockfile mechanism
RUN pnpm install --frozen-lockfile

# Stage 3: Build the application
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable

COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

# Build the specific app using turbo via pnpm
RUN pnpm turbo run build --filter=drives-ui

# Stage 4: Production Runner
FROM node:24-alpine AS runner

# Define Build Arguments
ARG UID=1010
ARG GID=1010
ARG PORT=3000

WORKDIR /app

# Set Environment Variables
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"

# Create the user and group using the provided ARGs
RUN addgroup -g ${GID} -S nodejs && \
    adduser -S -u ${UID} -G nodejs nextjs

# Copy files with explicit ownership
# Note: Next.js standalone outputs a fully compiled Node server that includes its own minimal node_modules,
# completely bypassing any complex monorepo symlink lookup issues at runtime!
COPY --from=builder --chown=nextjs:nodejs /app/frontend/drives-ui/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/drives-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/drives-ui/.next/static ./frontend/drives-ui/.next/static

# --- Healthcheck ---
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

USER nextjs

EXPOSE ${PORT}

# Next.js standalone output creates a server.js in the root of the output
CMD ["node", "frontend/drives-ui/server.js"]
