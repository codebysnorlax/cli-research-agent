# Email Agent — Folder Structure

> Every directory has a single responsibility. Every file has a clear owner.

---

## Complete Project Tree

```
langchain_langgraph/
│
├── .env                              # Environment variables (API keys, config)
├── .gitignore                        # Git exclusions (credentials/, data/, .env)
├── package.json                      # Project manifest + scripts
├── README.md                         # Project overview
│
├── debug/                            # Debug utilities (existing)
│
├── src/                              # Shared source (existing — research agent)
│   ├── index.js                      # Research agent entry point
│   ├── config/
│   │   ├── models.js                 # LLM model definitions
│   │   ├── provider.js               # Provider configuration
│   │   └── selector.js               # Model selection logic
│   ├── tools/
│   │   └── index.js                  # Shared tool definitions
│   └── utils/
│       └── terminalMarkdown.js       # Terminal markdown renderer
│
├── notion/                           # Notion workflow (existing — untouched)
│   └── index.js                      # Notion agent entry point
│
│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│   EMAIL AGENT (new)
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│
├── email/                            # ★ EMAIL AGENT ROOT
│   │
│   ├── index.js                      # Email system entry point
│   │                                 # - Load config
│   │                                 # - Initialize database
│   │                                 # - Validate schema
│   │                                 # - Authenticate Gmail
│   │                                 # - Start scheduler
│   │                                 # - Reconcile jobs
│   │                                 # - Report system status
│   │                                 # - Start terminal interaction
│   │
│   ├── auth/                         # ── Authentication ──
│   │   └── gmail/
│   │       ├── oauth.js              # OAuth 2.0 flow (Desktop credentials)
│   │       │                         # - Load client secrets
│   │       │                         # - Authorize (consent screen)
│   │       │                         # - Token refresh
│   │       │                         # - Token persistence
│   │       └── scopes.js             # Gmail API scope definitions
│   │                                 # - gmail.readonly (read)
│   │                                 # - gmail.compose (draft + send)
│   │                                 # - Narrowest scope principle
│   │
│   ├── graph/                        # ── LangGraph Agent ──
│   │   ├── agent/
│   │   │   ├── index.js              # Main agent graph definition
│   │   │   ├── state.js              # Graph state schema (Zod)
│   │   │   └── nodes.js              # Graph node definitions
│   │   │
│   │   ├── research/
│   │   │   ├── index.js              # Research subgraph
│   │   │   └── prompts.js            # Research-specific prompts
│   │   │                             # - Summarize threads
│   │   │                             # - Compare emails
│   │   │                             # - Extract key information
│   │   │
│   │   ├── drafting/
│   │   │   ├── index.js              # Drafting subgraph
│   │   │   └── prompts.js            # Drafting-specific prompts
│   │   │                             # - Compose new emails
│   │   │                             # - Reply drafts
│   │   │                             # - Tone/style instructions
│   │   │
│   │   └── approval/
│   │       ├── index.js              # Approval workflow node
│   │       └── display.js            # Terminal email preview renderer
│   │                                 # - Show draft to user
│   │                                 # - [S]end / [R]eject / [T]imer
│   │                                 # - Schedule confirmation display
│   │
│   ├── tools/                        # ── LangGraph Tools ──
│   │   │                             # (What the LLM can invoke)
│   │   │
│   │   ├── search/
│   │   │   └── index.js              # email_search tool
│   │   │                             # - Convert natural language → Gmail query
│   │   │                             # - Return: messageId, threadId, sender,
│   │   │                             #   recipient, subject, date, snippet, labels
│   │   │
│   │   ├── read/
│   │   │   └── index.js              # email_read tool
│   │   │                             # - Fetch full message content
│   │   │                             # - Pagination / size limits
│   │   │                             # - Never dump entire mailbox
│   │   │
│   │   ├── thread/
│   │   │   └── index.js              # email_thread tool
│   │   │                             # - Fetch conversation thread
│   │   │                             # - Incremental summarization for long threads
│   │   │                             # - Preserve threadId for replies
│   │   │
│   │   ├── draft/
│   │   │   └── index.js              # email_create_draft tool
│   │   │                             # - Propose email (NOT send)
│   │   │                             # - Returns draft for human review
│   │   │                             # ⚠ NO email_send tool exposed to LLM
│   │   │
│   │   └── scheduling/
│   │       └── index.js              # Scheduling tools:
│   │                                 # - email_schedule
│   │                                 # - email_list_scheduled
│   │                                 # - email_cancel_scheduled
│   │                                 # - email_reschedule
│   │
│   ├── services/                     # ── Service Layer ──
│   │   └── gmail/
│   │       ├── index.js              # GmailService class
│   │       │                         # - gmail.search(query)
│   │       │                         # - gmail.read(messageId)
│   │       │                         # - gmail.thread(threadId)
│   │       │                         # - gmail.createDraft(payload)
│   │       │                         # - gmail.send(payload)
│   │       │                         # - gmail.sendDraft(draftId)
│   │       │
│   │       ├── client.js             # googleapis client initialization
│   │       │                         # - Authenticated Gmail API instance
│   │       │
│   │       ├── parser.js             # Gmail message parser
│   │       │                         # - MIME → structured data
│   │       │                         # - Header extraction
│   │       │                         # - Body decoding
│   │       │
│   │       └── threading.js          # Thread-aware reply construction
│   │                                 # - threadId preservation
│   │                                 # - In-Reply-To header
│   │                                 # - References header
│   │                                 # - Subject matching
│   │
│   ├── scheduler/                    # ── Scheduler System ──
│   │   ├── worker/
│   │   │   └── index.js              # Scheduler worker
│   │   │                             # - Periodic SQLite polling
│   │   │                             # - Find due SCHEDULED jobs
│   │   │                             # - Atomic job claiming
│   │   │                             # - Execute via GmailService
│   │   │                             # - Update job state
│   │   │
│   │   ├── reconciliation/
│   │   │   └── index.js              # Startup reconciliation
│   │   │                             # - Detect stale PROCESSING jobs
│   │   │                             # - Detect past-due SCHEDULED jobs
│   │   │                             # - Apply grace period policy
│   │   │                             # - Report system status
│   │   │
│   │   └── policies/
│   │       ├── grace.js              # Grace period policy
│   │       │                         # - Configurable window
│   │       │                         # - Within grace → SEND
│   │       │                         # - Outside grace → EXPIRED
│   │       │
│   │       └── retry.js              # Retry policy
│   │                                 # - Transient vs permanent classification
│   │                                 # - Bounded retries (max 3)
│   │                                 # - Exponential backoff + jitter
│   │                                 # - Never retry permanent failures
│   │
│   ├── db/                           # ── Database Layer ──
│   │   ├── database/
│   │   │   ├── index.js              # SQLite connection management
│   │   │   └── schema.js             # Schema creation / migration
│   │   │
│   │   ├── jobs/
│   │   │   └── index.js              # Job repository
│   │   │                             # - createJob()
│   │   │                             # - getJob(id)
│   │   │                             # - updateStatus(id, status)
│   │   │                             # - claimJob(id)  ← atomic
│   │   │                             # - listScheduled()
│   │   │                             # - listDue()
│   │   │                             # - cancelJob(id)
│   │   │                             # - rescheduleJob(id, datetime)
│   │   │                             # ⚠ NO raw SQL exposed to LLM
│   │   │
│   │   └── events/
│   │       └── index.js              # Event log repository
│   │                                 # - logEvent(jobId, event, metadata)
│   │                                 # - getJobHistory(jobId)
│   │                                 # - Full audit trail
│   │
│   └── utils/                        # ── Email Utilities ──
│       ├── datetime/
│       │   ├── parser.js             # Natural-language → exact datetime
│       │   │                         # - "tomorrow at 10" → 2026-10-04T10:00:00
│       │   │                         # - Timezone-aware (Asia/Kolkata)
│       │   │                         # - Ambiguity detection
│       │   │                         # - Invalid date rejection
│       │   │
│       │   └── timezone.js           # Timezone configuration
│       │                             # - Default: Asia/Kolkata
│       │                             # - Never depend on machine timezone
│       │                             # - Explicit in all stored timestamps
│       │
│       ├── hashing/
│       │   └── index.js              # Payload integrity
│       │                             # - SHA-256 hash of approved payload
│       │                             # - Hash verification before send
│       │                             # - Mismatch → DO NOT SEND
│       │
│       └── validation/
│           ├── index.js              # Input validators
│           │                         # - Email address format
│           │                         # - Date validity (no Feb 31)
│           │                         # - Recipient existence check
│           │
│           └── sendGate.js           # Final send gate
│                                     # 1.  Job exists?
│                                     # 2.  Status is PROCESSING?
│                                     # 3.  Human approval exists?
│                                     # 4.  Approval still valid?
│                                     # 5.  Payload hash matches?
│                                     # 6.  Recipient valid?
│                                     # 7.  Schedule condition met?
│                                     # 8.  Job not cancelled?
│                                     # 9.  Job not expired?
│                                     # 10. Gmail authenticated?
│                                     # 11. Retry policy allows?
│
│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│   DATA & CREDENTIALS (git-ignored)
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│
├── credentials/                      # ★ GIT-IGNORED
│   ├── google-oauth.json             # OAuth Desktop client credentials
│   └── token.json                    # Stored refresh/access token
│
├── data/                             # ★ GIT-IGNORED
│   └── email.sqlite                  # SQLite database file
│
│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│   DOCUMENTATION & TESTING
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│
├── docs/                             # Architecture & design documents
│   ├── 00-ARCHITECTURE-OVERVIEW.md
│   ├── 01-FOLDER-STRUCTURE.md        # ← You are here
│   ├── 02-STATE-MACHINE.md
│   ├── 03-APPROVAL-AND-SECURITY.md
│   ├── 04-SCHEDULER.md
│   ├── 05-GMAIL-INTEGRATION.md
│   ├── 06-DATABASE-SCHEMA.md
│   ├── 07-LANGGRAPH-WORKFLOW.md
│   ├── 08-DATETIME-AND-TIMEZONE.md
│   ├── 09-ERROR-HANDLING.md
│   ├── 10-FAILURE-SCENARIOS.md
│   ├── 11-IMPLEMENTATION-PHASES.md
│   └── 12-ANTI-PATTERNS.md
│
└── test/                             # Tests (existing directory)
    └── (unit + integration + failure/recovery tests)
```

---

## NPM Scripts

```jsonc
{
  "scripts": {
    "start": "node src/index.js",       // Research agent (existing)
    "dev": "nodemon src/index.js",      // Research agent dev (existing)
    "notion": "node notion/index.js",   // Notion workflow (existing)
    "email": "node email/index.js"      // ★ Email agent (new)
  }
}
```

---

## .gitignore Additions

```gitignore
# Email agent — sensitive data
credentials/
data/
*.sqlite
```

---

## Key Architectural Boundaries

| Boundary | What's Inside | What's Outside |
|---|---|---|
| **email/graph/** | LLM reasoning, tool orchestration | Gmail API calls, SQL queries |
| **email/tools/** | Tool schemas, input validation | Direct service calls |
| **email/services/gmail/** | Gmail HTTP abstraction | Agent logic, scheduling logic |
| **email/scheduler/** | Job polling, claiming, execution | LLM interaction |
| **email/db/** | SQLite queries, transactions | Business logic |
| **email/utils/validation/sendGate.js** | All 11 pre-send checks | Everything else |

The graph should **never** call `googleapis` directly.  
The scheduler should **never** call the LLM.  
The database should **never** be queried with LLM-generated SQL.
