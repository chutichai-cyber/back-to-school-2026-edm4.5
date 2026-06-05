# ── install stage ─────────────────────────────────────────────────────────────
FROM node:20-slim AS install
RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml        ./
COPY packages/shared/package.json            ./packages/shared/
COPY apps/backend/package.json               ./apps/backend/
COPY apps/backend/prisma                     ./apps/backend/prisma

RUN pnpm install --ignore-scripts

# Generate Prisma client here while pnpm symlinks are intact.
# Running in the runner stage after COPY breaks the .pnpm virtual-store paths.
WORKDIR /app/apps/backend
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# ── runner ────────────────────────────────────────────────────────────────────
FROM oven/bun:1.1 AS runner
RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && ln -s /usr/local/bin/bun /usr/local/bin/node
WORKDIR /app

COPY --from=install /app/node_modules              ./node_modules
COPY --from=install /app/apps/backend/node_modules ./apps/backend/node_modules
COPY packages/shared/src                           ./packages/shared/src
COPY packages/shared/package.json                  ./packages/shared/package.json
COPY apps/backend/src                              ./apps/backend/src
COPY apps/backend/prisma                           ./apps/backend/prisma
COPY apps/backend/package.json                     ./apps/backend/package.json
COPY package.json                                  ./

WORKDIR /app/apps/backend
EXPOSE 4000
ENV NODE_ENV=production

CMD ["sh", "-c", \
  "./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss \
   && bun run src/index.js"]
