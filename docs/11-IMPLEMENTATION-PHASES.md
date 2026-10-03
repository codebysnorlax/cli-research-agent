# Email Agent — Implementation Phases

> Don't build everything simultaneously. Each phase should be provably working before moving on.

---

## Phase Overview

```
Phase 1 ─── Gmail Foundation ──────── Prove Gmail works
Phase 2 ─── Agent ─────────────────── LLM understands and drafts
Phase 3 ─── Approval ──────────────── Human-in-the-loop boundary
Phase 4 ─── SQLite ────────────────── Persistent job storage
Phase 5 ─── Scheduling ────────────── Natural-language datetime
Phase 6 ─── Scheduler ────────────── Polling worker + execution
Phase 7 ─── Recovery ─────────────── Break it, then survive it
```

---

## Phase 1 — Gmail Foundation

### Goal
Prove Gmail API access works end-to-end.

### Build

```
email/auth/gmail/oauth.js        → OAuth 2.0 flow
email/auth/gmail/scopes.js       → Scope definitions
email/services/gmail/index.js    → GmailService
email/services/gmail/client.js   → googleapis client init
email/services/gmail/parser.js   → Message parsing
credentials/google-oauth.json    → OAuth credentials (manual setup)
```

### Verify

- [ ] OAuth consent flow completes successfully
- [ ] Token is stored and reused on subsequent runs
- [ ] `gmail.search("from:someone")` returns results
- [ ] `gmail.read(messageId)` returns full message
- [ ] `gmail.thread(threadId)` returns conversation
- [ ] `gmail.createDraft(payload)` creates a draft in Gmail
- [ ] `gmail.send(payload)` sends an email
- [ ] Token auto-refreshes when expired

### No scheduler yet. No LLM yet. Just Gmail.

---

## Phase 2 — Agent

### Goal
LLM can understand requests, search/read mail, and produce drafts.

### Build

```
email/graph/agent/index.js       → Main agent graph
email/graph/agent/state.js       → Graph state schema
email/graph/agent/nodes.js       → Node definitions
email/graph/research/index.js    → Research subgraph
email/graph/research/prompts.js  → Research prompts
email/graph/drafting/index.js    → Drafting subgraph
email/graph/drafting/prompts.js  → Drafting prompts
email/tools/search/index.js      → email_search tool
email/tools/read/index.js        → email_read tool
email/tools/thread/index.js      → email_thread tool
email/tools/draft/index.js       → email_create_draft tool
```

### Verify

- [ ] "Find emails from Rahul" → correct Gmail search
- [ ] "Read the latest email from Rahul" → full content displayed
- [ ] "What is this thread about?" → coherent summary
- [ ] "Reply saying I'll finish tomorrow" → well-formed draft displayed
- [ ] Drafts distinguish NEW_EMAIL vs REPLY
- [ ] Reply drafts include threadId and proper headers
- [ ] Long threads are summarized, not dumped
- [ ] Large emails don't crash the context window

### Still don't schedule. Display only.

---

## Phase 3 — Approval

### Goal
Human approval boundary is enforced before any send.

### Build

```
email/graph/approval/index.js    → Approval workflow node
email/graph/approval/display.js  → Terminal draft renderer
email/utils/hashing/index.js     → SHA-256 payload hashing
email/utils/validation/sendGate.js → 11-check send gate
```

### Verify

- [ ] Draft is displayed with To, Subject, Body
- [ ] User can choose [S]end, [R]eject, [T]imer
- [ ] [R]eject terminates cleanly
- [ ] [S]end triggers approval flow
- [ ] Payload is frozen and hashed after approval
- [ ] Send gate validates all 11 checks
- [ ] Immediate send works (approved → send → Gmail)
- [ ] Payload modification after approval is detected and blocked

---

## Phase 4 — SQLite

### Goal
Jobs and events are durably persisted.

### Build

```
email/db/database/index.js       → SQLite connection
email/db/database/schema.js      → Schema creation
email/db/jobs/index.js           → Job repository
email/db/events/index.js         → Event log repository
data/email.sqlite                → Database file
```

### Verify

- [ ] Schema creates correctly on first run
- [ ] Jobs are created with `EMAIL-XXXXX` IDs
- [ ] Status transitions are atomic
- [ ] `claimJob()` is truly atomic (test concurrent access)
- [ ] Event log records every state transition
- [ ] `getJobHistory(id)` returns full timeline
- [ ] Database survives process restart
- [ ] Transactions roll back correctly on failure

---

## Phase 5 — Natural-Language Scheduling

### Goal
Parse human datetime expressions and confirm with the user.

### Build

```
email/utils/datetime/parser.js   → NL date parser
email/utils/datetime/timezone.js → Timezone configuration
email/tools/scheduling/index.js  → Schedule tools
```

### Verify

- [ ] "tomorrow at 10" → correct date + 10:00 AM IST
- [ ] "next Monday" → correct date + ask for time
- [ ] "in 2 hours" → correct relative time
- [ ] "tomorrow morning" → asks for specific time
- [ ] Ambiguous dates prompt clarification
- [ ] Past dates are rejected
- [ ] Invalid dates (Feb 31) are rejected
- [ ] Resolved datetime is displayed and confirmed by user
- [ ] Timezone is always explicit (never system default)

---

## Phase 6 — Scheduler

### Goal
Polling worker finds due jobs and sends them.

### Build

```
email/scheduler/worker/index.js         → Scheduler worker
email/scheduler/reconciliation/index.js → Startup reconciliation
email/scheduler/policies/grace.js       → Grace period policy
email/scheduler/policies/retry.js       → Retry policy
email/index.js                          → Full system entry point
```

### Verify

- [ ] Worker polls at configured interval
- [ ] Due jobs are detected correctly
- [ ] Atomic claiming prevents double execution
- [ ] Send gate is checked before Gmail API call
- [ ] Successful send → SENT + event logged
- [ ] Failed send → classified (transient/permanent)
- [ ] Transient failure → retry with backoff
- [ ] Permanent failure → FAILED, no retry
- [ ] Grace period works (within → send, outside → expired)
- [ ] Startup reconciliation runs and reports status
- [ ] Health check displays on every `npm run email`

### Startup Output

```
EMAIL AGENT
────────────────────────────────

LLM:       ✓ Gemini available
Gmail:     ✓ OAuth authenticated
Database:  ✓ SQLite connected, schema valid
Scheduler: ✓ Running

Jobs:
  Scheduled:  3
  Processing: 0
  Failed:     1
  Expired:    1

Next:
  EMAIL-00021
  Oct 4, 2026 — 10:00 AM IST

────────────────────────────────
Ready.
```

---

## Phase 7 — Recovery

### Goal
The system survives every failure scenario documented in [10-FAILURE-SCENARIOS.md](./10-FAILURE-SCENARIOS.md).

### Deliberately Break

- [ ] Kill process during scheduling → verify job state is deterministic
- [ ] Kill process during Gmail send → verify reconciliation detects it
- [ ] Disconnect network at send time → verify retry behavior
- [ ] Expire OAuth token → verify auto-refresh
- [ ] Revoke OAuth → verify graceful failure
- [ ] Change system clock → verify timezone-aware behavior
- [ ] Start duplicate scheduler → verify atomic claiming prevents dupes
- [ ] Crash after Gmail accepts → verify no duplicate on retry
- [ ] Sleep computer past scheduled time → verify grace period behavior
- [ ] Send email with prompt injection content → verify untrusted handling
- [ ] Schedule for Feb 31 → verify validation catches it
- [ ] Cancel while processing → verify race resolution
- [ ] Modify payload after approval → verify hash check blocks send

### This phase is about confidence, not features.

---

## Dependency Installation Plan

### Phase 1 — Add

```
googleapis
@google-cloud/local-auth
```

### Phase 4 — Add

```
better-sqlite3    (or similar synchronous SQLite driver)
```

### Phase 5 — Add

```
chrono-node        (or similar NL date parser)
luxon / date-fns   (timezone-aware date utilities)
```

### Already Available

```
@langchain/core
@langchain/langgraph
@langchain/google-genai
zod
chalk
dotenv
```
