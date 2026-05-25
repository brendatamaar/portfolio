# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS build
WORKDIR /app

RUN wget -qO /usr/local/bin/pnpm \
    https://github.com/pnpm/pnpm/releases/download/v10.18.3/pnpm-linuxstatic-x64 \
    && chmod +x /usr/local/bin/pnpm

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY admin/package.json ./admin/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-admin-new...

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY shared/ ./shared/
COPY admin/ ./admin/
RUN pnpm --filter portfolio-admin-new build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/admin/build ./build
COPY --from=build /app/admin/package.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "build/index.js"]
