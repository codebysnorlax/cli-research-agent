# APPROVAL-002 — Approval Workflow

---

## Ticket ID
`APPROVAL-002`

## Title
Approval Workflow

## Level
Level 7

## Priority
P0

## Risk
HIGH

## Depends On
APPROVAL-001, SECURITY-001, STATE-001

## Blocks
APPROVAL-003, GRAPH-002

## Parallelizable
NO — critical security path

---

## Purpose
Implement the human-in-the-loop approval workflow. After the LLM drafts an email, the user is presented with the draft and must choose: [S]end, [R]eject, or [T]imer. This is the **primary security boundary** — the point where a human authorizes side effects.

## Current State
Draft display exists (APPROVAL-001). Payload hashing exists (SECURITY-001). State machine exists (STATE-001). No approval workflow code.

## Required Change
Create `email/graph/approval/index.js` per doc 03 §1–§4:
1. Display draft to user (uses APPROVAL-001)
2. Collect user decision: [S]end / [R]eject / [T]imer
3. On [S]end → freeze payload, hash (SHA-256), record approval, transition to APPROVED
4. On [R]eject → transition to REJECTED, end
5. On [T]imer → signal schedule flow (APPROVAL-003)
6. Generate unique approval_id (APR-XXXXX)
7. Record approval metadata (approved_at, approved_by, payload_hash)

## Scope
- Create `email/graph/approval/index.js`

## Out of Scope
- Do NOT implement schedule confirmation (APPROVAL-003)
- Do NOT implement Gmail send
- Do NOT implement scheduler

## Expected Files / Modules
**Created:**
- `email/graph/approval/index.js`
**Tests:**
- `test/email/integration/approval/workflow.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/services/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export async function handleApproval(db, draft, readline)
// draft: structured email draft
// readline: readline interface for user input
// Returns: {
//   decision: 'SEND' | 'REJECT' | 'TIMER',
//   job?: { id, status, payloadHash, approvalId },
// }

export function generateApprovalId()
// Returns: "APR-XXXXX" (unique, sequential)
```

## Behavior
- **[S]end path:**
  1. Canonicalize payload
  2. Compute SHA-256 hash
  3. Create job in database (createJob)
  4. Transition DRAFT → AWAITING_APPROVAL → APPROVED
  5. Store payload_hash, approval_id, approved_at, approved_by
  6. Log APPROVED event
  7. Return `{ decision: 'SEND', job }`
  
- **[R]eject path:**
  1. If job was created, transition to REJECTED
  2. Log REJECTED event
  3. Return `{ decision: 'REJECT' }`

- **[T]imer path:**
  1. Signal that scheduling is needed
  2. Return `{ decision: 'TIMER' }` — schedule flow handled by APPROVAL-003

## Security
- This IS the approval boundary
- Payload is frozen (hashed) at approval time
- Approval is bound to exact payload hash
- `approved_by: 'terminal_user'`

## Tests Required
1. [S]end path creates job, hashes payload, records approval
2. [R]eject path transitions to REJECTED
3. [T]imer path returns correct signal
4. Approval ID format is APR-XXXXX
5. Payload hash is SHA-256 of canonical payload
6. approved_at is ISO 8601 UTC
7. approved_by is 'terminal_user'
8. Invalid input re-prompts (not S, R, or T)

## Acceptance Criteria
1. Given draft + [S]end, then job created with APPROVED status and payload_hash
2. Given draft + [R]eject, then REJECTED status, no send attempted
3. Given draft + [T]imer, then schedule flow signaled
4. Approval metadata fully populated
5. All tests pass

## Definition of Ready
- APPROVAL-001, SECURITY-001, STATE-001 complete

## Definition of Done
- Approval workflow created, tests pass, checkpoint updated
- Commit: `feat(email): APPROVAL-002 — add approval workflow`

---

## AI Implementation Guardrail
```
You are implementing ONLY APPROVAL-002.
1. Read docs/03-APPROVAL-AND-SECURITY.md §1–§4.
2. Verify APPROVAL-001, SECURITY-001, STATE-001 are complete.
3. Create ONLY the approval workflow. Write tests. Run tests.
4. Update CURRENT-CHECKPOINT.md. Stop.
```
