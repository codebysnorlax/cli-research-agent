# Phase 1 — Domain Foundation

> **Goal:** Email job contracts, database schema, repositories  
> **Tickets:** DOMAIN-001, DOMAIN-002, DB-001, DB-002, DB-003  
> **Entry Criteria:** Phase 0 complete (architecture verified, tests run)  
> **Exit Criteria:** Schema creates, CRUD works, events log, validation utilities ready

---

## Level Unlock

```
ENTRY:       Phase 0 complete (FOUND-001 + FOUND-002 DONE)
BUILD L1:    DOMAIN-001 → DOMAIN-002
BUILD L2:    DB-001 → DB-002 (parallel with DB-003) → DB-003
TEST:        All unit tests pass for domain + db modules
CHECKPOINT:  CURRENT-CHECKPOINT.md updated
UNLOCK:      Phase 2 (STATE-001, SECURITY-001)
```

---

## Tickets

| ID | Title | Level | Status |
|---|---|---|---|
| DOMAIN-001 | Email Job Constants & Contracts | 1 | BLOCKED |
| DOMAIN-002 | Validation Utilities | 1 | BLOCKED |
| DB-001 | SQLite Connection & Schema | 2 | BLOCKED |
| DB-002 | Job Repository | 2 | BLOCKED |
| DB-003 | Event Log Repository | 2 | BLOCKED |

---

## Dependencies Within Phase
```
DOMAIN-001 → DOMAIN-002 (needs constants)
DOMAIN-001 → DB-001 (needs status defaults)
DB-001 → DB-002 (needs schema)
DB-001 → DB-003 (needs schema)
DB-002 ∥ DB-003 (parallel)
```

---

## New Dependencies Installed
- `better-sqlite3` (in DB-001)

---

## Phase Gate

- [ ] All 10 job statuses defined and immutable
- [ ] Valid transition map matches doc 02 §3
- [ ] All event types defined
- [ ] Email validation utilities work
- [ ] SQLite database creates successfully
- [ ] Schema has all tables, columns, indexes from doc 06
- [ ] Job CRUD operations work
- [ ] Job ID generation (EMAIL-XXXXX) works
- [ ] Atomic status updates work (WHERE status = ?)
- [ ] Event log appends and queries work
- [ ] Foreign key constraints enforced
- [ ] All Phase 1 tests pass
