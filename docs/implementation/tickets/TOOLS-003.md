# TOOLS-003 — Email Thread Tool

---

## Ticket ID
`TOOLS-003`

## Title
Email Thread Tool

## Level
Level 6

## Priority
P1

## Risk
LOW

## Depends On
GMAIL-005

## Blocks
GRAPH-002

## Parallelizable
YES (with TOOLS-001, TOOLS-002, TOOLS-004)

---

## Purpose
Create `email_thread` tool — fetches conversation thread. Handles long threads via pagination and incremental summarization markers. Read-only. Preserves threadId for replies.

## Scope
- Create `email/tools/thread/index.js`

## Interfaces / Contracts
```javascript
export const emailThread = tool(
  async ({ threadId, maxMessages }) => { /* calls GmailService.thread() */ },
  {
    name: "email_thread",
    description: "Fetch a conversation thread. Returns messages in order with sender, date, and content.",
    schema: z.object({
      threadId: z.string().describe("Gmail thread ID"),
      maxMessages: z.number().optional().default(20).describe("Max messages to retrieve"),
    })
  }
);
```

## Tests Required
1. Tool returns thread messages in order
2. Long threads limited to maxMessages
3. Each message includes sender, date, content
4. threadId preserved for reply use

## Acceptance Criteria
1. Read-only, handles long threads safely
2. All tests pass

## Definition of Done
- Tool created, tests pass, checkpoint updated
- Commit: `feat(email): TOOLS-003 — add email thread tool`

---

## AI Implementation Guardrail
```
You are implementing ONLY TOOLS-003. Create only the thread tool. Write tests. Run tests. Update checkpoint. Stop.
```
