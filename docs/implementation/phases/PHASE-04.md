# Phase 4 — Tools + Approval

> **Goal:** LLM-callable tools, human approval workflow  
> **Tickets:** TOOLS-001–005, APPROVAL-001–003  
> **Entry Criteria:** Phase 3 complete (Gmail + DateTime tracks merged)  
> **Exit Criteria:** Tools work against Gmail; approval S/R/T works; hash verification blocks tampered payloads

---

## Level Unlock

```
ENTRY:       Phase 3 complete (both tracks)
BUILD L6:    TOOLS-001 ∥ TOOLS-002 ∥ TOOLS-003 ∥ TOOLS-004 (parallel)
             TOOLS-005 (needs DB-002 + STATE-001 + TIME-002)
BUILD L7:    APPROVAL-001 → APPROVAL-002 → APPROVAL-003
TEST:        Tool schemas, approval workflow, hash verification
CHECKPOINT:  CURRENT-CHECKPOINT.md updated
UNLOCK:      Phase 5 (LangGraph integration)
```

---

## Tickets

| ID | Title | Level | Status |
|---|---|---|---|
| TOOLS-001 | Email Search Tool | 6 | BLOCKED |
| TOOLS-002 | Email Read Tool | 6 | BLOCKED |
| TOOLS-003 | Email Thread Tool | 6 | BLOCKED |
| TOOLS-004 | Email Draft Tool | 6 | BLOCKED |
| TOOLS-005 | Scheduling Tools | 6 | BLOCKED |
| APPROVAL-001 | Draft Display | 7 | BLOCKED |
| APPROVAL-002 | Approval Workflow | 7 | BLOCKED |
| APPROVAL-003 | Schedule Confirmation | 7 | BLOCKED |

---

## Phase Gate

- [ ] All 5 tools have correct LangChain schemas
- [ ] Search, read, thread tools are read-only
- [ ] Draft tool proposes but does NOT send
- [ ] **NO `email_send` tool exists** (critical security check)
- [ ] Scheduling tools use bounded repository API
- [ ] Draft displayed clearly in terminal
- [ ] [S]end creates job with payload hash
- [ ] [R]eject transitions cleanly
- [ ] [T]imer triggers schedule confirmation
- [ ] Schedule confirmation shows resolved datetime
- [ ] Past dates rejected during scheduling
- [ ] Payload modification after approval detected
- [ ] All Phase 4 tests pass
