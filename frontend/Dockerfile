# syntax=docker/dockerfile:1.7
# Static SPA image: multi-stage build, nginx serves dist with SPA fallback,
# an unauthenticated /health endpoint for Compose/infra probes.
FROM node:22-alpine AS build
ARG VITE_API_URL
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Vite inlines VITE_API_URL at build time; empty ARG keeps the localhost default.
RUN VITE_API_URL="${VITE_API_URL}" npm run build

FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
# Templates are rendered by the base image's envsubst entrypoint into conf.d.
# The headers snippet lives in conf.d/snippets/ so conf.d/*.conf (http level)
# does not load it on its own; only CSP_CONNECT_SRC is substituted.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf.template /etc/nginx/templates/snippets/security-headers.conf.template
ENV CSP_CONNECT_SRC="'self' https:" \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_FILTER=CSP_CONNECT_SRC

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
