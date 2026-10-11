# APPROVAL-003 — Schedule Confirmation

---

## Ticket ID
`APPROVAL-003`

## Title
Schedule Confirmation

## Level
Level 7

## Priority
P0

## Risk
MEDIUM

## Depends On
APPROVAL-002, TIME-002, TIME-003

## Blocks
INTEGRATION-001

## Parallelizable
NO

---

## Purpose
When user selects [T]imer, collect the schedule expression, parse it, display the resolved datetime, and get explicit confirmation. Never silently schedule. Per doc 08 §6.

## Scope
- Create `email/graph/approval/schedule.js`

## Interfaces / Contracts
```javascript
export async function handleScheduleConfirmation(db, jobId, readline, options = {})
// 1. Prompt: "When should this email be sent?"
// 2. Parse NL expression (TIME-002)
// 3. If ambiguous: ask clarifying question
// 4. Validate date (TIME-003)
// 5. Display: "You said: 'tomorrow at 10' → October 4, 2026 10:00 AM IST"
// 6. Confirm: [Y/N]
// 7. On Y: transition job to SCHEDULED, store scheduled_at + timezone
// 8. On N: re-prompt or cancel
// Returns: { confirmed, scheduledAt?, timezone? }
```

## Tests Required
1. Valid expression resolves and confirms
2. Ambiguous expression prompts for clarification
3. Past date rejected with message
4. Confirmation shows exact datetime with timezone
5. [N] allows re-prompt
6. Job transitions to SCHEDULED on confirmation

## Acceptance Criteria
1. User always sees resolved datetime before confirming
2. Ambiguous inputs trigger clarification
3. Invalid dates rejected before persistence
4. All tests pass

## Definition of Done
- Schedule confirmation created, tests pass, checkpoint updated
- Commit: `feat(email): APPROVAL-003 — add schedule confirmation`

---

## AI Implementation Guardrail
```
You are implementing ONLY APPROVAL-003. Use TIME-002 parser + TIME-003 validation. Never silently schedule. Write tests. Run tests. Update checkpoint. Stop.
```
