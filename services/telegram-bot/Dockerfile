FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS development
COPY pnpm-workspace.yaml packages/ ./
COPY packages/shared/package.json packages/shared/
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
CMD ["pnpm", "run", "dev"]

FROM base AS builder
COPY pnpm-workspace.yaml packages/ ./
COPY packages/shared/package.json packages/shared/
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml packages/ ./
COPY packages/shared/package.json packages/shared/
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=builder /app/dist ./dist
CMD ["pnpm", "start"]
