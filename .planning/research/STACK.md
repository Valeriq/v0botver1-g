# Technology Stack

**Project:** v0botver1-g Web Interface (Email Outreach Dashboard)
**Researched:** 2026-03-07
**Mode:** Ecosystem (Stack dimension)

---

## Executive Summary

Your existing stack is **already optimal for 2025/2026**. React 19 + Vite 7 + Tailwind + Radix UI (shadcn/ui pattern) is the current best practice for dashboards. The only missing piece is **TanStack Table** for data grids. No major refactoring needed—just add what's missing.

**Confidence:** HIGH — All recommendations verified against current npm versions and 2025/2026 best practices.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React** | 19.0.0 | UI framework | Latest stable. Concurrent features, improved performance. Already installed. |
| **Vite** | 7.0.0 | Build tool | Fastest dev server, optimal DX. Already installed. |
| **TypeScript** | 5.0.0 | Type safety | Industry standard. Already installed. |
| **Tailwind CSS** | 3.4.0 | Styling | Utility-first, perfect for dashboards. Already installed. |

**Rationale:** React 19 + Vite 7 is the 2025 standard for SPAs. No changes needed.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query** | 5.90.16 | Server state | Already installed. Gold standard for API data, caching, synchronization. |
| **Zustand** | 5.0.11 | Client state | **ADD THIS.** Minimal (~3KB), no Provider, simple API. Perfect for auth, workspace selection, UI state. |

**Rationale:** 
- **Server state** (API data, contacts, emails, campaigns) → TanStack Query (already have it)
- **Client state** (auth, selected workspace, sidebar state) → Zustand (need to add)

**Why Zustand over Redux/Jotai:**
- Zustand: 18M weekly downloads, simplest API, no boilerplate
- Redux Toolkit: 15KB, overkill for this scope, declining in new projects
- Jotai: Atomic model, better for complex derived state (not needed here)

**Installation:**
```bash
npm install zustand
```

**Usage pattern:**
```typescript
// stores/authStore.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  workspace: Workspace | null
  setUser: (user: User | null) => void
  setWorkspace: (workspace: Workspace | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  setUser: (user) => set({ user }),
  setWorkspace: (workspace) => set({ workspace }),
}))
```

**Confidence:** HIGH — Zustand is the 2025/2026 standard for client state. Verified via npm trends and multiple 2026 articles.

---

### Routing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **wouter** | 3.9.0 | Client-side routing | Already installed. Lightweight (~1.5KB), sufficient for dashboard. |

**Rationale:**
- **Keep wouter** for now. It's already installed and sufficient for a simple dashboard with ~5-10 routes.
- **Alternative:** React Router 7.13.1 if you need nested routes, loaders, or more complex patterns later.

**Why wouter over React Router:**
- wouter: 1.5KB, zero config, perfect for simple SPAs
- React Router 7: 12KB, more features (loaders, error boundaries, nested routes)
- TanStack Router: Better TypeScript, but overkill for this scope

**When to switch to React Router:**
- Need nested layouts with data loaders
- Complex route guards/permissions
- File-based routing

**Confidence:** HIGH — wouter is sufficient for current scope. React Router 7 is the upgrade path if needed.

---

### Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query** | 5.90.16 | Server state management | Already installed. Handles caching, refetching, pagination, mutations. |

**Rationale:** TanStack Query is the 2025/2026 standard. No changes needed.

**Best practices for your dashboard:**
```typescript
// Query keys pattern
export const queryKeys = {
  contacts: (workspaceId: string, page: number) => ['contacts', workspaceId, page] as const,
  emails: (workspaceId: string, filters: EmailFilters) => ['emails', workspaceId, filters] as const,
  threads: (contactId: string) => ['threads', contactId] as const,
}

// Usage
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.contacts(workspaceId, page),
  queryFn: () => fetchContacts(workspaceId, page),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**Key patterns:**
- **Query keys factory:** Centralized query key management
- **Stale time:** 5 minutes for dashboard data (reduces refetches)
- **Pagination:** Use `useInfiniteQuery` for contact lists
- **Optimistic updates:** For lead status changes

**Confidence:** HIGH — TanStack Query 5.x is the current standard. Already installed.

---

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Radix UI** | Various | Headless primitives | Already installed (full suite). Accessible, unstyled, perfect foundation. |
| **shadcn/ui pattern** | — | Component system | Already set up (CVA, clsx, tailwind-merge). Copy-paste components, full control. |
| **Lucide React** | 0.562.0 | Icons | Already installed. Modern, tree-shakeable. |
| **Framer Motion** | 12.26.2 | Animations | Already installed. For transitions, modals. |

**Rationale:** Your UI setup is already the 2025/2026 standard. No changes needed.

**Why shadcn/ui pattern over MUI/Chakra:**
- **shadcn/ui:** Copy-paste, full control, Tailwind-native, 0 runtime cost
- **MUI:** 300KB+, Material Design lock-in, harder to customize
- **Chakra UI:** Good DX but adds runtime overhead, less Tailwind-native

**What you have:**
- ✅ Full Radix UI suite (dialogs, dropdowns, popovers, etc.)
- ✅ shadcn/ui utilities (CVA, clsx, tailwind-merge)
- ✅ Tailwind animations plugin
- ✅ Dark mode support (class-based)

**Confidence:** HIGH — shadcn/ui + Radix is the 2025/2026 standard for Tailwind projects.

---

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Hook Form** | 7.71.0 | Form state management | Already installed. Best performance, minimal re-renders. |
| **Zod** | 3.25.76 | Schema validation | Already installed. TypeScript-first, runtime + type safety. |
| **@hookform/resolvers** | 5.2.2 | Integration bridge | Already installed. Connects Zod to RHF. |

**Rationale:** This is the 2025/2026 gold standard. No changes needed.

**Best practices:**
```typescript
// schemas/templateSchema.ts
import { z } from 'zod'

export const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
})

export type TemplateFormData = z.infer<typeof templateSchema>

// components/TemplateForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormData>({
  resolver: zodResolver(templateSchema),
})
```

**Why this stack:**
- **React Hook Form:** Uncontrolled inputs, best performance, no unnecessary re-renders
- **Zod:** Single source of truth for types + validation
- **Integration:** Seamless via @hookform/resolvers

**Confidence:** HIGH — RHF + Zod is the 2025/2026 standard. Already installed.

---

### Tables & Pagination

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Table** | 8.21.3 | Headless table logic | **ADD THIS.** Industry standard, 15.2KB, full control over UI. |

**Rationale:** You need a table library for contacts, emails, leads. TanStack Table is the 2025 standard.

**Why TanStack Table over AG Grid:**
- **TanStack Table:** 15.2KB, headless (you control UI), MIT license, perfect for dashboards
- **AG Grid:** 298KB, batteries-included, MIT + $999/year for enterprise features

**Installation:**
```bash
npm install @tanstack/react-table
```

**Usage pattern:**
```typescript
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

const table = useReactTable({
  data: contacts,
  columns: contactColumns,
  getCoreRowModel: getCoreRowModel(),
})

// Render with your shadcn/ui components
<table>
  <thead>
    {table.getHeaderGroups().map(headerGroup => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map(header => (
          <th key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        ))}
      </tr>
    ))}
  </thead>
  <tbody>
    {table.getRowModel().rows.map(row => (
      <tr key={row.id}>
        {row.getVisibleCells().map(cell => (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

**Features you'll use:**
- Sorting
- Filtering
- Pagination (server-side via TanStack Query)
- Column visibility
- Row selection

**Confidence:** HIGH — TanStack Table 8.x is the 2025 standard. Verified via npm and multiple 2025 articles.

---

### Charts & Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Recharts** | 3.6.0 | Charts | Already installed. Simple, composable, React-native. |

**Rationale:** Recharts is sufficient for dashboard charts. No changes needed.

**Note:** Charts are out of scope for v1 (per PROJECT.md), but you have Recharts ready if needed later.

**Confidence:** MEDIUM — Recharts is good, but TanStack Charts is emerging. For v1, Recharts is fine.

---

### Date Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **date-fns** | 4.1.0 | Date utilities | Already installed. Modular, tree-shakeable, modern. |

**Rationale:** date-fns is the 2025 standard. No changes needed.

**Confidence:** HIGH — date-fns is the current standard over Moment.js.

---

### Excel Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **xlsx** | 0.18.5 | Excel export | Already installed. For exporting contacts, email reports. |

**Rationale:** xlsx (SheetJS) is the standard for Excel generation. No changes needed.

**Confidence:** HIGH — xlsx is the industry standard.

---

## What to Avoid

| Technology | Why Avoid | What to Use Instead |
|------------|-----------|-------------------|
| **Redux / Redux Toolkit** | Overkill for this scope. 15KB, boilerplate, declining usage in new projects. | Zustand for client state, TanStack Query for server state |
| **AG Grid** | 298KB bundle, overkill for simple tables. Enterprise features require paid license. | TanStack Table (15KB, headless, MIT) |
| **Formik** | Slower, more re-renders, outdated patterns. | React Hook Form (already installed) |
| **Moment.js** | Large bundle, mutable API, legacy. | date-fns (already installed) |
| **MUI / Material UI** | 300KB+, Material Design lock-in, harder to customize with Tailwind. | shadcn/ui pattern (already set up) |
| **Chakra UI** | Runtime overhead, less Tailwind-native than shadcn/ui. | shadcn/ui pattern (already set up) |
| **React Router (if not needed)** | 12KB, unnecessary if wouter suffices. | Keep wouter (already installed) |
| **Axios** | Unnecessary abstraction over fetch. | Native fetch with TanStack Query |

---

## Installation Summary

### Add These

```bash
# State management (client state)
npm install zustand

# Tables
npm install @tanstack/react-table
```

### Already Have (No Changes)

```bash
# Core
react@19.0.0
vite@7.0.0
typescript@5.0.0
tailwindcss@3.4.0

# Server state
@tanstack/react-query@5.90.16

# Routing
wouter@3.9.0

# UI
@radix-ui/* (full suite)
lucide-react@0.562.0
framer-motion@12.26.2
class-variance-authority@0.7.1
clsx@2.1.1
tailwind-merge@3.4.0

# Forms
react-hook-form@7.71.0
zod@3.25.76
@hookform/resolvers@5.2.2

# Charts
recharts@3.6.0

# Utilities
date-fns@4.1.0
xlsx@0.18.5
```

---

## Architecture Notes

### State Separation

```
┌─────────────────────────────────────────┐
│           Server State                   │
│  (API data, cached, synchronized)       │
│  → TanStack Query                        │
│  - Contacts, emails, campaigns           │
│  - Leads, threads                        │
│  - Gmail accounts                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Client State                   │
│  (UI state, auth, selections)           │
│  → Zustand                               │
│  - Current user                          │
│  - Selected workspace                    │
│  - Sidebar state                         │
│  - Modal state                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           URL State                      │
│  (Filters, pagination, search)          │
│  → URL search params                     │
│  - Active filters                        │
│  - Current page                          │
│  - Search query                          │
└─────────────────────────────────────────┘
```

### Data Flow

```
User action → Zustand (UI state)
            → TanStack Query (server sync)
            → URL params (shareable state)
```

---

## Sources

**State Management:**
- "State Management in React 2026: Redux vs Zustand vs Jotai" — https://teachmeidea.com/state-management-react-2026/
- "State Management in 2026: Zustand vs Jotai vs Redux Toolkit vs Signals" — https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge
- npm trends: Zustand 18M weekly downloads vs Redux 9M (declining)

**Routing:**
- "TanStack Router vs React Router: Which One Fits Your App?" — https://reliasoftware.com/blog/tanstack-router-vs-react-router
- "TanStack Router vs React Router" — https://betterstack.com/community/comparisons/tanstack-router-vs-react-router

**Tables:**
- "TanStack Table vs AG Grid: Complete Comparison (2025)" — https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison
- "5 Best React Data Grid Libraries Every Developer Should Know in 2025" — https://medium.com/syncfusion/5-best-react-data-grid-libraries-every-developer-should-know-in-2025-657afad08dd8

**UI Components:**
- "Best React UI Library 2026: MUI vs Chakra vs Shadcn" — https://www.latestly.in/post/best-react-ui-library-2026-mui-vs-chakra-vs-shadcn
- "Shadcn/ui vs Chakra UI vs Material-UI: Component Battle 2025" — https://asepalazhari.com/blog/shadcn-ui-vs-chakra-ui-vs-material-ui-component-battle-2025

**Forms:**
- "Stop Writing Messy Form Validation Use React Hook Form + Zod Instead" — https://medium.com/@nuwandarshana2012/stop-writing-messy-form-validation-use-react-hook-form-zod-instead-f48a51fd48c7
- "Form Validation in React with Zod and React Hook Form" — https://blog.nashtechglobal.com/form-validation-in-react-with-zod-and-react-hook-form/

**Data Fetching:**
- "TanStack Query v5: The Complete Guide to Mastering Server State in React" — https://medium.com/@learning.anand01/tanstack-query-v5-the-complete-guide-to-mastering-server-state-in-react-cbc1905a3095
- "TanStack Query: Complete Guide to Advanced Patterns and Best Practices" — https://codingjournal.dev/post/tanstack-query-complete-guide-advanced-patterns-and-best-practices

**Version Verification:**
- npm registry (react-router-dom@7.13.1, @tanstack/react-table@8.21.3, zustand@5.0.11, @tanstack/react-query@5.90.21)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Core Framework | HIGH | React 19 + Vite 7 is 2025 standard. Already installed. |
| State Management | HIGH | Zustand is 2025/2026 standard (18M downloads). TanStack Query already installed. |
| Routing | HIGH | wouter sufficient for scope. React Router 7 is upgrade path. |
| Data Fetching | HIGH | TanStack Query 5.x is the gold standard. Already installed. |
| UI Components | HIGH | shadcn/ui + Radix is 2025/2026 standard. Already set up. |
| Forms | HIGH | RHF + Zod is the gold standard. Already installed. |
| Tables | HIGH | TanStack Table 8.x is the standard. Need to add. |
| Charts | MEDIUM | Recharts is good, but TanStack Charts is emerging. Fine for v1. |

---

## Next Steps

1. **Install missing dependencies:**
   ```bash
   npm install zustand @tanstack/react-table
   ```

2. **Set up Zustand stores:**
   - `stores/authStore.ts` — User, workspace, authentication
   - `stores/uiStore.ts` — Sidebar, modals, theme

3. **Set up TanStack Query:**
   - `lib/queryClient.ts` — Query client with defaults
   - `lib/queryKeys.ts` — Centralized query key factory

4. **Set up TanStack Table:**
   - Create reusable table component with shadcn/ui styling
   - Implement pagination with TanStack Query integration

5. **No refactoring needed** — Your existing stack is already optimal.

---

*Last updated: 2026-03-07*
