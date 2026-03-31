FROM node:20-alpine AS build

WORKDIR /app

# better-sqlite3 requires native compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
