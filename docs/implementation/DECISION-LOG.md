# Email Agent — Decision Log

> Every architecture decision during implementation is recorded here.  
> Decisions are immutable once recorded. If a decision is reversed, record a new decision referencing the old one.

---

## Template

```
### DECISION-XXX: <Title>
- **Date:** YYYY-MM-DD
- **Status:** PROPOSED | ACCEPTED | SUPERSEDED
- **Context:** Why this decision was needed
- **Decision:** What was decided
- **Rationale:** Why this option was chosen
- **Alternatives considered:** What else was evaluated
- **Consequences:** What this decision implies
- **Affected tickets:** Which tickets are impacted
- **Supersedes:** (if replacing a previous decision)
```

---

## Decisions

### DECISION-001: Test Framework Selection
- **Date:** 2026-10-04
- **Status:** PROPOSED
- **Context:** Project has no test framework. All 41 tickets require testable outputs.
- **Decision:** Use Node.js built-in test runner (`node:test` + `node:assert`)
- **Rationale:** Zero dependency, native ESM support, built-in mocking, sufficient for this project scale
- **Alternatives considered:** Vitest (heavier, not needed), Jest (ESM issues historically)
- **Consequences:** Tests run via `node --test test/email/`; no additional test runner package needed
- **Affected tickets:** FOUND-002, all subsequent tickets

### DECISION-002: DateTime Library Selection
- **Date:** 2026-10-04
- **Status:** PROPOSED
- **Context:** Need timezone-aware date operations. Architecture recommends "temporal-aware date library"
- **Decision:** Use `date-fns` + `date-fns-tz` for timezone operations, `chrono-node` for NL parsing
- **Rationale:** Tree-shakeable, lightweight, good IANA timezone support, chrono-node is the most mature NL date parser for Node.js
- **Alternatives considered:** Luxon (heavier, moment-like API), Temporal API (not yet stable in Node.js)
- **Consequences:** Two dependencies added in Phase 3
- **Affected tickets:** TIME-001, TIME-002, TIME-003

### DECISION-003: SQLite Driver Selection
- **Date:** 2026-10-04
- **Status:** PROPOSED
- **Context:** Architecture requires synchronous atomic SQL operations for job claiming
- **Decision:** Use `better-sqlite3`
- **Rationale:** Synchronous API aligns perfectly with atomic claim pattern (`result.changes === 1`); fastest SQLite driver for Node.js; transaction support
- **Alternatives considered:** `sql.js` (WASM, slower, but no native compilation), `sqlite3` (async, doesn't suit atomic patterns)
- **Consequences:** Requires native compilation (node-gyp); fallback to sql.js if compilation fails
- **Affected tickets:** DB-001, DB-002, DB-003

### DECISION-004: Shared vs Isolated Model Selection
- **Date:** 2026-10-04
- **Status:** PROPOSED
- **Context:** Email agent needs LLM access. `src/config/` already has the provider factory.
- **Decision:** Reuse `src/config/provider.js`, `src/config/models.js`, `src/config/selector.js` via relative imports
- **Rationale:** Follows existing pattern (notion/index.js does the same); avoids duplication
- **Consequences:** Email agent has an import dependency on `src/config/` — these files become frozen for email agent purposes
- **Affected tickets:** INTEGRATION-001, GRAPH-002

---

*(New decisions will be appended as implementation progresses)*
