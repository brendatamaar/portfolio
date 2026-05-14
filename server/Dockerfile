FROM oven/bun:1-alpine AS build

WORKDIR /app

RUN apk add --no-cache vips-dev python3 make g++

COPY shared/ ./shared/
COPY server/package.json server/bun.lockb* ./server/
RUN cd server && bun install --production

COPY server/ ./server/

FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache vips

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["bun", "run", "server/src/index.ts"]
