# DOMAIN-001 — Email Job Constants & Contracts

---

## Ticket ID
`DOMAIN-001`

## Title
Email Job Constants & Contracts

## Level
Level 1

## Priority
P0

## Risk
LOW

## Depends On
FOUND-001, FOUND-002

## Blocks
DOMAIN-002, DB-001, DB-002, DB-003, STATE-001, SECURITY-001, TIME-001, GRAPH-001, SCHED-001, SCHED-002, TOOLS-004

## Parallelizable
NO — foundational contract, blocks many tickets

---

## Purpose
Define the canonical domain constants and data contracts for the email agent. These are the shared definitions that every other module depends on: job statuses, event types, email types, valid transitions, and the job data shape.

## Current State
No domain definitions exist.

## Required Change
Create a domain constants module that defines:
1. All 10 job statuses as an immutable enum/object
2. Terminal states set
3. Valid state transitions map
4. Event types enum
5. Email types (NEW_EMAIL, REPLY)
6. Job ID format specification
7. Timestamp utility for ISO 8601 UTC generation
8. Default configuration constants (grace period, retry, poll interval)

## Scope
- Create `email/domain/constants.js` — status enums, event types, email types
- Create `email/domain/transitions.js` — valid transition map
- Create `email/domain/config.js` — default configuration constants

## Out of Scope
- Do NOT create database code
- Do NOT create state machine logic (just the transition map)
- Do NOT create Gmail code
- Do NOT create UI code

## Expected Files / Modules
**Created:**
- `email/domain/constants.js`
- `email/domain/transitions.js`
- `email/domain/config.js`

**Tests:**
- `test/email/unit/domain/constants.test.js`
- `test/email/unit/domain/transitions.test.js`

## Forbidden Files / Modules
- `src/**`
- `notion/**`
- `email/db/**`
- `email/graph/**`
- `email/services/**`
- `email/scheduler/**`

## Interfaces / Contracts

### Job Statuses (from doc 02 §2)
```
DRAFT
AWAITING_APPROVAL
REJECTED          (terminal)
APPROVED
SCHEDULED
PROCESSING
SENT              (terminal)
FAILED            (terminal)
EXPIRED           (terminal)
CANCELLED         (terminal)
```

### Valid Transitions (from doc 02 §3)
```
DRAFT              → AWAITING_APPROVAL
AWAITING_APPROVAL  → REJECTED, APPROVED
APPROVED           → PROCESSING, SCHEDULED
SCHEDULED          → PROCESSING, EXPIRED, CANCELLED, SCHEDULED
PROCESSING         → SENT, FAILED, SCHEDULED
```

### Event Types (from doc 02 §7)
```
CREATED, DRAFT_GENERATED, APPROVAL_REQUESTED, APPROVED, REJECTED,
SCHEDULE_REQUESTED, SCHEDULE_RESOLVED, SCHEDULE_CONFIRMED, SCHEDULED,
CLAIM_ATTEMPTED, CLAIM_SUCCEEDED, CLAIM_FAILED, PROCESSING,
SEND_GATE_PASSED, SEND_GATE_FAILED, GMAIL_SUBMITTED, SENT, FAILED,
RETRY_SCHEDULED, EXPIRED, CANCELLED, RESCHEDULED, CANCEL_RACE_LOST
```

### Email Types
```
NEW_EMAIL, REPLY
```

### Config Constants
```
DEFAULT_GRACE_MINUTES: 15
MAX_RETRY_ATTEMPTS: 3
RETRY_BASE_DELAY_MS: 60000
RETRY_MAX_DELAY_MS: 300000
RETRY_BACKOFF_FACTOR: 2
RETRY_JITTER_MS: 10000
POLL_INTERVAL_MS: 30000
DEFAULT_TIMEZONE: 'Asia/Kolkata'
```

## Data Changes
None.

## Behavior
Pure data definitions. No runtime behavior — only exported constants.

## Security
None.

## Failure Cases
None — pure constants.

## Edge Cases
- Ensure SCHEDULED → SCHEDULED (reschedule) is a valid transition
- Ensure PROCESSING → SCHEDULED (retry) is a valid transition

## Tests Required
1. All 10 statuses are defined and unique
2. Terminal states set contains exactly: SENT, FAILED, EXPIRED, REJECTED, CANCELLED
3. Every transition in the map matches doc 02 §3
4. No transition leads TO a terminal state FROM another terminal state
5. All event types are defined
6. Config constants have correct default values

## Acceptance Criteria
1. `import { JOB_STATUSES, TERMINAL_STATES, EVENT_TYPES, EMAIL_TYPES } from 'email/domain/constants.js'` works
2. `import { VALID_TRANSITIONS } from 'email/domain/transitions.js'` works
3. `import { DEFAULT_CONFIG } from 'email/domain/config.js'` works
4. All constants match architecture documents exactly
5. Tests pass

## Definition of Ready
- FOUND-001 and FOUND-002 complete
- Architecture docs 02-STATE-MACHINE.md and 04-SCHEDULER.md reviewed

## Definition of Done
- All files created
- All tests pass
- Constants match architecture exactly
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): DOMAIN-001 — add email job constants and contracts`

## Checkpoint
Record: Domain constants created. List all exported symbols. Confirm match with architecture.

## Next Tickets
Unlocks: DOMAIN-002, DB-001, SECURITY-001, TIME-001, GRAPH-001, SCHED-001, SCHED-002

---

## AI Implementation Guardrail

```
You are implementing ONLY DOMAIN-001.

1. Read docs/02-STATE-MACHINE.md, docs/04-SCHEDULER.md, docs/09-ERROR-HANDLING.md.
2. Read docs/implementation/CURRENT-CHECKPOINT.md.
3. Create ONLY the domain constant files listed in scope.
4. Write tests.
5. Run tests.
6. Update CURRENT-CHECKPOINT.md.
7. Stop.

Do NOT create database code.
Do NOT create state machine logic (only the transition map data).
Do NOT create Gmail code.
```
