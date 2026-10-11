# TOOLS-001 — Email Search Tool

---

## Ticket ID
`TOOLS-001`

## Title
Email Search Tool

## Level
Level 6

## Priority
P0

## Risk
LOW

## Depends On
GMAIL-004

## Blocks
GRAPH-002

## Parallelizable
YES (with TOOLS-002, TOOLS-003, TOOLS-004)

---

## Purpose
Create the `email_search` LangChain tool that the LLM can invoke to search Gmail. Converts natural language queries into Gmail search syntax. Read-only, no side effects.

## Current State
GmailService exists with `search()` method. No LangChain tool wrapper.

## Required Change
Create `email/tools/search/index.js` per doc 07 §6.

## Scope
- Create `email/tools/search/index.js` — LangChain tool definition

## Out of Scope
- Do NOT create GmailService (already exists)
- Do NOT expose send capability

## Expected Files / Modules
**Created:**
- `email/tools/search/index.js`
**Tests:**
- `test/email/unit/tools/search.test.js`

## Forbidden Files / Modules
- `src/**`, `notion/**`, `email/db/**`, `email/scheduler/**`

## Interfaces / Contracts
```javascript
// LangChain tool definition
export const emailSearch = tool(
  async ({ query, maxResults }) => { /* calls GmailService.search() */ },
  {
    name: "email_search",
    description: "Search Gmail for emails matching a query. Returns: messageId, threadId, sender, recipient, subject, date, snippet, labels.",
    schema: z.object({
      query: z.string().describe("Gmail search query"),
      maxResults: z.number().optional().default(10).describe("Maximum results"),
    })
  }
);
```

## Tests Required
1. Tool has correct name `email_search`
2. Tool schema accepts query string
3. Tool returns structured search results
4. Error in GmailService doesn't crash (returns error message)

## Acceptance Criteria
1. Tool is a valid LangChain tool with schema
2. Read-only — no side effects
3. All tests pass

## Definition of Ready
- GMAIL-004 complete

## Definition of Done
- Tool created, tests pass, checkpoint updated
- Commit: `feat(email): TOOLS-001 — add email search tool`

## Next Tickets
Unlocks: GRAPH-002 (combined with other tools)

---

## AI Implementation Guardrail
```
You are implementing ONLY TOOLS-001.
1. Read docs/07-LANGGRAPH-WORKFLOW.md §6.
2. Create ONLY the search tool. Write tests. Run tests.
3. Update CURRENT-CHECKPOINT.md. Stop.
```
