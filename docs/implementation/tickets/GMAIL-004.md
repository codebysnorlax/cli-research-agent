# GMAIL-004 — GmailService

---

## Ticket ID
`GMAIL-004`

## Title
GmailService

## Level
Level 5

## Priority
P0

## Risk
MEDIUM

## Depends On
GMAIL-002, GMAIL-003

## Blocks
GMAIL-005, TOOLS-001, TOOLS-002, TOOLS-004, SCHED-003

## Parallelizable
NO

---

## Purpose
Create the GmailService — the **isolation layer** between the application and Gmail API. The graph and tools never call googleapis directly; they call GmailService methods. If Gmail is replaced with Outlook, only this module changes.

## Current State
Gmail client exists (GMAIL-002). Parser exists (GMAIL-003). No service layer.

## Required Change
Create `email/services/gmail/index.js` per doc 05 §1 with:
1. `search(query)` — search messages
2. `read(messageId)` — read full message
3. `thread(threadId)` — read thread
4. `createDraft(payload)` — create Gmail draft
5. `send(payload)` — send message
6. `sendDraft(draftId)` — send existing draft

## Scope
- Create `email/services/gmail/index.js`

## Out of Scope
- Do NOT implement threading headers (GMAIL-005)
- Do NOT implement scheduler
- Do NOT expose to LLM directly

## Expected Files / Modules
**Created:**
- `email/services/gmail/index.js`
**Tests:**
- `test/email/integration/gmail/service.test.js` (with mocked googleapis)

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/graph/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export class GmailService {
  constructor(gmailClient)

  async search(query, maxResults = 10)
  // Returns: parsedSearchResult[]

  async read(messageId)
  // Returns: parsedFullMessage

  async thread(threadId, maxMessages = 20)
  // Returns: parsedFullMessage[]

  async createDraft(payload)
  // payload: { to, cc?, bcc?, subject, body, threadId?, headers? }
  // Returns: { draftId, messageId }

  async send(payload)
  // payload: { to, cc?, bcc?, subject, body, threadId?, headers? }
  // Returns: { messageId, threadId }

  async sendDraft(draftId)
  // Returns: { messageId, threadId }
}
```

## Behavior
- All methods use the parser to return structured data
- MIME encoding for send/draft payloads (RFC 2822)
- Error wrapping: Gmail API errors → application error types
- Search uses Gmail query syntax (from:, to:, subject:, etc.)

## Security
- No `email_send` exposed to LLM — `send()` is only called by the scheduler/approval worker
- GmailService is infrastructure, not a tool

## Tests Required
1. `search` calls Gmail API and returns parsed results
2. `read` calls Gmail API and returns parsed full message
3. `thread` calls Gmail API and returns parsed messages
4. `createDraft` encodes MIME correctly
5. `send` encodes MIME correctly
6. Error from Gmail API is wrapped with classification (transient vs permanent)
7. `maxResults` limits search results

## Acceptance Criteria
1. All 6 GmailService methods exist
2. Uses parser for response processing
3. MIME encoding works for send/draft
4. Gmail API errors are classified
5. All tests pass

## Definition of Ready
- GMAIL-002 and GMAIL-003 complete

## Definition of Done
- GmailService created, tests pass, checkpoint updated
- Commit: `feat(email): GMAIL-004 — add GmailService abstraction`

## Next Tickets
Unlocks: GMAIL-005, TOOLS-001, TOOLS-002, TOOLS-004

---

## AI Implementation Guardrail
```
You are implementing ONLY GMAIL-004.
1. Read docs/05-GMAIL-INTEGRATION.md §1, §7, §8.
2. Read CURRENT-CHECKPOINT.md.
3. Create ONLY the GmailService class.
4. Write tests with mocked Gmail API. Run tests.
5. Update CURRENT-CHECKPOINT.md. Stop.
```
