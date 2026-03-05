FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/telegram-bot ./services/telegram-bot
RUN pnpm install --no-frozen-lockfile
RUN cd services/telegram-bot && pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/telegram-bot/package.json ./services/telegram-bot/
RUN pnpm install --prod --no-frozen-lockfile --filter @cold-email-bot/telegram-bot
COPY --from=builder /app/services/telegram-bot/dist ./services/telegram-bot/dist
WORKDIR /app/services/telegram-bot
CMD ["node", "dist/index.js"]
