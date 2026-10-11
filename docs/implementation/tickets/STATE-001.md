# STATE-001 — State Transition Engine

---

## Ticket ID
`STATE-001`

## Title
State Transition Engine

## Level
Level 3

## Priority
P0

## Risk
HIGH

## Depends On
DB-002, DB-003

## Blocks
SECURITY-002, APPROVAL-002, TOOLS-005, SCHED-003

## Parallelizable
NO — critical path

---

## Purpose
Implement the deterministic state machine that governs the email job lifecycle. This is the **most important component** — more important than the LLM. Every state transition must be validated, atomic, and produce an audit event in a single transaction.

## Current State
- Job repository exists (DB-002)
- Event log exists (DB-003)
- Domain constants define valid transitions (DOMAIN-001)
- No state machine enforcement code

## Required Change
Create state transition engine that:
1. Validates transitions against the transition map from DOMAIN-001
2. Rejects illegal transitions
3. Enforces terminal state immutability (SENT, FAILED, EXPIRED, REJECTED, CANCELLED never change)
4. Wraps every transition in a transaction (job update + event log)
5. Enforces state invariants from doc 02 §5
6. Provides the atomic claim operation for the scheduler

## Scope
- Create `email/db/stateMachine.js` (or `email/state/index.js`)

## Out of Scope
- Do NOT implement Gmail integration
- Do NOT implement the approval UI
- Do NOT implement the scheduler worker
- Do NOT implement datetime parsing

## Expected Files / Modules
**Created:**
- `email/state/index.js`

**Tests:**
- `test/email/unit/state/transitions.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/graph/**`, `email/services/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function transitionJob(db, jobId, toStatus, metadata = {})
// 1. Get current job
// 2. Validate transition (currentStatus → toStatus) against VALID_TRANSITIONS
// 3. Reject if illegal or terminal
// 4. In transaction: updateStatus + logEvent
// Returns: { success, job?, error? }

export function claimJobForProcessing(db, jobId)
// Atomic SCHEDULED → PROCESSING
// In transaction: claimJob + logEvent(CLAIM_SUCCEEDED or CLAIM_FAILED)
// Returns: { claimed, job? }

export function isTerminalState(status)
// Returns: boolean

export function isValidTransition(fromStatus, toStatus)
// Returns: boolean

export function getValidNextStates(currentStatus)
// Returns: status[]
```

## Behavior
- **Every** transition goes through `transitionJob()` — no direct DB updates elsewhere
- Transaction wraps `updateStatus()` + `logEvent()` atomically
- If either fails, both roll back
- Terminal states cannot be transitioned from
- Invalid transitions return `{ success: false, error: "..." }`
- `claimJobForProcessing` logs both success AND failure attempts for audit

## Security
- State machine is the enforcement layer — not the LLM, not the UI
- Terminal states are absolutely immutable
- Atomic transactions prevent inconsistent state

## Failure Cases
- Attempt SENT → DRAFT → reject with error
- Attempt CANCELLED → PROCESSING → reject with error
- Concurrent claim attempts → only one succeeds (test with two sequential calls)
- Transaction failure → both update and event roll back

## Edge Cases
- SCHEDULED → SCHEDULED (reschedule) — valid, same source and target
- PROCESSING → SCHEDULED (retry after transient failure) — valid
- Two simultaneous `claimJobForProcessing` on same job — only first returns `{ claimed: true }`

## Tests Required
1. Every valid transition from doc 02 §3 succeeds
2. Every invalid transition is rejected
3. Transition from terminal state always fails
4. `transitionJob` creates event log entry
5. Transaction atomicity: if event insert fails, status doesn't change
6. `claimJobForProcessing` returns true on first call, false on second
7. `claimJobForProcessing` logs CLAIM_SUCCEEDED for winner
8. `claimJobForProcessing` logs CLAIM_FAILED for loser
9. `isTerminalState` correctly identifies all 5 terminal states
10. `isValidTransition` matches transition map exactly
11. `getValidNextStates` returns correct options for each state
12. SCHEDULED → SCHEDULED (reschedule) works
13. PROCESSING → SCHEDULED (retry) works

## Acceptance Criteria
1. Given a job in DRAFT, when `transitionJob(db, id, 'AWAITING_APPROVAL')` is called, then status changes and event is logged
2. Given a job in SENT, when any transition is attempted, then it is rejected
3. Given a SCHEDULED job, when `claimJobForProcessing` is called twice, then only the first returns `{claimed: true}`
4. Given a transaction failure, when transition is attempted, then neither status nor event log changes
5. All tests pass

## Definition of Ready
- DB-002 complete (job repository)
- DB-003 complete (event log repository)
- DOMAIN-001 complete (transition map)

## Definition of Done
- State machine module created
- All tests pass (≥13 tests)
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): STATE-001 — add state transition engine`

## Checkpoint
Record: State machine implemented. List all valid transitions tested. Note claim race test results. Record transaction atomicity verification.

## Next Tickets
Unlocks: SECURITY-002, APPROVAL-002, TOOLS-005, SCHED-003

---

## AI Implementation Guardrail
```
You are implementing ONLY STATE-001.
1. Read docs/02-STATE-MACHINE.md (ALL sections).
2. Read docs/06-DATABASE-SCHEMA.md §8 (transactions).
3. Read CURRENT-CHECKPOINT.md.
4. Verify DB-002 and DB-003 are complete.
5. Import VALID_TRANSITIONS from email/domain/transitions.js.
6. Create ONLY the state machine module.
7. Write comprehensive tests. Run tests.
8. Update CURRENT-CHECKPOINT.md. Stop.

Do NOT implement Gmail calls.
Do NOT implement approval UI.
Do NOT implement scheduler.
```
