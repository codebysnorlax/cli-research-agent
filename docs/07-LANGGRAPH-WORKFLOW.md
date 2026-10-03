# Email Agent — LangGraph Workflow

> LangGraph manages interactive reasoning workflows. It does **not** replace the database.

---

## 1. LangGraph's Responsibility

```
START
 ↓
Understand user request
 ↓
Search / Read if needed
 ↓
Research if needed
 ↓
Draft email
 ↓
Human action decision
 ├── Send
 ├── Reject
 └── Schedule
        ↓
    Parse datetime
        ↓
    Human confirmation
        ↓
    Persist job to SQLite
        ↓
       END
```

LangGraph handles the **interactive reasoning** workflow. Once a job is persisted to SQLite, LangGraph's involvement is **done**.

---

## 2. What LangGraph Does NOT Do

| LangGraph Does | LangGraph Does NOT |
|---|---|
| Orchestrate agent conversation | Execute scheduled sends |
| Manage tool calls | Contact Gmail directly |
| Route between subgraphs | Manage the scheduler |
| Handle state transitions during conversation | Store persistent job state |
| Pause/resume for human input | Replace SQLite |

### Avoid This

```
LangGraph
 ├── Gmail API        ← NO
 ├── SQLite queries   ← NO
 ├── Scheduler logic  ← NO
 ├── OAuth flow       ← NO
 ├── Retry logic      ← NO
 ├── MIME encoding    ← NO
 └── Everything       ← NO
```

### Do This

```
LangGraph
    ↓
Application Services (EmailService, ScheduleService)
    ↓
Infrastructure (GmailService, SQLite, etc.)
```

---

## 3. Graph Structure

```
                    ┌──────────┐
                    │  START   │
                    └────┬─────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  AGENT NODE   │
                 │ (understand)  │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
         ┌─────────┐ ┌────────┐ ┌──────────┐
         │ SEARCH  │ │  READ  │ │ RESEARCH │
         │  node   │ │  node  │ │   node   │
         └────┬────┘ └───┬────┘ └────┬─────┘
              │          │          │
              └──────────┼──────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ DRAFTING NODE │
                 │ (compose)     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ APPROVAL NODE │
                 │ (human-in-    │
                 │  the-loop)    │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
           [SEND]    [REJECT]   [SCHEDULE]
              │          │          │
              ▼          ▼          ▼
          ┌────────┐ ┌────────┐ ┌──────────────┐
          │PERSIST │ │  END   │ │ SCHEDULE     │
          │ + SEND │ │        │ │ CONFIRM NODE │
          └───┬────┘ └────────┘ └──────┬───────┘
              │                        │
              ▼                        ▼
          ┌────────┐              ┌─────────┐
          │  END   │              │ PERSIST │
          └────────┘              │ + END   │
                                  └─────────┘
```

---

## 4. Graph State Schema

**Location:** `email/graph/agent/state.js`

```javascript
// Conceptual state definition (Zod-validated)
{
  // Conversation
  messages:           [],        // LangGraph message history
  userRequest:        "",        // Original user input

  // Email context
  searchResults:      [],        // From email_search
  readMessages:       [],        // From email_read
  threadMessages:     [],        // From email_thread
  researchSummary:    "",        // From research subgraph

  // Draft
  draft: {
    to:               [],
    cc:               [],
    bcc:              [],
    subject:          "",
    body:             "",
    type:             "",        // NEW_EMAIL | REPLY
    threadId:         null,
    replyToMessageId: null,
  },

  // Approval
  userDecision:       null,      // SEND | REJECT | SCHEDULE
  scheduleInput:      null,      // "tomorrow at 10"
  resolvedDatetime:   null,      // 2026-10-04T10:00:00
  resolvedTimezone:   null,      // Asia/Kolkata
  scheduleConfirmed:  false,

  // Result
  jobId:              null,      // EMAIL-00021
  finalStatus:        null,      // SENT | REJECTED | SCHEDULED
}
```

---

## 5. LLM Responsibilities

The LLM should primarily handle:

| Capability | Example |
|---|---|
| **Understanding** | "Find the mail Rahul sent yesterday" → Gmail search query |
| **Research** | "Read last 3 emails from Rahul, what changed?" → summarize |
| **Drafting** | "Reply saying I'll finish tomorrow" → compose reply |
| **Summarization** | "What is this thread about?" → concise summary |
| **Intent extraction** | "Send Rahul the API update tomorrow morning" → extract schedule |

The LLM can **understand** the request. It should **not** independently execute the final side effect.

---

## 6. Tools Available to the Graph

### Read-Side Tools

| Tool | Purpose | Side Effects |
|---|---|---|
| `email_search` | Convert NL query → Gmail search | None (read-only) |
| `email_read` | Fetch full message content | None (read-only) |
| `email_thread` | Fetch conversation thread | None (read-only) |

### Composition Tools

| Tool | Purpose | Side Effects |
|---|---|---|
| `email_create_draft` | Propose email for review | Creates internal draft |

### Scheduling Tools

| Tool | Purpose | Side Effects |
|---|---|---|
| `email_schedule` | Propose scheduled send | Requires approval |
| `email_list_scheduled` | View scheduled jobs | None (read-only) |
| `email_cancel_scheduled` | Cancel a scheduled job | State transition |
| `email_reschedule` | Change scheduled time | Requires re-approval |

### ⚠ NOT Available

```
email_send()    → NOT a freely available LLM tool
```

---

## 7. Subgraphs

### Research Subgraph

**Location:** `email/graph/research/`

- Invoked when the agent needs to understand email context
- Reads multiple emails, threads, searches
- Produces a `researchSummary` for the drafting node
- Handles long threads via incremental summarization

### Drafting Subgraph

**Location:** `email/graph/drafting/`

- Takes user intent + research context
- Produces a structured draft
- Handles tone, style, formality
- Distinguishes NEW_EMAIL vs REPLY (with threading metadata)

### Approval Node

**Location:** `email/graph/approval/`

- Displays draft to terminal user
- Collects [S]end / [R]eject / [T]imer decision
- For [T]imer: invokes datetime parser, shows resolved time, gets confirmation
- Produces the `userDecision` and related state

---

## 8. LangGraph Persistence

LangGraph's built-in checkpointing can pause/resume workflows around human interaction points. However:

- **SQLite** remains the durable email-job source of truth
- LangGraph state is for **conversation context**, not job lifecycle
- If LangGraph state is lost, the job in SQLite still exists

The approved payload is persisted to SQLite **immediately** after approval, before LangGraph's conversation ends.
