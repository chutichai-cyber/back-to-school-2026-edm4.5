FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
ENV NEXT_TELEMETRY_DISABLED=1

# ── build stage ───────────────────────────────────────────────────────────────
# Install and build in one stage so pnpm's virtual store symlinks stay intact.
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json     ./packages/shared/
COPY apps/frontend/package.json       ./apps/frontend/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/shared  ./packages/shared
COPY apps/frontend    ./apps/frontend

ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

WORKDIR /app/apps/frontend
# public/ is optional in Next.js but the runner COPY expects it to exist
RUN mkdir -p public
RUN pnpm build

# ── runner stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output mirrors the monorepo tree under .next/standalone
COPY --from=builder /app/apps/frontend/.next/standalone      ./
COPY --from=builder /app/apps/frontend/.next/static          ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public                ./apps/frontend/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/frontend/server.js"]
