FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY shared/ ./shared/
COPY admin/package.json admin/package-lock.json* ./admin/
RUN cd admin && bun install --frozen-lockfile

ARG VITE_API_URL
ARG VITE_SITE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

COPY admin/ ./admin/
RUN cd admin && bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=build /app/admin/build ./build
COPY --from=build /app/admin/node_modules ./node_modules
COPY --from=build /app/admin/package.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "build/index.js"]
