# Coding Standards - AI Cold Email Bot

**Version:** 1.0.0  
**Last Updated:** 2026-01-19

---

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [React/Component Standards](#reactcomponent-standards)
4. [Backend/API Standards](#backendapi-standards)
5. [Database Standards](#database-standards)
6. [Testing Standards](#testing-standards)
7. [Git Workflow](#git-workflow)
8. [Documentation Standards](#documentation-standards)

---

## General Principles

### Core Values

- **Readability over cleverness** - Write code that others can understand easily
- **Consistency** - Follow established patterns across the codebase
- **Simplicity** - Solve problems in the simplest way possible
- **Testability** - Write code that's easy to test
- **Performance** - Consider performance implications, but don't prematurely optimize

### Code Quality

- **ESLint** - All code must pass ESLint with no errors
- **TypeScript Strict Mode** - Enable `strict: true` in tsconfig.json
- **No `any` Types** - Use proper TypeScript types unless absolutely necessary
- **Meaningful Names** - Variable, function, and class names should be descriptive
- **Functions Should Be Small** - Aim for functions under 50 lines
- **DRY Principle** - Don't Repeat Yourself - extract common logic

---

## TypeScript Standards

### Type Definitions

```typescript
// ✅ GOOD - Explicit type definitions
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// ❌ BAD - Implicit types
const user = {
  id: '123',
  email: 'test@example.com',
};
```

### Function Signatures

```typescript
// ✅ GOOD - Clear parameter and return types
async function createUser(data: CreateUserDto): Promise<User> {
  // implementation
}

// ❌ BAD - Implicit return type
async function createUser(data: CreateUserDto) {
  // implementation
}
```

### Error Handling

```typescript
// ✅ GOOD - Proper error handling with typed errors
class ValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
  }
}

try {
  // code that might throw
} catch (error) {
  if (error instanceof ValidationError) {
    // handle validation error
  }
  throw error;
}
```

### Type Imports

```typescript
// ✅ GOOD - Use type-only imports when possible
import type { User } from './types';

// ✅ GOOD - Mixed imports
import { userService } from './services';
import type { User } from './types';

// ❌ BAD - Import types as values when not needed
import { User } from './types';
```

---

## React/Component Standards

### Component Structure

```typescript
// ✅ GOOD - Clear component structure
import { useState } from 'react';

interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit(user.id);
  };

  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
}
```

### Hooks

```typescript
// ✅ GOOD - Custom hook with proper naming
function useUserData(userId: string) {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // fetch logic
  }, [userId]);

  return { data, loading, error };
}
```

### State Management

- Use local state for component-specific data
- Use React Context for global application state
- Use TanStack Query for server state
- Keep state as close to where it's used as possible

---

## Backend/API Standards

### API Routes Structure

```typescript
// ✅ GOOD - Clear route structure
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});
```

### Request Validation

```typescript
// ✅ GOOD - Use Zod for validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

function validateUserInput(data: unknown) {
  return CreateUserSchema.parse(data);
}
```

### Response Format

```typescript
// ✅ GOOD - Consistent API response format
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
```

### Error Handling Middleware

```typescript
// ✅ GOOD - Centralized error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});
```

---

## Database Standards

### Schema Definitions

```typescript
// ✅ GOOD - Clear schema definitions with proper types
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Migrations

- Name migrations descriptively: `YYYYMMDDHHMMSS_description.sql`
- Run migrations locally before pushing to remote
- Always test migrations on staging first
- Never modify existing migrations - create new ones

### Query Patterns

```typescript
// ✅ GOOD - Use Drizzle ORM
import { db } from './db';
import { users } from './schema';

const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, userId));
```

---

## Testing Standards

### Unit Tests

```typescript
// ✅ GOOD - Clear test structure with descriptive names
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const result = await userService.createUser(validUserDto);
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(validUserDto.email);
    });

    it('should throw error for duplicate email', async () => {
      await expect(
        userService.createUser(existingUserDto)
      ).rejects.toThrow(DuplicateEmailError);
    });
  });
});
```

### Integration Tests

```typescript
// ✅ GOOD - Integration test with database
describe('User API Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(validUserDto);
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Test Coverage

- Aim for at least 80% code coverage
- Critical business logic should have 100% coverage
- All public APIs should have tests
- Test edge cases and error scenarios

---

## Git Workflow

### Commit Messages

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): add Telegram login integration

- Implement TelegramLoginButton component
- Add Telegram authentication flow
- Update user table to store telegram_id

Closes #123
```

### Branch Naming

```
feature/<description>
bugfix/<description>
hotfix/<description>
release/<version>
```

**Examples:**
- `feature/telegram-auth`
- `bugfix/email-validation`
- `hotfix/security-patch`

### Pull Request Guidelines

- Keep PRs focused and small
- Provide clear description of changes
- Link to related issues
- Ensure all tests pass
- Get at least one code review before merging

---

## Documentation Standards

### Code Comments

```typescript
// ✅ GOOD - JSDoc for public functions
/**
 * Creates a new user in the database
 * @param data - User creation data
 * @returns Created user with generated ID
 * @throws ValidationError if validation fails
 * @throws DuplicateError if email already exists
 */
async function createUser(data: CreateUserDto): Promise<User> {
  // implementation
}

// ✅ GOOD - Clear inline comments for complex logic
// Calculate score using weighted algorithm:
// - Recency: 40% weight
// - Frequency: 30% weight
// - Engagement: 30% weight
const score = (recency * 0.4) + (frequency * 0.3) + (engagement * 0.3);
```

### README Files

Every service and major module should have a README.md with:
- Purpose and description
- Installation instructions
- Usage examples
- API documentation (for services)
- Development setup
- Testing instructions

### API Documentation

- Use OpenAPI/Swagger specs for REST APIs
- Document all endpoints
- Include request/response examples
- Document error responses

---

## Security Standards

### Input Validation

- Validate all user inputs
- Use prepared statements for database queries
- Sanitize data before rendering in UI

### Authentication & Authorization

- Never expose secrets in client code
- Use environment variables for sensitive data
- Implement proper RBAC (Role-Based Access Control)
- Use HTTPS in production

### Data Protection

- Hash passwords with bcrypt or similar
- Encrypt sensitive data at rest
- Use secure session management
- Implement rate limiting on public APIs

---

## Performance Standards

### Frontend

- Use React.memo for expensive components
- Implement code splitting with lazy loading
- Optimize images and assets
- Minimize bundle size

### Backend

- Implement caching strategies (Redis)
- Use database indexes appropriately
- Optimize database queries
- Implement pagination for large datasets

---

## Code Review Checklist

Before merging code:

- [ ] Code follows TypeScript standards
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] Meaningful variable/function names
- [ ] No sensitive data exposed
- [ ] ESLint passes with no errors
- [ ] Git commit message follows convention

---

## Tools & Configuration

### Required Tools

- **Node.js** >= 20.x
- **pnpm** package manager
- **TypeScript** >= 5.x
- **ESLint** for linting
- **Prettier** for formatting
- **Jest** for testing

### Configuration Files

- `.eslintrc.json` - ESLint configuration
- `tsconfig.json` - TypeScript configuration
- `prettier.config.js` - Prettier configuration
- `.prettierrc` - Prettier rules
- `.editorconfig` - Editor settings

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**Last Updated:** 2026-01-19  
**Maintainer:** Development Team
