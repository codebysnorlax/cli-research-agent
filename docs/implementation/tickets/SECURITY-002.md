# SECURITY-002 — Send Gate (11 Checks)

---

## Ticket ID
`SECURITY-002`

## Title
Send Gate (11 Checks)

## Level
Level 4

## Priority
P0

## Risk
HIGH

## Depends On
STATE-001, SECURITY-001, DOMAIN-002

## Blocks
SCHED-003

## Parallelizable
NO — depends on multiple Level 3–4 outputs

---

## Purpose
Implement the 11-check send gate — the final security boundary before Gmail is contacted. Every check must pass. If ANY fails, the send is blocked and the failure reason is logged.

## Current State
No send gate code exists.

## Required Change
Create `email/utils/validation/sendGate.js` per doc 03 §5 with all 11 checks:
1. Job exists?
2. Status is PROCESSING?
3. Human approval exists?
4. Approval still valid (not expired/stale)?
5. Payload hash matches?
6. Recipient valid?
7. Schedule condition met?
8. Job not cancelled?
9. Job not expired?
10. Gmail authenticated?
11. Retry policy allows?

## Scope
- Create `email/utils/validation/sendGate.js`

## Out of Scope
- Do NOT implement Gmail authentication check (accept a boolean/function parameter)
- Do NOT implement the scheduler worker
- Do NOT implement the approval UI

## Expected Files / Modules
**Created:**
- `email/utils/validation/sendGate.js`

**Tests:**
- `test/email/unit/security/sendGate.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/graph/**`, `email/services/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function checkSendGate(job, options = {})
// job: full job record from database
// options: {
//   isGmailAuthenticated: boolean | () => boolean,
//   retryPolicyAllows: boolean | (job) => boolean,
//   maxRetryAttempts: number (default from config)
// }
// Returns: {
//   allowed: boolean,
//   checks: [{ name, passed, reason? }],  // all 11 checks with results
//   failedChecks: string[],                // names of failed checks
// }
```

## Behavior
- All 11 checks run regardless of earlier failures (report all problems, not just the first)
- Returns structured result showing every check's status
- `allowed` is true ONLY if ALL checks pass
- Each check has a human-readable name and failure reason

## Security
This IS the security boundary. It must:
- Never be bypassable
- Never be optional
- Always run before Gmail contact
- Log the gate result (SEND_GATE_PASSED or SEND_GATE_FAILED event)

## Tests Required
1. All checks pass → `{ allowed: true }`
2. Job doesn't exist (null) → fails check 1
3. Job status is not PROCESSING → fails check 2
4. Job has no approval_id → fails check 3
5. Job has no approved_at → fails check 4
6. Payload hash mismatch → fails check 5
7. Invalid recipient → fails check 6
8. Scheduled job not yet due → fails check 7
9. Job is cancelled → fails check 8
10. Job is expired → fails check 9
11. Gmail not authenticated → fails check 10
12. Retry policy exhausted → fails check 11
13. Multiple failures reported simultaneously
14. Immediate send (no scheduled_at) passes check 7

## Acceptance Criteria
1. Given a fully valid PROCESSING job, when `checkSendGate` runs, then `allowed: true` and all 11 checks show `passed: true`
2. Given a job with mismatched payload hash, when `checkSendGate` runs, then `allowed: false` and check 5 shows the failure
3. Given a job with 3 failures, when `checkSendGate` runs, then all 3 appear in `failedChecks`
4. All tests pass

## Definition of Ready
- STATE-001 complete (state machine works)
- SECURITY-001 complete (payload hashing works)
- DOMAIN-002 complete (validation utilities)

## Definition of Done
- Send gate module created with all 11 checks
- All tests pass
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): SECURITY-002 — add 11-check send gate`

## Checkpoint
Record: Send gate created. List all 11 check names. Note test results for each check individually.

## Next Tickets
Unlocks: SCHED-003

---

## AI Implementation Guardrail
```
You are implementing ONLY SECURITY-002.
1. Read docs/03-APPROVAL-AND-SECURITY.md §5 carefully — all 11 checks.
2. Read CURRENT-CHECKPOINT.md.
3. Verify STATE-001, SECURITY-001, DOMAIN-002 are complete.
4. Create ONLY the send gate module.
5. Write tests for every check individually. Run tests.
6. Update CURRENT-CHECKPOINT.md. Stop.
```
