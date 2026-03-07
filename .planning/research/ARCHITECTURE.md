# Architecture Patterns: React Dashboard with Microservices Integration

**Domain:** Email outreach SaaS dashboard
**Researched:** 2026-03-07
**Confidence:** HIGH (based on existing codebase + current best practices)

---

## Executive Summary

This document defines the architecture for integrating a React dashboard with the existing microservices backend. The system follows a **layered architecture** with clear separation between UI, state management, API integration, and backend services. The architecture prioritizes maintainability, scalability, and developer experience while leveraging existing infrastructure.

**Key Architectural Decisions:**
1. **Feature-based organization** over type-based folders
2. **TanStack Query** for server state management (already in place)
3. **Custom hooks pattern** to isolate API logic from components
4. **API service layer** for centralized request handling
5. **Component composition** with container/presentational separation

---

## 1. Frontend Architecture Pattern

### Recommended Pattern: Feature-Sliced Design (FSD) Lite

The architecture follows a simplified Feature-Sliced Design approach, organizing code by business features rather than technical layers. This enables:
- **High cohesion**: Related code stays together
- **Low coupling**: Features communicate through well-defined APIs
- **Scalability**: New features don't affect existing ones
- **Team autonomy**: Different developers can work on different features

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     APP LAYER                               │
│  (Providers, Router, Global Config, Error Boundaries)      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    PAGES LAYER                              │
│  (Route-level components, Page composition)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   FEATURES LAYER                            │
│  (Business capabilities: Contacts, Campaigns, Leads, etc.)  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    SHARED LAYER                             │
│  (UI Kit, Utilities, API Client, Types, Hooks)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

### Recommended Structure

```
client/src/
├── app/                          # App layer - global configuration
│   ├── providers/
│   │   ├── QueryProvider.tsx     # TanStack Query provider
│   │   ├── AuthProvider.tsx      # Authentication context
│   │   └── ThemeProvider.tsx     # Theme/dark mode
│   ├── router/
│   │   ├── AppRouter.tsx         # Main router configuration
│   │   └── ProtectedRoute.tsx    # Auth guard component
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
│
├── pages/                        # Page layer - route components
│   ├── dashboard/
│   │   ├── DashboardPage.tsx     # Main dashboard view
│   │   ├── DashboardStats.tsx   # Stats widget
│   │   └── index.ts              # Public API
│   ├── contacts/
│   │   ├── ContactsPage.tsx      # Contacts list view
│   │   ├── ContactTable.tsx      # Table component
│   │   ├── ContactUploadDialog.tsx
│   │   └── index.ts
│   ├── campaigns/
│   │   ├── CampaignsPage.tsx
│   │   ├── CampaignList.tsx
│   │   ├── CampaignWizard.tsx   # Multi-step form
│   │   └── index.ts
│   ├── leads/
│   │   ├── LeadsPage.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── ThreadView.tsx        # Email thread display
│   │   └── index.ts
│   ├── gmail-accounts/
│   │   ├── GmailAccountsPage.tsx
│   │   ├── AccountCard.tsx
│   │   ├── OAuthCallback.tsx     # OAuth redirect handler
│   │   └── index.ts
│   ├── ai-profiles/
│   │   ├── AIProfilesPage.tsx
│   │   ├── ProfileEditor.tsx
│   │   └── index.ts
│   └── auth/
│       ├── LoginPage.tsx
│       └── index.ts
│
├── features/                     # Feature layer - business logic
│   ├── contacts/
│   │   ├── api/
│   │   │   ├── contactsApi.ts    # API functions
│   │   │   └── contactsKeys.ts   # Query keys factory
│   │   ├── hooks/
│   │   │   ├── useContacts.ts    # List contacts
│   │   │   ├── useCreateContact.ts
│   │   │   ├── useDeleteContact.ts
│   │   │   └── useUploadContacts.ts
│   │   ├── types/
│   │   │   └── contacts.types.ts
│   │   └── index.ts              # Public API
│   ├── campaigns/
│   │   ├── api/
│   │   │   ├── campaignsApi.ts
│   │   │   └── campaignsKeys.ts
│   │   ├── hooks/
│   │   │   ├── useCampaigns.ts
│   │   │   ├── useCreateCampaign.ts
│   │   │   ├── useStartCampaign.ts
│   │   │   └── useCampaignStats.ts
│   │   ├── components/
│   │   │   ├── CampaignStatus.tsx
│   │   │   └── CampaignProgress.tsx
│   │   ├── types/
│   │   │   └── campaigns.types.ts
│   │   └── index.ts
│   ├── leads/
│   │   ├── api/
│   │   │   ├── leadsApi.ts
│   │   │   └── leadsKeys.ts
│   │   ├── hooks/
│   │   │   ├── useLeads.ts
│   │   │   ├── useUpdateLeadStatus.ts
│   │   │   └── useLeadThread.ts
│   │   ├── types/
│   │   │   └── leads.types.ts
│   │   └── index.ts
│   ├── gmail-accounts/
│   │   ├── api/
│   │   │   ├── gmailApi.ts
│   │   │   └── gmailKeys.ts
│   │   ├── hooks/
│   │   │   ├── useGmailAccounts.ts
│   │   │   ├── useAddGmailAccount.ts
│   │   │   └── useRemoveGmailAccount.ts
│   │   ├── types/
│   │   │   └── gmail.types.ts
│   │   └── index.ts
│   └── auth/
│       ├── api/
│       │   └── authApi.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useLogin.ts
│       │   └── useLogout.ts
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── types/
│       │   └── auth.types.ts
│       └── index.ts
│
├── shared/                       # Shared layer - reusable utilities
│   ├── api/
│   │   ├── apiClient.ts          # Axios/fetch instance with interceptors
│   │   ├── apiConfig.ts          # Base URL, endpoints map
│   │   └── apiUtils.ts           # Error handling, transformers
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── ... (all UI primitives)
│   ├── components/               # Shared composite components
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Main layout with sidebar
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── data-display/
│   │   │   ├── DataTable.tsx     # Generic table with sorting/pagination
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── feedback/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Toast.tsx
│   │   └── forms/
│   │       ├── FormField.tsx
│   │       └── FileUpload.tsx
│   ├── hooks/                    # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── utils.ts              # Utility functions
│   │   ├── constants.ts          # App constants
│   │   └── validators.ts         # Zod schemas
│   ├── types/
│   │   ├── common.types.ts       # Shared types
│   │   └── api.types.ts          # API response types
│   └── index.ts                  # Public API
│
└── assets/                       # Static assets
    ├── images/
    ├── fonts/
    └── icons/
```

### Key Principles

1. **Feature Isolation**: Each feature is self-contained with its own API, hooks, types, and components
2. **Public API Pattern**: Each module exports only what's needed via `index.ts`
3. **Colocation**: Related files live together (API, hooks, types, components)
4. **Shared Layer**: Truly reusable utilities and components, not feature-specific

---

## 3. Component Hierarchy

### Component Categories

#### 1. **Page Components** (Route-level)
- **Responsibility**: Compose features, handle routing params, manage page-level state
- **Examples**: `DashboardPage`, `ContactsPage`, `CampaignsPage`
- **Pattern**: Container components that orchestrate child components

```typescript
// pages/contacts/ContactsPage.tsx
export function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: contacts, isLoading } = useContacts({ search: searchQuery });
  
  return (
    <AppLayout>
      <PageHeader title="Contacts" />
      <ContactSearch value={searchQuery} onChange={setSearchQuery} />
      <ContactTable contacts={contacts} isLoading={isLoading} />
    </AppLayout>
  );
}
```

#### 2. **Feature Components** (Business logic)
- **Responsibility**: Implement specific business features
- **Examples**: `ContactTable`, `CampaignWizard`, `ThreadView`
- **Pattern**: Smart components with hooks integration

```typescript
// features/contacts/components/ContactTable.tsx
export function ContactTable({ contacts }: ContactTableProps) {
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  
  const handleDelete = (id: string) => {
    deleteContact.mutate(id, {
      onSuccess: () => toast({ title: "Contact deleted" })
    });
  };
  
  return (
    <DataTable
      data={contacts}
      columns={columns}
      actions={(row) => (
        <Button onClick={() => handleDelete(row.id)}>Delete</Button>
      )}
    />
  );
}
```

#### 3. **UI Components** (Presentational)
- **Responsibility**: Render UI, handle user interactions, no business logic
- **Examples**: `Button`, `Card`, `Table`, `Dialog`
- **Pattern**: Dumb components with props-driven rendering

```typescript
// shared/ui/button.tsx
export function Button({ variant, size, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### 4. **Layout Components**
- **Responsibility**: Define page structure, navigation, responsive behavior
- **Examples**: `AppLayout`, `Sidebar`, `Header`
- **Pattern**: Wrapper components with slots

```typescript
// shared/components/layout/AppLayout.tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### Component Communication

```
┌──────────────────────────────────────────────────────────────┐
│                     Page Component                           │
│  - Manages page state                                         │
│  - Composes feature components                                │
│  - Handles routing                                            │
└──────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Feature    │ │  Feature    │ │  Feature    │
│ Component   │ │ Component   │ │ Component   │
│             │ │             │ │             │
│ - Uses      │ │ - Uses      │ │ - Uses      │
│   hooks     │ │   hooks     │ │   hooks     │
│ - Business  │ │ - Business  │ │ - Business  │
│   logic     │ │   logic     │ │   logic     │
└─────────────┘ └─────────────┘ └─────────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     UI Components                            │
│  - Pure presentational                                        │
│  - Props-driven                                               │
│  - No business logic                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. API Integration Layer

### Architecture Overview

The API integration layer follows a **three-tier architecture**:

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                           │
│  (React components call hooks, not API directly)            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      HOOK LAYER                              │
│  (Custom hooks wrap TanStack Query, handle caching)         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  (API functions with typed requests/responses)              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   HTTP CLIENT LAYER                          │
│  (Axios/fetch instance with interceptors)                   │
└──────────────────────────────────────────────────────────────┘
```

### Layer 1: HTTP Client (shared/api/apiClient.ts)

**Purpose**: Centralized HTTP client with interceptors for auth, logging, error handling

```typescript
// shared/api/apiClient.ts
import axios from 'axios';
import { tokenService } from './token-service';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Layer 2: Service Layer (features/*/api/*Api.ts)

**Purpose**: Type-safe API functions with request/response typing

```typescript
// features/contacts/api/contactsApi.ts
import { apiClient } from '@/shared/api/apiClient';
import type { Contact, CreateContactInput, PaginatedResponse } from '../types';

export const contactsApi = {
  list: async (params: { workspace_id: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Contact>>('/contacts', { params });
    return data;
  },
  
  create: async (contact: CreateContactInput) => {
    const { data } = await apiClient.post<Contact>('/contacts', contact);
    return data;
  },
  
  delete: async (id: string) => {
    await apiClient.delete(`/contacts/${id}`);
  },
  
  uploadFile: async (file: File, workspaceId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);
    
    const { data } = await apiClient.post<{ uploaded: number; skipped: number }>(
      '/contacts/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
```

### Layer 3: Query Keys Factory (features/*/api/*Keys.ts)

**Purpose**: Centralized query key management for cache control

```typescript
// features/contacts/api/contactsKeys.ts
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters: ContactFilters) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};
```

### Layer 4: Custom Hooks (features/*/hooks/use*.ts)

**Purpose**: Wrap TanStack Query with feature-specific logic

```typescript
// features/contacts/hooks/useContacts.ts
import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '../api/contactsApi';
import { contactsKeys } from '../api/contactsKeys';
import type { ContactFilters } from '../types';

export function useContacts(filters: ContactFilters) {
  return useQuery({
    queryKey: contactsKeys.list(filters),
    queryFn: () => contactsApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// features/contacts/hooks/useCreateContact.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../api/contactsApi';
import { contactsKeys } from '../api/contactsKeys';
import { useToast } from '@/shared/hooks/useToast';

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      toast({ title: 'Contact created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create contact', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}
```

### Integration with Existing Backend

**Current Backend Endpoints** (from core-api):
- `GET /api/contacts` - List contacts (paginated)
- `POST /api/contacts/upload` - Upload CSV/TSV
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/leads` - List leads
- `GET /api/gmail-accounts` - List Gmail accounts
- `GET /api/prompt-profiles` - List AI profiles

**API Client Configuration**:
```typescript
// shared/api/apiConfig.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  endpoints: {
    contacts: {
      list: '/api/contacts',
      upload: '/api/contacts/upload',
      delete: (id: string) => `/api/contacts/${id}`,
    },
    campaigns: {
      list: '/api/campaigns',
      create: '/api/campaigns',
      get: (id: string) => `/api/campaigns/${id}`,
    },
    leads: {
      list: '/api/leads',
      update: (id: string) => `/api/leads/${id}`,
    },
    gmailAccounts: {
      list: '/api/gmail-accounts',
      add: '/api/gmail-accounts/add',
      remove: (id: string) => `/api/gmail-accounts/${id}`,
    },
    promptProfiles: {
      list: '/api/prompt-profiles',
      create: '/api/prompt-profiles',
    },
  },
};
```

---

## 5. State Management Flow

### State Categories

The application manages three distinct types of state:

#### 1. **Server State** (Remote Data)
**Managed by**: TanStack Query
**Examples**: Contacts, campaigns, leads, Gmail accounts

```typescript
// Server state is managed by TanStack Query
const { data: contacts, isLoading } = useContacts({ workspace_id: '123' });

// Mutations automatically invalidate cache
const createContact = useCreateContact();
createContact.mutate(newContact); // Auto-refetches contacts list
```

**Why TanStack Query**:
- Automatic caching and background refetching
- Built-in loading/error states
- Optimistic updates
- Request deduplication
- Stale-while-revalidate pattern

#### 2. **Client State** (Local UI State)
**Managed by**: React useState/useReducer
**Examples**: Form inputs, modal visibility, filters, pagination

```typescript
// Local state stays in components
const [searchQuery, setSearchQuery] = useState('');
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState('all');
```

#### 3. **Global Client State** (Shared UI State)
**Managed by**: Zustand or React Context
**Examples**: User session, theme, sidebar state, notifications

```typescript
// Global UI state with Zustand (if needed)
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTION                              │
│                  (Click, form submit, etc.)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                              │
│  - Updates local state (useState)                               │
│  - Calls mutation hook (TanStack Query)                         │
│  - Updates global state (Zustand/Context)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │   Local   │  │  Server   │  │  Global   │
        │   State   │  │   State   │  │   State   │
        │           │  │           │  │           │
        │ useState  │  │ TanStack  │  │  Zustand  │
        │ useReducer│  │   Query   │  │  Context  │
        └───────────┘  └───────────┘  └───────────┘
                │             │             │
                │             │             │
                │             ▼             │
                │      ┌─────────────┐       │
                │      │  API Layer  │       │
                │      │             │       │
                │      │  - Fetch    │       │
                │      │  - Cache    │       │
                │      │  - Retry    │       │
                │      └─────────────┘       │
                │             │             │
                └─────────────┼─────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       UI RE-RENDER                              │
│  (Components update based on new state)                         │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Each State Type

| State Type | When to Use | Example |
|------------|-------------|---------|
| **Server State** | Data from API, needs caching | Contacts list, campaign data |
| **Local State** | Component-specific, not shared | Form input, dropdown open state |
| **Global State** | Shared across multiple features | User session, theme, notifications |

---

## 6. Data Flow Diagram

### Complete Data Flow: Contact Upload Example

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS CSV FILE                                         │
│    (ContactUploadDialog component)                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. COMPONENT CALLS HOOK                                          │
│    const uploadMutation = useUploadContacts()                    │
│    uploadMutation.mutate(file)                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. TANSTACK QUERY HANDLES MUTATION                               │
│    - Shows loading state                                         │
│    - Calls mutation function                                     │
│    - Handles success/error                                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. API SERVICE MAKES REQUEST                                     │
│    contactsApi.uploadFile(file, workspaceId)                     │
│    - Creates FormData                                            │
│    - POSTs to /api/contacts/upload                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. HTTP CLIENT SENDS REQUEST                                     │
│    apiClient.post()                                              │
│    - Adds auth header                                            │
│    - Sends to http://localhost:3000/api/contacts/upload          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. CORE-API SERVICE RECEIVES                                     │
│    POST /api/contacts/upload                                     │
│    - Validates workspace_id                                      │
│    - Parses CSV                                                  │
│    - Inserts contacts into PostgreSQL                            │
│    - Returns { uploaded: 50, skipped: 5, errors: [...] }         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE RETURNS TO FRONTEND                                  │
│    - HTTP client receives response                               │
│    - API service returns data                                    │
│    - TanStack Query caches result                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. SUCCESS CALLBACK EXECUTES                                     │
│    onSuccess: (data) => {                                        │
│      queryClient.invalidateQueries(['contacts'])                 │
│      toast({ title: `Uploaded ${data.uploaded} contacts` })      │
│    }                                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. CACHE INVALIDATION TRIGGERS REFETCH                           │
│    - Contacts list query refetches                               │
│    - UI updates with new contacts                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 10. USER SEES UPDATED CONTACTS LIST                             │
│     (ContactTable re-renders with new data)                      │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Campaign Creation

```
User fills form
      │
      ▼
CampaignWizard component
      │
      ▼
useCreateCampaign hook
      │
      ▼
TanStack Query mutation
      │
      ▼
campaignsApi.create(campaignData)
      │
      ▼
POST /api/campaigns → core-api
      │
      ▼
PostgreSQL: INSERT INTO campaigns
      │
      ▼
Response: { id, status, ... }
      │
      ▼
onSuccess: invalidateQueries(['campaigns'])
      │
      ▼
Campaigns list refetches
      │
      ▼
User sees new campaign in list
```

### Real-time Data Flow: Lead Notifications

```
Gmail receives reply
      │
      ▼
Gmail Service webhook
      │
      ▼
Worker: classify job
      │
      ▼
AI Orchestrator: classify reply
      │
      ▼
PostgreSQL: INSERT INTO leads
      │
      ▼
Worker: notify job
      │
      ▼
Telegram Bot: notification
      │
      ▼
[Future] WebSocket to React app
      │
      ▼
TanStack Query: invalidateQueries(['leads'])
      │
      ▼
Leads list updates in real-time
```

---

## 7. Build Order Recommendations

### Phase 1: Foundation (Week 1)

**Goal**: Establish core architecture and shared infrastructure

#### 1.1 Setup Project Structure
- [ ] Create feature-based directory structure
- [ ] Configure path aliases in `tsconfig.json`
- [ ] Setup shared API client with interceptors
- [ ] Configure TanStack Query with proper defaults

**Files to create**:
```
client/src/
├── app/
│   ├── providers/
│   └── router/
├── shared/
│   ├── api/
│   │   ├── apiClient.ts
│   │   └── apiConfig.ts
│   ├── ui/ (existing shadcn components)
│   └── lib/
│       └── utils.ts
```

**Dependencies**: None

#### 1.2 Authentication Layer
- [ ] Implement AuthContext with workspace scoping
- [ ] Create ProtectedRoute component
- [ ] Setup token management
- [ ] Add login/logout functionality

**Files to create**:
```
client/src/
├── features/auth/
│   ├── api/
│   │   └── authApi.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useLogin.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── types/
│       └── auth.types.ts
├── pages/auth/
│   └── LoginPage.tsx
└── app/router/
    └── ProtectedRoute.tsx
```

**Dependencies**: API client setup

#### 1.3 Layout Components
- [ ] Create AppLayout with responsive sidebar
- [ ] Build Header with user menu
- [ ] Implement mobile-responsive navigation

**Files to create**:
```
client/src/shared/components/layout/
├── AppLayout.tsx
├── Sidebar.tsx
├── Header.tsx
└── MobileNav.tsx
```

**Dependencies**: AuthContext (for user info in header)

---

### Phase 2: Core Features (Week 2)

**Goal**: Implement primary business features

#### 2.1 Contacts Feature
- [ ] Create contacts API service
- [ ] Implement contacts hooks (list, create, delete, upload)
- [ ] Build ContactsPage with table
- [ ] Add CSV upload functionality
- [ ] Implement search/filter

**Files to create**:
```
client/src/
├── features/contacts/
│   ├── api/
│   │   ├── contactsApi.ts
│   │   └── contactsKeys.ts
│   ├── hooks/
│   │   ├── useContacts.ts
│   │   ├── useCreateContact.ts
│   │   ├── useDeleteContact.ts
│   │   └── useUploadContacts.ts
│   ├── components/
│   │   ├── ContactTable.tsx
│   │   ├── ContactUploadDialog.tsx
│   │   └── ContactSearch.tsx
│   ├── types/
│   │   └── contacts.types.ts
│   └── index.ts
├── pages/contacts/
│   ├── ContactsPage.tsx
│   └── index.ts
```

**Dependencies**: Auth (workspace_id), Layout components

#### 2.2 Campaigns Feature
- [ ] Create campaigns API service
- [ ] Implement campaigns hooks
- [ ] Build CampaignsPage with list view
- [ ] Create campaign creation wizard
- [ ] Add campaign status indicators

**Files to create**:
```
client/src/
├── features/campaigns/
│   ├── api/
│   │   ├── campaignsApi.ts
│   │   └── campaignsKeys.ts
│   ├── hooks/
│   │   ├── useCampaigns.ts
│   │   ├── useCreateCampaign.ts
│   │   ├── useStartCampaign.ts
│   │   └── useCampaignStats.ts
│   ├── components/
│   │   ├── CampaignList.tsx
│   │   ├── CampaignWizard.tsx
│   │   ├── CampaignStatus.tsx
│   │   └── CampaignProgress.tsx
│   ├── types/
│   │   └── campaigns.types.ts
│   └── index.ts
├── pages/campaigns/
│   ├── CampaignsPage.tsx
│   └── index.ts
```

**Dependencies**: Contacts (for recipient selection), AI Profiles (for prompt selection)

#### 2.3 AI Profiles Feature
- [ ] Create AI profiles API service
- [ ] Implement profiles hooks
- [ ] Build AIProfilesPage
- [ ] Create profile editor with template variables

**Files to create**:
```
client/src/
├── features/ai-profiles/
│   ├── api/
│   │   ├── profilesApi.ts
│   │   └── profilesKeys.ts
│   ├── hooks/
│   │   ├── useProfiles.ts
│   │   ├── useCreateProfile.ts
│   │   └── useUpdateProfile.ts
│   ├── components/
│   │   ├── ProfileList.tsx
│   │   ├── ProfileEditor.tsx
│   │   └── TemplateVariables.tsx
│   ├── types/
│   │   └── profiles.types.ts
│   └── index.ts
├── pages/ai-profiles/
│   ├── AIProfilesPage.tsx
│   └── index.ts
```

**Dependencies**: Auth (workspace_id)

---

### Phase 3: Advanced Features (Week 3)

**Goal**: Complete remaining features and polish

#### 3.1 Leads Feature
- [ ] Create leads API service
- [ ] Implement leads hooks
- [ ] Build LeadsPage with status filters
- [ ] Create ThreadView component for email history
- [ ] Add lead status actions (take, close)

**Files to create**:
```
client/src/
├── features/leads/
│   ├── api/
│   │   ├── leadsApi.ts
│   │   └── leadsKeys.ts
│   ├── hooks/
│   │   ├── useLeads.ts
│   │   ├── useUpdateLeadStatus.ts
│   │   └── useLeadThread.ts
│   ├── components/
│   │   ├── LeadsList.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── ThreadView.tsx
│   │   └── LeadStatusBadge.tsx
│   ├── types/
│   │   └── leads.types.ts
│   └── index.ts
├── pages/leads/
│   ├── LeadsPage.tsx
│   └── index.ts
```

**Dependencies**: Auth (workspace_id)

#### 3.2 Gmail Accounts Feature
- [ ] Create Gmail API service
- [ ] Implement accounts hooks
- [ ] Build GmailAccountsPage
- [ ] Create OAuth flow integration
- [ ] Add account status indicators

**Files to create**:
```
client/src/
├── features/gmail-accounts/
│   ├── api/
│   │   ├── gmailApi.ts
│   │   └── gmailKeys.ts
│   ├── hooks/
│   │   ├── useGmailAccounts.ts
│   │   ├── useAddGmailAccount.ts
│   │   └── useRemoveGmailAccount.ts
│   ├── components/
│   │   ├── AccountsList.tsx
│   │   ├── AccountCard.tsx
│   │   ├── AccountStatus.tsx
│   │   └── OAuthCallback.tsx
│   ├── types/
│   │   └── gmail.types.ts
│   └── index.ts
├── pages/gmail-accounts/
│   ├── GmailAccountsPage.tsx
│   └── index.ts
```

**Dependencies**: Auth (workspace_id), OAuth callback route

#### 3.3 Dashboard Feature
- [ ] Create dashboard API service (aggregates data)
- [ ] Implement dashboard hooks
- [ ] Build DashboardPage with stats
- [ ] Add recent activity feed
- [ ] Create quick action buttons

**Files to create**:
```
client/src/
├── features/dashboard/
│   ├── api/
│   │   ├── dashboardApi.ts
│   │   └── dashboardKeys.ts
│   ├── hooks/
│   │   ├── useDashboardStats.ts
│   │   └── useRecentActivity.ts
│   ├── components/
│   │   ├── StatsGrid.tsx
│   │   ├── StatCard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── QuickActions.tsx
│   ├── types/
│   │   └── dashboard.types.ts
│   └── index.ts
├── pages/dashboard/
│   ├── DashboardPage.tsx
│   └── index.ts
```

**Dependencies**: All other features (aggregates data)

---

### Phase 4: Polish & Optimization (Week 4)

**Goal**: Performance optimization and UX improvements

#### 4.1 Performance Optimization
- [ ] Implement route-based code splitting
- [ ] Add React.memo to expensive components
- [ ] Optimize TanStack Query caching strategies
- [ ] Implement optimistic updates for mutations
- [ ] Add loading skeletons

#### 4.2 Error Handling
- [ ] Create ErrorBoundary components
- [ ] Implement retry logic for failed requests
- [ ] Add offline mode handling
- [ ] Create error toast notifications

#### 4.3 UX Enhancements
- [ ] Add keyboard shortcuts
- [ ] Implement undo functionality for deletions
- [ ] Add confirmation dialogs for destructive actions
- [ ] Create onboarding tooltips
- [ ] Add dark mode support

---

## 8. Integration with Existing Backend

### Backend Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                               │
│                    (client/ port 5173)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      CORE-API                                     │
│                   (services/core-api port 3000)                  │
│                                                                   │
│  Routes:                                                          │
│  - /api/contacts                                                  │
│  - /api/campaigns                                                 │
│  - /api/leads                                                     │
│  - /api/gmail-accounts                                            │
│  - /api/prompt-profiles                                           │
│  - /api/workspaces                                                │
│  - /api/metrics                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │    Other     │
│              │    │   (Queues)   │    │  Services    │
│  - contacts  │    │              │    │              │
│  - campaigns │    │  - generate  │    │  - Gmail    │
│  - leads     │    │  - send      │    │    Service   │
│  - accounts  │    │  - classify  │    │              │
│              │    │  - notify    │    │  - AI        │
│              │    │              │    │  Orchestr.   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Authentication Flow

**Current State**: Telegram-based authentication
**Future State**: JWT-based web authentication

```
1. User visits /login
      │
      ▼
2. User clicks "Login with Telegram"
      │
      ▼
3. Telegram OAuth popup
      │
      ▼
4. Telegram redirects to /auth/callback?user=...
      │
      ▼
5. Frontend sends user data to POST /api/auth/telegram
      │
      ▼
6. Core-API creates/updates workspace
      │
      ▼
7. Core-API returns JWT token
      │
      ▼
8. Frontend stores token in localStorage/cookie
      │
      ▼
9. Token included in all subsequent API requests
      │
      ▼
10. User redirected to dashboard
```

### Workspace Scoping

All API requests must include `workspace_id`:

```typescript
// Every API call includes workspace context
const { data: contacts } = useContacts({ 
  workspace_id: currentWorkspace.id 
});

// API client automatically adds workspace_id to requests
apiClient.get('/api/contacts', {
  params: { workspace_id: currentWorkspace.id }
});
```

### CORS Configuration

Backend must allow frontend origin:

```typescript
// services/core-api/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

---

## 9. Anti-Patterns to Avoid

### 1. **Direct API Calls in Components**
❌ **Bad**:
```typescript
function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => setContacts(data));
  }, []);
  
  return <ContactTable contacts={contacts} />;
}
```

✅ **Good**:
```typescript
function ContactsPage() {
  const { data: contacts, isLoading } = useContacts();
  return <ContactTable contacts={contacts} isLoading={isLoading} />;
}
```

### 2. **Prop Drilling**
❌ **Bad**:
```typescript
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Layout>
</App>
```

✅ **Good**:
```typescript
// Use context for global state
function App() {
  return (
    <AuthProvider>
      <Layout>
        <Sidebar />
      </Layout>
    </AuthProvider>
  );
}

function UserMenu() {
  const { user } = useAuth();
  return <div>{user.name}</div>;
}
```

### 3. **Mixed State Types**
❌ **Bad**:
```typescript
// Don't put server data in Zustand/Redux
const useStore = create((set) => ({
  contacts: [], // This should be in TanStack Query
  fetchContacts: async () => {
    const res = await fetch('/api/contacts');
    set({ contacts: await res.json() });
  }
}));
```

✅ **Good**:
```typescript
// Use TanStack Query for server state
const { data: contacts } = useContacts();

// Use Zustand only for UI state
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen }))
}));
```

### 4. **Tight Coupling to API Structure**
❌ **Bad**:
```typescript
// Component knows API structure
function ContactCard({ contact }) {
  return <div>{contact.first_name} {contact.last_name}</div>;
}
```

✅ **Good**:
```typescript
// Transform data at API layer
// features/contacts/api/contactsApi.ts
const contactsApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/contacts');
    return data.map(transformContact); // Transform to domain model
  }
};

// Component uses domain model
function ContactCard({ contact }: { contact: Contact }) {
  return <div>{contact.fullName}</div>;
}
```

### 5. **No Error Boundaries**
❌ **Bad**:
```typescript
// Errors crash the whole app
function App() {
  return <Router />;
}
```

✅ **Good**:
```typescript
// Errors are caught and handled gracefully
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Router />
    </ErrorBoundary>
  );
}
```

---

## 10. Scalability Considerations

### At 100 Users
- **Frontend**: Single React app, no code splitting needed
- **API**: Single core-api instance sufficient
- **Database**: Single PostgreSQL instance
- **Caching**: TanStack Query client-side caching sufficient

### At 10K Users
- **Frontend**: Add route-based code splitting
- **API**: Multiple core-api instances behind load balancer
- **Database**: Add read replicas
- **Caching**: Add Redis caching layer for API responses

### At 1M Users
- **Frontend**: Consider micro-frontends for independent feature deployment
- **API**: Full microservices with API Gateway
- **Database**: Sharding, connection pooling optimization
- **Caching**: Multi-layer caching (CDN, Redis, client)
- **Real-time**: WebSocket server for live updates

---

## 11. Testing Strategy

### Unit Tests
- **Components**: Test UI components in isolation with React Testing Library
- **Hooks**: Test custom hooks with @testing-library/react-hooks
- **API Services**: Mock API calls, test transformations

### Integration Tests
- **Feature Flows**: Test complete user flows (create contact, start campaign)
- **API Integration**: Test with MSW (Mock Service Worker)

### E2E Tests
- **Critical Paths**: Login, create campaign, view leads
- **Tools**: Playwright or Cypress

---

## 12. Security Considerations

### Authentication
- JWT tokens stored in httpOnly cookies (prevent XSS)
- Token refresh mechanism
- Workspace isolation enforced at API level

### Authorization
- All API requests validated against workspace_id
- User can only access their own workspace data
- Role-based access control (future)

### Data Protection
- Sensitive data never logged
- API keys stored in environment variables
- HTTPS enforced in production

---

## Sources

### High Confidence Sources
- **TanStack Query Documentation**: https://tanstack.com/query/latest
- **Feature-Sliced Design**: https://feature-sliced.design/
- **React Best Practices 2026**: Multiple industry sources
- **Existing Codebase**: Direct analysis of current implementation

### Medium Confidence Sources
- **Scalability Patterns**: Industry best practices from multiple sources
- **State Management Patterns**: Community consensus from 2024-2026 articles

### Implementation Notes
- Architecture based on existing `client/` structure
- API integration patterns match current `core-api` endpoints
- State management follows TanStack Query best practices
- Component structure aligns with shadcn/ui patterns

---

**Document Version**: 1.0
**Last Updated**: 2026-03-07
**Next Review**: After Phase 1 implementation
