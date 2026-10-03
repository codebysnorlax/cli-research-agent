# Email Agent — Database Schema

> SQLite is the **source of truth** for jobs. Not the LLM. Not LangGraph state. Not setTimeout().

---

## 1. Database Location

```
data/email.sqlite     ← git-ignored
```

**Location:** `email/db/database/index.js` (connection)  
**Location:** `email/db/database/schema.js` (creation/migration)

---

## 2. Tables

### `email_jobs` — The Job Table

This is the core table. Every email action becomes a job.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Application job ID: `EMAIL-00001` |
| `status` | TEXT NOT NULL | Current state (see State Machine doc) |
| `type` | TEXT NOT NULL | `NEW_EMAIL` or `REPLY` |
| | | |
| `to` | TEXT NOT NULL | Recipient email address(es), JSON array |
| `cc` | TEXT | CC recipients, JSON array |
| `bcc` | TEXT | BCC recipients, JSON array |
| `subject` | TEXT NOT NULL | Email subject line |
| `body` | TEXT NOT NULL | Email body (plain text or HTML) |
| | | |
| `thread_id` | TEXT | Gmail thread ID (for replies) |
| `reply_to_message_id` | TEXT | Gmail message ID being replied to |
| `in_reply_to_header` | TEXT | `In-Reply-To` header value |
| `references_header` | TEXT | `References` header value |
| | | |
| `scheduled_at` | TEXT | ISO 8601 datetime for scheduled send |
| `timezone` | TEXT | IANA timezone: `Asia/Kolkata` |
| | | |
| `payload_hash` | TEXT | SHA-256 of approved payload |
| `approval_id` | TEXT | Unique approval identifier |
| `approved_at` | TEXT | ISO 8601 timestamp of approval |
| `approved_by` | TEXT | Who approved: `terminal_user` |
| | | |
| `gmail_message_id` | TEXT | Gmail's returned message ID after send |
| `gmail_draft_id` | TEXT | Gmail draft ID (if created) |
| | | |
| `attempt_count` | INTEGER DEFAULT 0 | Number of send attempts |
| `last_error` | TEXT | Last error message |
| `last_attempt_at` | TEXT | ISO 8601 timestamp of last attempt |
| | | |
| `created_at` | TEXT NOT NULL | ISO 8601 job creation time |
| `updated_at` | TEXT NOT NULL | ISO 8601 last update time |
| `claimed_at` | TEXT | ISO 8601 when worker claimed the job |
| `sent_at` | TEXT | ISO 8601 actual send time |

### Indexes

```sql
CREATE INDEX idx_jobs_status ON email_jobs(status);
CREATE INDEX idx_jobs_scheduled ON email_jobs(status, scheduled_at)
  WHERE status = 'SCHEDULED';
CREATE INDEX idx_jobs_processing ON email_jobs(status)
  WHERE status = 'PROCESSING';
```

---

### `email_events` — The Audit Log

Every state transition, every significant action produces an event.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Event sequence ID |
| `job_id` | TEXT NOT NULL | FK → `email_jobs.id` |
| `event_type` | TEXT NOT NULL | Event name (see below) |
| `timestamp` | TEXT NOT NULL | ISO 8601 when event occurred |
| `metadata` | TEXT | JSON blob with event-specific data |

### Event Types

```
CREATED
DRAFT_GENERATED
APPROVAL_REQUESTED
APPROVED
REJECTED
SCHEDULE_REQUESTED
SCHEDULE_RESOLVED
SCHEDULE_CONFIRMED
SCHEDULED
CLAIM_ATTEMPTED
CLAIM_SUCCEEDED
CLAIM_FAILED
PROCESSING
SEND_GATE_PASSED
SEND_GATE_FAILED
GMAIL_SUBMITTED
SENT
FAILED
RETRY_SCHEDULED
EXPIRED
CANCELLED
RESCHEDULED
CANCEL_RACE_LOST
```

### Index

```sql
CREATE INDEX idx_events_job ON email_events(job_id);
CREATE INDEX idx_events_type ON email_events(event_type);
```

---

## 3. Schema Creation SQL

```sql
-- email/db/database/schema.js

CREATE TABLE IF NOT EXISTS email_jobs (
  id                   TEXT PRIMARY KEY,
  status               TEXT NOT NULL DEFAULT 'DRAFT',
  type                 TEXT NOT NULL DEFAULT 'NEW_EMAIL',

  "to"                 TEXT NOT NULL,
  cc                   TEXT,
  bcc                  TEXT,
  subject              TEXT NOT NULL,
  body                 TEXT NOT NULL,

  thread_id            TEXT,
  reply_to_message_id  TEXT,
  in_reply_to_header   TEXT,
  references_header    TEXT,

  scheduled_at         TEXT,
  timezone             TEXT DEFAULT 'Asia/Kolkata',

  payload_hash         TEXT,
  approval_id          TEXT,
  approved_at          TEXT,
  approved_by          TEXT,

  gmail_message_id     TEXT,
  gmail_draft_id       TEXT,

  attempt_count        INTEGER NOT NULL DEFAULT 0,
  last_error           TEXT,
  last_attempt_at      TEXT,

  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  claimed_at           TEXT,
  sent_at              TEXT
);

CREATE TABLE IF NOT EXISTS email_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      TEXT NOT NULL REFERENCES email_jobs(id),
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
  metadata    TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON email_jobs(status);

CREATE INDEX IF NOT EXISTS idx_jobs_scheduled
  ON email_jobs(status, scheduled_at)
  WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_jobs_processing
  ON email_jobs(status)
  WHERE status = 'PROCESSING';

CREATE INDEX IF NOT EXISTS idx_events_job
  ON email_events(job_id);

CREATE INDEX IF NOT EXISTS idx_events_type
  ON email_events(event_type);
```

---

## 4. Job Repository API

**Location:** `email/db/jobs/index.js`

These are the **only** operations exposed. No raw SQL from the LLM.

| Function | Description |
|---|---|
| `createJob(payload)` | Insert new job, return `EMAIL-XXXXX` |
| `getJob(id)` | Fetch job by ID |
| `updateStatus(id, fromStatus, toStatus)` | Atomic status transition |
| `claimJob(id)` | Atomic `SCHEDULED → PROCESSING` |
| `listByStatus(status)` | List jobs in given status |
| `listScheduled()` | All `SCHEDULED` jobs |
| `listDue(now)` | `SCHEDULED` jobs where `scheduled_at <= now` |
| `cancelJob(id)` | `SCHEDULED → CANCELLED` |
| `rescheduleJob(id, newDatetime, timezone)` | Update `scheduled_at` |
| `markSent(id, gmailMessageId)` | `PROCESSING → SENT` |
| `markFailed(id, error, isRetryable)` | `PROCESSING → FAILED` or schedule retry |

### Atomic Claim Pattern

```javascript
// Conceptual
function claimJob(id) {
  const result = db.run(
    `UPDATE email_jobs
     SET status = 'PROCESSING', claimed_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ? AND status = 'SCHEDULED'`,
    [id]
  );
  return result.changes === 1; // true = claimed, false = already claimed
}
```

---

## 5. Event Log Repository API

**Location:** `email/db/events/index.js`

| Function | Description |
|---|---|
| `logEvent(jobId, eventType, metadata)` | Record event |
| `getJobHistory(jobId)` | Full event timeline for a job |
| `getRecentEvents(limit)` | Latest events across all jobs |

---

## 6. Job ID Generation

Format: `EMAIL-XXXXX`

```
EMAIL-00001
EMAIL-00002
...
EMAIL-99999
```

Auto-incrementing, zero-padded, application-managed.

---

## 7. Timestamp Convention

All timestamps stored as **ISO 8601 strings in UTC**:

```
2026-10-03T14:30:00.000Z
```

Display timestamps are converted to the user's timezone (`Asia/Kolkata`) at the presentation layer.

Scheduled times are stored with their **intended timezone** in the `timezone` column, so `scheduled_at` + `timezone` together define the exact moment.

---

## 8. Transaction Safety

Every state transition that modifies the job **and** creates an event must happen in a **single transaction**:

```javascript
db.transaction(() => {
  updateStatus(jobId, 'SCHEDULED', 'PROCESSING');
  logEvent(jobId, 'PROCESSING', { worker: 'main' });
})();
```

If either fails, both roll back. The database is never in an inconsistent state.
