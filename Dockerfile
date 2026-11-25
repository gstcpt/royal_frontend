# ==============================================================================
# ROYAL FRONTEND — PRODUCTION MULTI-STAGE DOCKERFILE
# ==============================================================================

FROM node:24-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@10.15.0

ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=true

# Copy workspace manifests & packages first (layer cache)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/packages ./apps/backend/packages
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/packages ./apps/frontend/packages

RUN pnpm install --no-frozen-lockfile

COPY apps/frontend ./apps/frontend

RUN pnpm --filter "@royal/shared-types" run build
RUN pnpm --filter "@royal/shared-validators" run build
RUN pnpm --filter "@royal/shared-utils" run build
RUN pnpm --filter frontend run build

# Runner Stage (Next.js standalone monorepo output)
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

COPY --chown=node:node --from=builder /app/apps/frontend/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --chown=node:node --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER node
EXPOSE 3100

CMD ["node", "apps/frontend/server.js"]
