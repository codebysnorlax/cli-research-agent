# SCHED-003 — Scheduler Worker

---

## Ticket ID
`SCHED-003`

## Title
Scheduler Worker

## Level
Level 9

## Priority
P0

## Risk
HIGH

## Depends On
STATE-001, SECURITY-002, GMAIL-004, SCHED-001, SCHED-002

## Blocks
SCHED-004, INTEGRATION-001

## Parallelizable
NO — critical path

---

## Purpose
Implement the polling scheduler worker per doc 04 §2, §6. This is the **deterministic executor** — it has no LLM, no intelligence. It polls SQLite for due jobs, claims them atomically, runs the send gate, and calls Gmail.

## Scope
- Create `email/scheduler/worker/index.js`

## Critical Rules
1. Scheduler has **NO LLM** dependency — verify no LLM imports
2. Uses **frozen approved payload** from database — never regenerates
3. Runs send gate before every Gmail call
4. Atomic claiming prevents duplicate sends
5. Error classification determines retry vs fail
6. Fail-closed on SQLite unavailability

## Interfaces / Contracts
```javascript
export class SchedulerWorker {
  constructor(options = { db, gmailService, pollIntervalMs })

  async start()       // Begin polling loop
  async stop()        // Graceful shutdown
  async pollOnce()    // Single poll cycle (for testing)
  isRunning()         // Returns boolean
}
```

## Behavior per poll cycle
1. Query `listDue(now)` for SCHEDULED jobs where `scheduled_at ≤ now`
2. For each due job:
   a. Apply grace period → if outside grace, transition to EXPIRED
   b. Attempt `claimJobForProcessing(id)` → if failed, skip (already claimed)
   c. Log `GMAIL_SUBMITTED` event (before API call)
   d. Run send gate → if failed, log SEND_GATE_FAILED, transition to FAILED
   e. Call `gmailService.send(frozenPayload)`
   f. On success: `markSent(id, gmailMessageId)`, log SENT
   g. On error: classify → transient: retry schedule, permanent: FAILED
3. Sleep for `pollIntervalMs`

## Security
- **NO LLM** in this code path
- Send gate runs on every job before Gmail contact
- Atomic claiming prevents concurrent execution
- Fail-closed on database unavailability

## Tests Required
1. `pollOnce` finds and processes due jobs
2. Non-due jobs are not processed
3. Atomic claim prevents double execution
4. Send gate failure blocks Gmail call
5. Successful send → SENT status + event
6. Transient error → retry scheduled
7. Permanent error → FAILED status
8. Grace period → outside grace → EXPIRED
9. No LLM import in scheduler code (code audit test)
10. `stop()` completes gracefully

## Acceptance Criteria
1. Worker polls at configured interval
2. Due jobs processed with full lifecycle
3. NO LLM dependency (verified by import audit)
4. Atomic claiming works
5. Send gate enforced
6. All tests pass

## Definition of Done
- Scheduler worker created, tests pass, checkpoint updated
- Commit: `feat(email): SCHED-003 — add scheduler worker`

---

## AI Implementation Guardrail
```
You are implementing ONLY SCHED-003.
1. Read docs/04-SCHEDULER.md (ALL sections).
2. Read docs/09-ERROR-HANDLING.md, docs/12-ANTI-PATTERNS.md §2, §3, §18.
3. Verify: NO LLM imports allowed in this file.
4. Create ONLY the scheduler worker. Write tests. Run tests.
5. AUDIT: grep for any LLM/langchain import in scheduler/. Report result.
6. Update CURRENT-CHECKPOINT.md. Stop.
```
