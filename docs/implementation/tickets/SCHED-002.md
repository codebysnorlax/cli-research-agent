# SCHED-002 — Retry Policy

---

## Ticket ID
`SCHED-002`

## Title
Retry Policy

## Level
Level 9

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
SCHED-003

## Parallelizable
YES (with SCHED-001)

---

## Purpose
Implement bounded retry policy with exponential backoff and jitter per doc 09 §2. Classify errors as transient (retryable) or permanent (fail immediately). Max 3 attempts.

## Scope
- Create `email/scheduler/policies/retry.js`

## Interfaces / Contracts
```javascript
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 60_000,
  maxDelayMs: 300_000,
  backoffFactor: 2,
  jitterMs: 10_000,
};

export function classifyError(error)
// Returns: 'TRANSIENT' | 'PERMANENT'

export function shouldRetry(attemptCount, errorType)
// Returns: boolean

export function calculateNextRetryDelay(attemptCount, config = RETRY_CONFIG)
// Returns: milliseconds until next retry (with jitter)

export function getNextRetryTime(attemptCount, config = RETRY_CONFIG)
// Returns: ISO 8601 UTC string for next retry
```

## Tests Required
1. Network timeout → TRANSIENT
2. Gmail 5xx → TRANSIENT
3. Rate limit 429 → TRANSIENT
4. Invalid recipient 400 → PERMANENT
5. Permission denied 403 → PERMANENT
6. Attempt 1 of 3 → shouldRetry: true
7. Attempt 3 of 3 → shouldRetry: false
8. Backoff increases exponentially
9. Jitter adds randomness (not deterministic delay)
10. PERMANENT errors → never retry

## Acceptance Criteria
1. Error classification correct for all documented error types
2. Bounded retries (max 3)
3. Exponential backoff with jitter
4. PERMANENT errors never retried
5. All tests pass

## Definition of Done
- Retry policy created, tests pass, checkpoint updated
- Commit: `feat(email): SCHED-002 — add retry policy`

---

## AI Implementation Guardrail
```
You are implementing ONLY SCHED-002. Read docs/09-ERROR-HANDLING.md §1–§2. Create ONLY the retry policy. Write tests. Run tests. Update checkpoint. Stop.
```
