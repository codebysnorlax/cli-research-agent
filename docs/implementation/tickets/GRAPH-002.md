# GRAPH-002 — Agent Graph & Nodes

---

## Ticket ID
`GRAPH-002`

## Title
Agent Graph & Nodes

## Level
Level 8

## Priority
P0

## Risk
HIGH

## Depends On
GRAPH-001, TOOLS-001, TOOLS-002, TOOLS-003, TOOLS-004

## Blocks
GRAPH-003, GRAPH-004, INTEGRATION-001

## Parallelizable
NO — main graph

---

## Purpose
Create the main LangGraph agent graph per doc 07 §3. This is the orchestration layer that routes between understanding, research, drafting, and approval nodes. The LLM is bound to tools but CANNOT send emails directly.

## Scope
- Create `email/graph/agent/index.js` — main graph
- Create `email/graph/agent/nodes.js` — node definitions
- Create `email/graph/agent/prompts.js` — system prompts

## Critical Security Rules
1. **NO `email_send` tool** — the tool list MUST NOT include any send capability
2. System prompt MUST declare email content as **untrusted data**
3. Graph routes through approval before any side effect
4. LangGraph → Tools → Services → API (never direct)

## Interfaces / Contracts
```javascript
export function createEmailAgentGraph(options = {})
// options: { llm, tools, gmailService, db }
// Returns: compiled LangGraph StateGraph

// Nodes:
// - agentNode: LLM understands request, invokes read-side tools
// - draftingNode: LLM composes email draft
// - approvalNode: human-in-the-loop decision
// - persistNode: save to SQLite
```

## Tests Required
1. Graph compiles without error
2. Tool list does NOT contain `email_send`
3. System prompt includes "untrusted" declaration for email content
4. Graph routes through approval node
5. Graph state includes all fields from GRAPH-001

## Acceptance Criteria
1. Graph compiles and runs
2. NO send tool in LLM tool list — confirmed by audit
3. Email content marked untrusted in system prompt
4. All tests pass

## Definition of Done
- Agent graph created, tests pass, checkpoint updated
- Commit: `feat(email): GRAPH-002 — add agent graph and nodes`

---

## AI Implementation Guardrail
```
You are implementing ONLY GRAPH-002.
1. Read docs/07-LANGGRAPH-WORKFLOW.md (ALL), docs/03-APPROVAL-AND-SECURITY.md §6–§7, docs/12-ANTI-PATTERNS.md §1, §8.
2. AUDIT the tool list — NO email_send allowed.
3. Create graph + nodes + prompts. Write tests. Run tests. Update checkpoint. Stop.
```
