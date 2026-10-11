# SCHED-001 — Grace Period Policy

---

## Ticket ID
`SCHED-001`

## Title
Grace Period Policy

## Level
Level 9

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
SCHED-003

## Parallelizable
YES (with SCHED-002)

---

## Purpose
Implement configurable grace period policy per doc 04 §5. If the system restarts after the scheduled time, determine whether the job is within grace (send) or outside (expire).

## Scope
- Create `email/scheduler/policies/grace.js`

## Interfaces / Contracts
```javascript
export const DEFAULT_GRACE_MINUTES = 15;

export function isWithinGracePeriod(scheduledAtISO, nowISO, graceMinutes = DEFAULT_GRACE_MINUTES)
// Returns: { withinGrace: boolean, minutesOverdue: number }

export function shouldExpire(scheduledAtISO, nowISO, graceMinutes = DEFAULT_GRACE_MINUTES)
// Returns: boolean (true if outside grace period)
```

## Tests Required
1. Job due 4 minutes ago → within grace (default 15 min)
2. Job due 30 minutes ago → outside grace
3. Job due exactly at grace boundary → within grace
4. Job not yet due → within grace (future)
5. Custom grace period works
6. Grace period 0 → expires immediately when overdue

## Acceptance Criteria
1. Grace period is configurable
2. Boundary conditions correct
3. All tests pass

## Definition of Done
- Policy created, tests pass, checkpoint updated
- Commit: `feat(email): SCHED-001 — add grace period policy`

---

## AI Implementation Guardrail
```
You are implementing ONLY SCHED-001. Read docs/04-SCHEDULER.md §5. Create ONLY the grace policy. Write tests. Run tests. Update checkpoint. Stop.
```
