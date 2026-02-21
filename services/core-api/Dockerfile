FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

# Development stage
FROM base AS development
RUN pnpm install --no-frozen-lockfile
COPY . .
EXPOSE 3000
EXPOSE 9229
CMD ["pnpm", "run", "dev"]

# Build stage
FROM base AS builder
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
EXPOSE 3000
CMD ["pnpm", "start"]
