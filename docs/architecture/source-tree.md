# Source Tree Structure - AI Cold Email Bot

**Version:** 1.0.0  
**Last Updated:** 2026-01-19

---

## Table of Contents

1. [Root Directory](#root-directory)
2. [Client Application](#client-application)
3. [Backend Services](#backend-services)
4. [Shared Packages](#shared-packages)
5. [Infrastructure](#infrastructure)
6. [Documentation](#documentation)
7. [Scripts](#scripts)
8. [Configuration Files](#configuration-files)

---

## Root Directory

```
v0botver1-g/
├── .bmadrc.json                    # BMad Method configuration
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── .npmrc                          # npm/pnpm configuration
├── .replit                         # Replit platform configuration
├── BMAD_GUIDE.md                   # BMad Method guide
├── components.json                 # shadcn/ui configuration
├── docker-compose.dev.yml          # Development Docker Compose
├── docker-compose.yml              # Production Docker Compose
├── drizzle.config.ts               # Drizzle ORM configuration
├── GITHUB_SETUP.md                 # GitHub setup instructions
├── NEXT_STEPS.md                   # Next steps guide
├── package.json                    # Root package.json
├── pnpm-lock.yaml                  # pnpm lock file
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── PROJECT_CONTEXT.md              # Project context documentation
├── QUICKSTART.md                   # Quick start guide
├── README.md                       # Main README
├── RENDER_DEPLOY.md                # Render deployment guide
├── render.yaml                     # Render platform configuration
├── SECURITY.md                     # Security documentation
├── SETUP.md                        # Setup instructions
├── START_TESTING.md                # Testing guide
├── tailwind.config.ts              # TailwindCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration
```

### Configuration Files

| File | Purpose |
|------|---------|
| `.bmadrc.json` | BMad Method framework configuration |
| `.eslintrc.json` | ESLint linting rules |
| `.gitignore` | Files to exclude from Git |
| `.npmrc` | npm/pnpm settings |
| `components.json` | shadcn/ui component configuration |
| `drizzle.config.ts` | Drizzle ORM database configuration |
| `pnpm-workspace.yaml` | Monorepo workspace configuration |
| `tailwind.config.ts` | TailwindCSS styling configuration |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Vite build tool configuration |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `QUICKSTART.md` | Quick start guide |
| `SETUP.md` | Detailed setup instructions |
| `START_TESTING.md` | Testing guide |
| `PROJECT_CONTEXT.md` | Project context and overview |
| `NEXT_STEPS.md` | Development roadmap |
| `SECURITY.md` | Security best practices |
| `RENDER_DEPLOY.md` | Render deployment guide |
| `GITHUB_SETUP.md` | GitHub repository setup |
| `BMAD_GUIDE.md` | BMad Method usage guide |

---

## Client Application

```
client/
├── public/                         # Static assets
│   ├── favicon.png                # Application favicon
│   └── ...                        # Other static files
├── src/
│   ├── components/                 # React components
│   │   ├── ProtectedRoute.tsx     # Authentication wrapper
│   │   ├── TelegramLoginButton.tsx # Telegram login component
│   │   ├── layout/                # Layout components
│   │   └── ui/                    # shadcn/ui components
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx        # Authentication context
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-campaigns.ts       # Campaign data hook
│   │   ├── use-contacts.ts        # Contacts data hook
│   │   ├── use-prompt-profiles.ts # AI profiles hook
│   │   ├── use-resources.ts       # Resources hook
│   │   ├── use-toast.ts           # Toast notifications hook
│   │   └── use-mobile.tsx         # Mobile detection hook
│   ├── lib/                       # Utility libraries
│   │   ├── queryClient.ts         # TanStack Query client
│   │   └── utils.ts               # Utility functions
│   ├── pages/                     # Page components
│   │   ├── Dashboard.tsx          # Dashboard page
│   │   ├── Campaigns.tsx          # Campaigns management
│   │   ├── Contacts.tsx           # Contacts management
│   │   ├── GmailAccounts.tsx      # Gmail accounts page
│   │   └── AIProfiles.tsx         # AI profiles configuration
│   ├── App.tsx                    # Main App component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── index.html                      # HTML template
├── package.json                    # Client dependencies
├── tsconfig.json                   # Client TypeScript config
├── vite.config.ts                  # Client Vite config
└── requirements.md                 # Client requirements
```

### Client Components

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable React components |
| `components/layout/` | Layout-specific components (header, sidebar, etc.) |
| `components/ui/` | shadcn/ui base components |
| `contexts/` | React Context providers for global state |
| `hooks/` | Custom React hooks for data fetching and logic |
| `pages/` | Main application pages/routes |
| `lib/` | Utility functions and configurations |

---

## Backend Services

### Core API

```
services/core-api/
├── migrations/                     # Database migrations
├── src/
│   ├── db/                        # Database configuration
│   ├── routes/                    # API routes
│   ├── controllers/                # Request handlers
│   ├── services/                  # Business logic
│   ├── middleware/                # Express middleware
│   ├── models/                    # Data models
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # Configuration files
│   └── index.ts                   # Application entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
├── jest.config.json               # Jest testing configuration
└── Dockerfile                      # Docker image configuration
```

### Telegram Bot

```
services/telegram-bot/
├── src/
│   ├── bot/                       # Bot handlers and commands
│   ├── middleware/                # Bot middleware
│   ├── services/                  # Bot business logic
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # Bot configuration
│   └── index.ts                   # Bot entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
└── Dockerfile                      # Docker image configuration
```

### Worker Service

```
services/worker/
├── src/
│   ├── jobs/                      # Background job definitions
│   ├── queues/                    # Queue configurations
│   ├── processors/                # Job processors
│   ├── services/                  # Worker services
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # Worker configuration
│   └── index.ts                   # Worker entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
├── jest.config.json               # Jest testing configuration
└── Dockerfile                      # Docker image configuration
```

### Gmail Service

```
services/gmail-service/
├── src/
│   ├── api/                       # Gmail API integration
│   ├── auth/                      # Gmail authentication
│   ├── services/                  # Gmail business logic
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # Gmail configuration
│   └── index.ts                   # Service entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
├── jest.config.json               # Jest testing configuration
└── Dockerfile                      # Docker image configuration
```

### AI Orchestrator

```
services/ai-orchestrator/
├── src/
│   ├── agents/                    # AI agent configurations
│   ├── prompts/                   # AI prompt templates
│   ├── services/                  # AI business logic
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # AI configuration
│   └── index.ts                   # Service entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
├── jest.config.json               # Jest testing configuration
└── Dockerfile                      # Docker image configuration
```

### Observability Service

```
services/observability/
├── src/
│   ├── metrics/                   # Metrics collection
│   ├── logging/                   # Logging configuration
│   ├── tracing/                   # Distributed tracing
│   ├── alerts/                    # Alert management
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Utility functions
│   ├── config/                    # Observability configuration
│   └── index.ts                   # Service entry point
├── package.json                    # Service dependencies
├── tsconfig.json                   # TypeScript configuration
└── Dockerfile                      # Docker image configuration
```

---

## Shared Packages

```
packages/shared/
├── src/
│   ├── types/                     # Shared TypeScript types
│   │   ├── user.ts                # User types
│   │   ├── campaign.ts            # Campaign types
│   │   ├── contact.ts             # Contact types
│   │   ├── email.ts               # Email types
│   │   └── index.ts               # Type exports
│   ├── utils/                     # Shared utilities
│   │   ├── validation.ts         # Validation helpers
│   │   ├── formatting.ts         # Formatting helpers
│   │   └── index.ts               # Utility exports
│   ├── constants/                 # Shared constants
│   │   ├── api.ts                 # API constants
│   │   ├── errors.ts              # Error constants
│   │   └── index.ts               # Constant exports
│   ├── config/                    # Shared configuration
│   │   └── index.ts               # Config exports
│   └── index.ts                   # Main exports
├── package.json                    # Shared package dependencies
├── tsconfig.json                   # TypeScript configuration
└── README.md                      # Shared package documentation
```

### Shared Code Organization

| Directory | Purpose |
|-----------|---------|
| `types/` | TypeScript interfaces, types, and enums |
| `utils/` | Shared utility functions and helpers |
| `constants/` | Application-wide constants |
| `config/` | Shared configuration objects |

---

## Infrastructure

### Docker & Containerization

```
├── docker-compose.yml              # Production Docker Compose
├── docker-compose.dev.yml          # Development Docker Compose
├── Dockerfile.postgres             # PostgreSQL Docker image
└── services/
    ├── core-api/Dockerfile         # Core API Docker image
    ├── telegram-bot/Dockerfile     # Telegram Bot Docker image
    ├── worker/Dockerfile           # Worker Docker image
    ├── gmail-service/Dockerfile    # Gmail Service Docker image
    ├── ai-orchestrator/Dockerfile # AI Orchestrator Docker image
    └── observability/Dockerfile   # Observability Docker image
```

### Kubernetes

```
k8s/
├── namespace.yaml                  # Kubernetes namespace
├── configmap.yaml                  # Configuration management
├── secrets.yaml                    # Secrets management
├── postgres.yaml                   # PostgreSQL deployment
├── redis.yaml                      # Redis deployment
├── core-api.yaml                   # Core API deployment
├── telegram-bot.yaml               # Telegram Bot deployment
├── worker.yaml                     # Worker deployment
├── gmail-service.yaml              # Gmail Service deployment
├── ai-orchestrator.yaml           # AI Orchestrator deployment
├── ingress.yaml                    # Ingress configuration
└── monitoring/                     # Monitoring configurations
    ├── prometheus/                 # Prometheus setup
    └── grafana/                    # Grafana dashboards
```

### Monitoring

```
monitoring/
├── prometheus.yml                  # Prometheus configuration
├── alerts.yml                      # Alert rules
└── grafana-dashboard.json          # Grafana dashboard
```

---

## Documentation

```
docs/
├── architecture/                   # Architecture documentation
│   ├── coding-standards.md        # Development standards
│   ├── tech-stack.md              # Technology stack
│   └── source-tree.md             # This file
├── api/                            # API documentation (planned)
│   ├── core-api/                  # Core API docs
│   └── openapi.yaml               # OpenAPI specification
├── deployment/                     # Deployment documentation (planned)
├── prd/                            # Product requirements (planned)
└── stories/                        # Development stories (planned)
```

### Documentation Structure

| Directory | Purpose |
|-----------|---------|
| `architecture/` | System architecture and design |
| `api/` | API documentation and specifications |
| `deployment/` | Deployment guides and procedures |
| `prd/` | Product requirement documents |
| `stories/` | User stories and development tasks |

---

## Scripts

```
scripts/
├── backup-db.sh                    # Database backup script
├── restore-db.sh                   # Database restore script
└── init-db.sh                      # Database initialization script

script/
└── build.ts                        # Build script
```

### Script Descriptions

| Script | Purpose |
|--------|---------|
| `backup-db.sh` | Automated database backup |
| `restore-db.sh` | Database restoration from backup |
| `init-db.sh` | Initial database setup |
| `build.ts` | Build automation script |

---

## Root Server Files

```
server/
├── db.ts                           # Database connection setup
├── index.ts                        # Main server entry
├── routes.ts                       # Route definitions
├── static.ts                       # Static file serving
├── storage.ts                      # Storage configuration
├── supabase.ts                     # Supabase integration
└── vite.ts                         # Vite development server
```

### Root Server Organization

| File | Purpose |
|------|---------|
| `db.ts` | Database connection pool configuration |
| `index.ts` | Main Express server setup |
| `routes.ts` | API route definitions |
| `static.ts` | Static file serving configuration |
| `storage.ts` | File storage configuration |
| `supabase.ts` | Supabase client setup |
| `vite.ts` | Vite dev server configuration |

---

## Configuration Files Directory

```
.vscode/                           # VS Code settings
    └── settings.json              # Editor configuration
.git/                              # Git directory (hidden)
node_modules/                      # Dependencies (hidden)
attached_assets/                   # Attached assets directory
temp_repo/                         # Temporary repository
```

### Hidden/Generated Directories

| Directory | Purpose |
|-----------|---------|
| `.vscode/` | VS Code workspace settings |
| `.git/` | Git version control data |
| `node_modules/` | npm/pnpm installed packages |
| `attached_assets/` | User-attached files and images |
| `temp_repo/` | Temporary repository for testing |

---

## File Naming Conventions

### TypeScript Files

- **Components**: PascalCase (e.g., `UserProfile.tsx`, `Dashboard.tsx`)
- **Utilities/Services**: kebab-case (e.g., `api-client.ts`, `email-sender.ts`)
- **Types**: kebab-case with `.types.ts` suffix (e.g., `user.types.ts`, `campaign.types.ts`)
- **Hooks**: camelCase with `use-` prefix (e.g., `use-campaigns.ts`, `use-auth.ts`)

### Configuration Files

- **Configs**: lowercase with hyphens (e.g., `drizzle.config.ts`, `tailwind.config.ts`)
- **Docker**: `Dockerfile` (exact case)
- **Docker Compose**: `docker-compose.yml` or `docker-compose.dev.yml`

### Documentation Files

- **Markdown**: lowercase with hyphens (e.g., `coding-standards.md`, `tech-stack.md`)
- **README**: `README.md` (exact case)

### Database Files

- **Migrations**: `YYYYMMDDHHMMSS_description.sql`
- **Seed files**: `seed-data.sql`

---

## Key Directories Explained

### `services/core-api/`
Main API gateway that handles:
- User authentication and authorization
- Campaign CRUD operations
- Contact management
- Email scheduling and sending
- AI orchestrator communication

### `services/telegram-bot/`
Telegram bot that provides:
- User authentication via Telegram
- Campaign management commands
- Contact import/export
- Real-time notifications
- Bot command handlers

### `services/worker/`
Background job processor for:
- Email queue processing
- AI content generation
- Campaign execution
- Scheduled tasks
- Data processing jobs

### `services/gmail-service/`
Gmail integration service handling:
- Gmail OAuth authentication
- Email sending via Gmail API
- Account management
- Email status tracking
- Rate limiting

### `services/ai-orchestrator/`
AI processing service for:
- Email content generation
- Subject line optimization
- A/B testing coordination
- Lead scoring
- AI model management

### `client/`
Frontend React application providing:
- User dashboard
- Campaign management UI
- Contact management UI
- Analytics and reports
- Settings and configuration

---

## Development Workflow

### Adding a New Feature

1. **Backend Changes** (if needed):
   - Update types in `packages/shared/src/types/`
   - Add routes in `services/core-api/src/routes/`
   - Implement business logic in `services/core-api/src/services/`

2. **Frontend Changes**:
   - Create components in `client/src/components/`
   - Add hooks in `client/src/hooks/`
   - Update pages in `client/src/pages/`

3. **Testing**:
   - Add unit tests for backend services
   - Add integration tests for API endpoints
   - Add component tests for React components

4. **Documentation**:
   - Update API documentation in `docs/api/`
   - Update architecture docs if needed

---

## Best Practices for File Organization

### Separation of Concerns

- Keep business logic in `services/`
- Keep UI logic in `client/`
- Share types in `packages/shared/`
- Keep configuration at the root or service level

### Import Paths

- Use absolute imports when possible
- Alias shared package as `@shared`
- Example: `import { User } from '@shared/types'`

### File Size

- Keep files under 300 lines when possible
- Split large files into smaller modules
- Use barrel exports for cleaner imports

---

## Future Directory Additions

### Planned Additions

| Directory | Purpose | Priority |
|-----------|---------|----------|
| `docs/stories/` | User stories and tasks | High |
| `docs/prd/` | Product requirements | High |
| `docs/api/` | API documentation | Medium |
| `tests/e2e/` | E2E tests | High |
| `services/queue/` | Message queue service | Low |
| `services/search/` | Elasticsearch service | Low |

---

**Last Updated:** 2026-01-19  
**Maintainer:** Development Team
