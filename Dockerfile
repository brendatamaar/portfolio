# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Stage 2: Run with Bun
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

COPY --from=build /app/server.ts .
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
