# Email Agent — Error Handling

> Don't treat every error the same. Classify, then decide.

---

## 1. Error Classification

### Transient Errors — Retryable

```
Network unavailable
Temporary Gmail server error (5xx)
Rate limit (429)
Connection timeout
Temporary DNS failure
```

**Action:** Retry with bounded backoff.

### Permanent Errors — Not Retryable

```
Invalid recipient address (400)
Invalid message format (400)
Permission denied (403)
Resource not found (404)
Invalid authorization (401, after refresh attempt failed)
Quota permanently exceeded
```

**Action:** Mark as `FAILED`, notify user, **never** retry endlessly.

---

## 2. Retry Policy

**Location:** `email/scheduler/policies/retry.js`

### ❌ Don't do this

```javascript
while (error) {
  retry();
}
```

### ✅ Do this: Bounded Exponential Backoff with Jitter

```
Attempt 1 → immediate
     ↓
wait ~1 minute (+ jitter)
     ↓
Attempt 2
     ↓
wait ~4 minutes (+ jitter)
     ↓
Attempt 3
     ↓
FAILED (retries exhausted)
```

### Configuration

```javascript
const RETRY_CONFIG = {
  maxAttempts:     3,
  baseDelayMs:    60_000,    // 1 minute
  maxDelayMs:    300_000,    // 5 minutes
  backoffFactor:      2,
  jitterMs:      10_000,    // random 0-10s added
};
```

### Per-Attempt Tracking

Stored in `email_jobs`:

```
attempt_count     → increments per attempt
last_error        → error message/code
last_attempt_at   → timestamp of last try
```

### Retry Decision Logic

```
Is error transient?
    │
    ├── NO  → FAILED (permanent, don't retry)
    │
    └── YES
          │
          ├── attempt_count >= maxAttempts?
          │       │
          │       └── YES → FAILED (retries exhausted)
          │
          └── NO → calculate next retry time
                        │
                        ▼
                   SCHEDULED (with retry timestamp)
```

---

## 3. Error Recovery Scenarios

### Scenario: Gmail accepted, but response lost

```
Gmail → SENT (actually sent)
       ↓
network dies
       ↓
application thinks → FAILED
       ↓
retry → DUPLICATE
```

**Mitigation:**
- Log `GMAIL_SUBMITTED` event **before** calling Gmail API
- If response is lost, reconciliation can check Gmail's sent folder
- Don't casually claim "exactly-once delivery"

### Scenario: Crash during PROCESSING

```
Status: PROCESSING
       ↓
Process crashes
       ↓
Restart
```

**Reconciliation detects:**
- Job in `PROCESSING` state
- No `SENT` or `FAILED` event logged
- Check: did Gmail actually send it?

**Recovery options:**
1. Check Gmail sent folder for matching message
2. If found → mark `SENT`
3. If not found → reset to `SCHEDULED` for retry
4. If uncertain → mark `FAILED`, notify user

### Scenario: OAuth token expired during send

```
Expected: auto-refresh via refresh token
          ↓
          retry with new access token
```

If refresh token is **also** revoked:
```
FAILED (permanent: authentication lost)
       ↓
Notify user to re-authorize
```

### Scenario: SQLite unavailable

```
No database = No reliable job state = No send
```

**Fail closed.** The scheduler stops processing entirely.

---

## 4. Error Reporting

Every error should produce:

1. **Event log entry** with full error details
2. **Job update** with `last_error` and `attempt_count`
3. **User notification** for permanent failures

### Error Event Metadata

```json
{
  "error_type": "TRANSIENT",
  "error_code": "NETWORK_TIMEOUT",
  "error_message": "Connection to Gmail timed out after 30s",
  "attempt": 2,
  "next_retry_at": "2026-10-03T10:05:30.000Z",
  "gmail_response": null
}
```

---

## 5. Failure States in the UI

### Transient Failure (retrying)

```
EMAIL-00021

Status: RETRY_SCHEDULED
Attempt: 2 of 3
Last Error: Network timeout
Next Retry: 10:05 AM IST
```

### Permanent Failure

```
EMAIL-00021

Status: FAILED ✗
Reason: Invalid recipient address
        rahul@gmial.com

[Edit & Retry]  [Discard]
```

### Retries Exhausted

```
EMAIL-00021

Status: FAILED ✗
Attempts: 3 of 3
Last Error: Gmail temporarily unavailable

[Retry Now]  [Reschedule]  [Discard]
```

---

## 6. System Component Failure Matrix

| Component Down | Impact | System Behavior |
|---|---|---|
| **LLM** (Gemini/OpenRouter) | Can't draft new emails | Scheduler continues, scheduled jobs still send |
| **Gmail API** | Can't send | Jobs remain in SCHEDULED, retry on recovery |
| **SQLite** | Can't verify state | **Fail closed** — stop all processing |
| **Network** | Can't reach anything | Retry transient, report permanent |
| **OAuth expired** | Can't authenticate | Auto-refresh, or fail permanently |
| **OAuth revoked** | Can't authenticate | Permanent failure, user re-auth needed |

### Key Property

```
Model failure should NOT destroy the system.
Gmail failure should NOT destroy the system.
Only SQLite failure should halt the system (fail closed).
```
