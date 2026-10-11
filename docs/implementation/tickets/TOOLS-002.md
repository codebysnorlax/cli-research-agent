# TOOLS-002 — Email Read Tool

---

## Ticket ID
`TOOLS-002`

## Title
Email Read Tool

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
YES (with TOOLS-001, TOOLS-003, TOOLS-004)

---

## Purpose
Create `email_read` LangChain tool — fetches full message content by messageId. Read-only, no side effects. Size-limited for LLM context safety.

## Scope
- Create `email/tools/read/index.js`

## Interfaces / Contracts
```javascript
export const emailRead = tool(
  async ({ messageId }) => { /* calls GmailService.read() */ },
  {
    name: "email_read",
    description: "Read the full content of an email by its message ID.",
    schema: z.object({
      messageId: z.string().describe("Gmail message ID"),
    })
  }
);
```

## Tests Required
1. Tool has correct name `email_read`
2. Tool returns full message content
3. Large messages are truncated for context safety
4. Error handling returns message, not crash

## Acceptance Criteria
1. Tool is read-only, returns structured message
2. Content truncated at safe limit
3. All tests pass

## Definition of Done
- Tool created, tests pass, checkpoint updated
- Commit: `feat(email): TOOLS-002 — add email read tool`

## Next Tickets
Unlocks: GRAPH-002

---

## AI Implementation Guardrail
```
You are implementing ONLY TOOLS-002. Create only the read tool. Write tests. Run tests. Update checkpoint. Stop.
```
