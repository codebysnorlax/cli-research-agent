# TIME-001 — Timezone Configuration

---

## Ticket ID
`TIME-001`

## Title
Timezone Configuration

## Level
Level 5

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
TIME-002, TIME-003

## Parallelizable
YES (with GMAIL track)

---

## Purpose
Establish explicit timezone configuration. Never depend on machine timezone. All datetime operations use IANA timezone identifiers. Default: `Asia/Kolkata`.

## Current State
No timezone configuration. DOMAIN-001 defines `DEFAULT_TIMEZONE` constant.

## Required Change
Create `email/utils/datetime/timezone.js` per doc 08 §5:
1. Default timezone constant
2. Timezone-aware "now" function
3. UTC ↔ user timezone conversion
4. Timezone display formatting
5. Install `date-fns` + `date-fns-tz` dependencies

## Scope
- Install `date-fns`, `date-fns-tz`
- Create `email/utils/datetime/timezone.js`

## Out of Scope
- Do NOT create NL parser (TIME-002)
- Do NOT create date validation (TIME-003)

## Expected Files / Modules
**Modified:**
- `package.json` — add `date-fns`, `date-fns-tz`
**Created:**
- `email/utils/datetime/timezone.js`
**Tests:**
- `test/email/unit/datetime/timezone.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/services/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function nowUTC()
// Returns: ISO 8601 UTC string

export function nowInTimezone(timezone = DEFAULT_TIMEZONE)
// Returns: Date object in specified timezone

export function toUTC(date, timezone = DEFAULT_TIMEZONE)
// Converts local datetime to UTC ISO string

export function fromUTC(utcISO, timezone = DEFAULT_TIMEZONE)
// Converts UTC ISO string to local display string

export function formatForDisplay(utcISO, timezone = DEFAULT_TIMEZONE)
// Returns: "October 4, 2026 10:00 AM IST"

export function getTimezoneAbbreviation(timezone = DEFAULT_TIMEZONE)
// Returns: "IST" for Asia/Kolkata
```

## Tests Required
1. `nowUTC` returns valid ISO 8601 UTC string
2. `toUTC` correctly converts IST to UTC (subtract 5:30)
3. `fromUTC` correctly converts UTC to IST (add 5:30)
4. `formatForDisplay` produces human-readable string with timezone
5. Never uses `new Date().toLocaleString()` without explicit timezone
6. Default timezone is `Asia/Kolkata`

## Acceptance Criteria
1. `date-fns` and `date-fns-tz` installed
2. All conversions use explicit IANA timezone
3. No dependence on `process.env.TZ` or machine timezone
4. All tests pass

## Definition of Ready
- DOMAIN-001 complete

## Definition of Done
- Timezone module created, dependencies installed, tests pass, checkpoint updated
- Commit: `feat(email): TIME-001 — add timezone configuration`

## Next Tickets
Unlocks: TIME-002, TIME-003

---

## AI Implementation Guardrail
```
You are implementing ONLY TIME-001.
1. Read docs/08-DATETIME-AND-TIMEZONE.md §5.
2. Install date-fns + date-fns-tz.
3. Create ONLY the timezone module. Write tests. Run tests.
4. Update CURRENT-CHECKPOINT.md. Stop.
```
