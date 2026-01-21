# Technology Stack - AI Cold Email Bot

**Version:** 1.0.0  
**Last Updated:** 2026-01-19

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack](#backend-stack)
4. [Database & Storage](#database--storage)
5. [AI & Machine Learning](#ai--machine-learning)
6. [Integrations](#integrations)
7. [Infrastructure & DevOps](#infrastructure--devops)
8. [Development Tools](#development-tools)
9. [Testing](#testing)
10. [Monitoring & Observability](#monitoring--observability)
11. [Security](#security)
12. [Version Control](#version-control)

---

## Overview

AI Cold Email Bot is a microservices-based application built with TypeScript that helps users create, manage, and execute cold email campaigns with AI-powered personalization.

### Architecture Type
- **Microservices Architecture**
- **Monorepo** (managed with pnpm workspaces)

### Design Philosophy
- **Type-safe** with TypeScript throughout
- **Containerized** with Docker
- **Cloud-native** with Kubernetes support
- **API-first** design
- **Event-driven** communication between services

---

## Frontend Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI Library |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 7.3.1 | Build tool and dev server |

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Query** | 5.90.16 | Server state management |
| **React Context API** | Built-in | Global application state |
| **React Hooks** | Built-in | Local component state |

### UI Components & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **TailwindCSS** | 3.4.19 | Utility-first CSS framework |
| **Radix UI** | Latest | Unstyled accessible components |
| **Lucide React** | 0.562.0 | Icon library |
| **Framer Motion** | 12.26.2 | Animation library |
| **Class Variance Authority** | 0.7.1 | Component variant management |
| **Tailwind Merge** | 3.4.0 | Merge Tailwind classes |
| **Tailwind Animate** | 1.0.7 | Tailwind animations |

### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.71.0 | Form state management |
| **Zod** | 3.25.76 | Schema validation |
| **@hookform/resolvers** | 5.2.2 | Form validation integration |

### Routing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Wouter** | 3.9.0 | Lightweight client-side router |

### Data Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 3.6.0 | Chart library for analytics |

### Data Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| **XLSX** | 0.18.5 | Excel file parsing/generation |
| **CSV Parse** | 6.1.0 | CSV file parsing |

### Client Location
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React contexts
│   └── lib/           # Utility functions
```

---

## Backend Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x+ | Runtime environment |
| **TypeScript** | 5.9.3 | Type safety |
| **Express** | 4.22.1 | Web framework |
| **TSX** | 4.21.0 | TypeScript execution |

### API Design

- **RESTful APIs** for all services
- **JSON** for data exchange
- **OpenAPI/Swagger** for API documentation (planned)

### Middleware

| Technology | Version | Purpose |
|------------|---------|---------|
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Express Rate Limit** | 8.2.1 | Rate limiting |
| **Cookie Session** | 2.1.1 | Session management |
| **Multer** | 2.0.2 | File upload handling |

### Backend Services

| Service | Location | Description |
|---------|----------|-------------|
| **Core API** | `services/core-api/` | Main API gateway |
| **Telegram Bot** | `services/telegram-bot/` | Telegram integration |
| **Worker** | `services/worker/` | Background job processing |
| **Gmail Service** | `services/gmail-service/` | Gmail API integration |
| **AI Orchestrator** | `services/ai-orchestrator/` | AI processing coordination |

---

## Database & Storage

### Primary Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15+ | Primary relational database |
| **Drizzle ORM** | 0.45.1 | Database ORM |
| **Drizzle Kit** | 0.31.8 | Database migrations & CLI |

### Caching Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | 5.10.0 | In-memory caching & session storage |

### Database Features

- **ACID compliant** transactions
- **Foreign key constraints**
- **Indexes** for performance
- **Migrations** with Drizzle Kit
- **Connection pooling** via pg driver

### Database Driver

| Technology | Version | Purpose |
|------------|---------|---------|
| **pg** | 8.16.3 | PostgreSQL client for Node.js |

---

## AI & Machine Learning

### AI Services

| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenAI API** | 6.16.0 | GPT models for content generation |
| **AI Orchestrator** | Custom | Service for AI request coordination |

### AI Capabilities

- **Email Content Generation** - Personalized cold emails
- **Subject Line Optimization** - AI-powered subject suggestions
- **A/B Testing** - AI-driven optimization
- **Lead Scoring** - AI-based lead prioritization

### AI Models Used

- **GPT-4** - Primary model for content generation
- **GPT-3.5-turbo** - Faster, cheaper model for simple tasks

---

## Integrations

### Telegram

| Technology | Version | Purpose |
|------------|---------|---------|
| **Telegraf** | 4.16.3 | Telegram Bot API framework |

### Gmail

| Technology | Version | Purpose |
|------------|---------|---------|
| **Google APIs** | 169.0.0 | Gmail API integration |
| **OAuth 2.0** | Standard | Gmail authentication |

### Third-Party APIs

| API | Purpose |
|-----|---------|
| **Telegram Bot API** | Bot functionality |
| **Gmail API** | Email sending & management |
| **OpenAI API** | AI-powered content generation |

---

## Infrastructure & DevOps

### Containerization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Container runtime |
| **Docker Compose** | Latest | Local development orchestration |

### Orchestration

| Technology | Version | Purpose |
|------------|---------|---------|
| **Kubernetes** | 1.28+ | Production orchestration |

### Deployment Platforms

| Platform | Status | Purpose |
|----------|--------|---------|
| **Render** | Configured | Cloud hosting |
| **Replit** | Available | Development environment |

### Infrastructure as Code (IaC)

- **Kubernetes manifests** in `k8s/`
- **Docker Compose** files in root
- **Render configuration** in `render.yaml`

### Kubernetes Resources

- **Namespaces** - Resource isolation
- **ConfigMaps** - Configuration management
- **Secrets** - Sensitive data management
- **Services** - Service discovery
- **Ingress** - Routing configuration
- **Deployments** - Application deployments
- **StatefulSets** - Stateful applications (PostgreSQL, Redis)

---

## Development Tools

### Package Manager

| Technology | Version | Purpose |
|------------|---------|---------|
| **pnpm** | Latest | Fast, disk-space efficient package manager |

### Monorepo Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **pnpm workspaces** | Built-in | Monorepo management |

### Code Quality

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.0.0+ | JavaScript/TypeScript linting |
| **TypeScript ESLint** | 8.0.0 | TypeScript linting rules |
| **Prettier** | Latest | Code formatting |

### Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 7.3.1 | Frontend build tool |
| **TypeScript Compiler** | 5.9.3 | TypeScript compilation |
| **PostCSS** | 8.5.6 | CSS processing |
| **Autoprefixer** | 10.4.23 | CSS vendor prefixes |

### Environment Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **dotenv** | 17.2.3 | Environment variable management |

---

## Testing

### Testing Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 29.7.0 | JavaScript testing framework |
| **ts-jest** | 29.2.0 | TypeScript preprocessor for Jest |
| **@jest/globals** | 29.7.0 | Jest globals |

### Testing Types

| Type | Tool | Purpose |
|------|------|---------|
| **Unit Tests** | Jest | Test individual functions/components |
| **Integration Tests** | Jest + Supertest | Test API endpoints |
| **E2E Tests** | Playwright (planned) | Test user flows |

### HTTP Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supertest** | 7.0.0 | HTTP assertion library |

### Testing Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/supertest** | 6.0.2 | Supertest type definitions |

---

## Monitoring & Observability

### Monitoring Stack

| Technology | Purpose |
|------------|---------|
| **Prometheus** | Metrics collection & storage |
| **Grafana** | Visualization & dashboards |

### Monitoring Features

- **Application metrics** - Response times, error rates
- **Database metrics** - Query performance, connection pool
- **Infrastructure metrics** - CPU, memory, disk usage
- **Business metrics** - Campaign performance, email delivery rates

### Observability Service

| Service | Location | Purpose |
|---------|----------|-------------|
| **Observability Service** | `services/observability/` | Centralized monitoring & logging |

### Logging

- **Structured logging** with JSON format
- **Log aggregation** with centralized service
- **Log levels** - DEBUG, INFO, WARN, ERROR, FATAL

### Alerting

| Tool | Purpose |
|------|---------|
| **Prometheus Alertmanager** | Alert routing & management |
| **Custom Alerts** | Business-level alerts |

---

## Security

### Authentication

| Mechanism | Purpose |
|-----------|---------|
| **Telegram OAuth** | User authentication via Telegram |
| **Cookie-based Sessions** | Session management |
| **JWT (planned)** | Token-based authentication |

### Authorization

| Mechanism | Purpose |
|-----------|---------|
| **Role-Based Access Control (RBAC)** | User permissions |
| **API Key Authentication** | Service-to-service auth (planned) |

### Security Best Practices

- **Environment variables** for sensitive data
- **Input validation** with Zod
- **SQL injection prevention** via Drizzle ORM
- **XSS protection** with React's built-in escaping
- **CSRF protection** (to be implemented)
- **Rate limiting** on public APIs
- **HTTPS only** in production

### Secrets Management

| Method | Purpose |
|--------|---------|
| **Environment Variables** | Development secrets |
| **Kubernetes Secrets** | Production secrets |
| **Render Environment Variables** | Cloud secrets |

---

## Version Control

### Git

| Configuration | Value |
|---------------|-------|
| **VCS** | Git |
| **Hosting** | GitHub |
| **Repository** | https://github.com/Valeriq/v0botver1-g.git |

### Branching Strategy

| Branch Type | Purpose |
|-------------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | Feature branches |
| `bugfix/*` | Bug fix branches |
| `hotfix/*` | Production hotfixes |

### Git Workflow

- **Feature Branch Workflow**
- **Pull Requests** for code review
- **Protected Branches** for main/develop
- **Required Reviews** before merging

### CI/CD

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD pipeline |
| **Automated Testing** | Run tests on every commit (lint, type-check, test, build) |
| **Automated Deployment** | Deploy to staging/production via Render |
| **Docker Hub** | Automated Docker image building and pushing |
| **Codecov** | Code coverage reporting |
| **Snyk** | Security scanning |

### CI/CD Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| **CI** | Linting, type-checking, testing, building | Push/PR to main, develop |
| **CD (Render)** | Deploy to Render cloud | Push to main/develop |
| **Release** | Create releases and push Docker images | Git tags (v*) |

---

## Shared Packages

### Monorepo Structure

```
packages/
└── shared/
    ├── src/           # Shared source code
    ├── package.json   # Package configuration
    └── tsconfig.json  # TypeScript configuration
```

### Shared Code

- **Type definitions** - Common interfaces & types
- **Utilities** - Shared helper functions
- **Constants** - Application-wide constants
- **Configuration** - Shared config objects

---

## Development Environment

### Required Software

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **pnpm** | 8.x+ | Package manager |
| **Docker** | Latest | Container runtime |
| **Docker Compose** | Latest | Local orchestration |
| **Git** | Latest | Version control |

### IDE Support

- **Windsurf** - Primary IDE
- **VS Code** - Alternative IDE
- **Cursor** - AI-enhanced editor

### Editor Configuration

- **.editorconfig** - Editor settings
- **.eslintrc.json** - Linting configuration
- **prettier.config.js** - Formatting configuration

---

## Performance Considerations

### Frontend Performance

- **Code Splitting** with React.lazy()
- **Lazy Loading** for routes
- **Memoization** with React.memo
- **Optimized Bundle Size** - Tree shaking
- **CDN** for static assets (planned)

### Backend Performance

- **Database Connection Pooling** - pg driver
- **Redis Caching** - Reduce database queries
- **Database Indexes** - Query optimization
- **Pagination** - Limit result sets
- **Rate Limiting** - Prevent abuse

### Caching Strategy

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | PostgreSQL queries | Query result caching |
| **Application** | Redis | Session & data caching |
| **CDN** (planned) | CloudFlare/CloudFront | Static asset caching |

---

## Scalability

### Horizontal Scaling

- **Kubernetes Deployments** - Scale microservices independently
- **Load Balancing** - Kubernetes Services + Ingress
- **Database Read Replicas** (planned) - Scale read operations
- **Redis Cluster** (planned) - Scale cache layer

### Vertical Scaling

- **Resource Limits** - Kubernetes resource requests/limits
- **Database Optimization** - Query tuning, indexes

---

## Backup & Disaster Recovery

### Database Backups

| Strategy | Frequency | Retention |
|----------|-----------|-----------|
| **Full Backups** | Daily | 30 days |
| **Incremental Backups** | Hourly | 7 days |

### Backup Scripts

- `scripts/backup-db.sh` - Database backup script
- `scripts/restore-db.sh` - Database restore script

### Disaster Recovery

- **Multi-region deployment** (planned)
- **Automated failover** (planned)

---

## Future Technology Additions

### Planned Technologies

| Technology | Purpose | Priority |
|------------|---------|----------|
| **Playwright** | E2E testing | High |
| **GitHub Actions** | CI/CD pipeline | High |
| **OpenAPI/Swagger** | API documentation | Medium |
| **Jaeger** | Distributed tracing | Medium |
| **Elasticsearch** | Advanced search | Low |
| **RabbitMQ/Kafka** | Message queue | Low |

### Architecture Evolution

- **Event Sourcing** - For audit logs (planned)
- **CQRS** - Command Query Responsibility Segregation (planned)
- **GraphQL** - Alternative API layer (planned)

---

## Technology Decision Rationale

### Why TypeScript?
- Type safety catches errors at compile time
- Better IDE support with IntelliSense
- Easier refactoring with types
- Industry standard for large-scale applications

### Why React?
- Large ecosystem and community
- Component-based architecture
- Excellent performance with virtual DOM
- Easy to test and maintain

### Why Microservices?
- Independent scaling of services
- Technology flexibility
- Fault isolation
- Better team organization

### Why PostgreSQL?
- ACID compliance for data integrity
- Full-text search capabilities
- JSON support for flexible schemas
- Strong community and tooling

### Why Kubernetes?
- Industry standard for container orchestration
- Scalability and reliability
- Self-healing capabilities
- Cloud-agnostic

---

## Resources & Documentation

### Official Documentation

- [TypeScript](https://www.typescriptlang.org/docs/)
- [React](https://react.dev/)
- [Node.js](https://nodejs.org/docs/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/docs/)
- [Docker](https://docs.docker.com/)
- [Kubernetes](https://kubernetes.io/docs/)
- [OpenAI API](https://platform.openai.com/docs/)

### Community Resources

- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Discussions](https://github.com/features/discussions)
- [Reddit - r/typescript](https://reddit.com/r/typescript)
- [Dev.to](https://dev.to/)

---

**Last Updated:** 2026-01-19  
**Maintainer:** Development Team
