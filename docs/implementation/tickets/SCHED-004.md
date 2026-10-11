# SCHED-004 — Startup Reconciliation

---

## Ticket ID
`SCHED-004`

## Title
Startup Reconciliation

## Level
Level 9

## Priority
P0

## Risk
MEDIUM

## Depends On
SCHED-003, DB-002

## Blocks
INTEGRATION-001

## Parallelizable
NO

---

## Purpose
Every time the system starts, reconcile the database state per doc 04 §4. Find stale PROCESSING jobs, apply grace policy to past-due SCHEDULED jobs, report FAILED jobs, and display a status summary.

## Scope
- Create `email/scheduler/reconciliation/index.js`

## Interfaces / Contracts
```javascript
export async function reconcile(db, options = {})
// Returns: {
//   staleProcessing: job[],    // PROCESSING jobs (stale — may need investigation)
//   overdue: job[],            // Past-due SCHEDULED jobs
//   expired: job[],            // Jobs expired by grace policy
//   failed: job[],             // FAILED jobs needing attention
//   summary: { scheduled, processing, due, expired, failed }
// }

export function formatReconciliationReport(result)
// Returns: formatted terminal string (per doc 04 §4 Expected Output)
```

## Behavior
1. Find PROCESSING jobs → stale if no recent activity
2. Find past-due SCHEDULED jobs → apply grace period
3. Outside grace → transition to EXPIRED
4. Find FAILED jobs → report for user attention
5. Count all job states → display summary
6. Show next scheduled job

## Tests Required
1. Stale PROCESSING jobs detected
2. Overdue jobs within grace period identified
3. Overdue jobs outside grace period expired
4. FAILED jobs reported
5. Summary counts correct
6. Report format matches expected output from doc 04 §4

## Acceptance Criteria
1. Reconciliation runs on every startup
2. Stale jobs detected and reported
3. Grace period applied correctly
4. Summary displayed
5. All tests pass

## Definition of Done
- Reconciliation created, tests pass, checkpoint updated
- Commit: `feat(email): SCHED-004 — add startup reconciliation`

---

## AI Implementation Guardrail
```
You are implementing ONLY SCHED-004. Read docs/04-SCHEDULER.md §4. Create ONLY reconciliation. Write tests. Run tests. Update checkpoint. Stop.
```
