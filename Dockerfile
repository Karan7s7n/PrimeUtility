# Production image for the Next.js app (server rendering + /api routes).
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
# Everything is owned by the unprivileged node user (uid 1000) — the app never
# runs as root.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.mjs ./next.config.mjs
USER node
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
