# TIME-003 — Date Validation

---

## Ticket ID
`TIME-003`

## Title
Date Validation

## Level
Level 5

## Priority
P0

## Risk
LOW

## Depends On
TIME-001

## Blocks
APPROVAL-003

## Parallelizable
YES (with TIME-002)

---

## Purpose
Validate parsed dates before they reach SQLite. Reject invalid dates (Feb 31), past dates, negative durations, and meaningless times. Per doc 08 §7.

## Current State
Timezone module exists (TIME-001). No date validation.

## Required Change
Create date validation functions in `email/utils/validation/index.js` (extend existing validation module from DOMAIN-002).

## Scope
- Add date validation functions to `email/utils/validation/index.js`

## Out of Scope
- Do NOT modify NL parser (TIME-002)
- Do NOT create approval UI

## Expected Files / Modules
**Modified:**
- `email/utils/validation/index.js` — add date validation functions
**Tests:**
- `test/email/unit/datetime/validation.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/services/**`

## Interfaces / Contracts
```javascript
export function validateScheduleDate(utcISO, timezone)
// Returns: { valid, error? }
// Checks: is real date, is in future, is reasonable (not 10 years away)

export function validateTimeNotPast(utcISO)
// Returns: { valid, error? }

export function isValidDate(dateString)
// Returns: boolean (is parseable and real — no Feb 31)
```

## Tests Required
1. Valid future date passes
2. Past date fails
3. February 31 fails
4. Invalid time (13:99) fails
5. Very far future (10+ years) warns
6. "in 0 seconds" fails
7. Negative duration fails

## Acceptance Criteria
1. Invalid dates never reach SQLite
2. Past dates rejected with clear message
3. All tests pass

## Definition of Ready
- TIME-001 complete, DOMAIN-002 complete

## Definition of Done
- Date validation added, tests pass, checkpoint updated
- Commit: `feat(email): TIME-003 — add date validation`

## Next Tickets
Unlocks: APPROVAL-003

---

## AI Implementation Guardrail
```
You are implementing ONLY TIME-003.
1. Read docs/08-DATETIME-AND-TIMEZONE.md §7.
2. Extend existing validation module. Write tests. Run tests.
3. Update CURRENT-CHECKPOINT.md. Stop.
```
