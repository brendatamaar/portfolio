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

WORKDIR /app

COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/server/src/index.js"]
