# Email Agent — Risk Register

> Track, monitor, and mitigate implementation risks.

---

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Gmail OAuth setup complexity blocks Phase 3 | Medium | HIGH | Provide step-by-step setup guide in GMAIL-001; allow mocking for test progression | GMAIL-001 | OPEN |
| R-002 | LangGraph human-in-the-loop API has changed in current version | Medium | HIGH | Research API surface in GRAPH-001 before building GRAPH-002; version-pin if needed | GRAPH-001 | OPEN |
| R-003 | `better-sqlite3` native compilation fails on target system | Low | MEDIUM | Fallback to `sql.js` (WASM-based, no native); document in DECISION-003 | DB-001 | OPEN |
| R-004 | Concurrent SQLite access edge cases under stress | Low | HIGH | Single-worker assumption + atomic SQL patterns + comprehensive tests | STATE-001 | OPEN |
| R-005 | `chrono-node` doesn't handle India-specific date formats well | Medium | LOW | Fallback to LLM-assisted parsing (hybrid approach per doc 08 §8) | TIME-002 | OPEN |
| R-006 | Email agent accidentally modifies shared config files | Low | CRITICAL | Explicit forbidden-files list on every ticket; review diffs | ALL | OPEN |
| R-007 | No existing test infrastructure → slow initial test setup | Medium | MEDIUM | Use Node.js built-in test runner (zero-config) | FOUND-002 | OPEN |
| R-008 | Gmail rate limits during development/testing | Medium | LOW | Use mock Gmail service for most testing; test real API sparingly | GMAIL-004 | OPEN |
| R-009 | Scope creep — email agent expanding into unrelated features | Low | MEDIUM | Strict ticket scope + out-of-scope sections + review | ALL | OPEN |
| R-010 | Dependencies between GMAIL and TIME tracks cause merge conflicts | Low | MEDIUM | Both tracks share only DOMAIN-001 contracts (frozen by Level 1) | Level 5 | OPEN |

---

*(Updated as risks are identified, mitigated, or realized during implementation)*
