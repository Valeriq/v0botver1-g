# Domain Pitfalls: React Dashboard + Existing Backend Integration

**Domain:** Web interface for AI Cold Email Bot (React + existing Node.js microservices)
**Researched:** 2026-03-07
**Context:** Adding frontend to production backend with no current authentication

---

## Executive Summary

This document catalogs critical mistakes when adding a React dashboard to an existing backend system. Based on research from production incidents, security breaches, and developer post-mortems, the most dangerous pitfalls cluster around **API contract drift**, **OAuth misconfiguration**, **token storage mistakes**, and **performance assumptions that don't scale**.

**Critical insight:** Most React dashboard failures aren't React problems—they're integration problems. The frontend assumes APIs work a certain way; the backend changes without warning; production breaks.

---

## 1. Architecture Pitfalls

### Pitfall 1.1: Backend-First API Design (Frontend Hell)

**What goes wrong:** Backend exposes database schema directly. Frontend receives 47 fields when it needs 3. Frontend becomes a "mini-backend" doing filtering, aggregation, and transformation that should happen server-side.

**Why it happens:** Backend developers design APIs based on internal logic, not UI needs. They've never seen the design. Frontend guesses at data shapes.

**Consequences:**
- Frontend makes 3 API calls to render 1 component
- Excessive data transfer (47 fields × 1000 rows)
- Frontend logic becomes complex and error-prone
- API changes break frontend silently

**Warning signs:**
- API returns nested objects that need flattening
- Frontend filters data that could be filtered server-side
- Multiple sequential API calls for single view
- `null` checks everywhere for fields that "should exist"

**Prevention:**
- **Contract-first development:** Write OpenAPI spec before implementation
- Frontend team participates in API design
- Generate TypeScript types from contract (Hey API, openapi-typescript)
- Mock APIs with MSW during frontend development

**Phase to address:** Phase 1 (API contract establishment)

**Sources:**
- Evil Martians: "API contracts and everything I wish I knew" (HIGH confidence)
- Sascha Becker: "Typesafe API Code Generation for React in 2026" (HIGH confidence)

---

### Pitfall 1.2: No API Contract = Integration Chaos

**What goes wrong:** Frontend and backend types drift apart. Backend changes a field name; frontend finds out in production. No shared source of truth.

**Why it happens:** Teams work in isolation. Backend "optimizes" endpoints without coordination. Frontend assumes data shapes based on yesterday's responses.

**Consequences:**
- Production bugs from "surprise" API changes
- 3-week waits for backend to "be ready"
- Double work: build with fake data, rebuild when real API differs
- Debugging staging environments at 3 AM

**Warning signs:**
- Manual TypeScript interfaces that don't match backend
- `as any` casts to silence type errors
- "The backend isn't ready yet" blocking frontend work
- Different behavior in dev vs staging vs production

**Prevention:**
- OpenAPI/Swagger specification as source of truth
- Generate types automatically (never hand-write)
- Contract changes require both teams' approval
- Use MSW mocks to develop independently

**Phase to address:** Phase 1 (before any frontend code)

**Sources:**
- Evil Martians: "Life's too short to hand-write API types" (HIGH confidence)
- Taqiyya Ghazi: "Stop Waiting for the Backend" (MEDIUM confidence)

---

### Pitfall 1.3: State Management Over-Engineering

**What goes wrong:** Every piece of state goes into global store (Redux/Context). Simple form inputs trigger cascading re-renders. Performance degrades. Code becomes complex for no reason.

**Why it happens:** "We need Redux for scalability" applied to 80-component dashboard. Developer reads that Context API is a "Redux killer" and puts everything in Context.

**Consequences:**
- Every keystroke re-renders entire component tree
- Bundle size bloat from unnecessary libraries
- Complex debugging for simple state changes
- Developer burnout from fighting the architecture

**Warning signs:**
- Global store contains form input values
- Context Provider wraps entire app with single "god" context
- `useContext` called in 50+ components
- Performance degrades as app grows

**Prevention:**
- **Local state first:** Use `useState` for component-specific data
- **Server state separate:** Use TanStack Query/SWR for API data
- **Context for truly global, stable data:** Theme, auth, locale
- **Split contexts:** AuthContext + ThemeContext, not AppContext

**Decision matrix:**

| State Type | Solution | Why |
|------------|----------|-----|
| Form inputs | `useState` / `useRef` | Local, high-frequency |
| API responses | TanStack Query / SWR | Caching, deduplication |
| Theme, locale | Context API | Global, rarely changes |
| Complex cross-component | Zustand / Jotai | Lightweight global |

**Phase to address:** Phase 1 (architecture decisions)

**Sources:**
- Aditya Tiwari: "I Wasted 6 Months Using React Context Wrong" (HIGH confidence)
- Kent C. Dodds: "Application State Management with React" (HIGH confidence)
- VOID: "Common React Context Mistakes" (MEDIUM confidence)

---

### Pitfall 1.4: Prop Drilling vs. Context Misuse

**What goes wrong:** Two extremes—either passing props through 10 intermediate components, or putting everything in Context and causing re-render storms.

**Why it happens:** No clear guidelines on when to use which approach. Developers default to what they know.

**Consequences:**
- **Prop drilling:** Maintenance nightmare, refactoring pain
- **Context overuse:** Performance degradation, unnecessary complexity

**Warning signs:**
- Components receive props they don't use
- Context value changes trigger re-renders in unrelated components
- Intermediate components exist only to pass props

**Prevention:**
- **Props for 2-3 close components:** Simpler, more explicit
- **Context for 5+ levels or distant components**
- **Composition pattern:** Pass components as props to avoid drilling

**Phase to address:** Phase 1 (component architecture)

**Sources:**
- LogicLoom: "State Management Gone Wrong" (MEDIUM confidence)
- Hooked On UI: "Context API vs Redux" (MEDIUM confidence)

---

## 2. Security Pitfalls

### Pitfall 2.1: OAuth Misconfiguration (Critical)

**What goes wrong:** OAuth implementation has security holes that allow token theft, account takeover, or data exposure.

**Why it happens:** OAuth is complex. Developers copy-paste tutorials without understanding security implications. "It works locally" doesn't mean "it's secure."

**Consequences:**
- **Salesloft-Drift breach:** 700+ organizations compromised via OAuth tokens
- Attackers access user data for days undetected
- Complete account takeover possible

**Critical vulnerabilities:**

| Vulnerability | What Happens | Real Attack |
|---------------|--------------|-------------|
| **Open redirect URIs** | Attacker redirects auth code to their server | Wildcard `*.example.com` allows `evil.example.com` |
| **Missing CSRF/state token** | Attacker forges auth requests | User clicks malicious link, attacker gets access |
| **Insecure token storage** | XSS attack steals tokens from localStorage | `localStorage.getItem('token')` readable by any script |
| **Wrong OAuth flow** | Implicit flow exposes tokens in URL | Use Authorization Code + PKCE for SPAs |
| **Overly broad scopes** | Token has more access than needed | `email:read` when only need `profile` |

**Warning signs:**
- Redirect URIs use wildcards (`*`)
- No `state` parameter in OAuth flow
- Tokens stored in `localStorage` or `sessionStorage`
- Using Implicit Flow instead of Authorization Code + PKCE
- Scopes request more access than feature needs

**Prevention:**
- **Authorization Code + PKCE for SPAs** (never Implicit Flow)
- **HttpOnly, Secure, SameSite cookies** for token storage
- **Validate `state` parameter** on callback (CSRF protection)
- **Exact redirect URI matching** (no wildcards in production)
- **Least-privilege scopes** (request minimum needed)
- **Short token TTL** (access tokens expire quickly)
- **Refresh token rotation** (invalidate old refresh tokens)

**Phase to address:** Phase 2 (authentication implementation)

**Sources:**
- Duende Software: "7 Common Security Pitfalls in OAuth 2.0" (HIGH confidence)
- Ankit (MERN Mastery): "Secure OAuth flow by fixing common vulnerabilities" (HIGH confidence)
- Cybersrely: "OAuth Misconfiguration in React.js: 10 Proven Fixes" (MEDIUM confidence)

---

### Pitfall 2.2: Token Storage in localStorage (Critical)

**What goes wrong:** JWT tokens stored in `localStorage` or `sessionStorage`. Any XSS attack can read and exfiltrate them.

**Why it happens:** Tutorials show `localStorage` because it's simple. Developers don't understand XSS risk.

**Consequences:**
- Single XSS vulnerability = complete account takeover
- Attacker can impersonate user indefinitely
- No way to detect token theft

**Warning signs:**
```typescript
// ❌ DANGEROUS
localStorage.setItem('token', response.token);
const token = localStorage.getItem('token');
```

**Prevention:**
- **HttpOnly cookies** for sensitive tokens (backend sets them)
- **In-memory storage** for short-lived access tokens
- **BFF (Backend-for-Frontend) pattern:** Tokens stay server-side, session cookie to frontend

**Implementation:**
```typescript
// ✅ SECURE: Backend sets HttpOnly cookie
// Frontend just makes requests, cookie sent automatically
const response = await fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
  credentials: 'include' // Send/receive cookies
});
```

**Phase to address:** Phase 2 (authentication)

**Sources:**
- NareshIT: "React Security Best Practices" (HIGH confidence)
- DEV Community: "7 security tips for your React application" (MEDIUM confidence)

---

### Pitfall 2.3: Missing CSRF Protection

**What goes wrong:** Attacker tricks authenticated user into making unwanted requests. User clicks malicious link; their account performs actions they didn't intend.

**Why it happens:** "We use JWTs, we don't need CSRF" misconception. JWTs in cookies still need CSRF protection.

**Consequences:**
- Attacker can perform actions on behalf of user
- Account settings changed, data deleted
- No user interaction required beyond clicking link

**Warning signs:**
- No CSRF token in forms
- API accepts requests without CSRF validation
- "We use JWTs so CSRF isn't needed" in code comments

**Prevention:**
- **CSRF token** in forms (double-submit cookie pattern)
- **SameSite=Strict** cookie attribute (browser-level protection)
- **Origin/Referer header validation** on backend

**Phase to address:** Phase 2 (security hardening)

**Sources:**
- Inwizards: "7 Common React Security Mistakes" (MEDIUM confidence)
- DEV Community: "7 security tips" (MEDIUM confidence)

---

### Pitfall 2.4: No Authentication Currently (Project-Specific Critical)

**What goes wrong:** Backend has NO authentication system. Adding frontend exposes all APIs to the world.

**Why it happens:** Backend was internal-only (Telegram bot). Web interface changes threat model completely.

**Consequences:**
- Anyone can access all workspaces
- All email campaigns visible
- Gmail OAuth tokens exposed
- Complete data breach

**Warning signs:**
- API endpoints have no auth middleware
- No user management system
- No session management
- Gmail tokens stored in plaintext

**Prevention:**
- **Implement auth BEFORE adding web interface**
- JWT-based authentication with proper token management
- OAuth 2.0 integration (Google, Telegram)
- Role-based access control (RBAC)
- API key management for programmatic access

**Phase to address:** Phase 2 (MUST complete before Phase 3)

**Sources:**
- Project CONCERNS.md: "No Authentication/Authorization - Critical" (HIGH confidence)

---

### Pitfall 2.5: Exposed Secrets in Frontend

**What goes wrong:** API keys, secrets, internal URLs embedded in React bundle. Anyone can view them.

**Why it happens:** `VITE_API_KEY` seems like it's hidden, but it's bundled into JavaScript.

**Consequences:**
- API keys stolen and abused
- Rate limits exceeded by attackers
- Backend services exposed

**Warning signs:**
```typescript
// ❌ VISIBLE IN BUNDLE
const API_KEY = import.meta.env.VITE_API_KEY;
const SECRET = 'sk-1234567890';
```

**Prevention:**
- **Frontend never has secrets** (only public config)
- **Backend-for-Frontend (BFF):** Secrets stay server-side
- **Environment variables are NOT hidden** from users
- **Proxy sensitive requests through backend**

**Phase to address:** Phase 2 (security architecture)

**Sources:**
- NareshIT: "React Security Best Practices" (HIGH confidence)

---

## 3. Performance Pitfalls

### Pitfall 3.1: Rendering Large Lists Without Virtualization

**What goes wrong:** Dashboard displays 10,000+ contacts/emails without virtualization. Browser crawls. Scrolling is janky. Memory usage spikes.

**Why it happens:** "It works with 100 items" assumption. No performance testing with realistic data volumes.

**Consequences:**
- 10,000 DOM nodes = browser freeze
- 4-8 second initial render
- 100+ MB memory usage
- Users abandon the interface

**Warning signs:**
- List renders all items at once
- No virtualization library used
- Performance degrades with data size
- "It's slow with real data" reports

**Prevention:**
- **Virtualization mandatory for 500+ items**
- Libraries: `@tanstack/react-virtual`, `react-window`, `react-virtualized`
- Fixed row height for best performance
- Overscan 10-20 items for smooth scrolling

**Implementation:**
```typescript
// ✅ Virtualized list - only ~20 DOM nodes
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Fixed row height
  overscan: 10
});
```

**Performance comparison:**

| Approach | 10K items | 100K items | DOM nodes |
|----------|-----------|------------|-----------|
| Naive render | 4-8s freeze | Browser crash | 10,000+ |
| Virtualization | <100ms | <200ms | ~20-30 |

**Phase to address:** Phase 3 (performance optimization)

**Sources:**
- Sandesh Rathnayake: "How to Render 100,000 Items in React" (HIGH confidence)
- Ashwin Rishi: "Building a High-Performance Virtualized Table" (HIGH confidence)
- OneUptime: "Virtualization in React" (MEDIUM confidence)

---

### Pitfall 3.2: Real-Time Updates Without Strategy

**What goes wrong:** Email status changes need real-time updates. Developer chooses wrong approach (polling for chat, WebSocket for hourly metrics).

**Why it happens:** "We need real-time" triggers "use WebSockets" without analysis. WebSockets are overkill for many use cases.

**Consequences:**
- **Polling:** Wasted bandwidth, server load, delayed updates
- **WebSocket overuse:** Unnecessary complexity, scaling challenges
- **Wrong choice:** Poor UX, wasted resources

**Decision framework:**

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Email status updates | **SSE** | Server→client only, simple, auto-reconnect |
| Live chat | **WebSocket** | Bidirectional, low latency |
| Hourly metrics | **Polling** | Infrequent, simple |
| Notifications | **SSE** | Server→client, reliable |
| Collaborative editing | **WebSocket** | Bidirectional, real-time |

**Warning signs:**
- Polling every 1 second for rarely-changing data
- WebSocket for server→client only updates
- No reconnection handling
- "It works locally" but fails at scale

**Prevention:**
- **SSE for server→client streaming** (simpler than WebSocket)
- **WebSocket for bidirectional real-time**
- **Polling for infrequent updates** (>1 minute intervals)
- **Always implement reconnection logic**

**Phase to address:** Phase 3 (real-time features)

**Sources:**
- Saad Minhas: "WebSockets vs Server-Sent Events vs Polling" (HIGH confidence)
- ScaleWithChintan: "Client-Backend Interaction Patterns" (MEDIUM confidence)
- ZeonEdge: "Building Real-Time Applications with WebSockets in 2026" (HIGH confidence)

---

### Pitfall 3.3: Infinite Scroll Without Virtualization

**What goes wrong:** Infinite scroll loads more data indefinitely. DOM grows without bound. Performance degrades over time.

**Why it happens:** Infinite scroll implemented, but each page adds more DOM nodes. No cleanup.

**Consequences:**
- After 10 pages: 200+ DOM nodes, sluggish
- After 50 pages: Browser struggles
- Memory leak as DOM grows

**Warning signs:**
- Infinite scroll without virtualization
- Performance degrades as user scrolls
- No "load more" limit

**Prevention:**
- **Combine infinite scroll with virtualization**
- **IntersectionObserver** for load trigger (not scroll events)
- **Debounce scroll handlers** if not using observer
- **Virtualization recycles DOM nodes**

**Phase to address:** Phase 3 (performance)

**Sources:**
- Magic UI: "Master React Infinite Scroll" (MEDIUM confidence)
- TheLinuxCode: "Implementing Infinite Scrolling with React Hooks" (MEDIUM confidence)

---

### Pitfall 3.4: No Loading States or Error Boundaries

**What goes wrong:** API call fails, UI shows nothing or crashes. No loading indicator, no error message. User sees blank screen.

**Why it happens:** Happy path only tested. Error states considered "later" (never happens).

**Consequences:**
- Users think app is broken
- No feedback on what went wrong
- Support tickets for "it doesn't work"
- Poor user experience

**Warning signs:**
- No loading spinners during API calls
- No error messages on failed requests
- No error boundaries around components
- Blank screens on errors

**Prevention:**
- **Loading states for all async operations**
- **Error boundaries** around major sections
- **User-friendly error messages** (not just "Error: ...")
- **Retry mechanisms** for transient failures

**Phase to address:** Phase 1 (MVP)

**Sources:**
- General React best practices (HIGH confidence)

---

## 4. Integration Pitfalls

### Pitfall 4.1: Breaking Existing API Contracts

**What goes wrong:** Adding web interface requires API changes. Changes break existing Telegram bot integration. Production incidents.

**Why it happens:** Frontend team doesn't know about existing consumers. Backend makes "small fixes" without coordination.

**Consequences:**
- Telegram bot stops working
- Existing users affected
- Emergency rollbacks
- Trust breakdown between teams

**Warning signs:**
- API changes without versioning
- No consumer awareness
- "It works for the web" but breaks bot
- No integration tests

**Prevention:**
- **API versioning** (v1, v2 endpoints)
- **Consumer contract tests** (Pact, Spring Cloud Contract)
- **Backward compatibility checks** before deployment
- **Integration test suite** covering all consumers

**Phase to address:** Phase 1 (API contract establishment)

**Sources:**
- Evil Martians: "API contracts" series (HIGH confidence)

---

### Pitfall 4.2: OAuth Flow Complexity

**What goes wrong:** Gmail OAuth works in Telegram bot but implementing in web is complex. Token storage, refresh, expiration handling all different.

**Why it happens:** Telegram bot uses different OAuth flow than web SPA. State management differs. Token refresh needs different approach.

**Consequences:**
- OAuth works in one place, fails in another
- Token expiration not handled
- Users logged out unexpectedly
- Security vulnerabilities

**Warning signs:**
- Copying Telegram bot OAuth code to web
- No token refresh mechanism
- Tokens expire during operation
- Different behavior in bot vs web

**Prevention:**
- **Authorization Code + PKCE for web SPAs**
- **Backend-for-Frontend pattern** for token management
- **Automatic token refresh** before expiration
- **Consistent auth flow** across all clients

**Phase to address:** Phase 2 (OAuth implementation)

**Sources:**
- Tanya Sharma: "Secure Your React App Like a Pro: Adding OAuth 2.0" (MEDIUM confidence)
- Toxigon: "Adding Google/GitHub login to your React app" (MEDIUM confidence)

---

### Pitfall 4.3: No Input Validation on Frontend

**What goes wrong:** Frontend trusts all user input. Backend validation catches issues, but UX is poor. Or worse, backend has no validation either.

**Why it happens:** "Backend will validate" assumption. Or no Zod/validation library used.

**Consequences:**
- Poor error messages (generic "Invalid input")
- Multiple round trips to discover all errors
- Security vulnerabilities if backend validation missing
- Bad user experience

**Warning signs:**
- No client-side validation
- Generic error messages
- Form submits, backend rejects, user confused
- No Zod/Yup/React Hook Form validation

**Prevention:**
- **Zod schemas generated from API contract**
- **React Hook Form with Zod resolver**
- **Client-side validation matches backend rules**
- **User-friendly error messages**

**Phase to address:** Phase 1 (form implementation)

**Sources:**
- Evil Martians: "Life's too short to hand-write API types" (HIGH confidence)

---

## 5. UX Pitfalls

### Pitfall 5.1: Thread View Without Proper Email Client Patterns

**What goes wrong:** Email thread view doesn't match Gmail-style expectations. Chronological vs reverse-chronological confusion. No visual distinction between sent/received.

**Why it happens:** Developer hasn't studied email client UX patterns. Implements what "makes sense" without user research.

**Consequences:**
- Users confused by thread order
- Can't quickly identify sent vs received
- Poor email client experience
- Users prefer to use Gmail directly

**Warning signs:**
- Thread order unclear
- No visual distinction (colors, alignment) for sent/received
- No collapse/expand for long threads
- Missing timestamps or sender info

**Prevention:**
- **Study Gmail/Outlook thread patterns**
- **Reverse chronological** (newest first) for most cases
- **Visual distinction:** sent on right, received on left
- **Collapse long threads** with "show more"
- **Clear timestamps and sender info**

**Phase to address:** Phase 3 (thread view implementation)

**Sources:**
- General UX best practices (MEDIUM confidence)

---

### Pitfall 5.2: Dashboard Without Key Metrics

**What goes wrong:** Dashboard shows data but not insights. Users see numbers but don't know what they mean or what to do.

**Why it happens:** "Show the data" approach without considering "what decisions does this support?"

**Consequences:**
- Users don't understand campaign performance
- No actionable insights
- Dashboard ignored
- Users export data to analyze elsewhere

**Warning signs:**
- Raw numbers without context
- No trends or comparisons
- No clear next actions
- Users ask "what does this mean?"

**Prevention:**
- **Key metrics prominently displayed**
- **Trends over time** (not just current values)
- **Comparisons** (this week vs last week)
- **Actionable insights** ("3 emails need follow-up")
- **Clear visual hierarchy**

**Phase to address:** Phase 3 (dashboard refinement)

**Sources:**
- General dashboard UX best practices (MEDIUM confidence)

---

## 6. Prevention Strategies per Phase

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish contracts, architecture, security foundation

| Pitfall | Prevention Strategy | Verification |
|---------|---------------------|--------------|
| API contract drift | OpenAPI spec before code | Types generated, contract tests pass |
| State management over-engineering | Architecture decision doc | No global store for local state |
| Breaking existing APIs | Consumer contract tests | Telegram bot tests pass |
| No input validation | Zod schemas from contract | Form validation matches backend |

**Critical deliverables:**
- [ ] OpenAPI specification for all endpoints
- [ ] Generated TypeScript types
- [ ] MSW mocks for frontend development
- [ ] Architecture decision records
- [ ] Contract tests for existing consumers

---

### Phase 2: Security (Week 3-4)

**Goal:** Implement authentication, harden security

| Pitfall | Prevention Strategy | Verification |
|---------|---------------------|--------------|
| OAuth misconfiguration | Authorization Code + PKCE | Security audit checklist |
| Token storage in localStorage | HttpOnly cookies | No tokens in localStorage |
| Missing CSRF protection | CSRF tokens + SameSite cookies | CSRF test passes |
| No authentication (critical) | JWT + OAuth implementation | All endpoints require auth |
| Exposed secrets | BFF pattern | No secrets in bundle |

**Critical deliverables:**
- [ ] OAuth 2.0 flow with PKCE
- [ ] HttpOnly, Secure, SameSite cookies
- [ ] CSRF protection
- [ ] RBAC implementation
- [ ] Security audit passed

---

### Phase 3: Performance & UX (Week 5-6)

**Goal:** Optimize performance, refine user experience

| Pitfall | Prevention Strategy | Verification |
|---------|---------------------|--------------|
| Large lists without virtualization | TanStack Virtual | 10K items render <200ms |
| Wrong real-time approach | SSE for email status | Updates arrive <1s |
| Infinite scroll DOM bloat | Virtualization + infinite scroll | Constant DOM size |
| No loading/error states | Error boundaries + loading UI | No blank screens |
| Poor thread view UX | Gmail-style patterns | User testing passes |

**Critical deliverables:**
- [ ] Virtualized lists for 500+ items
- [ ] SSE for real-time updates
- [ ] Error boundaries around sections
- [ ] Loading states for all async ops
- [ ] Thread view matches Gmail patterns

---

## 7. Quick Reference: Pitfall Severity Matrix

| Pitfall | Severity | Likelihood | Impact | Phase |
|---------|----------|------------|--------|-------|
| No authentication (project-specific) | **CRITICAL** | High | Complete breach | 2 |
| OAuth misconfiguration | **CRITICAL** | Medium | Account takeover | 2 |
| Token storage in localStorage | **CRITICAL** | High | Account takeover | 2 |
| API contract drift | **HIGH** | High | Production bugs | 1 |
| Breaking existing APIs | **HIGH** | Medium | Production incident | 1 |
| Large lists without virtualization | **HIGH** | High | Browser freeze | 3 |
| State management over-engineering | **MEDIUM** | High | Performance issues | 1 |
| Wrong real-time approach | **MEDIUM** | Medium | Poor UX | 3 |
| No loading/error states | **MEDIUM** | High | Poor UX | 1 |
| Poor thread view UX | **LOW** | Medium | User confusion | 3 |

---

## 8. Sources & Confidence Levels

### HIGH Confidence Sources
- Evil Martians: "API contracts and everything I wish I knew" (Production experience, detailed examples)
- Evil Martians: "Life's too short to hand-write API types" (Comprehensive guide, 2026)
- Duende Software: "7 Common Security Pitfalls in OAuth 2.0" (Security experts, real breaches cited)
- Sandesh Rathnayake: "How to Render 100,000 Items in React" (Performance benchmarks, code examples)
- Kent C. Dodds: "Application State Management with React" (Industry expert)
- Project CONCERNS.md: Security gaps documented (Internal analysis)

### MEDIUM Confidence Sources
- Ankit (MERN Mastery): "Secure OAuth flow" (Good examples, Medium article)
- Saad Minhas: "WebSockets vs SSE vs Polling" (Comparison framework, Medium)
- Aditya Tiwari: "I Wasted 6 Months Using React Context Wrong" (Personal experience, Medium)
- Various Medium articles on React patterns (Good insights, less authoritative)

### LOW Confidence Sources
- General UX best practices (Common knowledge, not specific research)

---

## 9. Conclusion

The most critical pitfalls for this project are:

1. **No authentication currently** — Adding web interface without auth is a security disaster
2. **OAuth misconfiguration** — Complex flow, easy to get wrong, severe consequences
3. **API contract drift** — Frontend-backend integration will break without contracts
4. **Performance assumptions** — Large contact lists will freeze browser without virtualization

**Key insight:** Most pitfalls are integration problems, not React problems. The solution is **contract-first development**, **security-first architecture**, and **performance testing with realistic data**.

**Recommendation:** Address Phase 1 (contracts) and Phase 2 (security) completely before building features. The cost of fixing these later is 10x higher.

---

**Last Updated:** 2026-03-07
**Maintainer:** Research Team
**Related Documents:**
- .planning/codebase/CONCERNS.md
- .planning/PROJECT.md
