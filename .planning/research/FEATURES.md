# Feature Landscape: Email Outreach Dashboard

**Domain:** Email outreach / cold email campaign management
**Researched:** 2026-03-07
**Confidence:** HIGH (multiple industry sources, competitor analysis, established patterns)

---

## 1. Dashboard Patterns

### Standard Layout Structure

Email outreach dashboards follow a consistent pattern across tools (Outreach, Lemlist, Mailshake, Smartlead):

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Workspace Selector | User Menu              │
├─────────────────────────────────────────────────────────────┤
│  Sidebar          │  Main Content Area                       │
│  ──────────────── │  ─────────────────────────────────────  │
│  Dashboard        │  ┌─────────────────────────────────────┐ │
│  Campaigns        │  │ KPI Cards Row (4-6 metrics)        │ │
│  Contacts         │  │ Sent | Opened | Replied | Leads    │ │
│  Leads            │  └─────────────────────────────────────┘ │
│  Templates        │  ┌─────────────────────────────────────┐ │
│  Accounts         │  │ Activity Table / Recent Activity   │ │
│  Settings         │  │ (Paginated, filterable)            │ │
│                   │  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### KPI Metrics (Industry Standard)

| Metric | Why Track | Display Format | Benchmark |
|--------|-----------|----------------|-----------|
| **Sent** | Volume tracking | Number + trend arrow | — |
| **Delivered** | Deliverability health | Number + % of sent | >95% |
| **Opened** | Subject line effectiveness | Number + open rate % | 20-50% (inflated post-iOS 15) |
| **Replied** | True engagement | Number + reply rate % | 1-5% (good), >5% (excellent) |
| **Bounced** | List quality | Number + bounce rate % | <2% |
| **Leads Generated** | Business outcome | Number + conversion % | — |

**Key insight:** Open rates are now "vanity metrics" due to Apple's privacy changes. Reply rate is the primary quality indicator.

### Dashboard Best Practices

1. **Single-glance summary** — Top 4 KPIs visible without scrolling
2. **Trend indicators** — Show week-over-week or period comparison
3. **Drill-down capability** — Click metric → filtered view
4. **Date range selector** — Last 7 days, 30 days, custom range
5. **Workspace/account switcher** — Multi-tenant support

---

## 2. Email Thread View Patterns

### Gmail-Style Conversation View (Industry Standard)

The Gmail conversation model is the de facto standard for email thread UI. Users expect:

```
┌─────────────────────────────────────────────────────────────┐
│  Subject: Re: Partnership Opportunity                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 👤 John Doe (me)                    Mar 5, 2:30 PM      ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ Hi [First Name], I wanted to reach out about...         ││
│  │ [Full email body]                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 👤 Jane Smith <jane@company.com>    Mar 6, 9:15 AM     ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ Thanks for reaching out! I'd love to learn more...     ││
│  │ [Full email body]                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Reply] [Reply All] [Forward]                              │
└─────────────────────────────────────────────────────────────┘
```

### Thread View Requirements

| Element | Purpose | Implementation |
|---------|---------|----------------|
| **Chronological order** | Follow conversation flow | Oldest → Newest (or reverse) |
| **Sender differentiation** | Distinguish sent vs received | Color coding, icons, alignment |
| **Quoted text handling** | Show/hide previous messages | Collapsible quote blocks |
| **Timestamp display** | Context for timing | Relative (2 hours ago) or absolute |
| **Sender info** | Identify participants | Name, email, avatar |
| **Quick actions** | Common operations | Reply, Forward, Archive |

### Technical Implementation (Email Threading)

Email threading relies on RFC headers:
- **Message-ID**: Unique identifier per message
- **In-Reply-To**: References parent Message-ID
- **References**: Chain of all Message-IDs in thread
- **Subject**: Must remain consistent (Re:/Fwd: prefixes)

---

## 3. Template Editor Patterns

### Variable/Personalization System

Standard variable syntax across email tools:

| Syntax | Tools Using | Example |
|--------|-------------|---------|
| `{{first_name}}` | Most common | "Hi {{first_name}}" |
| `{first_name}` | Some tools | "Hi {first_name}" |
| `{{ first_name }}` | Spaced variant | "Hi {{ first_name }}" |

### Standard Variables (Table Stakes)

| Variable | Purpose | Required |
|----------|---------|----------|
| `{{first_name}}` | Personal greeting | ✓ |
| `{{last_name}}` | Full name usage | ✓ |
| `{{email}}` | Reference | ✓ |
| `{{company}}` | Company personalization | ✓ |
| `{{website}}` | Research reference | ✓ |
| `{{position}}` | Role-based messaging | Optional |

### Template Editor UI Patterns

```
┌─────────────────────────────────────────────────────────────┐
│  Template Editor                                             │
├─────────────────────────────────────────────────────────────┤
│  Name: [Initial Outreach Template          ] [Save] [Delete]│
├─────────────────────────────────────────────────────────────┤
│  Subject: [Hi {{first_name}}, quick question]              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬───────────────────────────────────┐│
│  │ Variables           │ Editor                            ││
│  │ ─────────────────── │ ───────────────────────────────── ││
│  │ • {{first_name}}    │ Hi {{first_name}},                ││
│  │ • {{last_name}}     │                                   ││
│  │ • {{company}}       │ I noticed {{company}} is...      ││
│  │ • {{website}}       │                                   ││
│  │ • {{position}}      │ [Text continues...]               ││
│  │                     │                                   ││
│  │ [Add Custom]        │                                   ││
│  └─────────────────────┴───────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Preview                                                    │
│  ────────────────────────────────────────────────────────── │
│  Hi John,                                                   │
│  I noticed Acme Corp is...                                  │
└─────────────────────────────────────────────────────────────┘
```

### Editor Features (Priority Order)

1. **Plain text editor** — Simple textarea with variable insertion
2. **Variable sidebar** — Click to insert at cursor
3. **Live preview** — Show rendered template with sample data
4. **Subject line field** — Separate from body
5. **Template management** — Save, edit, delete, duplicate

**Out of scope for MVP:** HTML editor, drag-and-drop builder, rich text formatting

---

## 4. Account Management Patterns

### Gmail Account Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Gmail Accounts                          [+ Add Account]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Email                    Status        Health    Actions ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ john@company.com         ✓ OK          450/day   [Edit] ││
│  │ jane@company.com         ⚠ Limit       50/day    [Edit] ││
│  │ outreach@company.com     ✗ Auth Failed —         [Edit] ││
│  │ sales@company.com        ⚠ Blocked     —         [Edit] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Account Status Types

| Status | Meaning | UI Treatment | Action |
|--------|---------|--------------|--------|
| `ok` | Healthy, sending | Green checkmark | None |
| `limit` | Rate limited | Yellow warning | Reduce volume |
| `blocked` | Account blocked | Red error | Investigate |
| `auth_failed` | OAuth expired | Red error | Re-authenticate |

### Account Management Features

1. **Account list** — All connected Gmail accounts
2. **Status indicators** — Visual health status
3. **Add account** — OAuth flow initiation
4. **Remove account** — Disconnect with confirmation
5. **Workspace assignment** — Link accounts to workspaces
6. **Health metrics** — Daily send limits, warmup status

### OAuth Flow (Web-Based)

```
User clicks "Add Account"
    ↓
Redirect to Google OAuth consent screen
    ↓
User grants permissions
    ↓
Callback with authorization code
    ↓
Exchange for tokens (access + refresh)
    ↓
Store tokens securely
    ↓
Account appears in list with "ok" status
```

---

## 5. Leads Management Patterns

### Lead Status Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Leads                                                       │
├─────────────────────────────────────────────────────────────┤
│  [All] [New] [Taken] [Replied] [Closed]                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Contact          Company    Status    Last Reply  Actions││
│  │ ─────────────────────────────────────────────────────── ││
│  │ John Doe         Acme Corp  New       Mar 5      [Take] ││
│  │ Jane Smith       Tech Inc   Taken     Mar 4      [View] ││
│  │ Bob Wilson       Startup    Replied   Mar 3      [View] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Lead Status Definitions

| Status | Meaning | Transitions |
|--------|---------|-------------|
| `new` | Unassigned lead | → taken, closed |
| `taken` | Assigned to user | → replied, closed |
| `replied` | User responded | → closed |
| `closed` | Conversation ended | Terminal |

### Lead Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  Lead: John Doe <john@acmecorp.com>                         │
│  Status: Taken (by You)                    [Close] [Reply] │
├─────────────────────────────────────────────────────────────┤
│  Contact Info                                                │
│  ────────────                                               │
│  Name: John Doe                                             │
│  Email: john@acmecorp.com                                   │
│  Company: Acme Corp                                         │
│  Position: CEO                                              │
├─────────────────────────────────────────────────────────────┤
│  Conversation Thread                                        │
│  ──────────────────                                        │
│  [Thread view component here]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Table Stakes Features

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Dashboard with KPIs** | Immediate performance visibility | Low | 4-6 key metrics |
| **Contact list with pagination** | Manage large lists | Low | 25-50 per page standard |
| **Email status tracking** | Know what happened to emails | Medium | Sent, delivered, opened, replied, bounced |
| **Search/filter contacts** | Find specific people | Low | By email, name, company |
| **Thread view** | Read conversations | Medium | Gmail-style expected |
| **Template variables** | Personalization at scale | Low | `{{first_name}}` syntax |
| **Account status display** | Know account health | Low | Visual indicators |
| **Lead status pipeline** | Track opportunities | Low | New → Taken → Replied → Closed |
| **Date filtering** | Analyze periods | Low | Last 7/30 days, custom |
| **OAuth Gmail connection** | Easy account setup | Medium | Web-based flow |

---

## 7. Differentiating Features

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI-powered email generation** | Save time, better personalization | High | Already exists in backend |
| **Reply classification** | Auto-categorize responses | High | Already exists in backend |
| **Live reply mode** | Respond directly from tool | High | Currently Telegram-only |
| **Multi-account rotation** | Scale without limits | Medium | Assign accounts to campaigns |
| **Deliverability insights** | Know why emails fail | Medium | Bounce analysis, spam detection |
| **Campaign performance comparison** | Optimize over time | Medium | A/B testing, template comparison |
| **Smart follow-up suggestions** | AI-driven timing | High | When to follow up |

---

## 8. Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **HTML email templates** | Complexity, deliverability issues, inconsistent rendering | Plain text only for MVP |
| **Rich text editor** | Overkill for cold email, plain text performs better | Simple textarea |
| **Drag-and-drop email builder** | Marketing tool feature, not outreach | Template variables |
| **Complex analytics charts** | Dashboard clutter, users export to Excel anyway | Simple KPI cards |
| **A/B testing UI** | Advanced feature, requires statistical significance | Defer to Phase 2 |
| **Team collaboration** | Multi-user workspaces add complexity | Single-user per workspace |
| **Mobile app** | Web-first, responsive design sufficient | Mobile-responsive web |
| **Live reply from web** | Complex real-time infrastructure | View-only for MVP |
| **Calendar integration** | Out of scope for email outreach | Defer indefinitely |
| **CRM sync** | Integration complexity | Export functionality |

---

## 9. Feature Dependencies

```
OAuth Gmail Connection
    ↓
Account Management
    ↓
Campaign Creation
    ↓
Contact Upload → Template Editor
    ↓              ↓
Email Sending ← ←
    ↓
Status Tracking (sent, opened, replied)
    ↓
Lead Generation (from positive replies)
    ↓
Lead Management
    ↓
Thread View (for lead context)
```

---

## 10. MVP Recommendation

### Phase 1 (Must Have)

1. **Dashboard** — 4 KPI cards (sent, opened, replied, leads)
2. **Contact list** — Paginated table with search/filter
3. **Email list** — All sent emails with status filtering
4. **Thread view** — Gmail-style conversation display
5. **Template editor** — Plain text with variable insertion
6. **Account management** — List, add via OAuth, remove
7. **Lead management** — Status pipeline, quick actions

### Phase 2 (Should Have)

1. **Live reply from web** — Respond to leads directly
2. **Deliverability dashboard** — Bounce analysis
3. **Campaign comparison** — Performance over time
4. **Export functionality** — CSV download

### Defer Indefinitely

1. HTML templates
2. Rich text editor
3. Team collaboration
4. Mobile app
5. CRM integrations

---

## Sources

| Source | Type | Confidence |
|--------|------|------------|
| [Smartlead vs Mailshake vs Lemlist Comparison](https://www.smartlead.ai/blog/smartlead-vs-mailshake-vs-lemlist-comparison) | Competitor analysis | HIGH |
| [Lemlist vs Outreach.io](https://www.coldiq.com/blog/lemlist-vs-outreach) | Competitor analysis | HIGH |
| [Email Marketing Dashboard Guide](https://www.1clickreport.com/blog/email-marketing-dashboard-guide) | Dashboard patterns | HIGH |
| [Email Marketing KPIs 2026](https://lagrowthmachine.com/email-marketing-kpis-2026/) | Metrics standards | HIGH |
| [Email Threading Overview](https://learn.emailengine.app/docs/sending/threading/overview) | Technical implementation | HIGH |
| [Gmail Conversation View](https://www.clrn.org/what-is-conversation-view-in-gmail/) | UI patterns | HIGH |
| [Email Template Personalization](https://www.mailersend.com/help/how-to-use-personalization) | Variable patterns | HIGH |
| [Cold Email Software Comparison](https://lagrowthmachine.com/best-email-outreach-software-2026) | Feature landscape | HIGH |
| [Outreach Metrics That Matter](https://outboundrepublic.com/blog/7-outbound-metrics-that-actually-matter/) | KPI prioritization | HIGH |
| [Cold Email Mistakes Analysis](https://sparkle.io/blog/cold-email-mistakes/) | Anti-patterns | HIGH |
