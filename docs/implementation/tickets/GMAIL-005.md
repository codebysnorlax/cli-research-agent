# GMAIL-005 — Email Threading

---

## Ticket ID
`GMAIL-005`

## Title
Email Threading

## Level
Level 5

## Priority
P1

## Risk
MEDIUM

## Depends On
GMAIL-004

## Blocks
TOOLS-003

## Parallelizable
NO

---

## Purpose
Implement thread-aware reply construction so replies appear in the correct Gmail conversation. Handles threadId, In-Reply-To, References headers, and Subject matching.

## Current State
GmailService exists (GMAIL-004). No threading logic.

## Required Change
Create `email/services/gmail/threading.js` per doc 05 §4:
1. Build reply headers (In-Reply-To, References) from original message
2. Preserve threadId for conversation continuity
3. Subject matching with `Re:` prefix
4. Distinguish NEW_EMAIL vs REPLY payloads

## Scope
- Create `email/services/gmail/threading.js`

## Out of Scope
- Do NOT modify GmailService (it will consume threading utilities)

## Expected Files / Modules
**Created:**
- `email/services/gmail/threading.js`
**Tests:**
- `test/email/unit/gmail/threading.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function buildReplyHeaders(originalMessage)
// originalMessage: parsed message with headers
// Returns: { threadId, inReplyTo, references, subject }

export function isReply(payload)
// Returns: boolean (has threadId + replyToMessageId)

export function buildReplyPayload(originalMessage, replyBody)
// Returns: full reply payload with correct headers
```

## Tests Required
1. `buildReplyHeaders` extracts In-Reply-To from original Message-ID
2. `buildReplyHeaders` builds References chain
3. `buildReplyHeaders` adds `Re:` prefix to subject (if not present)
4. `buildReplyHeaders` preserves threadId
5. `isReply` returns true for reply payloads, false for new emails
6. Duplicate `Re: Re:` prefix is avoided

## Acceptance Criteria
1. Reply payloads include threadId, In-Reply-To, References
2. Subject correctly prefixed with `Re:`
3. All tests pass

## Definition of Ready
- GMAIL-004 complete

## Definition of Done
- Threading module created, tests pass, checkpoint updated
- Commit: `feat(email): GMAIL-005 — add email threading`

## Next Tickets
Unlocks: TOOLS-003

---

## AI Implementation Guardrail
```
You are implementing ONLY GMAIL-005.
1. Read docs/05-GMAIL-INTEGRATION.md §4.
2. Create ONLY the threading module. Write tests. Run tests.
3. Update CURRENT-CHECKPOINT.md. Stop.
```
