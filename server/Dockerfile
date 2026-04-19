FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy shared module (rootDir is repo root, so tsc compiles shared/ into dist/shared/)
COPY shared/ ./shared/

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/
RUN cd server && npm run build

FROM node:20-alpine

RUN apk add --no-cache python3 make g++

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

WORKDIR /app

COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/node_modules ./node_modules

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/server/src/index.js"]
