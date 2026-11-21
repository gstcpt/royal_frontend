# ==============================================================================
# ROYAL FRONTEND — PRODUCTION MULTI-STAGE DOCKERFILE
# ==============================================================================

FROM node:24-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@10.15.0

# Copy Monorepo manifests & packages
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter "@royal/shared-types" run build
RUN pnpm --filter "@royal/shared-validators" run build
RUN pnpm --filter "@royal/shared-utils" run build
RUN pnpm --filter frontend run build

# Runner Stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

USER node

COPY --chown=node:node --from=builder /app/apps/frontend/public ./public
COPY --chown=node:node --from=builder /app/apps/frontend/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/frontend/.next/static ./.next/static

EXPOSE 3100

CMD ["node", "apps/frontend/server.js"]
