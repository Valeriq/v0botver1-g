# Phase 1: Foundation - Validation Architecture

## Overview

This document defines the validation strategy for Phase 1: Foundation. It ensures that all success criteria are verifiable through automated tests and manual checks.

## Success Criteria Validation

| # | Success Criterion | Validation Type | Test Location |
|---|-------------------|-----------------|---------------|
| 1 | Developer can run `npm run dev` and see the app layout | Manual + Automated | `npm run dev` exits 0 |
| 2 | Zustand store is configured and accessible from any component | Automated | `uiStore.test.ts` |
| 3 | TanStack Table renders a sample data grid | Automated | `SampleTable.test.tsx` |
| 4 | API client can make requests to backend | Automated | `apiClient.test.ts` |
| 5 | Layout components (Sidebar, Header) are functional | Automated | `AppLayout.test.tsx` |

## Test Architecture

### Unit Tests

```
client/src/__tests__/
├── setup.ts                    # Test configuration
├── stores/
│   └── uiStore.test.ts         # Zustand store tests
├── components/
│   └── SampleTable.test.tsx    # TanStack Table demo
├── lib/
│   ├── apiClient.test.ts       # API client tests
│   └── queryKeys.test.ts       # Query keys tests
└── components/layout/
    ├── AppLayout.test.tsx      # Layout tests
    └── Header.test.tsx         # Header tests
```

### Test Coverage Targets

| Component | Target Coverage | Critical Paths |
|-----------|-----------------|----------------|
| uiStore | 100% | persist, toggle, theme |
| apiClient | 100% | error handling, requests |
| SampleTable | 80% | render, columns, rows |
| Layout | 80% | render, navigation |

## Validation Commands

### Run All Tests
```bash
cd client && npm test
```

### Run Specific Test
```bash
cd client && npm test -- --run src/__tests__/stores/uiStore.test.ts
```

### Check Coverage
```bash
cd client && npm test -- --coverage
```

## Manual Validation Checklist

After all plans complete:

- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:5173
- [ ] Sidebar is visible and collapsible
- [ ] Header shows user menu
- [ ] Theme toggle works
- [ ] Navigation between sections works
- [ ] Sample table renders with mock data

## Nyquist Validation

This phase follows Nyquist validation principles:

1. **Test-Driven Development**: All tasks specify TDD behavior
2. **Automated Verification**: Each task has automated verify step
3. **Coverage Tracking**: Test coverage measured per component
4. **Integration Points**: API client tested against backend

## Test Data Strategy

### Mock Data for SampleTable
```typescript
const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'bounced' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', status: 'active' },
  { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', status: 'unsubscribed' },
];
```

### API Mock Responses
- Use MSW (Mock Service Worker) for API mocking in tests
- Or use simple fetch mocks for unit tests

---

*Phase: 01-foundation*
*Created: 2026-03-07*
