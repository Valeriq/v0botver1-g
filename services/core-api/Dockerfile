FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/core-api ./services/core-api
RUN pnpm install --no-frozen-lockfile
RUN cd services/core-api && pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/core-api/package.json ./services/core-api/
RUN pnpm install --prod --no-frozen-lockfile --filter @cold-email-bot/core-api
COPY --from=builder /app/services/core-api/dist ./services/core-api/dist
COPY --from=builder /app/services/core-api/migrations ./migrations
WORKDIR /app/services/core-api
EXPOSE 3000
CMD ["node", "dist/index.js"]
