FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/gmail-service ./services/gmail-service
RUN pnpm install --no-frozen-lockfile
RUN cd services/gmail-service && pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY package.json pnpm-lock.yaml* ./
COPY services/gmail-service/package.json ./services/gmail-service/
RUN pnpm install --prod --no-frozen-lockfile --filter @cold-email-bot/gmail-service
COPY --from=builder /app/services/gmail-service/dist ./services/gmail-service/dist
WORKDIR /app/services/gmail-service
EXPOSE 3001
CMD ["node", "dist/index.js"]
