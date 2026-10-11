# INTEGRATION-001 — System Entry Point

---

## Ticket ID
`INTEGRATION-001`

## Title
System Entry Point

## Level
Level 10

## Priority
P0

## Risk
MEDIUM

## Depends On
SCHED-004, GRAPH-002, APPROVAL-003

## Blocks
RECOVERY-001

## Parallelizable
NO — system integration

---

## Purpose
Create `email/index.js` — the full system entry point for `npm run email`. This file wires together ALL components: LLM provider, Gmail service, SQLite database, LangGraph agent, scheduler worker, and startup reconciliation. It produces the startup health check output documented in doc 04 §4 and doc 11 Phase 6.

## Current State
`email/index.js` does not exist. `package.json` already has `"email": "node email/index.js"`.

## Required Change
Create `email/index.js` that:
1. Loads environment config (`dotenv/config`)
2. Initializes SQLite database + schema validation
3. Initializes Gmail OAuth + authentication check
4. Initializes LLM provider (reuse `src/config/` via import)
5. Runs startup reconciliation
6. Displays health check output
7. Starts scheduler worker (background polling)
8. Starts interactive agent (LangGraph) for user commands
9. Handles graceful shutdown (SIGINT/SIGTERM)

## Scope
- Create `email/index.js`

## Out of Scope
- Do NOT modify existing `src/index.js` or `notion/index.js`
- Do NOT create new components — only wire existing ones

## Expected Files / Modules
**Created:**
- `email/index.js`
**Tests:**
- `test/email/e2e/startup.test.js` (integration smoke test)

## Forbidden Files / Modules
- `src/index.js` — DO NOT MODIFY
- `notion/index.js` — DO NOT MODIFY
- `src/config/*.js` — DO NOT MODIFY (only import)

## Interfaces / Contracts
```javascript
// email/index.js — entry point
// No exports — this is the main execution file

// Startup sequence:
// 1. Config:    load .env
// 2. Database:  openDatabase() + initializeSchema() + validateSchema()
// 3. Gmail:     authorize() → isAuthenticated?
// 4. LLM:       selectModel() → createLLM()
// 5. Reconcile: reconcile(db)
// 6. Display:   health check output
// 7. Scheduler: worker.start()
// 8. Agent:     interactive readline loop with LangGraph
// 9. Shutdown:  worker.stop() + closeDatabase() on SIGINT/SIGTERM
```

## Behavior
### Startup Health Check Output (per doc 04 §4)
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

### Failure Display
If a component fails to initialize:
```
EMAIL AGENT
────────────────────────────────

LLM:       ✓ Gemini available
Gmail:     ✗ Not authenticated (run: npm run email --reauth)
Database:  ✓ SQLite connected
Scheduler: ✗ Not started (Gmail required)

────────────────────────────────
Partial startup. Some features unavailable.
```

## Security
- OAuth credentials never logged to stdout
- API keys not displayed
- Graceful shutdown prevents data corruption

## Tests Required
1. Entry point file exists and is syntactically valid
2. All imports resolve (no missing modules)
3. Startup sequence handles missing Gmail gracefully (partial startup)
4. Startup sequence handles missing database with fail-closed
5. Graceful shutdown cleans up resources
6. Health check output format matches spec

## Acceptance Criteria
1. `npm run email` starts the system
2. Health check output displayed on startup
3. Reconciliation runs automatically
4. Scheduler starts in background
5. Interactive agent available for user commands
6. Graceful shutdown works (Ctrl+C)
7. Missing Gmail → partial startup (not crash)
8. Missing database → fail closed (no scheduler)
9. All tests pass

## Definition of Ready
- SCHED-004 complete (reconciliation)
- GRAPH-002 complete (agent graph)
- APPROVAL-003 complete (schedule confirmation)
- All Level 5–9 components available

## Definition of Done
- Entry point created, tests pass, checkpoint updated
- Commit: `feat(email): INTEGRATION-001 — add system entry point`

## Checkpoint
Record: System entry point created. Document startup sequence. List all components wired. Note any partial-startup scenarios.

## Next Tickets
Unlocks: RECOVERY-001

---

## AI Implementation Guardrail
```
You are implementing ONLY INTEGRATION-001.
1. Read docs/04-SCHEDULER.md §4 (startup output), docs/11-IMPLEMENTATION-PHASES.md Phase 6.
2. Read CURRENT-CHECKPOINT.md — verify all dependencies complete.
3. Create ONLY email/index.js. Wire existing components — do NOT create new ones.
4. DO NOT modify src/index.js, notion/index.js, or src/config/*.
5. Write tests. Run tests.
6. Update CURRENT-CHECKPOINT.md. Stop.
```
