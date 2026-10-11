# GRAPH-003 — Research Subgraph

---

## Ticket ID
`GRAPH-003`

## Title
Research Subgraph

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
YES (with GRAPH-004)

---

## Purpose
Create research subgraph per doc 07 §7 — invoked when the agent needs deeper email context. Reads multiple emails/threads, summarizes, and produces `researchSummary` for the drafting node. Handles long threads via incremental summarization.

## Scope
- Create `email/graph/research/index.js`
- Create `email/graph/research/prompts.js`

## Interfaces / Contracts
```javascript
export function createResearchSubgraph(options = {})
// Returns: compiled subgraph that produces researchSummary
```

## Tests Required
1. Subgraph compiles
2. Produces researchSummary from search/read results
3. Long threads handled (not all 500 messages sent to LLM)

## Acceptance Criteria
1. Subgraph integrates with main graph
2. Summarization works for multi-message context
3. All tests pass

## Definition of Done
- Research subgraph created, tests pass, checkpoint updated
- Commit: `feat(email): GRAPH-003 — add research subgraph`

---

## AI Implementation Guardrail
```
You are implementing ONLY GRAPH-003. Create research subgraph. Write tests. Run tests. Update checkpoint. Stop.
```
