# Email Agent — Master Implementation Plan

> **Status:** PLAN COMPLETE · Ready for Level 0  
> **Version:** 1.0.0  
> **Created:** October 4, 2026  
> **Last Updated:** October 4, 2026

---

## 1. Executive Summary

This document is the construction plan for adding an **Email Agent** to the existing `langchain_langgraph` project — a Node.js CLI with two independent features (interactive chat agent + Notion research workflow).

The Email Agent is a **new, isolated feature** with its own entry point (`npm run email`), its own module tree (`email/`), and its own infrastructure (SQLite, Gmail OAuth, scheduler). It shares only the LLM provider layer (`src/config/`) with the existing codebase.

The plan decomposes the architecture into **13 levels** containing **37 individually-testable tickets**, ordered by strict dependency, with checkpoints, phase gates, and explicit AI handoff rules.

### Key Numbers

| Metric | Value |
|---|---|
| Architecture documents read | 13 |
| Existing source files inspected | 11 |
| Architecture requirements traced | 47 |
| Implementation tickets | 37 |
| Implementation levels | 13 (0–12) |
| Phases | 8 (0–7) |
| New dependencies required | 4 |
| Existing files to modify | 2 (`package.json`, `.env`) |
| Existing files that MUST NOT change | 8 |

---

## 2. Existing Repository Assessment

### 2.1 Project Structure

```
langchain_langgraph/
├── src/                  ← Interactive CLI chat agent (existing)
│   ├── index.js          ← Main entry point (npm start)
│   ├── config/           ← Model registry, provider factory, TUI selector
│   ├── tools/            ← Tavily web search / page extraction
│   └── utils/            ← Terminal markdown renderer
├── notion/               ← Notion research workflow (existing)
│   └── index.js          ← Notion entry point (npm run notion)
├── email/                ← Email Agent (NEW — currently empty placeholders)
│   ├── auth/gmail/       ← .gitkeep only
│   ├── graph/            ← .gitkeep only (4 subdirs)
│   ├── tools/            ← .gitkeep only (5 subdirs)
│   ├── services/gmail/   ← .gitkeep only
│   ├── scheduler/        ← .gitkeep only (3 subdirs)
│   ├── db/               ← .gitkeep only (3 subdirs)
│   └── utils/            ← .gitkeep only (3 subdirs)
├── credentials/          ← .gitkeep only (git-ignored)
├── data/                 ← .gitkeep only (git-ignored)
├── test/                 ← 3 ad-hoc debug/test scripts
├── debug/                ← 9 debug scripts
├── notes/                ← 14 chapter markdown files + notes
└── docs/                 ← 13 architecture documents
```

### 2.2 Technology Stack (Current)

| Technology | Version | Usage |
|---|---|---|
| Node.js | 20+ (ESM, `"type": "module"`) | Runtime |
| `@langchain/core` | ^1.2.12 | LLM abstractions |
| `@langchain/langgraph` | ^1.4.17 | State graph (Notion workflow) |
| `@langchain/google-genai` | ^2.3.2 | Gemini provider |
| `@langchain/openai` | ^1.5.8 | OpenRouter via OpenAI compat |
| `@langchain/tavily` | ^1.2.0 | (unused — using @tavily/core instead) |
| `@tavily/core` | ^0.7.13 | Web search / page extraction |
| `chalk` | ^5.6.2 | Terminal colors |
| `dotenv` | ^18.0.2 | Environment variables |
| `langchain` | ^1.5.12 | Agent creation (`createAgent`) |
| `zod` | ^4.6.5 | Schema validation |

### 2.3 Existing Conventions

| Convention | Detail |
|---|---|
| Module system | ESM (`import`/`export`) |
| Config | `dotenv/config` loaded at entry point |
| LLM creation | `createLLM(provider, modelId, opts)` factory |
| Model selection | `selectModel()` TUI → returns `{mode, provider, modelId}` |
| Error handling | `try/catch` in tools; `process.on("unhandledRejection")` in main |
| CLI interaction | `readline/promises` |
| Test strategy | **None** — test files are ad-hoc debug scripts, not automated tests |
| Build tool | None — direct `node` execution |
| Git strategy | Feature-oriented commits on `main` branch |

### 2.4 Reusable Components

| Component | Location | Reusable by Email Agent? |
|---|---|---|
| `createLLM()` | `src/config/provider.js` | ✅ YES — same provider factory |
| `PROVIDERS` / `FALLBACK_CHAIN` | `src/config/models.js` | ✅ YES — same model registry |
| `selectModel()` | `src/config/selector.js` | ✅ YES — same TUI selector |
| `renderMarkdown()` | `src/utils/terminalMarkdown.js` | ⚠️ MAYBE — email display is different |
| `webSearch` / `visitPage` | `src/tools/index.js` | ❌ NO — email agent uses Gmail tools |

### 2.5 Existing Code Quality Assessment

| Finding | Severity | Affects Email Agent? |
|---|---|---|
| No test framework configured | HIGH | YES — need to add one |
| `package.json` test script is a no-op placeholder | LOW | YES — need to configure |
| No linter/formatter configured | LOW | No |
| `@langchain/tavily` installed but unused (code uses `@tavily/core`) | LOW | No |
| `notion/index.js` imports from `../src/config/` (cross-module reference) | MEDIUM | Pattern to follow |
| No error handling abstraction (raw try/catch) | MEDIUM | Email agent will need its own |
| Spinner/timer utilities duplicated between `src/index.js` and `notion/index.js` | LOW | Not blocking |
| `Object.assign(rl, newRl)` in switch handler is fragile | LOW | No |
| `.env` contains real API keys (committed historically) | CRITICAL | Already git-ignored |

### 2.6 Files That MUST Remain Untouched

| File | Reason |
|---|---|
| `src/index.js` | Chat agent — unrelated to email |
| `src/config/models.js` | Shared — no modification needed |
| `src/config/provider.js` | Shared — no modification needed |
| `src/config/selector.js` | Shared — no modification needed |
| `src/tools/index.js` | Chat tools — unrelated |
| `src/utils/terminalMarkdown.js` | Chat utility — unrelated |
| `notion/index.js` | Notion workflow — unrelated |
| `debug/*` | Debug utilities — unrelated |

---

## 3. Architecture Assessment

### 3.1 The Five Core Components (from doc 00)

| Component | Architecture Priority | Current Status |
|---|---|---|
| State Machine | ████████████████████ | MISSING |
| Approval / Security | ███████████████████ | MISSING |
| Scheduler | ██████████████████ | MISSING |
| SQLite Persistence | █████████████████ | MISSING |
| Gmail Integration | ███████████████ | MISSING |

### 3.2 Architecture Principles Extracted

1. **LLM ≠ Execution Authority** — LLM proposes, application decides, human approves
2. **SQLite = Source of Truth** — not LangGraph state, not setTimeout, not memory
3. **Fail Closed** — no database = no send
4. **Payload Freezing** — approved payload is SHA-256 hashed and immutable
5. **Atomic Claims** — SQL `WHERE status = 'SCHEDULED'` for claim/cancel race safety
6. **Event Sourcing** — every state transition produces an audit event
7. **Separation of Concerns** — Graph → Tools → Services → API
8. **Deterministic Execution** — scheduler has no LLM, no intelligence
9. **Explicit Timezone** — never depend on machine timezone
10. **Grace Period Policy** — overdue ≠ auto-send; outside grace → EXPIRED

---

## 4. Architecture vs Code Gap Analysis

### ARCH-REQ-001: Email Agent isolated module boundary
- **Doc:** 01-FOLDER-STRUCTURE.md
- **Current:** Empty placeholder directories with `.gitkeep` files exist in `email/`
- **Status:** ✅ ALREADY CORRECT (structure scaffolded)

### ARCH-REQ-002: `npm run email` entry point
- **Doc:** 01-FOLDER-STRUCTURE.md, package.json
- **Current:** `"email": "node email/index.js"` script exists in package.json
- **Status:** ✅ ALREADY CORRECT (script exists, `email/index.js` does not yet exist)

### ARCH-REQ-003: Credentials and data git-ignored
- **Doc:** 01-FOLDER-STRUCTURE.md
- **Current:** `.gitignore` already excludes `credentials/`, `data/`, `*.sqlite`
- **Status:** ✅ ALREADY CORRECT

### ARCH-REQ-004: SQLite persistent job storage
- **Doc:** 04-SCHEDULER.md, 06-DATABASE-SCHEMA.md
- **Current:** No SQLite dependency, no database code
- **Status:** 🔴 MISSING

### ARCH-REQ-005: email_jobs table with documented schema
- **Doc:** 06-DATABASE-SCHEMA.md
- **Current:** No schema code
- **Status:** 🔴 MISSING

### ARCH-REQ-006: email_events audit log table
- **Doc:** 06-DATABASE-SCHEMA.md
- **Current:** No schema code
- **Status:** 🔴 MISSING

### ARCH-REQ-007: State machine with 10 states and defined transitions
- **Doc:** 02-STATE-MACHINE.md
- **Current:** No state machine code
- **Status:** 🔴 MISSING

### ARCH-REQ-008: Terminal states are immutable
- **Doc:** 02-STATE-MACHINE.md §4
- **Current:** No enforcement
- **Status:** 🔴 MISSING

### ARCH-REQ-009: Atomic state transitions via SQL
- **Doc:** 02-STATE-MACHINE.md §4, 06-DATABASE-SCHEMA.md §4
- **Current:** No implementation
- **Status:** 🔴 MISSING

### ARCH-REQ-010: Human approval with [S]end / [R]eject / [T]imer
- **Doc:** 03-APPROVAL-AND-SECURITY.md §2
- **Current:** No approval code
- **Status:** 🔴 MISSING

### ARCH-REQ-011: Payload freezing with SHA-256 hash
- **Doc:** 03-APPROVAL-AND-SECURITY.md §4
- **Current:** No hashing code
- **Status:** 🔴 MISSING

### ARCH-REQ-012: 11-check send gate
- **Doc:** 03-APPROVAL-AND-SECURITY.md §5
- **Current:** No send gate code
- **Status:** 🔴 MISSING

### ARCH-REQ-013: LLM has NO email_send tool
- **Doc:** 03-APPROVAL-AND-SECURITY.md §7
- **Current:** No tools exist — correct by absence
- **Status:** ⚠️ INCOMPLETE (must be enforced when tools are created)

### ARCH-REQ-014: Gmail OAuth 2.0 Desktop credentials
- **Doc:** 05-GMAIL-INTEGRATION.md §2
- **Current:** No OAuth code, no googleapis dependency
- **Status:** 🔴 MISSING

### ARCH-REQ-015: GmailService abstraction layer
- **Doc:** 05-GMAIL-INTEGRATION.md §1
- **Current:** No service code
- **Status:** 🔴 MISSING

### ARCH-REQ-016: Narrow Gmail scopes (readonly + compose)
- **Doc:** 05-GMAIL-INTEGRATION.md §3
- **Current:** No scope definitions
- **Status:** 🔴 MISSING

### ARCH-REQ-017: Email threading (threadId, In-Reply-To, References)
- **Doc:** 05-GMAIL-INTEGRATION.md §4
- **Current:** No threading code
- **Status:** 🔴 MISSING

### ARCH-REQ-018: Gmail message parser (MIME → structured data)
- **Doc:** 05-GMAIL-INTEGRATION.md §6
- **Current:** No parser code
- **Status:** 🔴 MISSING

### ARCH-REQ-019: Scheduler worker with SQLite polling
- **Doc:** 04-SCHEDULER.md §2, §6
- **Current:** No scheduler code
- **Status:** 🔴 MISSING

### ARCH-REQ-020: Atomic job claiming
- **Doc:** 04-SCHEDULER.md §3
- **Current:** No claiming code
- **Status:** 🔴 MISSING

### ARCH-REQ-021: Startup reconciliation
- **Doc:** 04-SCHEDULER.md §4
- **Current:** No reconciliation code
- **Status:** 🔴 MISSING

### ARCH-REQ-022: Grace period policy (configurable, default 15 min)
- **Doc:** 04-SCHEDULER.md §5
- **Current:** No policy code
- **Status:** 🔴 MISSING

### ARCH-REQ-023: Retry policy (bounded, exponential backoff, jitter)
- **Doc:** 09-ERROR-HANDLING.md §2
- **Current:** No retry policy
- **Status:** 🔴 MISSING

### ARCH-REQ-024: Natural-language datetime parsing
- **Doc:** 08-DATETIME-AND-TIMEZONE.md §2
- **Current:** No datetime parser
- **Status:** 🔴 MISSING

### ARCH-REQ-025: Explicit timezone (Asia/Kolkata default)
- **Doc:** 08-DATETIME-AND-TIMEZONE.md §5
- **Current:** No timezone configuration
- **Status:** 🔴 MISSING

### ARCH-REQ-026: Schedule confirmation with display
- **Doc:** 08-DATETIME-AND-TIMEZONE.md §6
- **Current:** No confirmation UI
- **Status:** 🔴 MISSING

### ARCH-REQ-027: LangGraph agent graph with subgraphs
- **Doc:** 07-LANGGRAPH-WORKFLOW.md §3
- **Current:** No graph code
- **Status:** 🔴 MISSING

### ARCH-REQ-028: Graph state schema (Zod-validated)
- **Doc:** 07-LANGGRAPH-WORKFLOW.md §4
- **Current:** No state schema
- **Status:** 🔴 MISSING

### ARCH-REQ-029: Email tools (search, read, thread, draft, scheduling)
- **Doc:** 07-LANGGRAPH-WORKFLOW.md §6
- **Current:** No email tools
- **Status:** 🔴 MISSING

### ARCH-REQ-030: Error classification (transient vs permanent)
- **Doc:** 09-ERROR-HANDLING.md §1
- **Current:** No classification code
- **Status:** 🔴 MISSING

### ARCH-REQ-031: Fail-closed on SQLite unavailability
- **Doc:** 04-SCHEDULER.md §9, 09-ERROR-HANDLING.md §6
- **Current:** No enforcement
- **Status:** 🔴 MISSING

### ARCH-REQ-032: Email content treated as untrusted input
- **Doc:** 03-APPROVAL-AND-SECURITY.md §6
- **Current:** No system prompt exists
- **Status:** 🔴 MISSING

### ARCH-REQ-033: Event log for every state transition
- **Doc:** 02-STATE-MACHINE.md §7, 06-DATABASE-SCHEMA.md §5
- **Current:** No event logging
- **Status:** 🔴 MISSING

### ARCH-REQ-034: Job ID format EMAIL-XXXXX
- **Doc:** 06-DATABASE-SCHEMA.md §6
- **Current:** No ID generation
- **Status:** 🔴 MISSING

### ARCH-REQ-035: Timestamps as ISO 8601 UTC strings
- **Doc:** 06-DATABASE-SCHEMA.md §7
- **Current:** No convention enforced
- **Status:** 🔴 MISSING

### ARCH-REQ-036: Transaction safety (job + event in single transaction)
- **Doc:** 06-DATABASE-SCHEMA.md §8
- **Current:** No transaction code
- **Status:** 🔴 MISSING

### ARCH-REQ-037: Input validation (email format, date validity)
- **Doc:** 08-DATETIME-AND-TIMEZONE.md §7, 03-APPROVAL-AND-SECURITY.md §9
- **Current:** No validation code
- **Status:** 🔴 MISSING

### ARCH-REQ-038: No LLM-generated SQL
- **Doc:** 03-APPROVAL-AND-SECURITY.md §7
- **Current:** No SQL exists — correct by absence
- **Status:** ⚠️ INCOMPLETE (must enforce via bounded repository API)

### ARCH-REQ-039: 20 failure scenarios handled
- **Doc:** 10-FAILURE-SCENARIOS.md
- **Current:** No failure handling
- **Status:** 🔴 MISSING

### ARCH-REQ-040: System entry point with startup health check
- **Doc:** 04-SCHEDULER.md §4, 11-IMPLEMENTATION-PHASES.md Phase 6
- **Current:** `email/index.js` does not exist
- **Status:** 🔴 MISSING

### ARCH-REQ-041: New dependencies (googleapis, better-sqlite3, chrono-node, date-fns/luxon)
- **Doc:** 05-GMAIL-INTEGRATION.md §9, 11-IMPLEMENTATION-PHASES.md
- **Current:** None installed
- **Status:** 🔴 MISSING

### ARCH-REQ-042: LangGraph does not call googleapis directly
- **Doc:** 07-LANGGRAPH-WORKFLOW.md §2, 12-ANTI-PATTERNS.md §8
- **Current:** No code exists
- **Status:** ⚠️ INCOMPLETE (must enforce in tool/service architecture)

### ARCH-REQ-043: Scheduler does not call LLM
- **Doc:** 04-SCHEDULER.md §8
- **Current:** No scheduler exists
- **Status:** ⚠️ INCOMPLETE (must enforce in scheduler design)

### ARCH-REQ-044: No LLM in scheduled execution path
- **Doc:** 12-ANTI-PATTERNS.md §3
- **Current:** No execution path exists
- **Status:** ⚠️ INCOMPLETE (must enforce)

### ARCH-REQ-045: Gmail tokens never committed to git
- **Doc:** 12-ANTI-PATTERNS.md §9
- **Current:** `.gitignore` already excludes `credentials/`
- **Status:** ✅ ALREADY CORRECT

### ARCH-REQ-046: Process lock or atomic claiming for duplicate scheduler
- **Doc:** 04-SCHEDULER.md §7, 10-FAILURE-SCENARIOS.md §14
- **Current:** No implementation
- **Status:** 🔴 MISSING

### ARCH-REQ-047: Test framework configured
- **Doc:** 10-FAILURE-SCENARIOS.md Testing Strategy
- **Current:** No test framework, ad-hoc scripts only
- **Status:** 🔴 MISSING

---

## 5. Evidence Table

### FACTS

| ID | Fact |
|---|---|
| F-001 | `email/` directory exists with correct sub-structure but only `.gitkeep` files |
| F-002 | `package.json` already has `"email": "node email/index.js"` script |
| F-003 | `.gitignore` already excludes `credentials/`, `data/`, `*.sqlite` |
| F-004 | Project uses ESM (`"type": "module"`) |
| F-005 | LLM provider factory (`createLLM`) supports Gemini and OpenRouter |
| F-006 | Model selector TUI (`selectModel`) is reusable |
| F-007 | No test framework is configured (`"test": "echo ... && exit 1"`) |
| F-008 | `notion/index.js` imports from `../src/config/` — cross-module pattern exists |
| F-009 | Project uses Zod for validation (both `z` from `zod` and LangGraph schemas) |
| F-010 | No SQLite dependency exists in the project |
| F-011 | No googleapis dependency exists in the project |
| F-012 | `email/index.js` does not exist yet (entry point file is missing) |

### ASSUMPTIONS

| ID | Assumption | Confidence |
|---|---|---|
| A-001 | Email agent will use the same LLM providers (Gemini/OpenRouter) via shared config | HIGH |
| A-002 | `better-sqlite3` is the intended SQLite driver (synchronous, fits atomic patterns) | HIGH |
| A-003 | `chrono-node` is suitable for NL date parsing | MEDIUM |
| A-004 | Single-worker scheduler is sufficient for POC | HIGH |
| A-005 | `Asia/Kolkata` is the correct default timezone for this user | HIGH |
| A-006 | The email agent will run in the same Node.js process (not separate microservices) | HIGH |

### DECISIONS REQUIRED

| ID | Decision | Impact | Default Recommendation |
|---|---|---|---|
| D-001 | Which test framework to use? (Node test runner / Vitest / Jest) | All tickets | **Node.js built-in test runner** (zero dependency, ESM native) |
| D-002 | Which timezone-aware date library? (`luxon` vs `date-fns-tz`) | TIME tickets | **`date-fns-tz`** (tree-shakeable, lightweight) |
| D-003 | Should the email agent share the `selectModel()` TUI or have its own? | FOUND-002 | **Share** — reuse from `src/config/selector.js` |
| D-004 | Should we add a process lock file for duplicate scheduler prevention? | SCHED-004 | **Yes** — simple file lock in `data/` |

### UNKNOWNS

| ID | Unknown | Impact | Resolution Strategy |
|---|---|---|---|
| U-001 | Does the user already have Google Cloud Project + Gmail API enabled? | Phase 1 gate | Ask during GMAIL-001 |
| U-002 | Does the user have OAuth Desktop credentials downloaded? | Phase 1 gate | Document setup steps in ticket |
| U-003 | Whether `@google-cloud/local-auth` works with current Node.js version | GMAIL-001 | Test during implementation |
| U-004 | Exact LangGraph interrupt/human-in-the-loop API for current version | GRAPH-002 | Investigate during GRAPH-001 |

---

## 6. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | Gmail OAuth setup complexity blocks Phase 1 | Medium | HIGH | Provide step-by-step setup guide; mock for testing |
| R-002 | LangGraph human-in-the-loop API may have changed | Medium | HIGH | Research API in GRAPH-001 before GRAPH-002 |
| R-003 | `better-sqlite3` native compilation issues | Low | MEDIUM | Alternative: `sql.js` (WASM-based, no native) |
| R-004 | Concurrent SQLite access edge cases | Low | HIGH | Single-worker assumption + atomic SQL patterns |
| R-005 | chrono-node doesn't handle India-specific date formats | Medium | LOW | Fallback to LLM-assisted parsing (hybrid approach) |
| R-006 | Email agent accidentally modifies shared config | Low | CRITICAL | Explicit forbidden-files list per ticket |
| R-007 | No existing test infrastructure means slow test setup | Medium | MEDIUM | Use Node.js built-in test runner (zero-config) |

---

## 7. Dependency DAG

```
LEVEL 0: Verification
  FOUND-001 ─── Architecture Verification
  FOUND-002 ─── Test Framework Setup
       │
       ▼
LEVEL 1: Foundation Domain
  DOMAIN-001 ── Email Job Constants & Contracts
  DOMAIN-002 ── Validation Utilities
       │
       ▼
LEVEL 2: Database Foundation
  DB-001 ────── SQLite Connection & Schema
  DB-002 ────── Job Repository
  DB-003 ────── Event Log Repository
       │
       ▼
LEVEL 3: State Machine
  STATE-001 ─── State Transition Engine
       │
       ▼
LEVEL 4: Security Core
  SECURITY-001 ─ Payload Hashing (SHA-256)
  SECURITY-002 ─ Send Gate (11 checks)
       │
       ├───────────────────────┐
       ▼                       ▼
LEVEL 5: Gmail                LEVEL 5: DateTime (PARALLEL)
  GMAIL-001 ── OAuth Setup      TIME-001 ── Timezone Config
  GMAIL-002 ── Gmail Client     TIME-002 ── NL Date Parser
  GMAIL-003 ── Message Parser   TIME-003 ── Date Validation
  GMAIL-004 ── GmailService
  GMAIL-005 ── Threading
       │                       │
       └───────────┬───────────┘
                   ▼
LEVEL 6: Email Tools
  TOOLS-001 ── Search Tool
  TOOLS-002 ── Read Tool
  TOOLS-003 ── Thread Tool
  TOOLS-004 ── Draft Tool
  TOOLS-005 ── Scheduling Tools
       │
       ▼
LEVEL 7: Approval
  APPROVAL-001 ── Draft Display
  APPROVAL-002 ── Approval Workflow
  APPROVAL-003 ── Schedule Confirmation
       │
       ▼
LEVEL 8: LangGraph
  GRAPH-001 ── Graph State Schema
  GRAPH-002 ── Agent Graph + Nodes
  GRAPH-003 ── Research Subgraph
  GRAPH-004 ── Drafting Subgraph
       │
       ▼
LEVEL 9: Scheduler
  SCHED-001 ── Grace Period Policy
  SCHED-002 ── Retry Policy
  SCHED-003 ── Scheduler Worker
  SCHED-004 ── Startup Reconciliation
       │
       ▼
LEVEL 10: System Integration
  INTEGRATION-001 ── System Entry Point
       │
       ▼
LEVEL 11: Recovery & Failure Testing
  RECOVERY-001 ── Failure Scenario Tests
       │
       ▼
LEVEL 12: Final Gate
  FINAL-001 ── Security Hardening & Compliance
```

---

## 8. Implementation Phases

### Phase 0 — Verification (Level 0)
**Goal:** Confirm architecture, configure test infrastructure  
**Tickets:** FOUND-001, FOUND-002  
**Gate:** Architecture verified, tests run

### Phase 1 — Domain Foundation (Levels 1–2)
**Goal:** Email job contracts, database schema, repositories  
**Tickets:** DOMAIN-001, DOMAIN-002, DB-001, DB-002, DB-003  
**Gate:** Schema creates, CRUD works, events log

### Phase 2 — State Machine + Security (Levels 3–4)
**Goal:** Deterministic state machine, payload hashing, send gate  
**Tickets:** STATE-001, SECURITY-001, SECURITY-002  
**Gate:** All transitions tested, terminal states immutable, gate passes/fails correctly

### Phase 3 — External Services (Level 5) — PARALLEL TRACKS
**Goal A:** Gmail works end-to-end  
**Tickets A:** GMAIL-001, GMAIL-002, GMAIL-003, GMAIL-004, GMAIL-005  
**Goal B:** DateTime parsing works  
**Tickets B:** TIME-001, TIME-002, TIME-003  
**Gate:** Gmail search/read/send proven; dates parse and validate correctly  
**Merge Point:** Both tracks must complete before Level 6

### Phase 4 — Tools + Approval (Levels 6–7)
**Goal:** LLM-callable tools, human approval workflow  
**Tickets:** TOOLS-001–005, APPROVAL-001–003  
**Gate:** Tools work against Gmail; approval cycle with S/R/T works; hash verification blocks tampered payloads

### Phase 5 — LangGraph Integration (Level 8)
**Goal:** Full agent conversation workflow  
**Tickets:** GRAPH-001–004  
**Gate:** End-to-end: user request → search → draft → approve → persist

### Phase 6 — Scheduler (Level 9)
**Goal:** Polling worker sends due emails  
**Tickets:** SCHED-001–004  
**Gate:** Scheduled email sends at correct time; overdue expires; reconciliation reports status

### Phase 7 — Integration, Recovery, Final (Levels 10–12)
**Goal:** Full system works end-to-end, survives all failure scenarios  
**Tickets:** INTEGRATION-001, RECOVERY-001, FINAL-001  
**Gate:** All 20 failure scenarios pass; security checklist complete

---

## 9. Parallel Work Map

```
              ┌── GMAIL-001 → GMAIL-002 → GMAIL-003 → GMAIL-004 → GMAIL-005
              │                                                        │
STATE-001 ────┤                                                   MERGE POINT
              │                                                        │
              └── TIME-001 → TIME-002 → TIME-003 ─────────────────────┘
                                                                       │
                                                                       ▼
                                                                  TOOLS-001
```

**Rules for parallel work:**
1. GMAIL track and TIME track share no files
2. Both depend on DOMAIN-001 contracts (stable by Level 1 completion)
3. Merge point is before TOOLS-001 (Level 6)
4. No shared state mutation during parallel execution

---

## 10. Testing Strategy

### Test Framework
**Recommendation:** Node.js built-in test runner (`node:test` + `node:assert`)
- Zero dependencies
- Native ESM support
- Built-in mocking (`node:test` mock)
- Test runner with `--test` flag

### Test Organization
```
test/
├── email/
│   ├── unit/
│   │   ├── domain/
│   │   ├── db/
│   │   ├── state/
│   │   ├── security/
│   │   ├── datetime/
│   │   └── validation/
│   ├── integration/
│   │   ├── gmail/
│   │   ├── scheduler/
│   │   └── approval/
│   ├── failure/
│   │   └── scenarios/
│   └── e2e/
│       └── workflow/
```

### Test Levels by Phase

| Phase | Test Type | What's Tested |
|---|---|---|
| 0 | Smoke | Test framework runs |
| 1 | Unit | Constants, validation, schema, CRUD |
| 2 | Unit + Integration | State transitions, atomic claims, hashing |
| 3 | Integration | Gmail API (real or mocked), date parsing |
| 4 | Unit + Integration | Tool schemas, approval flow |
| 5 | Integration | Graph execution, subgraph routing |
| 6 | Integration + Recovery | Scheduler polling, grace period, retry |
| 7 | Failure + E2E | All 20 failure scenarios, full workflow |

---

## 11. Security Strategy

### Threat Model

| Threat | Mitigation | Ticket |
|---|---|---|
| LLM sends email without approval | No `email_send` tool; send gate enforces | SECURITY-002 |
| Payload modified after approval | SHA-256 hash comparison at send time | SECURITY-001 |
| Email content as injection vector | System prompt declares untrusted; no action from content | GRAPH-002 |
| Stale approval used for different email | Approval bound to exact payload hash | SECURITY-001 |
| Duplicate send on crash/restart | Atomic claiming + event log audit | STATE-001, SCHED-003 |
| Gmail credential leakage | `.gitignore` already configured | ✅ DONE |
| LLM generates raw SQL | Bounded repository API only | DB-002 |
| Broad Gmail permissions | Narrow scopes (readonly + compose) | GMAIL-001 |

---

## 12. Failure and Recovery Strategy

Every failure scenario from doc 10 maps to a ticket:

| Scenario | Severity | Primary Ticket | Test Ticket |
|---|---|---|---|
| 1. Crash during scheduling | 🔴 | DB-002, STATE-001 | RECOVERY-001 |
| 2. Crash while sending | 🔴 | SCHED-003 | RECOVERY-001 |
| 3. Gmail accepted but response lost | 🔴 | SCHED-003 | RECOVERY-001 |
| 4. Scheduler runs twice | 🔴 | STATE-001, SCHED-003 | RECOVERY-001 |
| 5. Computer sleeps | 🟡 | SCHED-001, SCHED-004 | RECOVERY-001 |
| 6. System clock changes | 🟡 | TIME-001 | RECOVERY-001 |
| 7. OAuth token expires | 🟡 | GMAIL-001 | RECOVERY-001 |
| 8. OAuth revoked | 🟡 | GMAIL-001 | RECOVERY-001 |
| 9. Recipient typo | 🟡 | DOMAIN-002 | RECOVERY-001 |
| 10. LLM hallucinates recipient | 🔴 | GRAPH-002 | RECOVERY-001 |
| 11. Multiple matching contacts | 🟡 | GRAPH-002 | RECOVERY-001 |
| 12. User edits after approval | 🔴 | SECURITY-001 | RECOVERY-001 |
| 13. Cancel vs processing race | 🟡 | STATE-001 | RECOVERY-001 |
| 14. Duplicate scheduler startup | 🟡 | SCHED-003 | RECOVERY-001 |
| 15. Network dies at send time | 🟡 | SCHED-002 | RECOVERY-001 |
| 16. LLM gives invalid schedule | 🟢 | TIME-003 | RECOVERY-001 |
| 17. Timezone mismatch | 🟡 | TIME-001 | RECOVERY-001 |
| 18. Email injection | 🔴 | GRAPH-002 | RECOVERY-001 |
| 19. Huge email (30 MB) | 🟢 | GMAIL-003 | RECOVERY-001 |
| 20. Very long thread (500 msgs) | 🟢 | TOOLS-003 | RECOVERY-001 |

---

## 13. Git / Commit Strategy

### Branch Strategy
All email agent work on a feature branch: `feat/email-agent`

### Commit Convention
```
feat(email): <ticket-id> — <short description>
test(email): <ticket-id> — <short description>
docs(email): <ticket-id> — <short description>
```

### Example Commits
```
feat(email): DOMAIN-001 — add email job constants and contracts
feat(email): DB-001 — add SQLite connection and schema creation
test(email): DB-001 — add schema creation and table verification tests
feat(email): STATE-001 — add state transition engine
test(email): STATE-001 — add state machine transition tests
feat(email): GMAIL-001 — add OAuth 2.0 flow and scope definitions
```

### Rules
1. Each ticket = at least one commit
2. Implementation and test may be separate commits or combined
3. Never combine multiple ticket implementations in one commit
4. Checkpoint update included with each ticket commit

---

## 14. AI Handoff Rules

### Before Starting Any Ticket

```
1. Read the architecture documents relevant to this ticket.
2. Read docs/implementation/CURRENT-CHECKPOINT.md.
3. Inspect the current implementation in the codebase.
4. Verify the ticket dependencies are complete.
5. Read the specific ticket file in docs/implementation/tickets/.
```

### During Implementation

```
6. Implement ONLY the defined scope.
7. Do not implement future tickets.
8. Do not redesign the architecture.
9. Do not modify files in the "Forbidden Files" list.
10. Do not modify unrelated modules.
11. Do not silently change contracts.
```

### After Implementation

```
12. Run the required tests.
13. Report exactly what changed (files, functions, exports).
14. Update CURRENT-CHECKPOINT.md.
15. Commit with the correct message format.
16. Mark ticket DONE in TICKET-INDEX.md.
17. Stop.
```

### STOP Conditions

The implementation AI MUST STOP and report when:

```
- Architecture contradiction found
- Missing dependency that should already exist
- Unknown existing behavior encountered
- Unexpected public API change needed
- Security boundary unclear
- Database migration uncertainty
- Approval semantics unclear
- State transition not documented
- Required file from a dependency ticket does not exist
- Existing code conflicts with architecture documents
- Tests reveal undocumented behavior
```

---

## 15. Implementation History Design

Location: `docs/implementation/CURRENT-CHECKPOINT.md`

The checkpoint file must always contain:

```
CURRENT LEVEL:          (e.g., "Level 3")
CURRENT TICKET:         (e.g., "STATE-001")
STATUS:                 (e.g., "IN_PROGRESS")
WHAT IS ALREADY BUILT:  (list of completed tickets with one-line summary)
WHAT HAS BEEN TESTED:  (test counts per level)
TEST RESULTS:           (PASS/FAIL)
KNOWN FAILURES:         (any failing tests or known issues)
ARCHITECTURE DECISIONS: (decisions made so far)
OPEN QUESTIONS:         (unresolved questions)
BLOCKERS:               (anything blocking progress)
NEXT UNLOCKED TICKET:   (what can be started next)
FILES RECENTLY CHANGED: (files from last ticket)
LAST COMMIT:            (commit hash + message)
```

---

## 16. Production Readiness Checklist

- [ ] All 37 tickets DONE
- [ ] All tests pass
- [ ] All 20 failure scenarios verified
- [ ] Send gate blocks unauthorized sends
- [ ] Payload hash prevents post-approval modification
- [ ] OAuth flow works end-to-end
- [ ] Token auto-refresh works
- [ ] Scheduler survives restart
- [ ] Startup reconciliation reports correct status
- [ ] Grace period policy correctly handles overdue jobs
- [ ] Atomic claiming prevents duplicate sends
- [ ] Event log provides complete audit trail
- [ ] No LLM in scheduled execution path
- [ ] Email content treated as untrusted
- [ ] Credentials not in git
- [ ] Existing features (chat, notion) unaffected
- [ ] CURRENT-CHECKPOINT.md is accurate

---

## 17. Architecture Compliance Checklist

- [ ] ARCH-REQ-001 through ARCH-REQ-047 all have corresponding tickets
- [ ] No ticket modifies forbidden files
- [ ] State machine has exactly 10 states and documented transitions
- [ ] Terminal states (SENT, FAILED, EXPIRED, REJECTED, CANCELLED) are immutable
- [ ] Only PROCESSING state triggers Gmail API
- [ ] LLM has no `email_send` tool
- [ ] Scheduler has no LLM dependency
- [ ] All timestamps use ISO 8601 UTC with explicit timezone
- [ ] All state transitions produce audit events
- [ ] Send gate checks all 11 conditions
- [ ] Payload hash uses SHA-256
- [ ] Grace period is configurable (default 15 min)
- [ ] Retry policy is bounded (max 3, exponential backoff)
- [ ] Error classification distinguishes transient vs permanent
- [ ] Gmail scopes use narrowest needed (readonly + compose)
