# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS build
WORKDIR /app

RUN apk add --no-cache vips-dev python3 make g++

RUN wget -qO /usr/local/bin/pnpm \
    https://github.com/pnpm/pnpm/releases/download/v10.18.3/pnpm-linuxstatic-x64 \
    && chmod +x /usr/local/bin/pnpm

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-server...

COPY shared/ ./shared/
COPY server/ ./server/

FROM oven/bun:1-alpine
WORKDIR /app

RUN apk add --no-cache vips

# Runs as the image's built-in `bun` user (uid/gid 1000). Host bind mounts for
# data/ and uploads/ must be owned by 1000:1000 (see docs/deployment.md).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
RUN mkdir -p server/data server/uploads && chown -R bun:bun server/data server/uploads

USER bun

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["bun", "run", "server/src/index.ts"]
