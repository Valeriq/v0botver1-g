# Tech Stack Analysis

**Project:** AI Cold Email Bot
**Generated:** 2026-03-07
**Version:** 1.0.0

---

## 1. Languages and Versions

| Language | Version | Usage |
|----------|---------|-------|
| **TypeScript** | 5.9.3 (root), 5.3.3 (services) | Primary language for all services and client |
| **JavaScript** | ES2022+ | Transpiled output, ESM modules |
| **Node.js** | 20.x (Alpine) | Runtime environment |

### TypeScript Configuration
- **Module System:** ESNext (ESM)
- **Target:** ESNext
- **JSX:** react-jsx
- **Strict Mode:** Enabled
- **Module Resolution:** Bundler
- **Source Maps:** Enabled

---

## 2. Frameworks per Service

### Client (Frontend)
| Framework | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.3 | UI framework |
| **Vite** | 7.3.1 | Build tool and dev server |
| **Wouter** | 3.9.0 | Lightweight router |
| **TanStack Query** | 5.90.16 | Server state management |
| **Tailwind CSS** | 3.4.19 | Utility-first CSS |
| **Radix UI** | Various | Accessible component primitives |
| **Framer Motion** | 12.26.2 | Animation library |
| **React Hook Form** | 7.71.0 | Form handling |

### Services (Backend)

| Service | Framework | Version | Port |
|---------|-----------|---------|------|
| **core-api** | Express | 4.22.1 | 3000 |
| **telegram-bot** | Telegraf | 4.16.3 | 8080 |
| **ai-orchestrator** | Express | 4.18.2 | 3002 |
| **gmail-service** | Express | 4.18.2 | 3001 |
| **worker** | Custom | - | 8081 |

---

## 3. Key Dependencies with Versions

### Database and ORM
| Package | Version | Purpose |
|---------|---------|---------|
| **pg** | 8.16.3 | PostgreSQL client |
| **drizzle-orm** | 0.45.1 | Type-safe ORM |
| **drizzle-kit** | 0.31.8 | Migrations and introspection |
| **drizzle-zod** | 0.8.3 | Schema validation integration |

### Authentication and Security
| Package | Version | Purpose |
|---------|---------|---------|
| **@supabase/supabase-js** | 2.90.1 | Auth and real-time |
| **cookie-session** | 2.1.1 | Session management |
| **express-rate-limit** | 8.2.1 | Rate limiting |
| **cors** | 2.8.5 | CORS middleware |

### AI and Integrations
| Package | Version | Purpose |
|---------|---------|---------|
| **openai** | 6.16.0 | OpenAI API client |
| **googleapis** | 169.0.0 | Gmail/Google API |
| **telegraf** | 4.16.3 | Telegram Bot API |

### Data Processing
| Package | Version | Purpose |
|---------|---------|---------|
| **zod** | 3.25.76 | Schema validation |
| **csv-parse** | 6.1.0 | CSV parsing |
| **xlsx** | 0.18.5 | Excel file handling |
| **date-fns** | 4.1.0 | Date utilities |

### Caching and Messaging
| Package | Version | Purpose |
|---------|---------|---------|
| **redis** | 5.10.0 | Caching and pub/sub |

### HTTP and Networking
| Package | Version | Purpose |
|---------|---------|---------|
| **axios** | 1.13.2 | HTTP client |
| **multer** | 2.0.2 | File uploads |

### UI Components (Client)
| Package | Version | Purpose |
|---------|---------|---------|
| **lucide-react** | 0.562.0 | Icon library |
| **recharts** | 3.6.0 | Charting library |
| **cmdk** | 1.1.1 | Command palette |
| **vaul** | 1.1.2 | Drawer component |
| **class-variance-authority** | 0.7.1 | CSS variants |
| **tailwind-merge** | 3.4.0 | Tailwind class merging |
| **clsx** | 2.1.1 | Conditional classes |

---

## 4. Build Tools and Scripts

### Package Manager
- **pnpm** (workspace-based monorepo)
- Workspace configuration: `pnpm-workspace.yaml`

### Build Scripts (Root)
| Script | Command | Purpose |
|--------|---------|---------|
| dev | nodemon | Development server |
| build | pnpm -r build | Build all packages |
| build:client | cd client && pnpm run build | Build frontend |
| typecheck | pnpm -r exec tsc --noEmit | Type checking |
| lint | eslint --fix | Fix linting issues |
| test | vitest run | Run tests |
| test:watch | vitest watch | Watch mode testing |
| test:coverage | vitest run --coverage | Coverage report |
| check | lint + typecheck + test | Full quality check |

### Build Scripts (Per Service)
| Service | Dev | Build | Start |
|---------|-----|-------|-------|
| core-api | tsx watch src/index.ts | tsc | node dist/index.js |
| telegram-bot | tsx watch src/index.ts | tsc | node dist/index.js |
| ai-orchestrator | tsx watch src/index.ts | tsc | node dist/index.js |
| gmail-service | tsx watch src/index.ts | tsc | node dist/index.js |
| worker | tsx watch src/index.ts | tsc | node dist/index.js |
| client | vite | tsc && vite build | vite preview |

### Build Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **Vite** | 7.3.1 | Frontend bundler |
| **tsx** | 4.21.0 | TypeScript execution |
| **tsc** | 5.9.3 | TypeScript compiler |
| **nodemon** | 3.1.11 | Development watcher |

---

## 5. Container/Infrastructure Stack

### Docker Compose Services

| Service | Image | Ports | Dependencies |
|---------|-------|-------|--------------|
| **postgres** | postgres:16-alpine | 5432 | - |
| **redis** | redis:7-alpine | 6379 | - |
| **core-api** | node:20-alpine | 3000 | postgres, redis |
| **telegram-bot** | node:20-alpine | 8080 | core-api, redis |
| **worker** | node:20-alpine | 8081 | postgres, redis, core-api, ai-orchestrator |
| **gmail-service** | node:20-alpine | 3001 | postgres, redis |
| **ai-orchestrator** | node:20-alpine | 3002 | postgres |

### Docker Configuration
- **Base Image:** node:20-alpine
- **Multi-stage builds:** Yes (development, builder, production)
- **Package Manager in Container:** pnpm (via corepack)
- **Health Checks:** Enabled for all services

### Infrastructure Components
| Component | Version | Purpose |
|-----------|---------|---------|
| **PostgreSQL** | 16-alpine | Primary database |
| **Redis** | 7-alpine | Caching, pub/sub, job queues |

### Environment Variables
| Variable | Services | Purpose |
|----------|----------|---------|
| DATABASE_URL | core-api, worker, gmail-service, ai-orchestrator | PostgreSQL connection |
| REDIS_URL | core-api, telegram-bot, worker, gmail-service | Redis connection |
| OPENAI_API_KEY | ai-orchestrator | OpenAI authentication |
| TELEGRAM_BOT_TOKEN | telegram-bot, gmail-service | Telegram bot auth |
| GOOGLE_CLIENT_ID | gmail-service | Google OAuth |
| GOOGLE_CLIENT_SECRET | gmail-service | Google OAuth |
| GOOGLE_REDIRECT_URI | gmail-service | OAuth callback |

---

## 6. Development Tools

### Testing
| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 4.0.17 | Unit testing (primary) |
| **Jest** | 29.7.0 | Unit testing (services) |
| **ts-jest** | 29.2.0 | TypeScript Jest transformer |
| **Supertest** | 7.0.0 | API testing |
| **@vitest/ui** | 4.0.17 | Test UI dashboard |
| **@vitest/coverage-v8** | 4.0.17 | Code coverage |
| **jsdom** | 27.4.0 | DOM simulation |
| **happy-dom** | 20.3.4 | Fast DOM alternative |

### Test Configuration
- globals: true
- environment: jsdom
- coverage provider: v8
- reporters: text, json, html

### Linting
| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 8.x | Code linting |
| **@typescript-eslint/parser** | 8.0.0 | TypeScript parser |
| **@typescript-eslint/eslint-plugin** | 8.0.0 | TypeScript rules |

### ESLint Configuration
- env: node, es2022
- extends: eslint:recommended
- parser: @typescript-eslint/parser
- plugins: @typescript-eslint

### Code Quality Scripts
| Script | Command | Purpose |
|--------|---------|---------|
| lint | eslint --fix | Fix linting issues |
| lint:check | eslint | Check linting |
| typecheck | tsc --noEmit | Type checking |
| check | Combined | Full quality check |

---

## 7. Project Structure

```
ai-cold-email-bot/
+-- client/                 # React frontend
|   +-- src/
|   +-- package.json
+-- services/
|   +-- core-api/          # Main API service
|   +-- telegram-bot/      # Telegram integration
|   +-- ai-orchestrator/   # AI processing
|   +-- gmail-service/     # Gmail integration
|   +-- worker/            # Background jobs
|   +-- observability/     # Monitoring
+-- packages/
|   +-- shared/            # Shared types/utilities
+-- docker-compose.yml
+-- pnpm-workspace.yaml
+-- tsconfig.json
+-- package.json           # Root workspace config
```

---

## 8. Monorepo Workspace Configuration

### Workspace Packages
```yaml
# pnpm-workspace.yaml
packages:
  - 'services/*'
  - 'packages/*'
```

### Internal Packages
| Package | Name | Purpose |
|---------|------|---------|
| shared | @cold-email-bot/shared | Shared types, utilities |

### Service Package Names
| Service | Package Name |
|---------|--------------|
| core-api | @cold-email-bot/core-api |
| telegram-bot | @cold-email-bot/telegram-bot |
| ai-orchestrator | @cold-email-bot/ai-orchestrator |
| gmail-service | @cold-email-bot/gmail-service |
| worker | @cold-email-bot/worker |

---

## Summary

This is a **TypeScript monorepo** built with **pnpm workspaces**, featuring:

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3 + Radix UI
- **Backend:** Express.js microservices architecture
- **Database:** PostgreSQL 16 with Drizzle ORM
- **Caching:** Redis 7
- **AI:** OpenAI API integration
- **Integrations:** Telegram Bot, Gmail API
- **Testing:** Vitest (primary) + Jest (services)
- **Containerization:** Docker Compose with multi-stage builds
- **Runtime:** Node.js 20 Alpine
