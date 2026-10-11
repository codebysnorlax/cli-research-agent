# Phase 6 — Scheduler

> **Goal:** Polling worker finds due jobs and sends them  
> **Tickets:** SCHED-001, SCHED-002, SCHED-003, SCHED-004  
> **Entry Criteria:** Phase 5 complete (LangGraph ready)  
> **Exit Criteria:** Scheduled email sends at correct time; overdue expires; reconciliation reports

---

## Tickets

| ID | Title | Level | Status |
|---|---|---|---|
| SCHED-001 | Grace Period Policy | 9 | BLOCKED |
| SCHED-002 | Retry Policy | 9 | BLOCKED |
| SCHED-003 | Scheduler Worker | 9 | BLOCKED |
| SCHED-004 | Startup Reconciliation | 9 | BLOCKED |

---

## Critical Audit

After SCHED-003 is complete, run this audit:
```bash
# Verify NO LLM imports in scheduler code
grep -r "langchain\|@langchain\|openai\|gemini\|llm\|LLM" email/scheduler/
# Expected: 0 results
```

---

## Phase Gate

- [ ] Grace period: within → send, outside → expired
- [ ] Retry: max 3 attempts, exponential backoff, jitter
- [ ] Error classification: transient → retry, permanent → fail
- [ ] Worker polls at configured interval
- [ ] Due jobs detected and processed
- [ ] Atomic claiming prevents double execution
- [ ] Send gate checked before Gmail call
- [ ] Successful send → SENT + event
- [ ] Failed send → classified correctly
- [ ] Startup reconciliation detects stale jobs
- [ ] Health check displays on startup
- [ ] **NO LLM in scheduler code** (audit verified)
- [ ] All Phase 6 tests pass
