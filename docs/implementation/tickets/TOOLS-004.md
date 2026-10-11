# TOOLS-004 — Email Draft Tool

---

## Ticket ID
`TOOLS-004`

## Title
Email Draft Tool

## Level
Level 6

## Priority
P0

## Risk
LOW

## Depends On
GMAIL-004, DOMAIN-001

## Blocks
APPROVAL-001, GRAPH-002

## Parallelizable
YES (with TOOLS-001–003)

---

## Purpose
Create `email_create_draft` tool — the LLM proposes an email for human review. This tool **creates an internal draft** but does NOT send. It returns a structured draft for the approval workflow.

⚠️ **There is NO `email_send` tool.** The LLM cannot send directly.

## Scope
- Create `email/tools/draft/index.js`

## Interfaces / Contracts
```javascript
export const emailCreateDraft = tool(
  async ({ to, cc, bcc, subject, body, type, threadId, replyToMessageId }) => {
    // Returns structured draft for review — does NOT send
  },
  {
    name: "email_create_draft",
    description: "Propose an email draft for human review. Does NOT send the email.",
    schema: z.object({
      to: z.array(z.string()).describe("Recipient email addresses"),
      cc: z.array(z.string()).optional().describe("CC recipients"),
      bcc: z.array(z.string()).optional().describe("BCC recipients"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body"),
      type: z.enum(["NEW_EMAIL", "REPLY"]).describe("Email type"),
      threadId: z.string().optional().describe("Gmail thread ID for replies"),
      replyToMessageId: z.string().optional().describe("Message ID being replied to"),
    })
  }
);
```

## Security
- This tool **proposes** — it does NOT send
- No `email_send` tool exists
- Draft must pass through approval workflow before any send

## Tests Required
1. Tool has correct name `email_create_draft`
2. Tool returns structured draft with all fields
3. Draft includes type (NEW_EMAIL or REPLY)
4. Reply draft includes threadId
5. No email is sent by this tool

## Acceptance Criteria
1. Tool proposes draft, does not send
2. Schema validates all required fields
3. All tests pass

## Definition of Done
- Tool created, tests pass, checkpoint updated
- Commit: `feat(email): TOOLS-004 — add email draft tool`

---

## AI Implementation Guardrail
```
You are implementing ONLY TOOLS-004. Create ONLY the draft tool. It must NOT send.
Write tests. Run tests. Update checkpoint. Stop.
```
