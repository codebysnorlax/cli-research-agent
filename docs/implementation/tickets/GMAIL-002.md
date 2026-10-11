# GMAIL-002 — Gmail API Client

---

## Ticket ID
`GMAIL-002`

## Title
Gmail API Client

## Level
Level 5

## Priority
P0

## Risk
LOW

## Depends On
GMAIL-001

## Blocks
GMAIL-003, GMAIL-004

## Parallelizable
NO

---

## Purpose
Create the authenticated Gmail API client wrapper — the low-level interface to googleapis. This module initializes the Gmail API instance using the OAuth client from GMAIL-001.

## Current State
OAuth module exists (GMAIL-001). No Gmail client code.

## Required Change
Create `email/services/gmail/client.js` that:
1. Takes an authenticated OAuth2 client
2. Returns an initialized `gmail` API instance (`google.gmail({ version: 'v1', auth })`)
3. Provides a factory function for creating/getting the client

## Scope
- Create `email/services/gmail/client.js`

## Out of Scope
- Do NOT implement search/read/send operations (GMAIL-004)
- Do NOT implement message parsing (GMAIL-003)

## Expected Files / Modules
**Created:**
- `email/services/gmail/client.js`
**Tests:**
- `test/email/unit/gmail/client.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
export function createGmailClient(authClient)
// authClient: authenticated OAuth2 client from authorize()
// Returns: gmail API instance (google.gmail({ version: 'v1', auth }))

export function getGmailClient()
// Returns: singleton gmail client (throws if not initialized)

export function initializeGmailClient(options = {})
// Combines authorize() + createGmailClient()
// Returns: gmail API instance
```

## Tests Required
1. `createGmailClient` returns object with `users` property
2. `getGmailClient` throws if not initialized
3. `initializeGmailClient` calls authorize and creates client

## Acceptance Criteria
1. Client wraps googleapis correctly
2. Factory pattern works
3. All tests pass

## Definition of Ready
- GMAIL-001 complete

## Definition of Done
- Client module created, tests pass, checkpoint updated
- Commit: `feat(email): GMAIL-002 — add Gmail API client`

## Next Tickets
Unlocks: GMAIL-003, GMAIL-004

---

## AI Implementation Guardrail
```
You are implementing ONLY GMAIL-002.
1. Read docs/05-GMAIL-INTEGRATION.md §1.
2. Read CURRENT-CHECKPOINT.md.
3. Create ONLY the Gmail client wrapper.
4. Write tests. Run tests.
5. Update CURRENT-CHECKPOINT.md. Stop.
```
