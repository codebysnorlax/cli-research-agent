# GMAIL-003 — Message Parser

---

## Ticket ID
`GMAIL-003`

## Title
Message Parser

## Level
Level 5

## Priority
P1

## Risk
LOW

## Depends On
GMAIL-002

## Blocks
GMAIL-004

## Parallelizable
YES (with GMAIL-005 if GMAIL-004 is not yet needed)

---

## Purpose
Parse Gmail API message responses from raw MIME format into structured data usable by the agent. Handle header extraction, body decoding (base64url), and size limits.

## Current State
No parser code exists.

## Required Change
Create `email/services/gmail/parser.js` per doc 05 §6:
1. Parse search result into minimal metadata (messageId, threadId, sender, recipient, subject, date, snippet, labels)
2. Parse full message into structured content (headers + decoded body)
3. Handle multipart MIME messages
4. Enforce size limits for LLM context safety
5. Handle base64url decoding

## Scope
- Create `email/services/gmail/parser.js`

## Out of Scope
- Do NOT create GmailService (GMAIL-004)
- Do NOT handle attachments (POC scope)

## Expected Files / Modules
**Created:**
- `email/services/gmail/parser.js`
**Tests:**
- `test/email/unit/gmail/parser.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function parseSearchResult(gmailMessage)
// Returns: { messageId, threadId, sender, recipient, subject, date, snippet, labels }

export function parseFullMessage(gmailMessage)
// Returns: { ...searchResult, body, bodyHtml?, headers }

export function decodeBase64Url(encoded)
// Returns: decoded string

export function truncateForContext(text, maxChars = 50000)
// Truncates with "[truncated]" marker for LLM safety
```

## Tests Required
1. `parseSearchResult` extracts all 8 fields correctly
2. `parseFullMessage` decodes base64url body
3. `decodeBase64Url` handles standard Gmail encoding
4. `truncateForContext` truncates oversized content
5. Multipart message body extraction works
6. Missing headers don't crash parser (return null/empty)

## Acceptance Criteria
1. Parser handles real Gmail API response format
2. Size limits enforced for LLM context safety
3. All tests pass

## Definition of Ready
- GMAIL-002 complete

## Definition of Done
- Parser module created, tests pass, checkpoint updated
- Commit: `feat(email): GMAIL-003 — add Gmail message parser`

## Next Tickets
Unlocks: GMAIL-004

---

## AI Implementation Guardrail
```
You are implementing ONLY GMAIL-003.
1. Read docs/05-GMAIL-INTEGRATION.md §6.
2. Read CURRENT-CHECKPOINT.md.
3. Create ONLY the message parser.
4. Write tests with mock Gmail API responses. Run tests.
5. Update CURRENT-CHECKPOINT.md. Stop.
```
