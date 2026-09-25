# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS build
WORKDIR /app

RUN wget -qO /usr/local/bin/pnpm \
    https://github.com/pnpm/pnpm/releases/download/v10.18.3/pnpm-linuxstatic-x64 \
    && chmod +x /usr/local/bin/pnpm

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-web...

COPY shared/ ./shared/
COPY web/ ./web/
RUN pnpm --filter portfolio-web build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/web/dist ./dist

# API_INTERNAL_URL is read at runtime (set in docker-compose.yml)
ENV HOST=0.0.0.0
ENV NODE_ENV=production
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "dist/server/entry.mjs"]
