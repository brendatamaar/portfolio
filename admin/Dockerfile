FROM node:20-alpine AS build

WORKDIR /app

# Copy shared module (admin imports @portfolio/shared → ../shared)
COPY shared/ ./shared/

COPY admin/package*.json ./admin/
RUN cd admin && npm install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY admin/ ./admin/
RUN cd admin && npm run build

FROM nginx:alpine
COPY --from=build /app/admin/dist /usr/share/nginx/html
EXPOSE 80
