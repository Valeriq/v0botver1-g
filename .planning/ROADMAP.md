# Roadmap: v0botver1-g Web Interface

## Overview

Build a React dashboard for email outreach management with AI Conversation Agent. The journey starts with project foundation, progresses through core features, includes AI-powered autonomous dialogue, and concludes with authentication.

## Phases

- [ ] **Phase 1: Foundation** - Setup project, add Zustand + TanStack Table, layout
- [ ] **Phase 2: Dashboard & Contacts** - Dashboard stats, contacts list with pagination
- [ ] **Phase 3: Email & Thread View** - Email list, Gmail-style thread view
- [ ] **Phase 4: AI Conversation Agent** - Autonomous email dialogue handling
- [ ] **Phase 5: Templates & Accounts** - Template editor, Gmail account management
- [ ] **Phase 6: Leads & Campaigns** - Leads pipeline, campaigns view
- [ ] **Phase 7: Authentication** - OAuth 2.0, security (LAST)

## Phase Details

### Phase 1: Foundation
**Goal**: Project architecture established, ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: None (infrastructure phase)
**Success Criteria**:
  1. Developer can run `npm run dev` and see the app layout
  2. Zustand store is configured and accessible from any component
  3. TanStack Table renders a sample data grid
  4. API client can make requests to backend
  5. Layout components (Sidebar, Header) are functional

Plans:
- [x] 01-01-PLAN.md — Install dependencies (Zustand, TanStack Table, testing-library) and create UI store ✅
- [x] 01-02-PLAN.md — Enhance API client with error handling and create query keys factory ✅
- [x] 01-03-PLAN.md — Add Header component and make Sidebar responsive with Zustand ✅

### Phase 2: Dashboard & Contacts
**Goal**: Users can view key metrics and manage their contact database
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria**:
  1. Dashboard displays 4 KPI cards (sent, opened, replied, leads)
  2. Contact list shows paginated contacts (25 per page)
  3. User can search contacts by email or name
  4. User can filter contacts by status
  5. User can upload contacts via CSV/TSV file

Plans:
- [ ] 02-01: Dashboard page with KPI cards
- [ ] 02-02: Contacts list with pagination and search
- [ ] 02-03: Contact filters and CSV upload

### Phase 3: Email & Thread View
**Goal**: Users can browse all sent emails and view conversation history
**Depends on**: Phase 2
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05, THREAD-01, THREAD-02, THREAD-03
**Success Criteria**:
  1. Email list displays all sent emails with status indicators
  2. User can filter emails by date, recipient, and status
  3. Thread view shows Gmail-style conversation chain
  4. Incoming and outgoing emails are visually distinguished
  5. Lead status is visible in thread view

Plans:
- [ ] 03-01: Email list with filtering and search
- [ ] 03-02: Thread view component (Gmail-style)

### Phase 4: AI Conversation Agent
**Goal**: AI autonomously handles email dialogues until lead interest is detected
**Depends on**: Phase 3
**Requirements**: AIAG-01, AIAG-02, AIAG-03, AIAG-04, AIAG-05, AIAG-06, AIAG-07
**Success Criteria**:
  1. AI classifies incoming replies (interested/question/not_interested)
  2. AI auto-responds to questions without human confirmation
  3. AI creates lead when interest detected and notifies human
  4. AI sends polite closing message when rejection detected
  5. Thread view shows AI-generated messages with indicator
  6. AI conversation history is preserved in thread
  7. User can see which threads are in AI mode

Plans:
- [ ] 04-01: AI reply classification endpoint enhancement
- [ ] 04-02: Auto-response generation and sending logic
- [ ] 04-03: Lead creation and notification on interest
- [ ] 04-04: Polite rejection handling and thread closure
- [ ] 04-05: Thread view AI indicators and history

### Phase 5: Templates & Accounts
**Goal**: Users can create email templates and manage Gmail accounts
**Depends on**: Phase 4
**Requirements**: TPL-01, TPL-02, TPL-03, TPL-04, ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05
**Success Criteria**:
  1. Template editor allows plain text editing with variable insertion
  2. User can preview template with substituted data
  3. Gmail accounts list shows status for each account
  4. User can add Gmail account via OAuth flow
  5. User can assign accounts to workspaces

Plans:
- [ ] 05-01: Template editor with variables and preview
- [ ] 05-02: Gmail accounts list with status indicators
- [ ] 05-03: Gmail OAuth flow and account assignment

### Phase 6: Leads & Campaigns
**Goal**: Users can track leads and monitor campaign performance
**Depends on**: Phase 5
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, CAMP-01, CAMP-02, CAMP-03
**Success Criteria**:
  1. Leads list displays all leads with status pipeline
  2. User can filter leads by status
  3. Lead detail view shows full thread history
  4. Campaigns list shows all campaigns with statistics
  5. User can take or close leads with quick actions

Plans:
- [ ] 06-01: Leads list with status pipeline and filtering
- [ ] 06-02: Lead detail view with thread history
- [ ] 06-03: Campaigns list with statistics

### Phase 7: Authentication
**Goal**: Users can securely access the application
**Depends on**: Phase 6
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria**:
  1. User can log in via OAuth 2.0 (Google/Telegram)
  2. User session persists across browser sessions
  3. User can log out from any page
  4. All API requests include authentication tokens
  5. Protected routes redirect unauthenticated users to login

Plans:
- [ ] 07-01: OAuth 2.0 + PKCE implementation
- [ ] 07-02: Session management and protected routes
- [ ] 07-03: Security hardening (CSRF, HttpOnly cookies)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | ✅ Complete | 2026-03-08 |
| 2. Dashboard & Contacts | 0/3 | Not started | - |
| 3. Email & Thread View | 0/2 | Not started | - |
| 4. AI Conversation Agent | 0/5 | Not started | - |
| 5. Templates & Accounts | 0/3 | Not started | - |
| 6. Leads & Campaigns | 0/3 | Not started | - |
| 7. Authentication | 0/3 | Not started | - |

## Coverage Validation

| Category | Requirements | Phase |
|----------|--------------|-------|
| DASH | DASH-01, DASH-02, DASH-03 | Phase 2 |
| CONT | CONT-01..05 | Phase 2 |
| EMAIL | EMAIL-01..05 | Phase 3 |
| THREAD | THREAD-01, THREAD-02, THREAD-03 | Phase 3 |
| AIAG | AIAG-01..07 | Phase 4 |
| TPL | TPL-01..04 | Phase 5 |
| ACCT | ACCT-01..05 | Phase 5 |
| LEAD | LEAD-01..04 | Phase 6 |
| CAMP | CAMP-01..03 | Phase 6 |
| AUTH | AUTH-01..05 | Phase 7 |

**Total requirements mapped:** 39/39

---

*Last updated: 2026-03-07*
