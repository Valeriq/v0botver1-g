FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS development
COPY pnpm-workspace.yaml ./
COPY tsconfig.service.json ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/ai-orchestrator ./services/ai-orchestrator
RUN pnpm install --no-frozen-lockfile
WORKDIR /app/services/ai-orchestrator
EXPOSE 3002
CMD ["npx", "tsx", "watch", "src/index.ts"]

FROM base AS builder
COPY pnpm-workspace.yaml ./
COPY tsconfig.service.json ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/ai-orchestrator ./services/ai-orchestrator
RUN pnpm install --no-frozen-lockfile
RUN cd services/ai-orchestrator && pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/ai-orchestrator/package.json ./services/ai-orchestrator/
RUN pnpm install --prod --no-frozen-lockfile --filter @cold-email-bot/ai-orchestrator
COPY --from=builder /app/services/ai-orchestrator/dist ./services/ai-orchestrator/dist
WORKDIR /app/services/ai-orchestrator
EXPOSE 3002
CMD ["node", "dist/index.js"]
