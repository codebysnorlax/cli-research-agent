# Email Agent — Scheduler

> SQLite is the source of truth. The scheduler is the execution mechanism.  
> The scheduler can die. The database cannot forget what was scheduled.

---

## 1. Why Not setTimeout()

```javascript
// ❌ DON'T DO THIS
setTimeout(() => sendEmail(), 3600000);
```

```
10:00 AM — schedule email
10:30 AM — computer crashes
11:00 AM — computer restarts
```

The `setTimeout()` is **gone**. SQLite is **not**.

---

## 2. Scheduler Architecture

```
Scheduler Worker
    │
    ├── Startup reconciliation
    │
    ├── Periodically query SQLite
    │
    └── Find due SCHEDULED jobs
                  │
                  ▼
             Claim job (atomic)
                  │
                  ▼
              PROCESSING
                  │
                  ▼
             Send Gate (11 checks)
                  │
                  ▼
             Gmail Service
                  │
                  ▼
             Update state
```

**Location:** `email/scheduler/worker/index.js`

---

## 3. Atomic Job Claiming

This is **critical** for preventing duplicate sends.

### The Problem

```
Worker A sees: EMAIL-001, SCHEDULED, due now
Worker B sees: EMAIL-001, SCHEDULED, due now

Without protection:
  A → send
  B → send
  User receives DUPLICATE email
```

### The Solution

```sql
UPDATE jobs
SET status = 'PROCESSING',
    claimed_at = CURRENT_TIMESTAMP
WHERE id = ?
AND status = 'SCHEDULED'
```

Then check: **Was exactly one row affected?**

- `1 row` → This worker claimed it. Proceed.
- `0 rows` → Another worker already claimed it. Skip.

This single detail prevents the most dangerous class of scheduler bugs.

**Location:** `email/db/jobs/index.js` → `claimJob()`

---

## 4. Startup Reconciliation

Every time the system starts (`npm run email`), it must:

```
1. Find PROCESSING jobs        → stale? reset or investigate
2. Find past-due SCHEDULED jobs → apply grace policy
3. Find FAILED jobs             → report for user attention
4. Count all job states         → display summary
```

### Expected Output

```
EMAIL AGENT
────────────────────────────────

Gmail             ✓
SQLite            ✓
Scheduler         ✓

Reconciling jobs...

Scheduled         3
Processing        0
Due               1
Expired           1
Failed            0

Next email:
EMAIL-00021
October 4, 2026
10:00 AM IST

────────────────────────────────
Ready.
```

**Location:** `email/scheduler/reconciliation/index.js`

---

## 5. Grace Period Policy

### The Problem

```
Scheduled: 10:00 AM
Computer OFF.
Computer starts: 4:30 PM
```

**Don't** automatically send 6.5 hours late.

### The Solution

Define a configurable grace period:

```
scheduled_at + grace_period = deadline
```

| Scenario | Action |
|---|---|
| Restart at 10:04 (within grace) | **SEND** (potentially) |
| Restart at 16:30 (outside grace) | **EXPIRED** |

### Grace Period Configuration

```javascript
// email/scheduler/policies/grace.js
const DEFAULT_GRACE_MINUTES = 15; // configurable
```

### Expired Email UX

```
EMAIL-00021

Scheduled:
  October 3, 2026 — 10:00 AM

Current:
  October 3, 2026 — 4:30 PM

⚠ Scheduled time has passed.
Email was NOT sent.

[Send Now]  [Reschedule]  [Discard]
```

**Location:** `email/scheduler/policies/grace.js`

---

## 6. Polling Strategy

The worker polls SQLite at a configurable interval:

```javascript
// Conceptual
const POLL_INTERVAL_MS = 30_000; // 30 seconds

async function pollLoop() {
  while (running) {
    const dueJobs = await findDueJobs();
    for (const job of dueJobs) {
      await processJob(job);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}
```

### Why Polling (Not setTimeout Per Job)

- **Restart-safe:** On restart, the worker simply queries for all due jobs.
- **Simple:** No complex event system needed.
- **Reliable:** SQLite is the single source of truth.
- **Debuggable:** You can inspect the database at any time.

---

## 7. Single Worker Assumption

For this POC, assume **one scheduler worker**.

If `npm run email` is started twice:

- Either **prevent** the second instance (process lock)
- Or the atomic claiming ensures safety regardless

For now, a single-worker assumption is sufficient. The atomic claim provides a safety net.

---

## 8. What the Scheduler Does NOT Do

| The Scheduler Does | The Scheduler Does NOT |
|---|---|
| Poll for due jobs | Call the LLM |
| Atomically claim jobs | Regenerate email content |
| Execute via Send Gate | Modify email payloads |
| Update job state | Interpret natural language |
| Log events | Interact with the terminal |
| Apply retry policy | Make approval decisions |

The scheduler is a **deterministic executor**. It has no intelligence. It doesn't need any.

---

## 9. Scheduler Health

The scheduler should survive:

| Failure | Expected Behavior |
|---|---|
| Gmail temporarily down | Retry per policy, don't crash |
| Network unavailable | Retry per policy, don't crash |
| OAuth token expired | Refresh automatically |
| OAuth revoked | Report error, don't send |
| SQLite unavailable | **Fail closed** — do NOT send |
| LLM unavailable | Scheduler is unaffected |
| System clock change | Re-evaluate based on current time |
| Computer sleep/wake | Treated as restart — reconcile |

### Fail-Closed Principle

If SQLite is unavailable:

```
No database = No reliable job state = No authorization state = No send
```

The scheduler should **never** send an email without being able to verify the job's state.
