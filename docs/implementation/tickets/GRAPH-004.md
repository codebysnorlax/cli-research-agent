# GRAPH-004 — Drafting Subgraph

---

## Ticket ID
`GRAPH-004`

## Title
Drafting Subgraph

## Level
Level 8

## Priority
P1

## Risk
MEDIUM

## Depends On
GRAPH-002

## Blocks
None (enhancement)

## Parallelizable
YES (with GRAPH-003)

---

## Purpose
Create drafting subgraph per doc 07 §7 — takes user intent + research context and produces a structured email draft. Handles tone, style, formality. Distinguishes NEW_EMAIL vs REPLY with correct threading metadata.

## Scope
- Create `email/graph/drafting/index.js`
- Create `email/graph/drafting/prompts.js`

## Interfaces / Contracts
```javascript
export function createDraftingSubgraph(options = {})
// Returns: compiled subgraph that produces structured draft
```

## Tests Required
1. Subgraph compiles
2. Produces structured draft with all required fields
3. NEW_EMAIL drafts have no threadId
4. REPLY drafts include threadId and replyToMessageId

## Acceptance Criteria
1. Subgraph integrates with main graph
2. Draft structure matches tool schema
3. All tests pass

## Definition of Done
- Drafting subgraph created, tests pass, checkpoint updated
- Commit: `feat(email): GRAPH-004 — add drafting subgraph`

---

## AI Implementation Guardrail
```
You are implementing ONLY GRAPH-004. Create drafting subgraph. Write tests. Run tests. Update checkpoint. Stop.
```
