# Phase 5 — LangGraph Integration

> **Goal:** Full agent conversation workflow  
> **Tickets:** GRAPH-001, GRAPH-002, GRAPH-003, GRAPH-004  
> **Entry Criteria:** Phase 4 complete (tools + approval ready)  
> **Exit Criteria:** End-to-end: user request → search → draft → approve → persist

---

## Tickets

| ID | Title | Level | Status |
|---|---|---|---|
| GRAPH-001 | Graph State Schema | 8 | BLOCKED |
| GRAPH-002 | Agent Graph & Nodes | 8 | BLOCKED |
| GRAPH-003 | Research Subgraph | 8 | BLOCKED |
| GRAPH-004 | Drafting Subgraph | 8 | BLOCKED |

---

## Phase Gate

- [ ] Graph state schema matches doc 07 §4
- [ ] Agent graph compiles and routes correctly
- [ ] Tool list audited — NO `email_send` present
- [ ] System prompt declares email content as untrusted
- [ ] Research subgraph summarizes multi-email context
- [ ] Drafting subgraph produces structured drafts
- [ ] NEW_EMAIL vs REPLY correctly distinguished
- [ ] Graph routes through approval node
- [ ] All Phase 5 tests pass
