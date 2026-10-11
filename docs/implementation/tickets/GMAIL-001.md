# GMAIL-001 — OAuth Setup & Scopes

---

## Ticket ID
`GMAIL-001`

## Title
OAuth Setup & Scopes

## Level
Level 5

## Priority
P0

## Risk
MEDIUM

## Depends On
FOUND-001

## Blocks
GMAIL-002

## Parallelizable
YES (with TIME track)

---

## Purpose
Implement Google OAuth 2.0 Desktop credential flow for Gmail API access. Install `googleapis` and `@google-cloud/local-auth`. Define narrow scopes. Handle token persistence, refresh, and revocation.

## Current State
No Gmail dependencies. No OAuth code. `credentials/` directory exists with `.gitkeep`.

## Required Change
1. Install `googleapis` and `@google-cloud/local-auth`
2. Create OAuth flow: load client secrets → authorize → store token
3. Define scopes (`gmail.readonly` + `gmail.compose`)
4. Token persistence in `credentials/token.json`
5. Auto-refresh on token expiry
6. Error handling for revoked tokens

## Scope
- Install dependencies
- Create `email/auth/gmail/oauth.js`
- Create `email/auth/gmail/scopes.js`

## Out of Scope
- Do NOT create GmailService (GMAIL-004)
- Do NOT create Gmail client initialization (GMAIL-002)
- Do NOT test against real Gmail (use mocks for automated tests; document manual verification steps)

## Expected Files / Modules
**Modified:**
- `package.json` — add `googleapis`, `@google-cloud/local-auth`

**Created:**
- `email/auth/gmail/oauth.js`
- `email/auth/gmail/scopes.js`

**Tests:**
- `test/email/unit/gmail/scopes.test.js`
- `test/email/unit/gmail/oauth.test.js` (mocked)

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/graph/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
// email/auth/gmail/scopes.js
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

// email/auth/gmail/oauth.js
export async function authorize(options = {})
// options: { credentialsPath?, tokenPath?, forceReauth? }
// Returns: authenticated google.auth.OAuth2 client
// Side effect: stores/refreshes token at tokenPath

export async function isAuthenticated(options = {})
// Returns: boolean (checks if valid token exists)

export async function revokeAuth(options = {})
// Deletes stored token, requiring re-authorization
```

## Security
- Credentials NEVER committed to git (`.gitignore` verified in FOUND-001)
- Use narrowest scopes possible
- Token stored locally in `credentials/token.json`

## Failure Cases
- `credentials/google-oauth.json` missing → clear error message with setup instructions
- Token expired → auto-refresh via refresh token
- Refresh token revoked → report error, prompt re-authorization
- Network unavailable during OAuth flow → report error

## Tests Required
1. `GMAIL_SCOPES` contains exactly `gmail.readonly` and `gmail.compose`
2. `GMAIL_SCOPES` does NOT contain `https://mail.google.com/`
3. `authorize` throws descriptive error when credentials file missing
4. `isAuthenticated` returns false when no token exists
5. Token path defaults to `credentials/token.json`

## Acceptance Criteria
1. `googleapis` and `@google-cloud/local-auth` installed
2. `GMAIL_SCOPES` has exactly 2 narrow scopes
3. `authorize()` function exists with credential/token path handling
4. Missing credentials file produces actionable error message
5. All tests pass

## Definition of Ready
- FOUND-001 complete

## Definition of Done
- Dependencies installed
- OAuth module created
- Scope definitions created
- Tests pass
- Manual verification steps documented
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): GMAIL-001 — add OAuth 2.0 flow and scopes`

## Checkpoint
Record: Gmail dependencies installed. OAuth module created. Scopes verified narrow. Note any compilation issues.

## Next Tickets
Unlocks: GMAIL-002

---

## AI Implementation Guardrail
```
You are implementing ONLY GMAIL-001.
1. Read docs/05-GMAIL-INTEGRATION.md §2, §3, §9.
2. Read CURRENT-CHECKPOINT.md.
3. Install dependencies. Create OAuth + scopes modules.
4. Write tests. Run tests.
5. Update CURRENT-CHECKPOINT.md. Stop.

Do NOT create GmailService.
Do NOT create Gmail client.
Do NOT create message parser.
```
