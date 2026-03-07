# Phase 1: Foundation - Research

**Researched:** 2026-03-07
**Domain:** React dashboard architecture, state management, data tables
**Confidence:** HIGH

## Summary

The project already has a solid foundation with React 19, Vite 7, TanStack Query, and a basic layout structure. The existing codebase follows good patterns with type-safe API routes via `@shared/routes`, proper authentication context, and shadcn/ui components. Phase 1 requires adding **Zustand** for client state management and **TanStack Table** for data grids, then establishing the testing infrastructure. No major refactoring needed—just augmenting what's already in place.

**Primary recommendation:** Install missing dependencies (zustand, @tanstack/react-table), create UI state store, build reusable DataTable component, and establish client-side testing with Vitest.

---

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | UI framework | Latest stable with concurrent features |
| Vite | 7.0.0 | Build tool | Fastest dev server, optimal DX |
| TypeScript | 5.0.0 | Type safety | Industry standard |
| TanStack Query | 5.90.16 | Server state | Gold standard for API data, caching, synchronization |
| wouter | 3.9.0 | Routing | Lightweight (~1.5KB), sufficient for dashboard |
| Tailwind CSS | 3.4.0 | Styling | Utility-first, perfect for dashboards |

### To Add (Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Zustand** | 5.0.11 | Client state | Minimal (~3KB), no Provider, simple API. 18M weekly downloads, 2025 standard. |
| **@tanstack/react-table** | 8.21.3 | Data grids | Headless table logic, 15.2KB, full control over UI. Industry standard. |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI | Various | Headless primitives | Already have full suite for accessible components |
| React Hook Form | 7.71.0 | Form state | Best performance, minimal re-renders |
| Zod | 3.25.76 | Schema validation | TypeScript-first, runtime + type safety |
| Lucide React | 0.562.0 | Icons | Modern, tree-shakeable |
| date-fns | 4.1.0 | Date utilities | Modular, tree-shakeable |
| recharts | 3.6.0 | Charts | Simple, composable (for Phase 2+) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | Redux Toolkit | Overkill for this scope. 15KB, boilerplate, declining usage. |
| Zustand | Jotai | Atomic model better for complex derived state (not needed here). |
| TanStack Table | AG Grid | 298KB bundle, overkill. Enterprise features require paid license. |
| wouter | React Router 7 | 12KB, unnecessary complexity. Keep wouter for now. |

**Installation:**
```bash
cd client
npm install zustand @tanstack/react-table
```

---

## Architecture Patterns

### Current Project Structure
```
client/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # ✅ Already exists
│   │   └── Sidebar.tsx         # ✅ Already exists
│   ├── ui/                     # ✅ Full shadcn/ui suite
│   ├── ErrorBoundary.tsx       # ✅ Already exists
│   ├── ProtectedRoute.tsx      # ✅ Already exists
│   └── TelegramLoginButton.tsx # ✅ Already exists
├── contexts/
│   └── AuthContext.tsx         # ✅ Already exists
├── hooks/
│   ├── use-contacts.ts         # ✅ Already exists
│   ├── use-campaigns.ts        # ✅ Already exists
│   ├── use-prompt-profiles.ts  # ✅ Already exists
│   ├── use-toast.ts            # ✅ Already exists
│   └── use-mobile.tsx          # ✅ Already exists
├── lib/
│   ├── queryClient.ts          # ✅ Already exists
│   └── utils.ts                # ✅ Already exists
├── pages/                      # ✅ All pages exist (placeholder)
│   ├── Dashboard.tsx
│   ├── Contacts.tsx
│   ├── Campaigns.tsx
│   ├── Leads.tsx
│   ├── GmailAccounts.tsx
│   ├── AIProfiles.tsx
│   ├── Login.tsx
│   └── Landing.tsx
├── App.tsx                     # ✅ Router + Providers
└── main.tsx                    # ✅ Entry point
```

### Recommended Additions for Phase 1
```
client/src/
├── stores/                     # 🆕 Zustand stores
│   ├── uiStore.ts             # Sidebar state, modals, theme
│   └── index.ts               # Public API
├── components/
│   └── data-table/            # 🆕 Reusable table component
│       ├── DataTable.tsx      # TanStack Table wrapper
│       ├── DataTablePagination.tsx
│       └── index.ts
└── __tests__/                  # 🆕 Test files
    ├── components/
    │   ├── layout/
    │   │   └── AppLayout.test.tsx
    │   └── data-table/
    │       └── DataTable.test.tsx
    ├── stores/
    │   └── uiStore.test.ts
    └── setup.ts               # Test utilities
```

### Pattern 1: Zustand Store Setup
**What:** Minimal client state management for UI state
**When to use:** Sidebar state, modal visibility, theme preferences
**Example:**
```typescript
// Source: Zustand docs + 2025 best practices
// stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

### Pattern 2: TanStack Table with shadcn/ui
**What:** Headless table logic with custom UI
**When to use:** Contacts list, campaigns table, leads grid
**Example:**
```typescript
// Source: TanStack Table docs + shadcn/ui patterns
// components/data-table/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Pattern 3: API Client Enhancement
**What:** Centralized fetch wrapper with error handling
**Current state:** Basic `apiRequest` function exists in `lib/queryClient.ts`
**Enhancement needed:** Add workspace_id injection, better error types
**Example:**
```typescript
// lib/apiClient.ts (enhance existing)
import { useAuth } from '@/contexts/AuthContext';

// Note: Current implementation uses credentials: "include" for cookies
// Enhancement: Add workspace context injection
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // HttpOnly cookies for auth
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}
```

### Anti-Patterns to Avoid
- **Direct fetch in components:** Use hooks (useContacts, useCampaigns) instead
- **Prop drilling for auth:** Use AuthContext (already in place)
- **Storing server state in Zustand:** Use TanStack Query for API data
- **Building custom table logic:** Use TanStack Table, not manual pagination

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table pagination | Custom pagination logic | TanStack Table's getPaginationRowModel | Edge cases, accessibility, performance |
| Table sorting | Custom sort functions | TanStack Table's getSortedRowModel | Multi-sort, server-side support |
| Global UI state | React Context + useReducer | Zustand | Simpler API, no Provider hell, middleware |
| Form validation | Manual validation | React Hook Form + Zod | Performance, accessibility, error handling |
| API error handling | Try-catch everywhere | TanStack Query's onError | Centralized, retry logic, caching |

**Key insight:** The project already avoids hand-rolling for forms (RHF + Zod) and server state (TanStack Query). Extend this pattern to tables and client state.

---

## Common Pitfalls

### Pitfall 1: Mixing Server and Client State
**What goes wrong:** Storing API data in Zustand, causing sync issues
**Why it happens:** Unclear separation of concerns
**How to avoid:** 
- Server state (contacts, campaigns) → TanStack Query
- Client state (sidebar, modals) → Zustand
- URL state (filters, page) → wouter's useSearch
**Warning signs:** Data not updating after mutations, stale cache

### Pitfall 2: TanStack Table Without Pagination
**What goes wrong:** Rendering 10,000+ rows, performance issues
**Why it happens:** Forgetting to add pagination row model
**How to avoid:** Always use `getPaginationRowModel()` or server-side pagination
**Warning signs:** Slow renders, browser freezing on large datasets

### Pitfall 3: Zustand Without Persistence
**What goes wrong:** Sidebar state lost on refresh
**Why it happens:** Not using persist middleware
**How to avoid:** Use `persist()` middleware for user preferences
**Warning signs:** Settings reset on page reload

### Pitfall 4: Missing Test Setup for Client
**What goes wrong:** No tests for React components
**Why it happens:** Vitest configured at root, but no client tests
**How to avoid:** Create `client/src/__tests__/` with setup.ts
**Warning signs:** No test coverage for UI components

---

## Code Examples

### Zustand Store with TypeScript
```typescript
// Source: Zustand docs + TypeScript best practices
// stores/uiStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Modals
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      activeModal: null,
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'coldbot-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        theme: state.theme 
      }),
    }
  )
);
```

### TanStack Table Column Definitions
```typescript
// Source: TanStack Table docs + shadcn/ui patterns
// features/contacts/components/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Contact } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

export const contactColumns: ColumnDef<Contact>[] = [
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return date.toLocaleDateString();
    },
  },
];
```

### Integration with Existing Hooks
```typescript
// pages/Contacts.tsx (enhanced)
import { useContacts } from '@/hooks/use-contacts';
import { DataTable } from '@/components/data-table';
import { contactColumns } from '@/features/contacts/components/columns';

export default function Contacts() {
  const { data: contacts, isLoading } = useContacts();
  
  return (
    <AppLayout>
      <PageHeader title="Контакты" description="Управление списком контактов" />
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={contactColumns} data={contacts || []} />
      )}
    </AppLayout>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | Zustand for client, TanStack Query for server | 2023-2025 | Simpler code, better performance |
| React Table v7 | TanStack Table v8 | 2022-2023 | TypeScript-first, headless, better DX |
| Axios for API | Native fetch + TanStack Query | 2024-2025 | Smaller bundle, built-in caching |
| Manual pagination | TanStack Table pagination | 2023-2025 | Accessibility, performance built-in |

**Deprecated/outdated:**
- **React Table v7:** Use TanStack Table v8 (already in package name)
- **Formik:** Use React Hook Form (already installed)
- **Moment.js:** Use date-fns (already installed)

---

## Open Questions

1. **Should we add TanStack Virtual for 10,000+ contacts?**
   - What we know: STATE.md mentions "Contact lists will have 10,000+ items — TanStack Virtual mandatory"
   - What's unclear: Should this be in Phase 1 or Phase 2?
   - Recommendation: Add in Phase 2 when implementing Contacts page. Phase 1 focuses on foundation.

2. **Should we enhance the API client with interceptors?**
   - What we know: Current implementation uses basic fetch with credentials
   - What's unclear: Do we need request/response interceptors for auth tokens?
   - Recommendation: Current cookie-based auth is sufficient. Add interceptors only if switching to JWT tokens.

3. **Should we create a Header component?**
   - What we know: Sidebar exists, but no separate Header
   - What's unclear: Is the current layout sufficient?
   - Recommendation: Add Header component in Phase 1 for user menu, notifications, search.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (configured at root) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test` (from root) |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Zustand store manages UI state | unit | `vitest run stores/uiStore.test.ts` | ❌ Wave 0 |
| FOUND-02 | TanStack Table renders data grid | unit | `vitest run components/data-table/DataTable.test.tsx` | ❌ Wave 0 |
| FOUND-03 | API client makes requests | integration | `vitest run lib/apiClient.test.ts` | ❌ Wave 0 |
| FOUND-04 | AppLayout renders with Sidebar | unit | `vitest run components/layout/AppLayout.test.tsx` | ❌ Wave 0 |
| FOUND-05 | Sidebar navigation works | unit | `vitest run components/layout/Sidebar.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (quick validation)
- **Per wave merge:** `npm test -- --coverage` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `client/src/__tests__/setup.ts` — test utilities and mocks
- [ ] `client/src/__tests__/stores/uiStore.test.ts` — covers FOUND-01
- [ ] `client/src/__tests__/components/data-table/DataTable.test.tsx` — covers FOUND-02
- [ ] `client/src/__tests__/lib/apiClient.test.ts` — covers FOUND-03
- [ ] `client/src/__tests__/components/layout/AppLayout.test.tsx` — covers FOUND-04
- [ ] `client/src/__tests__/components/layout/Sidebar.test.tsx` — covers FOUND-05
- [ ] Framework install: Already have Vitest at root level

---

## Sources

### Primary (HIGH confidence)
- **Zustand documentation** - https://zustand-demo.pmnd.rs/ (accessed 2026-03-07)
- **TanStack Table v8 docs** - https://tanstack.com/table/v8/docs/overview (accessed 2026-03-07)
- **Project codebase** - Existing implementation patterns in client/src/
- **STACK.md** - Technology stack research (2026-03-07)
- **ARCHITECTURE.md** - Architecture patterns research (2026-03-07)

### Secondary (MEDIUM confidence)
- **State Management in React 2025** - https://makersden.io/blog/react-state-management-in-2025
- **TanStack Table guide** - https://blog.logrocket.com/tanstack-table-formerly-react-table/
- **Zustand TypeScript setup** - https://codezup.com/simplify-state-management-zustand-typescript-react/

### Tertiary (LOW confidence)
- None — all findings verified with primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm, docs, and existing codebase
- Architecture: HIGH - Based on existing codebase + ARCHITECTURE.md research
- Pitfalls: HIGH - Common patterns from TanStack/Zustand docs + 2025 best practices

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days - stable stack)

---

## Current Client State Analysis

### What's Already Working
✅ **Routing:** wouter configured with protected routes
✅ **Authentication:** AuthContext with Telegram login, cookie-based sessions
✅ **Server State:** TanStack Query configured with custom queryFn
✅ **UI Components:** Full shadcn/ui suite (40+ components)
✅ **Layout:** Basic AppLayout and Sidebar components
✅ **API Types:** Type-safe routes via @shared/routes with Zod validation
✅ **Forms:** React Hook Form + Zod integration
✅ **Build Tool:** Vite 7 with path aliases

### What's Missing for Phase 1
❌ **Client State Management:** No Zustand stores
❌ **Data Tables:** No TanStack Table implementation
❌ **Header Component:** No separate header with user menu
❌ **Testing:** No client-side tests
❌ **Pagination:** Tables don't have pagination yet

### What Needs Enhancement
⚠️ **API Client:** Basic fetch works, but could use better error types
⚠️ **Query Keys:** Using full paths as keys (works, but could be cleaner)
⚠️ **Sidebar:** Fixed width (pl-64), could be responsive

---

## Required Dependencies to Add

```bash
cd client

# State management
npm install zustand@5.0.11

# Data tables
npm install @tanstack/react-table@8.21.3

# Testing (already have vitest at root, but need testing-library)
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Total bundle impact:** ~18KB (zustand: 3KB, tanstack-table: 15KB)

---

## Directory Structure Recommendations

### Immediate Additions (Phase 1)
```
client/src/
├── stores/                     # 🆕 Zustand stores
│   ├── uiStore.ts             # Sidebar, theme, modals
│   └── index.ts               # Public API
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # 🆕 User menu, notifications
│   │   ├── AppLayout.tsx      # ✏️ Enhance with Header
│   │   └── Sidebar.tsx        # ✏️ Make responsive
│   │
│   └── data-table/            # 🆕 Reusable table
│       ├── DataTable.tsx
│       ├── DataTablePagination.tsx
│       ├── DataTableToolbar.tsx
│       └── index.ts
│
└── __tests__/                  # 🆕 Test files
    ├── setup.ts
    ├── stores/
    │   └── uiStore.test.ts
    └── components/
        ├── layout/
        │   ├── AppLayout.test.tsx
        │   └── Sidebar.test.tsx
        └── data-table/
            └── DataTable.test.tsx
```

### Future Additions (Phase 2+)
```
client/src/
├── features/                   # Feature-based organization
│   ├── contacts/
│   │   ├── api/
│   │   │   └── contactsApi.ts
│   │   ├── hooks/
│   │   │   └── useContacts.ts # ✏️ Move from src/hooks/
│   │   ├── components/
│   │   │   └── columns.tsx    # Table columns
│   │   └── index.ts
│   └── ... (other features)
```

---

## API Client Setup Patterns

### Current Implementation
```typescript
// lib/queryClient.ts (existing)
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // HttpOnly cookies
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}
```

### Recommended Enhancement
```typescript
// lib/apiClient.ts (new file)
import { useAuth } from '@/contexts/AuthContext';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new APIError(res.status, res.statusText, text);
  }
  
  return res;
}

// Convenience methods
export const api = {
  get: (url: string) => apiRequest('GET', url),
  post: (url: string, data: unknown) => apiRequest('POST', url, data),
  put: (url: string, data: unknown) => apiRequest('PUT', url, data),
  delete: (url: string) => apiRequest('DELETE', url),
};
```

### Query Keys Factory Pattern
```typescript
// lib/queryKeys.ts (new file)
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: () => [...queryKeys.contacts.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.contacts.all, 'detail', id] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    list: () => [...queryKeys.campaigns.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.campaigns.all, 'detail', id] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: () => [...queryKeys.leads.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.leads.all, 'detail', id] as const,
  },
} as const;
```

---

## Layout Component Architecture

### Current State
- **AppLayout:** Simple wrapper with Sidebar + main content area
- **Sidebar:** Fixed width (w-64), navigation links, user info
- **No Header:** User menu is in Sidebar footer

### Recommended Enhancements

#### 1. Add Header Component
```typescript
// components/layout/Header.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore } from '@/stores/uiStore';
import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUIStore();
  
  return (
    <header className="h-16 border-b border-border/50 bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts, campaigns..." className="pl-10" />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        {/* User menu dropdown */}
      </div>
    </header>
  );
}
```

#### 2. Enhance AppLayout
```typescript
// components/layout/AppLayout.tsx (enhanced)
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-0"
      )}>
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 3. Make Sidebar Responsive
```typescript
// components/layout/Sidebar.tsx (enhanced)
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card transition-transform duration-300",
      !sidebarOpen && "-translate-x-full"
    )}>
      {/* ... existing content ... */}
    </aside>
  );
}
```

---

## Specific Implementation Notes

### 1. Zustand Store Setup
- Use `persist()` middleware for user preferences
- Keep stores small and focused (UI state only)
- Don't duplicate server state (use TanStack Query)

### 2. TanStack Table Integration
- Create reusable DataTable component with shadcn/ui styling
- Use `getPaginationRowModel()` for client-side pagination
- Prepare for server-side pagination in Phase 2 (10,000+ contacts)
- Add sorting with `getSortedRowModel()`
- Column definitions should be in feature folders (e.g., `features/contacts/columns.tsx`)

### 3. API Client Enhancement
- Keep existing cookie-based auth (no JWT needed yet)
- Add custom `APIError` class for better error handling
- Create query keys factory for cache management
- Don't add interceptors unless switching to JWT tokens

### 4. Layout Components
- Add Header component for user menu and search
- Make Sidebar responsive with Zustand state
- Use CSS transitions for smooth sidebar toggle
- Keep layout simple—no complex state needed

### 5. Testing Setup
- Create `client/src/__tests__/setup.ts` with testing-library utilities
- Test Zustand stores with simple unit tests
- Test DataTable with mock data
- Test layout components with @testing-library/react
- Use Vitest's built-in mocking (vi.fn())

### 6. Performance Considerations
- TanStack Table is already optimized for large datasets
- Zustand has minimal overhead (~3KB)
- Use React.memo for expensive table cells
- Lazy load pages with React.lazy() (Phase 2+)

---

## Ready for Planning

Research complete. The planner can now create PLAN.md files for:
- **01-01:** Project setup and dependencies (Zustand, TanStack Table, testing-library)
- **01-02:** API client and TanStack Query configuration (query keys, error handling)
- **01-03:** Layout components (Header, responsive Sidebar, enhanced AppLayout)

All findings are HIGH confidence, verified against official docs and existing codebase.
