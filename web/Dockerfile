FROM oven/bun:1-alpine AS build
WORKDIR /app

RUN wget -qO /usr/local/bin/pnpm \
    https://github.com/pnpm/pnpm/releases/download/v10.18.3/pnpm-linuxstatic-x64 \
    && chmod +x /usr/local/bin/pnpm

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter portfolio-web...

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY shared/ ./shared/
COPY web/ ./web/
RUN pnpm --filter portfolio-web build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/web/dist ./dist

ENV HOST=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "dist/server/entry.mjs"]
