# DOMAIN-002 — Validation Utilities

---

## Ticket ID
`DOMAIN-002`

## Title
Validation Utilities

## Level
Level 1

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
SECURITY-002, TOOLS-004

## Parallelizable
YES (with DB-001)

---

## Purpose
Create input validation utilities for email addresses, recipients, and basic data integrity. These validators are used by the send gate, tools, and approval workflow.

## Current State
No validation code exists.

## Required Change
Create validation module with:
1. Email address format validation
2. Recipient list validation (non-empty, valid format)
3. Subject validation (non-empty)
4. Body validation (non-empty)
5. Suspicious domain detection (common typos like gmial.com, gamil.com)
6. Job ID format validation (EMAIL-XXXXX pattern)

## Scope
- Create `email/utils/validation/index.js`

## Out of Scope
- Do NOT create the send gate (SECURITY-002)
- Do NOT create date validation (TIME-003)
- Do NOT implement actual recipient lookup

## Expected Files / Modules
**Created:**
- `email/utils/validation/index.js`

**Tests:**
- `test/email/unit/validation/index.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`

## Interfaces / Contracts
```javascript
export function validateEmailAddress(email)    // → { valid, error? }
export function validateRecipients(toArray)     // → { valid, error?, warnings? }
export function validateSubject(subject)        // → { valid, error? }
export function validateBody(body)              // → { valid, error? }
export function validateJobId(id)               // → boolean
export function detectSuspiciousDomain(email)   // → { suspicious, suggestion? }
```

## Tests Required
1. Valid emails pass (`user@example.com`)
2. Invalid emails fail (no @, no domain, spaces)
3. Empty recipient list fails
4. Suspicious domains flagged (`gmial.com` → suggests `gmail.com`)
5. Valid job IDs pass (`EMAIL-00001`)
6. Invalid job IDs fail (`EMAIL-1`, `JOB-00001`, `EMAIL-100000`)
7. Empty subject/body fails

## Acceptance Criteria
1. All validators return consistent `{ valid, error? }` shape
2. Suspicious domain detection catches at least: `gmial.com`, `gamil.com`, `outlok.com`
3. All tests pass

## Definition of Ready
- DOMAIN-001 complete

## Definition of Done
- Validation module created
- All tests pass
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): DOMAIN-002 — add validation utilities`

## Checkpoint
Record: Validation utilities created. List exported functions.

## Next Tickets
Unlocks: Contributes to SECURITY-002 readiness

---

## AI Implementation Guardrail

```
You are implementing ONLY DOMAIN-002.
1. Read docs/03-APPROVAL-AND-SECURITY.md §9, docs/08-DATETIME-AND-TIMEZONE.md §7.
2. Read docs/implementation/CURRENT-CHECKPOINT.md.
3. Create ONLY validation utilities listed in scope.
4. Write tests.
5. Run tests.
6. Update CURRENT-CHECKPOINT.md.
7. Stop.
```
