FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS development
COPY pnpm-workspace.yaml ./
COPY tsconfig.service.json ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/worker ./services/worker
RUN pnpm install --no-frozen-lockfile
WORKDIR /app/services/worker
CMD ["npx", "tsx", "watch", "src/index.ts"]

FROM base AS builder
COPY pnpm-workspace.yaml ./
COPY tsconfig.service.json ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/worker ./services/worker
RUN pnpm install --no-frozen-lockfile
RUN cd services/worker && pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/worker/package.json ./services/worker/
RUN pnpm install --prod --no-frozen-lockfile --filter @cold-email-bot/worker
COPY --from=builder /app/services/worker/dist ./services/worker/dist
WORKDIR /app/services/worker
CMD ["node", "dist/index.js"]
