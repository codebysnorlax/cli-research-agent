# Phase 3 — External Services (Parallel Tracks)

> **Goal A:** Gmail API works end-to-end  
> **Goal B:** DateTime parsing works  
> **Tickets A:** GMAIL-001, GMAIL-002, GMAIL-003, GMAIL-004, GMAIL-005  
> **Tickets B:** TIME-001, TIME-002, TIME-003  
> **Entry Criteria:** Phase 2 complete (state machine + security ready)  
> **Exit Criteria:** Gmail search/read/send proven; dates parse and validate correctly

---

## ⚡ PARALLEL EXECUTION

Tracks A (Gmail) and B (DateTime) share NO files and can be built simultaneously.

```
              ┌── GMAIL-001 → GMAIL-002 → GMAIL-003 → GMAIL-004 → GMAIL-005
              │
STATE-001 ────┤
              │
              └── TIME-001 → TIME-002 ─┐
                  TIME-001 → TIME-003 ──┘
```

**Merge point:** Both tracks must complete before Phase 4 begins.

---

## Track A — Gmail

| ID | Title | Status |
|---|---|---|
| GMAIL-001 | OAuth Setup & Scopes | BLOCKED |
| GMAIL-002 | Gmail API Client | BLOCKED |
| GMAIL-003 | Message Parser | BLOCKED |
| GMAIL-004 | GmailService | BLOCKED |
| GMAIL-005 | Email Threading | BLOCKED |

### New Dependencies
- `googleapis`
- `@google-cloud/local-auth`

---

## Track B — DateTime

| ID | Title | Status |
|---|---|---|
| TIME-001 | Timezone Configuration | BLOCKED |
| TIME-002 | NL Date Parser | BLOCKED |
| TIME-003 | Date Validation | BLOCKED |

### New Dependencies
- `date-fns`, `date-fns-tz`
- `chrono-node`

---

## Phase Gate

- [ ] **Gmail:** OAuth consent flow completes
- [ ] **Gmail:** Token stored and reused
- [ ] **Gmail:** Search returns results
- [ ] **Gmail:** Read returns full message
- [ ] **Gmail:** Send works (manual verification)
- [ ] **Gmail:** Draft creation works
- [ ] **Gmail:** Reply threading with correct headers
- [ ] **Gmail:** Error classification (transient vs permanent)
- [ ] **DateTime:** "tomorrow at 10" → correct date + time
- [ ] **DateTime:** Ambiguity detected for "tomorrow morning"
- [ ] **DateTime:** Past dates rejected
- [ ] **DateTime:** Invalid dates (Feb 31) rejected
- [ ] **DateTime:** Timezone always explicit (never machine default)
- [ ] All Phase 3 tests pass
