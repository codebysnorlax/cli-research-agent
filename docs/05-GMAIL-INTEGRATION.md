# Email Agent — Gmail Integration

> Isolate Gmail completely. The graph should not know how Gmail HTTP requests work.

---

## 1. Gmail Service Isolation

```
LangGraph
    ↓
Email Tools (abstraction)
    ↓
GmailService (isolation layer)
    ↓
googleapis (client library)
    ↓
Gmail API (external)
```

### GmailService Interface

**Location:** `email/services/gmail/index.js`

```
gmail.search(query)              → Search messages
gmail.read(messageId)            → Read full message
gmail.thread(threadId)           → Read thread
gmail.createDraft(payload)       → Create Gmail draft
gmail.send(payload)              → Send message
gmail.sendDraft(draftId)         → Send existing draft
```

### Tool → Service Mapping

```
email_search    →  gmail.search()
email_read      →  gmail.read()
email_thread    →  gmail.thread()
email_draft     →  gmail.createDraft()
approved send   →  gmail.send()
```

### Future Extensibility

```
Email Agent
     ↓
Email Service Interface
     ├── GmailService       ← current
     └── OutlookService     ← future (no agent changes needed)
```

---

## 2. Authentication — OAuth 2.0

### ✅ Use
```
Google OAuth 2.0 (Desktop credentials)
```

### ❌ Never Use
```
GMAIL_PASSWORD
GMAIL_ACCESS_TOKEN in .env
username + password
```

### OAuth Flow

```
Google Cloud Project
       ↓
Gmail API enabled
       ↓
OAuth Desktop credentials (downloaded JSON)
       ↓
Local authorization (consent screen in browser)
       ↓
Refresh token obtained
       ↓
Stored locally in credentials/token.json
```

**Location:** `email/auth/gmail/oauth.js`

### Required Setup (One-Time)

1. Create a Google Cloud Project
2. Enable Gmail API
3. Create OAuth 2.0 Desktop Client credentials
4. Download `client_secret_*.json` → save as `credentials/google-oauth.json`
5. First run triggers consent screen → token stored in `credentials/token.json`
6. Subsequent runs use stored refresh token

### Token Lifecycle

| Event | Action |
|---|---|
| First run | Open browser → consent → store token |
| Token expired | Auto-refresh using refresh token |
| Refresh token revoked | Re-prompt authorization |
| Token file missing | Re-prompt authorization |

### Credential Storage

```
credentials/
├── google-oauth.json      # OAuth client config (from Google Cloud Console)
└── token.json              # Stored refresh + access token
```

**Both files must be git-ignored.**

---

## 3. Gmail Scopes

### ❌ Don't request immediately
```
https://mail.google.com/     ← extremely broad, full mailbox access
```

### ✅ Use narrowest scopes needed

| Scope | Permission |
|---|---|
| `gmail.readonly` | Read messages, threads, labels |
| `gmail.compose` | Create drafts, send emails |

**Location:** `email/auth/gmail/scopes.js`

```javascript
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];
```

### Scope Escalation Policy

If broader access is needed later (e.g., label management, mailbox modification), add scopes **deliberately** and document why.

---

## 4. Email Threading

### The Problem

Replying isn't simply:
```
To: person
Subject: same subject
Body: reply
```

Gmail requires proper threading semantics for conversation continuity.

### Required for Thread-Aware Replies

| Field | Source | Purpose |
|---|---|---|
| `threadId` | Original message | Groups in same conversation |
| `In-Reply-To` | Original `Message-ID` header | Links to specific message |
| `References` | Original `References` + `Message-ID` | Full chain reference |
| `Subject` | Must match (with `Re:` prefix) | Thread association |

**Location:** `email/services/gmail/threading.js`

### Internal Model

Distinguish between:

```
NEW_EMAIL    → no threadId, no In-Reply-To
REPLY        → threadId + In-Reply-To + References + matching Subject
```

---

## 5. Internal Draft vs Gmail Draft

There are **two** separate concepts:

| Concept | Storage | Purpose |
|---|---|---|
| **Internal agent draft** | SQLite / LangGraph state | Application source of truth |
| **Gmail draft** | Gmail Drafts resource | Convenience / user visibility |

### Important

- Sending a Gmail draft **removes** the draft and creates a new sent message with a **new** message ID.
- **Don't** build internal job identity around a Gmail draft message ID.
- Use your own `EMAIL-00021` as the application job ID.

For the POC: the **internal approved payload in SQLite** is the source of truth.

---

## 6. Gmail Message Parsing

**Location:** `email/services/gmail/parser.js`

### Search Results — Keep Minimal

For search results, return only:
```
messageId
threadId
sender
recipient
subject
date
snippet
labels
```

**Don't** dump entire mailbox into SQLite.

### Full Content — On Demand

Retrieve full email body only when explicitly requested (email_read tool).

### Large Emails

A 30 MB email can destroy the LLM context window. Use:
- Metadata first, content on demand
- Pagination
- Size limits
- Summarization for long content

### Long Threads

Don't send 500 messages to the model. Instead:
- Retrieve relevant messages
- Summarize incrementally
- Use pagination

---

## 7. Gmail Error Handling

### Transient Errors (retryable)

```
Network unavailable
Temporary Gmail server error (5xx)
Rate limit (429)
Connection timeout
```

### Permanent Errors (don't retry)

```
Invalid recipient (400)
Invalid message format (400)
Permission denied (403)
Not found (404)
Invalid authorization (401, after refresh attempt)
```

See [09-ERROR-HANDLING.md](./09-ERROR-HANDLING.md) for retry policies.

---

## 8. Gmail Send — The Hardest Part

### The Exactly-Once Problem

```
Gmail accepts email
        ↓
network dies
        ↓
application doesn't receive response
        ↓
application thinks: FAILED
        ↓
retry → DUPLICATE sent
```

### Our Strategy

The system is designed around:

1. **At-most-once execution attempt** per job claim
2. **Idempotency strategy** where possible
3. **Reconciliation** on startup
4. **Audit history** for investigation

### Clearly Distinguish

```
"Submitted to Gmail"        ≠  "Recipient received it"
"Gmail returned success"    ≠  "Email was delivered"
```

Gmail's send operation returns the resulting message resource, but that is **not** end-to-end delivery confirmation.

---

## 9. Dependencies

```
googleapis           → Google API client
@google-cloud/local-auth  → Local OAuth flow helper
```

These are the **only** Gmail-related dependencies.
