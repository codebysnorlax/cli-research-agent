# Phase 2 — State Machine + Security

> **Goal:** Deterministic state machine, payload hashing, send gate  
> **Tickets:** STATE-001, SECURITY-001, SECURITY-002  
> **Entry Criteria:** Phase 1 complete (DB + domain ready)  
> **Exit Criteria:** All transitions tested, terminal states immutable, send gate passes/fails correctly

---

## Level Unlock

```
ENTRY:       Phase 1 complete (DB-002 + DB-003 DONE)
BUILD L3:    STATE-001
BUILD L4:    SECURITY-001 (can start after DOMAIN-001, parallel with STATE-001)
             SECURITY-002 (needs STATE-001 + SECURITY-001 + DOMAIN-002)
TEST:        State machine transitions, hashing, all 11 send gate checks
CHECKPOINT:  CURRENT-CHECKPOINT.md updated
UNLOCK:      Phase 3 (Gmail + DateTime tracks)
```

---

## Tickets

| ID | Title | Level | Status |
|---|---|---|---|
| STATE-001 | State Transition Engine | 3 | BLOCKED |
| SECURITY-001 | Payload Hashing (SHA-256) | 4 | BLOCKED |
| SECURITY-002 | Send Gate (11 Checks) | 4 | BLOCKED |

---

## Phase Gate

- [ ] Every valid transition succeeds with event logged
- [ ] Every invalid transition rejected
- [ ] Terminal states absolutely immutable
- [ ] Atomic claiming: second call returns false
- [ ] Transaction atomicity verified (rollback on failure)
- [ ] SHA-256 hashing deterministic
- [ ] Payload modification detected by hash comparison
- [ ] All 11 send gate checks tested individually
- [ ] Multiple failures reported simultaneously by send gate
- [ ] All Phase 2 tests pass
