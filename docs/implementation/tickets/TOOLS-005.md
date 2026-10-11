# TOOLS-005 — Scheduling Tools

---

## Ticket ID
`TOOLS-005`

## Title
Scheduling Tools

## Level
Level 6

## Priority
P1

## Risk
MEDIUM

## Depends On
DB-002, STATE-001, TIME-002

## Blocks
GRAPH-002

## Parallelizable
NO (depends on multiple Level 2–5 outputs)

---

## Purpose
Create scheduling-related LangChain tools: `email_schedule`, `email_list_scheduled`, `email_cancel_scheduled`, `email_reschedule`. These tools let the LLM manage scheduled jobs through bounded, validated operations.

## Scope
- Create `email/tools/scheduling/index.js`

## Interfaces / Contracts
```javascript
export const emailSchedule = tool(/* propose schedule — requires approval */)
export const emailListScheduled = tool(/* read-only: list scheduled jobs */)
export const emailCancelScheduled = tool(/* cancel a scheduled job */)
export const emailReschedule = tool(/* reschedule — requires re-approval */)
```

## Security
- `email_schedule` proposes — requires approval flow
- `email_cancel_scheduled` is user-initiated, safe (state machine enforces)
- `email_reschedule` requires re-approval
- No raw SQL — uses job repository API only

## Tests Required
1. All 4 tools have correct names and schemas
2. `email_list_scheduled` returns only SCHEDULED jobs
3. `email_cancel_scheduled` uses atomic state transition
4. `email_reschedule` validates new datetime
5. No tool bypasses state machine

## Acceptance Criteria
1. All 4 tools created with proper schemas
2. State machine enforced for all mutations
3. All tests pass

## Definition of Done
- Tools created, tests pass, checkpoint updated
- Commit: `feat(email): TOOLS-005 — add scheduling tools`

---

## AI Implementation Guardrail
```
You are implementing ONLY TOOLS-005. Create scheduling tools. Use job repository and state machine — no raw SQL. Write tests. Run tests. Update checkpoint. Stop.
```
