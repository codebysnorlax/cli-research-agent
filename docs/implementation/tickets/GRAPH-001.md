# GRAPH-001 — Graph State Schema

---

## Ticket ID
`GRAPH-001`

## Title
Graph State Schema

## Level
Level 8

## Priority
P0

## Risk
LOW

## Depends On
DOMAIN-001

## Blocks
GRAPH-002

## Parallelizable
NO

---

## Purpose
Define the LangGraph state schema using Zod validation, per doc 07 §4. This is the shape of data flowing through the agent conversation graph.

## Scope
- Create `email/graph/agent/state.js`

## Interfaces / Contracts
```javascript
// Zod-validated state schema for LangGraph annotation
export const EmailAgentState = {
  messages:           Annotation({ reducer: messagesStateReducer }),
  userRequest:        Annotation({ reducer: (_, v) => v, default: () => "" }),
  searchResults:      Annotation({ reducer: (_, v) => v, default: () => [] }),
  readMessages:       Annotation({ reducer: (_, v) => v, default: () => [] }),
  threadMessages:     Annotation({ reducer: (_, v) => v, default: () => [] }),
  researchSummary:    Annotation({ reducer: (_, v) => v, default: () => "" }),
  draft:              Annotation({ reducer: (_, v) => v, default: () => null }),
  userDecision:       Annotation({ reducer: (_, v) => v, default: () => null }),
  scheduleInput:      Annotation({ reducer: (_, v) => v, default: () => null }),
  resolvedDatetime:   Annotation({ reducer: (_, v) => v, default: () => null }),
  resolvedTimezone:   Annotation({ reducer: (_, v) => v, default: () => null }),
  scheduleConfirmed:  Annotation({ reducer: (_, v) => v, default: () => false }),
  jobId:              Annotation({ reducer: (_, v) => v, default: () => null }),
  finalStatus:        Annotation({ reducer: (_, v) => v, default: () => null }),
};
```

## Tests Required
1. State schema defines all fields from doc 07 §4
2. Default values are correct
3. Messages field uses LangGraph message reducer

## Acceptance Criteria
1. Schema matches doc 07 §4 exactly
2. Compatible with LangGraph StateGraph
3. All tests pass

## Definition of Done
- State schema created, tests pass, checkpoint updated
- Commit: `feat(email): GRAPH-001 — add graph state schema`

---

## AI Implementation Guardrail
```
You are implementing ONLY GRAPH-001.
1. Read docs/07-LANGGRAPH-WORKFLOW.md §4.
2. Research current @langchain/langgraph API for StateGraph annotation.
3. Create ONLY the state schema. Write tests. Run tests. Update checkpoint. Stop.
```
