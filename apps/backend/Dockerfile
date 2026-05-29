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

# prisma generate runs at container start (needs no DB connection, only schema).
# prisma migrate deploy then applies pending migrations before the server starts.
CMD ["sh", "-c", \
  "./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma \
   && ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma \
   && bun prisma/seed.js \
   && bun run src/index.js"]
