# APPROVAL-001 — Draft Display

---

## Ticket ID
`APPROVAL-001`

## Title
Draft Display

## Level
Level 7

## Priority
P0

## Risk
LOW

## Depends On
TOOLS-004

## Blocks
APPROVAL-002

## Parallelizable
NO

---

## Purpose
Create terminal draft renderer — displays the composed email to the user for review before the approval decision. Shows To, CC, BCC, Subject, Body, and Type clearly formatted.

## Scope
- Create `email/graph/approval/display.js`

## Interfaces / Contracts
```javascript
export function formatDraftForDisplay(draft)
// Returns: formatted string showing:
// ─── EMAIL DRAFT ────────────
// To:      recipient@example.com
// CC:      (none)
// BCC:     (none)
// Subject: API Update
// Type:    NEW_EMAIL
// ─────────────────────────────
// Body:
//   (email body here)
// ─────────────────────────────
// [S]end  [R]eject  [T]imer

export function displayDraftToTerminal(draft)
// Side effect: prints formatted draft to terminal using chalk
```

## Tests Required
1. All fields displayed when present
2. Missing optional fields shown as "(none)"
3. Body content preserved (no truncation in display)
4. Decision options [S]end [R]eject [T]imer shown

## Acceptance Criteria
1. Draft renders cleanly in terminal
2. All fields visible for human review
3. All tests pass

## Definition of Done
- Display module created, tests pass, checkpoint updated
- Commit: `feat(email): APPROVAL-001 — add draft display`

---

## AI Implementation Guardrail
```
You are implementing ONLY APPROVAL-001. Create ONLY the display module. Write tests. Run tests. Update checkpoint. Stop.
```
