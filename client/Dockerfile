FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY client ./client
COPY vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json ./

RUN pnpm install --frozen-lockfile || pnpm install

RUN cd client && pnpm run build

FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html

COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]