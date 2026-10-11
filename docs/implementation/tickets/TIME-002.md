# TIME-002 — NL Date Parser

---

## Ticket ID
`TIME-002`

## Title
NL Date Parser

## Level
Level 5

## Priority
P1

## Risk
MEDIUM

## Depends On
TIME-001

## Blocks
TOOLS-005, APPROVAL-003

## Parallelizable
YES (with GMAIL track)

---

## Purpose
Parse natural-language date/time expressions into exact timestamps. Uses hybrid approach: `chrono-node` for parsing + timezone module for resolution. Handles ambiguity detection and past-date rejection.

## Current State
Timezone module exists (TIME-001). No NL parser.

## Required Change
Create `email/utils/datetime/parser.js` per doc 08 §2–§4:
1. Install `chrono-node`
2. Parse expressions: "tomorrow at 10", "next Monday", "in 2 hours", etc.
3. Detect ambiguity ("tomorrow morning" → ask for time)
4. Reject past dates
5. Return structured result with confidence/ambiguity flags

## Scope
- Install `chrono-node`
- Create `email/utils/datetime/parser.js`

## Out of Scope
- Do NOT create the confirmation UI (APPROVAL-003)
- Do NOT create validation (TIME-003)

## Expected Files / Modules
**Modified:**
- `package.json` — add `chrono-node`
**Created:**
- `email/utils/datetime/parser.js`
**Tests:**
- `test/email/unit/datetime/parser.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/services/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function parseScheduleExpression(input, options = {})
// input: natural language string ("tomorrow at 10")
// options: { referenceDate?, timezone? }
// Returns: {
//   parsed: boolean,
//   date: Date | null,
//   utcISO: string | null,           // "2026-10-04T04:30:00.000Z"
//   timezone: string,                // "Asia/Kolkata"
//   displayString: string | null,    // "October 4, 2026 10:00 AM IST"
//   ambiguous: boolean,              // true if time missing or unclear
//   ambiguityReason: string | null,  // "Time not specified"
//   isPast: boolean,
// }
```

## Tests Required
1. "tomorrow at 10" → correct date + 10:00 AM in configured timezone
2. "next Monday" → correct date + ambiguous (no time)
3. "in 2 hours" → correct relative time
4. "tomorrow morning" → ambiguous
5. "October 15 at 6 PM" → exact datetime
6. "yesterday" → isPast: true
7. "February 31" → parsed: false
8. Empty/null input → parsed: false
9. Timezone explicitly used (not machine default)

## Acceptance Criteria
1. `chrono-node` installed
2. All supported input formats from doc 08 §3 parse correctly
3. Ambiguity detected for expressions without specific time
4. Past dates flagged
5. All tests pass

## Definition of Ready
- TIME-001 complete

## Definition of Done
- Parser module created, chrono-node installed, tests pass, checkpoint updated
- Commit: `feat(email): TIME-002 — add NL datetime parser`

## Next Tickets
Unlocks: TOOLS-005, APPROVAL-003

---

## AI Implementation Guardrail
```
You are implementing ONLY TIME-002.
1. Read docs/08-DATETIME-AND-TIMEZONE.md §2, §3, §4, §8.
2. Install chrono-node. Create ONLY the parser module.
3. Write tests covering all input formats. Run tests.
4. Update CURRENT-CHECKPOINT.md. Stop.
```
