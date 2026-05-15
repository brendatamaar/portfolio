FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY shared/ ./shared/
COPY web/package.json web/package-lock.json* ./web/
RUN cd web && bun install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY web/ ./web/
RUN cd web && bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=build /app/web/dist ./dist
COPY --from=build /app/web/node_modules ./node_modules

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "dist/server/entry.mjs"]
