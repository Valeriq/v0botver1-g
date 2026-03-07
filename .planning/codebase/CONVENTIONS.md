# Coding Conventions

**Version:** 1.0.0  
**Last Updated:** 2026-03-07  
**Source Analysis:** Based on actual codebase patterns

---

## Table of Contents

1. [TypeScript Conventions](#1-typescript-conventions)
2. [Naming Conventions](#2-naming-conventions)
3. [Error Handling Patterns](#3-error-handling-patterns)
4. [Logging Patterns](#4-logging-patterns)
5. [Testing Patterns](#5-testing-patterns)
6. [Code Organization Patterns](#6-code-organization-patterns)
7. [API Patterns](#7-api-patterns)
8. [Database Patterns](#8-database-patterns)
9. [Import Patterns](#9-import-patterns)
10. [Code Quality Checklist](#10-code-quality-checklist)

---

## 1. TypeScript Conventions

### Configuration

- **Strict Mode:** Enabled (`strict: true`)
- **Module System:** ESNext with bundler resolution
- **Target:** ES2022+ features supported
- **No Emit:** TypeScript used for type-checking only in root config

### Type Definitions

```typescript
// PREFER: Interface for object shapes
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// PREFER: Type-only imports when possible
import type { User } from './types';

// AVOID: Using any without justification
// If necessary, add a comment explaining why
const data: any = someUnknownSource; // TODO: Add proper typing

// PREFER: Explicit return types for functions
async function createUser(data: CreateUserDto): Promise<User> {
  // implementation
}

// PREFER: Union types for status fields
type LeadStatus = 'new' | 'taken' | 'replied' | 'closed';
```

### Function Signatures

```typescript
// GOOD: Clear parameter and return types
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// GOOD: Async functions with Promise return type
async function fetchLeads(workspaceId: string): Promise<Lead[]> {
  // implementation
}
```

---

## 2. Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Source files | kebab-case | contacts.ts, lead-router.ts |
| Test files | *.test.ts | contacts.test.ts |
| Directories | kebab-case | src/routes/, src/middleware/ |
| Config files | dotfile or lowercase | .eslintrc.json, tsconfig.json |

### Variables and Constants

```typescript
// Variables: camelCase
const workspaceId = '123';
const leadCount = 10;

// Constants: SCREAMING_SNAKE_CASE for env/config
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3000';
const MAX_RETRIES = 3;

// Booleans: is/has/should prefix
const isActive = true;
const hasPermission = false;
const shouldNotify = true;
```

### Functions

```typescript
// Functions: camelCase, verb-noun pattern
async function createLead(data: CreateLeadDto): Promise<Lead> { }
function validateEmail(email: string): boolean { }
function formatDateString(date: Date): string { }

// Event handlers: handle prefix
function handleLeadTaken(ctx: Context) { }
function handleUploadComplete(file: File) { }

// Callbacks: on prefix
const onSubmit = (data: FormData) => { };
const onError = (error: Error) => { };
```

### Classes and Interfaces

```typescript
// Classes: PascalCase
class ValidationError extends Error { }
class Logger { }

// Interfaces: PascalCase, no 'I' prefix
interface User { }
interface LeadResponse { }
interface ApiResponse<T> { }

// Type aliases: PascalCase
type LeadStatus = 'new' | 'taken' | 'replied' | 'closed';
type Maybe<T> = T | null;
```

### Exports

```typescript
// Router exports: xxxRouter suffix
export const contactRouter = Router();
export const leadRouter = Router();

// Schema exports: xxxSchema suffix
export const createCampaignSchema = z.object({ });
export const paginationSchema = z.object({ });

// Scene exports: xxxScene suffix
export const leadsScene = new Scenes.BaseScene('leads');
```

---

## 3. Error Handling Patterns

### Express Route Error Handling

```typescript
// PATTERN: Try-catch with next(error)
router.get('/', async (req, res, next) => {
  try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// PATTERN: ZodError handling
router.post('/upload', async (req, res, next) => {
  try {
    const data = validateRequest(uploadSchema, req.body);
    // process data
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error 
      });
    }
    next(error);
  }
});
```

### Custom Error Classes

```typescript
// PATTERN: Extend Error for custom errors
class ValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Response Format

```typescript
// PATTERN: Consistent error response structure
res.status(400).json({ error: 'workspace_id is required' });
res.status(404).json({ error: 'Lead not found' });
res.status(500).json({ error: 'Internal server error' });
```

### Async Error Handling

```typescript
// PATTERN: Catch with error type checking
try {
  await axios.post(url, data);
} catch (error: any) {
  console.error('[service] Error:', error.response?.data || error.message);
  throw new Error('Operation failed');
}
```

---

## 4. Logging Patterns

### Console Logging with Prefix

```typescript
// PATTERN: Bracket prefix for service identification
console.log('[worker] Connected to Redis');
console.error('[leads] Take lead error:', error.response?.data || error.message);
console.warn('[octto] Config validation errors');
```

### Structured Logger (Shared Package)

```typescript
// PATTERN: Use shared Logger for structured logging
import { Logger } from '@cold-email-bot/shared/logger';

const logger = new Logger('telegram-bot');

// Log levels
logger.info('User authenticated', { userId, workspaceId });
logger.warn('Rate limit approaching', { currentRate: 95 });
logger.error('Failed to send email', error, { campaignId, recipientId });
logger.debug('Processing request', { requestId });
```

### Log Context Structure

```typescript
interface LogContext {
  requestId?: string;
  jobId?: string;
  workspaceId?: string;
  userId?: string;
  campaignId?: string;
  [key: string]: any;
}
```

---

## 5. Testing Patterns

### Test File Organization

```
services/
  core-api/
    src/
      __tests__/           # Integration tests folder
        contacts.test.ts
        campaigns.test.ts
        integration.test.ts
      utils.test.ts        # Co-located with source
```

### Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import pool from '../db';

describe('Contacts API', () => {
  let workspaceId: string;

  beforeAll(async () => {
    // Setup: Create test data
    const result = await pool.query(
      'INSERT INTO workspaces (name, owner_telegram_id) VALUES ($1, $2) RETURNING id',
      ['Test Workspace', '987654321']
    );
    workspaceId = result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await pool.query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);
    await pool.end();
  });

  it('should upload contacts from CSV', async () => {
    const response = await request(app)
      .post('/api/contacts/upload')
      .field('workspace_id', workspaceId)
      .attach('file', Buffer.from(csvContent), 'contacts.csv');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('imported');
  });
});
```

### Test Naming Convention

```typescript
// PATTERN: should + expected behavior
it('should create a new user with valid data', async () => { });
it('should throw error for duplicate email', async () => { });
it('should return 404 for non-existent lead', async () => { });
```

### Test Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical business logic
- All public APIs must have tests
- Edge cases and error scenarios must be tested

---

## 6. Code Organization Patterns


### Monorepo Structure

```
v0botver1-g/
  packages/
    shared/               # Shared utilities
      src/
        index.ts
        logger.ts
        routes.ts
        schema.ts
        types.ts
  services/
    core-api/             # Main API service
    telegram-bot/         # Telegram bot service
    worker/               # Background job processor
    gmail-service/        # Gmail integration
    ai-orchestrator/      # AI generation service
  client/                 # Frontend application
```

### Service Structure

```
services/core-api/
  src/
    __tests__/            # Integration tests
    db/                   # Database configuration
    lib/                  # Utility functions
    middleware/           # Express middleware
    routes/               # API route handlers
    shared/               # Service-specific shared code
    db.ts                 # DB connection export
    index.ts              # App entry point
  package.json
  tsconfig.json
```

### Route File Structure

```typescript
// routes/contacts.ts
import { Router } from 'express';
import { pool } from '../db';
import { validateRequest, uploadContactsSchema } from '../lib/validation';

export const contactRouter = Router();

// Route handlers...
contactRouter.post('/upload', uploadLimiter, async (req, res, next) => { });
contactRouter.get('/', async (req, res, next) => { });
contactRouter.delete('/:id', async (req, res, next) => { });
```

---

## 7. API Patterns

### Request Validation

```typescript
// PATTERN: Zod schemas for validation
import { z } from 'zod';

export const createCampaignSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace_id format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  steps: z.array(z.object({
    template: z.string().min(1, 'Template is required'),
    delay_hours: z.number().int().min(0).max(720),
  })).min(1, 'At least one step required'),
});

// Usage in route
const data = validateRequest(createCampaignSchema, req.body);
```

### Response Format

```typescript
// PATTERN: Consistent API response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Success response
res.json({ leads: result.rows, total: count });

// Error response
res.status(400).json({ error: 'workspace_id is required' });
```

### Pagination

```typescript
// PATTERN: Limit/offset pagination
const { limit, offset } = validateRequest(paginationSchema, req.query);

const result = await pool.query(
  'SELECT * FROM contacts WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
  [workspace_id, limit, offset]
);

res.json({
  contacts: result.rows,
  total: parseInt(countResult.rows[0].count),
  limit,
  offset,
});
```

### Route Naming

```
# PATTERN: RESTful routes
GET    /api/contacts          # List
POST   /api/contacts/upload   # Upload (action)
GET    /api/contacts/:id      # Get single
DELETE /api/contacts/:id      # Delete

GET    /api/leads             # List
GET    /api/leads/:id         # Get detail
POST   /api/leads/:id/take    # Action
POST   /api/leads/:id/reply   # Action
POST   /api/leads/:id/close   # Action
```

---

## 8. Database Patterns

### Query Patterns

```typescript
// PATTERN: Parameterized queries (prevent SQL injection)
const result = await pool.query(
  'SELECT * FROM contacts WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
  [workspace_id, limit, offset]
);

// PATTERN: Dynamic query building
let query = 'SELECT * FROM leads WHERE workspace_id = $1';
const params: any[] = [workspace_id];

if (status) {
  query += ' AND status = $' + (params.length + 1);
  params.push(status);
}
```

### UUID Generation

```typescript
// PATTERN: Use uuid for primary keys
import { v4 as uuidv4 } from 'uuid';

const id = uuidv4();
```

---

## 9. Import Patterns

### Import Order

```typescript
// 1. External packages
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// 2. Internal packages (shared)
import { Logger } from '@cold-email-bot/shared/logger';

// 3. Local modules (relative)
import { pool } from '../db';
import { validateRequest } from '../lib/validation';
import { uploadLimiter } from '../middleware/rateLimiter';
```

### Type-Only Imports

```typescript
// PREFER: Type-only imports for types
import type { User, Lead } from './types';

// MIXED: Value and type imports
import { userService } from './services';
import type { User } from './types';
```

### Re-exports

```typescript
// PATTERN: Barrel exports in index.ts
// packages/shared/src/index.ts
export * from './logger';
export * from './routes';
export * from './schema';
export * from './types';
```

---

## 10. Code Quality Checklist

### Before Every Commit

```bash
pnpm lint
pnpm typecheck
pnpm test
```

### Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] No any types without justification
- [ ] All functions have explicit return types
- [ ] Error handling with try-catch and next(error)
- [ ] Logging with service prefix
- [ ] Zod validation for all inputs
- [ ] Parameterized database queries
- [ ] No console.log in production code (use logger)
- [ ] No commented-out code
- [ ] Meaningful variable/function names
- [ ] JSDoc comments for public functions
- [ ] Tests for new functionality

### ESLint Rules

```json
{
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": "off",
    "no-undef": "off"
  }
}
```

### Git Commit Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(contacts): add CSV upload with validation

- Implement CSV parsing with configurable delimiter
- Add email validation and duplicate detection
- Store original CSV for audit trail

Closes #123
```

---

## Quick Reference

| Category | Convention |
|----------|------------|
| Files | kebab-case |
| Variables | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| Functions | camelCase |
| Classes/Interfaces | PascalCase |
| Routers | xxxRouter |
| Schemas | xxxSchema |
| Scenes | xxxScene |
| Error prefix | [service] |
| Test files | *.test.ts |
| Validation | Zod |
| Database | Parameterized queries |
| Logging | Console with prefix or Logger class |

---

**Last Updated:** 2026-03-07  
**Maintainer:** Development Team
