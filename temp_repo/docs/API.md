# API Documentation

## Core API (port 3000)

### Authentication

Currently, workspace identification is done via `workspace_id` parameter. Future versions will implement JWT authentication.

### Base URL

`http://localhost:3000/api` (development)
`https://yourdomain.com/api` (production)

---

## Workspaces

### Create Workspace

```http
POST /api/workspaces
```

**Request Body:**

```json
{
  "name": "My Company",
  "owner_telegram_id": "123456789"
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "My Company",
  "owner_telegram_id": "123456789",
  "created_at": "2025-01-06T10:00:00Z"
}
```

---

## Contacts

### Upload Contacts

```http
POST /api/contacts/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `workspace_id`: string (UUID)
- `file`: CSV/TSV file

**CSV Format:**

```csv
email,first_name,last_name,company,website
john@example.com,John,Doe,Acme Inc,https://example.com
```

**Response:**

```json
{
  "imported": 10,
  "duplicates": 2,
  "invalid": 1,
  "total": 13
}
```

### List Contacts

```http
GET /api/contacts?workspace_id={uuid}&limit=50&offset=0
```

**Response:**

```json
[
  {
    "id": "uuid",
    "workspace_id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "website": "https://example.com",
    "created_at": "2025-01-06T10:00:00Z"
  }
]
```

### Delete Contact

```http
DELETE /api/contacts/{id}
```

**Response:**

```json
{
  "message": "Contact deleted"
}
```

---

## Suppression List

### Add to Suppression List

```http
POST /api/suppression
```

**Request Body:**

```json
{
  "workspace_id": "uuid",
  "email": "bounce@example.com",
  "reason": "hard_bounce"
}
```

### List Suppressed Emails

```http
GET /api/suppression?workspace_id={uuid}
```

---

## Prompt Profiles

### Create Prompt Profile

```http
POST /api/prompt-profiles
```

**Request Body:**

```json
{
  "workspace_id": "uuid",
  "name": "Sales Outreach",
  "system_prompt": "You are a professional sales representative...",
  "user_prompt_template": "Write an email to {{first_name}} at {{company}}...",
  "temperature": 0.7,
  "max_tokens": 500
}
```

### List Prompt Profiles

```http
GET /api/prompt-profiles?workspace_id={uuid}
```

### Update Prompt Profile

```http
PUT /api/prompt-profiles/{id}
```

### Delete Prompt Profile

```http
DELETE /api/prompt-profiles/{id}
```

---

## Campaigns

### Create Campaign

```http
POST /api/campaigns
```

**Request Body:**

```json
{
  "workspace_id": "uuid",
  "name": "Q1 Outreach",
  "prompt_profile_id": "uuid",
  "steps": [
    {
      "step_number": 1,
      "template": "Initial outreach",
      "delay_hours": 0
    },
    {
      "step_number": 2,
      "template": "Follow-up if no response",
      "delay_hours": 48
    },
    {
      "step_number": 3,
      "template": "Final follow-up",
      "delay_hours": 96
    }
  ]
}
```

**Response:**

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "name": "Q1 Outreach",
  "status": "draft",
  "created_at": "2025-01-06T10:00:00Z"
}
```

### List Campaigns

```http
GET /api/campaigns?workspace_id={uuid}
```

### Get Campaign with Stats

```http
GET /api/campaigns/{id}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Q1 Outreach",
  "status": "active",
  "stats": {
    "total_recipients": 100,
    "sent_count": 75,
    "pending_count": 25,
    "replied_count": 10,
    "leads_count": 5,
    "failed_count": 2
  },
  "steps": [...]
}
```

### Update Campaign Status

```http
POST /api/campaigns/{id}/status
```

**Request Body:**

```json
{
  "status": "active" // or "paused"
}
```

### Add Recipients

```http
POST /api/campaigns/{id}/recipients
```

**Request Body:**

```json
{
  "contact_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Leads

### List Leads

```http
GET /api/leads?workspace_id={uuid}&status=new
```

**Query Parameters:**
- `workspace_id`: UUID (required)
- `status`: new | taken | replied | closed
- `limit`: number (default: 50)
- `offset`: number (default: 0)

### Get Lead Details

```http
GET /api/leads/{id}
```

**Response:**

```json
{
  "id": "uuid",
  "contact": {
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc"
  },
  "campaign": {
    "id": "uuid",
    "name": "Q1 Outreach"
  },
  "status": "new",
  "thread": [
    {
      "id": "uuid",
      "direction": "outbound",
      "subject": "Quick question about...",
      "body": "Hi John...",
      "sent_at": "2025-01-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "direction": "inbound",
      "subject": "Re: Quick question about...",
      "body": "Thanks for reaching out...",
      "received_at": "2025-01-02T15:30:00Z"
    }
  ],
  "created_at": "2025-01-02T15:30:00Z"
}
```

### Take Lead

```http
POST /api/leads/{id}/take
```

**Request Body:**

```json
{
  "taken_by_telegram_id": "123456789"
}
```

### Reply to Lead

```http
POST /api/leads/{id}/reply
```

**Request Body:**

```json
{
  "body": "Thanks for your interest! Let me share more details..."
}
```

### Close Lead

```http
POST /api/leads/{id}/close
```

---

## Billing

### Get Balance

```http
GET /api/billing/balance?workspace_id={uuid}
```

**Response:**

```json
{
  "workspace_id": "uuid",
  "balance": 1000,
  "currency": "USD"
}
```

### Get Ledger

```http
GET /api/billing/ledger?workspace_id={uuid}&limit=50
```

**Response:**

```json
[
  {
    "id": "uuid",
    "type": "credit",
    "amount": 1000,
    "description": "Initial deposit",
    "balance_after": 1000,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "type": "debit",
    "amount": -1,
    "description": "Email sent to john@example.com",
    "balance_after": 999,
    "created_at": "2025-01-02T10:30:00Z"
  }
]
```

### Add Credits

```http
POST /api/billing/credit
```

**Request Body:**

```json
{
  "workspace_id": "uuid",
  "amount": 500,
  "description": "Monthly top-up"
}
```

---

## Gmail Service (port 3001)

### Send Email

```http
POST /api/send
```

**Request Body:**

```json
{
  "workspace_id": "uuid",
  "to": "recipient@example.com",
  "subject": "Hello",
  "body": "Email body...",
  "thread_id": "optional-thread-id"
}
```

### List Gmail Accounts

```http
GET /api/accounts
```

### Setup Watch

```http
POST /api/watch/setup
```

**Request Body:**

```json
{
  "gmail_account_id": "uuid"
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error
