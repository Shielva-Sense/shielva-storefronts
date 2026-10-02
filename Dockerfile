# syntax=docker/dockerfile:1.7
# shielva-storefronts — Next.js (standalone). Brand / admin hosts and secrets are runtime env.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Inlined at build: public site URL (index) and the in-cluster API the /api/v1 rewrite proxies to.
ARG NEXT_PUBLIC_SITE_URL=https://storefront.shielva.ai
ARG API_ORIGIN=http://storefronts-api.shielva.svc.cluster.local
# Pages pre-rendered at build (the index) resolve store links to brand domains with this.
ARG BRAND_HOSTS=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL API_ORIGIN=$API_ORIGIN BRAND_HOSTS=$BRAND_HOSTS NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && pnpm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3030 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3030
CMD ["node", "server.js"]
