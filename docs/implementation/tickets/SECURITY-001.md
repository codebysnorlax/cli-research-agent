# SECURITY-001 — Payload Hashing (SHA-256)

---

## Ticket ID
`SECURITY-001`

## Title
Payload Hashing (SHA-256)

## Level
Level 4

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
SECURITY-002, APPROVAL-002

## Parallelizable
YES (can start as soon as DOMAIN-001 is done, in parallel with Level 2–3 work)

---

## Purpose
Implement SHA-256 payload hashing for email approval integrity. After the user approves an email, the exact payload is frozen and hashed. At send time, the hash is recomputed and compared. Any modification invalidates the approval.

## Current State
No hashing code exists.

## Required Change
Create hashing utility per doc 03 §4:
1. `hashPayload(payload)` — compute SHA-256 of canonical email payload
2. `verifyPayload(payload, expectedHash)` — recompute and compare
3. Canonical payload format (deterministic JSON serialization)

## Scope
- Create `email/utils/hashing/index.js`

## Out of Scope
- Do NOT implement the send gate (SECURITY-002)
- Do NOT implement approval workflow (APPROVAL-002)

## Expected Files / Modules
**Created:**
- `email/utils/hashing/index.js`

**Tests:**
- `test/email/unit/security/hashing.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`

## Interfaces / Contracts
```javascript
import { createHash } from 'node:crypto';

export function hashPayload(payload)
// payload: { to, cc, bcc, subject, body, threadId, replyToMessageId }
// Canonical: sort keys, JSON.stringify, then SHA-256 hex digest
// Returns: "sha256:<hex>"

export function verifyPayload(payload, expectedHash)
// Recompute hash, compare with expected
// Returns: { valid: boolean, computedHash: string }

export function canonicalizePayload(payload)
// Extract only approval-relevant fields, sort keys, stringify
// Returns: canonical JSON string
```

## Behavior
- Uses Node.js built-in `node:crypto` (no external dependency)
- Canonical form includes ONLY: `to`, `cc`, `bcc`, `subject`, `body`, `threadId`, `replyToMessageId`
- Keys are sorted alphabetically for deterministic output
- Null/undefined fields are excluded from canonical form
- Hash prefix: `sha256:` for future algorithm flexibility

## Security
- SHA-256 is cryptographically secure for integrity checking
- Any field change produces a completely different hash
- Hash comparison prevents post-approval payload modification

## Failure Cases
- Missing required fields in payload → hash still computes (empty values produce valid hash)
- Hash format mismatch → `verifyPayload` returns `{ valid: false }`

## Edge Cases
- Payload with unicode characters → handled by JSON.stringify
- Payload with empty arrays (`to: []`) → included in canonical form
- `null` vs `undefined` fields → both excluded from canonical form
- Field ordering in input doesn't matter (canonical sorting handles it)

## Tests Required
1. Same payload always produces same hash
2. Different payload produces different hash
3. `verifyPayload` returns true for matching payload
4. `verifyPayload` returns false when any field changes (to, cc, bcc, subject, body, threadId, replyToMessageId — test each)
5. Field order doesn't affect hash
6. Null/undefined fields excluded consistently
7. Hash has `sha256:` prefix
8. Unicode content hashes correctly

## Acceptance Criteria
1. Given an approved payload, when no fields change, then `verifyPayload` returns `{ valid: true }`
2. Given an approved payload, when recipient changes, then `verifyPayload` returns `{ valid: false }`
3. Given an approved payload, when subject changes, then `verifyPayload` returns `{ valid: false }`
4. Given an approved payload, when body changes, then `verifyPayload` returns `{ valid: false }`
5. All tests pass

## Definition of Ready
- DOMAIN-001 complete

## Definition of Done
- Hashing module created
- All tests pass
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): SECURITY-001 — add SHA-256 payload hashing`

## Checkpoint
Record: Hashing utility created. List exported functions. Note hash format.

## Next Tickets
Unlocks: SECURITY-002, APPROVAL-002

---

## AI Implementation Guardrail
```
You are implementing ONLY SECURITY-001.
1. Read docs/03-APPROVAL-AND-SECURITY.md §3, §4.
2. Read CURRENT-CHECKPOINT.md.
3. Create ONLY the hashing utility.
4. Write tests. Run tests.
5. Update CURRENT-CHECKPOINT.md. Stop.

Do NOT implement the send gate.
Do NOT implement approval workflow.
```
