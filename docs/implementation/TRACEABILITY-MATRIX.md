# Email Agent — Traceability Matrix

> Every architecture requirement traces to an implementation ticket, test, and acceptance criteria.

---

| Arch Requirement | Document | Section | Ticket(s) | Test Location | Acceptance Criteria | Phase |
|---|---|---|---|---|---|---|
| ARCH-REQ-001: Isolated email/ module | 01-FOLDER | §Complete Tree | FOUND-001 | FOUND-001 verification | Directory structure matches architecture | 0 |
| ARCH-REQ-002: npm run email entry point | 01-FOLDER | §NPM Scripts | INTEGRATION-001 | Integration tests | `node email/index.js` starts system | 7 |
| ARCH-REQ-003: Credentials/data git-ignored | 01-FOLDER | §.gitignore | FOUND-001 | FOUND-001 verification | `.gitignore` has entries | 0 |
| ARCH-REQ-004: SQLite persistent storage | 04-SCHED, 06-DB | §1, §1 | DB-001 | test/email/unit/db/ | Database creates in data/ | 1 |
| ARCH-REQ-005: email_jobs table schema | 06-DB | §2 | DB-001 | test/email/unit/db/ | All columns exist with correct types | 1 |
| ARCH-REQ-006: email_events audit log | 06-DB | §2 | DB-003 | test/email/unit/db/ | Events insert and query correctly | 1 |
| ARCH-REQ-007: 10-state state machine | 02-STATE | §2 | STATE-001 | test/email/unit/state/ | All states and transitions work | 2 |
| ARCH-REQ-008: Terminal states immutable | 02-STATE | §4-R2 | STATE-001 | test/email/unit/state/ | SENT→anything throws error | 2 |
| ARCH-REQ-009: Atomic state transitions | 02-STATE | §4-R1 | STATE-001, DB-002 | test/email/unit/state/ | `changes===1` enforced | 2 |
| ARCH-REQ-010: Human approval S/R/T | 03-APPROVAL | §2 | APPROVAL-001, APPROVAL-002 | test/email/integration/approval/ | User can choose all 3 options | 4 |
| ARCH-REQ-011: SHA-256 payload hash | 03-APPROVAL | §4 | SECURITY-001 | test/email/unit/security/ | Hash generated and verified | 2 |
| ARCH-REQ-012: 11-check send gate | 03-APPROVAL | §5 | SECURITY-002 | test/email/unit/security/ | All 11 checks tested individually | 2 |
| ARCH-REQ-013: No email_send LLM tool | 03-APPROVAL | §7 | GRAPH-002 | test/email/integration/graph/ | Tool list audit shows no send tool | 5 |
| ARCH-REQ-014: Gmail OAuth 2.0 | 05-GMAIL | §2 | GMAIL-001 | test/email/integration/gmail/ | OAuth flow completes | 3 |
| ARCH-REQ-015: GmailService abstraction | 05-GMAIL | §1 | GMAIL-004 | test/email/integration/gmail/ | Service has all documented methods | 3 |
| ARCH-REQ-016: Narrow Gmail scopes | 05-GMAIL | §3 | GMAIL-001 | test/email/unit/gmail/ | Only readonly + compose | 3 |
| ARCH-REQ-017: Email threading | 05-GMAIL | §4 | GMAIL-005 | test/email/unit/gmail/ | Reply has threadId + headers | 3 |
| ARCH-REQ-018: Message parser | 05-GMAIL | §6 | GMAIL-003 | test/email/unit/gmail/ | MIME→structured data works | 3 |
| ARCH-REQ-019: Scheduler polling | 04-SCHED | §2, §6 | SCHED-003 | test/email/integration/scheduler/ | Worker finds due jobs | 6 |
| ARCH-REQ-020: Atomic job claiming | 04-SCHED | §3 | STATE-001, DB-002 | test/email/unit/state/ | Second claim returns false | 2 |
| ARCH-REQ-021: Startup reconciliation | 04-SCHED | §4 | SCHED-004 | test/email/integration/scheduler/ | Stale jobs detected and reported | 6 |
| ARCH-REQ-022: Grace period (15 min default) | 04-SCHED | §5 | SCHED-001 | test/email/unit/scheduler/ | Within=process, outside=expire | 6 |
| ARCH-REQ-023: Retry policy (bounded, backoff) | 09-ERROR | §2 | SCHED-002 | test/email/unit/scheduler/ | Max 3 attempts, exponential delay | 6 |
| ARCH-REQ-024: NL datetime parsing | 08-DATETIME | §2 | TIME-002 | test/email/unit/datetime/ | "tomorrow at 10" resolves correctly | 3 |
| ARCH-REQ-025: Explicit timezone | 08-DATETIME | §5 | TIME-001 | test/email/unit/datetime/ | Asia/Kolkata default, never machine TZ | 3 |
| ARCH-REQ-026: Schedule confirmation display | 08-DATETIME | §6 | APPROVAL-003 | test/email/integration/approval/ | Resolved datetime shown to user | 4 |
| ARCH-REQ-027: LangGraph agent graph | 07-LANGGRAPH | §3 | GRAPH-002 | test/email/integration/graph/ | Graph compiles and routes | 5 |
| ARCH-REQ-028: Graph state schema (Zod) | 07-LANGGRAPH | §4 | GRAPH-001 | test/email/unit/graph/ | Schema validates correctly | 5 |
| ARCH-REQ-029: Email tools (5 categories) | 07-LANGGRAPH | §6 | TOOLS-001–005 | test/email/unit/tools/ | Each tool has schema + handler | 4 |
| ARCH-REQ-030: Error classification | 09-ERROR | §1 | SCHED-002 | test/email/unit/scheduler/ | Transient vs permanent correct | 6 |
| ARCH-REQ-031: Fail-closed on SQLite down | 04-SCHED | §9 | SCHED-003, SECURITY-002 | test/email/failure/scenarios/ | No send when DB unavailable | 7 |
| ARCH-REQ-032: Email content = untrusted | 03-APPROVAL | §6 | GRAPH-002 | test/email/integration/graph/ | System prompt includes declaration | 5 |
| ARCH-REQ-033: Event log per transition | 02-STATE | §7 | DB-003, STATE-001 | test/email/unit/db/ | Every transition has event | 1–2 |
| ARCH-REQ-034: Job ID EMAIL-XXXXX | 06-DB | §6 | DB-002 | test/email/unit/db/ | IDs auto-increment, zero-padded | 1 |
| ARCH-REQ-035: ISO 8601 UTC timestamps | 06-DB | §7 | DOMAIN-001 | test/email/unit/domain/ | All timestamps UTC ISO format | 1 |
| ARCH-REQ-036: Transaction safety | 06-DB | §8 | DB-002 | test/email/unit/db/ | Job+event in single transaction | 1 |
| ARCH-REQ-037: Input validation | 08-DATETIME §7, 03-APPROVAL §9 | — | DOMAIN-002, TIME-003 | test/email/unit/validation/ | Invalid emails/dates rejected | 1, 3 |
| ARCH-REQ-038: No LLM-generated SQL | 03-APPROVAL | §7 | DB-002 | test/email/unit/db/ | Only repository API exposed | 1 |
| ARCH-REQ-039: 20 failure scenarios | 10-FAILURE | All | RECOVERY-001 | test/email/failure/scenarios/ | Each scenario has test | 7 |
| ARCH-REQ-040: System entry point + health | 04-SCHED §4, 11-PHASES §6 | — | INTEGRATION-001 | test/email/e2e/ | Startup shows status | 7 |
| ARCH-REQ-041: New dependencies | 05-GMAIL §9, 11-PHASES | — | DB-001, GMAIL-001, TIME-002 | Package verification | All deps installed | 1, 3 |
| ARCH-REQ-042: Graph ≠ googleapis | 07-LANGGRAPH §2, 12-ANTI §8 | — | GRAPH-002, TOOLS-001–004 | Code review | No googleapis in graph/ | 5 |
| ARCH-REQ-043: Scheduler ≠ LLM | 04-SCHED | §8 | SCHED-003 | Code review | No LLM import in scheduler/ | 6 |
| ARCH-REQ-044: No LLM in execution path | 12-ANTI | §3 | SCHED-003 | Code review | Scheduler uses frozen payload | 6 |
| ARCH-REQ-045: Tokens not in git | 12-ANTI | §9 | FOUND-001 | Verification | .gitignore verified | 0 |
| ARCH-REQ-046: Process lock or atomic claim | 04-SCHED §7, 10-FAILURE §14 | — | SCHED-003 | test/email/failure/scenarios/ | Duplicate startup handled | 6 |
| ARCH-REQ-047: Test framework | 10-FAILURE | Testing Strategy | FOUND-002 | Meta-test | Framework runs | 0 |
