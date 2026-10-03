# Email Agent — Architecture Overview

> **Status:** Design Phase · No Implementation Yet  
> **Version:** 0.1.0  
> **Last Updated:** October 3, 2026

---

## 1. System Purpose

A CLI-based email automation agent that uses LLM reasoning to understand, search, read, research, draft, and schedule emails — while enforcing **strict human approval boundaries** before any external side effect (sending email) occurs.

### The Core Principle

```
LLM ≠ Execution Authority
```

The model can **propose** actions. The **application** decides whether those actions are actually allowed. Only **explicit human approval** authorizes external side effects.

---

## 2. High-Level Architecture

```
                         ┌─────────────────────┐
                         │       USER          │
                         │   Terminal / CLI    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    EMAIL AGENT      │
                         │     LangGraph       │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
              Email Search      Email Read      Email Research
                    │               │                │
                    └───────────────┼────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ EMAIL DRAFTING │
                           │      LLM       │
                           └───────┬────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │ FINAL EMAIL DISPLAY │
                         └──────────┬──────────┘
                                    │
                       ┌────────────┼─────────────┐
                       │            │             │
                     SEND         REJECT       SCHEDULE
                       │                          │
                       │                          ▼
                       │                  Natural-language
                       │                  date/time parser
                       │                          │
                       │                          ▼
                       │                  Exact datetime
                       │                          │
                       │                          ▼
                       │                    Human approval
                       │                          │
                       │                         YES
                       │                          │
                       ▼                          ▼
                ┌─────────────────────────────────────┐
                │           EMAIL JOB SYSTEM           │
                │              SQLite                  │
                └──────────────────┬──────────────────┘
                                   │
                                   ▼
                            Scheduler Worker
                                   │
                              due job?
                                   │
                                   ▼
                          Atomic job claiming
                                   │
                                   ▼
                            PROCESSING
                                   │
                                   ▼
                           Gmail Service
                                   │
                                   ▼
                            Gmail API
                                   │
                                   ▼
                              SENT / FAILED
```

---

## 3. The Five Core Components

Everything else is secondary. These are the heart of the system:

```
              ┌─────────────────┐
              │      LLM        │
              │ understand/draft│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ APPROVAL GATE   │
              │ human authority │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ STATE MACHINE   │
              │ lifecycle       │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │     SQLITE      │
              │ source of truth │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ GMAIL EXECUTOR  │
              │ external side   │
              │ effect          │
              └─────────────────┘
```

**Not** LangChain. **Not** Gemini. **Not** the CLI. **Not** Gmail.  
The combination of **State Machine + Persistent Jobs + Approval Boundary + Deterministic Executor** is what turns this from a chatbot into an actual automation system.

---

## 4. Separation of Concerns

```
LangGraph
    ↓
Email Tools (abstraction)
    ↓
Gmail Service (isolation layer)
    ↓
googleapis (client library)
    ↓
Gmail API (external)
```

The graph never knows how Gmail HTTP requests work. If Gmail is later replaced with Outlook, the agent doesn't change:

```
Email Agent
     ↓
Email Service Interface
     ├── Gmail
     └── Outlook (future)
```

---

## 5. Technology Stack

| Technology | Responsibility |
|---|---|
| **Node.js** | Runtime |
| **LangGraph** | Agent workflow / state orchestration |
| **LangChain** | LLM / tool abstractions |
| **Gemini / OpenRouter** | Reasoning, research, drafting |
| **Gmail API** | Actual mailbox operations |
| **Google OAuth 2.0** | Gmail authorization |
| **googleapis** | Google API client library |
| **@google-cloud/local-auth** | Local OAuth flow |
| **SQLite** | Persistent job / state storage |
| **Zod** | Validate tool inputs / state |
| **Node crypto (SHA-256)** | Payload integrity hashing |
| **Temporal-aware date library** | Natural-language schedule resolution |
| **Terminal / readline** | Human interaction / approval |

---

## 6. Document Index

| Document | Description |
|---|---|
| [01-FOLDER-STRUCTURE.md](./01-FOLDER-STRUCTURE.md) | Complete folder architecture with file responsibilities |
| [02-STATE-MACHINE.md](./02-STATE-MACHINE.md) | Email job lifecycle, states, and transitions |
| [03-APPROVAL-AND-SECURITY.md](./03-APPROVAL-AND-SECURITY.md) | Human approval boundaries, payload freezing, hashing |
| [04-SCHEDULER.md](./04-SCHEDULER.md) | Scheduler worker, reconciliation, grace policies |
| [05-GMAIL-INTEGRATION.md](./05-GMAIL-INTEGRATION.md) | OAuth, scopes, service isolation, threading |
| [06-DATABASE-SCHEMA.md](./06-DATABASE-SCHEMA.md) | SQLite tables, job records, event log |
| [07-LANGGRAPH-WORKFLOW.md](./07-LANGGRAPH-WORKFLOW.md) | Agent graph, nodes, tools, state |
| [08-DATETIME-AND-TIMEZONE.md](./08-DATETIME-AND-TIMEZONE.md) | Natural-language parsing, timezone handling |
| [09-ERROR-HANDLING.md](./09-ERROR-HANDLING.md) | Failure classification, retries, recovery |
| [10-FAILURE-SCENARIOS.md](./10-FAILURE-SCENARIOS.md) | 20 explicit failure scenarios and expected behavior |
| [11-IMPLEMENTATION-PHASES.md](./11-IMPLEMENTATION-PHASES.md) | Seven-phase build plan |
| [12-ANTI-PATTERNS.md](./12-ANTI-PATTERNS.md) | What NOT to do, and what to do instead |

---

## 7. The Guiding Question

When implementing any operation, ask:

> **"If the process crashes immediately after this line, can I restart the application and know exactly what happened?"**

If the answer is no — that's where you need better persistence, state management, or reconciliation.

That's the difference between an AI demo and a reliable email automation system.

---

## 8. Engineering Effort Priority

```
                    Importance

State machine       ████████████████████
Approval/security   ███████████████████
Scheduler           ██████████████████
SQLite persistence  █████████████████
Gmail integration   ███████████████
Error recovery      ███████████████
Date/time           ██████████████
LLM prompting       ███████████
UI/terminal         ███████
Fancy agent stuff   ███
```

The mistake would be spending 70% on **"making the AI smarter"** while having `setTimeout()` as the scheduler.
