# RECOVERY-001 — Failure Scenario Tests

---

## Ticket ID
`RECOVERY-001`

## Title
Failure Scenario Tests

## Level
Level 11

## Priority
P0

## Risk
HIGH

## Depends On
INTEGRATION-001

## Blocks
FINAL-001

## Parallelizable
NO — requires full system

---

## Purpose
Deliberately break the system and verify it survives. Test all 20 failure scenarios from doc 10-FAILURE-SCENARIOS.md. This phase is about **confidence, not features**.

## Current State
Full system is integrated (INTEGRATION-001). No failure scenario tests exist.

## Required Change
Create test suite covering all 20 documented failure scenarios. Each scenario must:
1. Reproduce the exact failure condition
2. Verify the system behaves as documented
3. Check the event log for correct audit trail
4. Confirm database consistency after recovery

## Scope
- Create `test/email/failure/scenarios/` test files

## Out of Scope
- Do NOT add new features
- Do NOT change system behavior
- Do NOT modify architecture

## Expected Files / Modules
**Created:**
- `test/email/failure/scenarios/persistence.test.js` — Scenarios 1, 12
- `test/email/failure/scenarios/delivery.test.js` — Scenarios 2, 3, 15
- `test/email/failure/scenarios/concurrency.test.js` — Scenarios 4, 13, 14
- `test/email/failure/scenarios/timing.test.js` — Scenarios 5, 6, 17
- `test/email/failure/scenarios/auth.test.js` — Scenarios 7, 8
- `test/email/failure/scenarios/validation.test.js` — Scenarios 9, 10, 11, 16
- `test/email/failure/scenarios/security.test.js` — Scenario 18
- `test/email/failure/scenarios/resource.test.js` — Scenarios 19, 20

## Forbidden Files / Modules
- Do NOT modify any implementation files

## Scenario → Test Map

| # | Scenario | Severity | Test File | Key Assertion |
|---|---|---|---|---|
| 1 | Crash during scheduling | 🔴 | persistence | Transaction rollback or completion — deterministic |
| 2 | Crash while sending | 🔴 | delivery | GMAIL_SUBMITTED event logged before API call |
| 3 | Gmail accepted, response lost | 🔴 | delivery | At-most-once claim; audit trail exists |
| 4 | Scheduler runs twice | 🔴 | concurrency | Only one `claimJob` returns true |
| 5 | Computer sleeps | 🟡 | timing | Grace period applied on wake |
| 6 | System clock changes | 🟡 | timing | Re-evaluates based on current time |
| 7 | OAuth token expires | 🟡 | auth | Auto-refresh works |
| 8 | OAuth revoked | 🟡 | auth | Graceful failure, no send |
| 9 | Recipient typo | 🟡 | validation | Permanent failure, no retry |
| 10 | LLM hallucinates recipient | 🔴 | validation | Draft shows address for review |
| 11 | Multiple matching contacts | 🟡 | validation | Requires clarification |
| 12 | User edits after approval | 🔴 | persistence | Hash mismatch blocks send |
| 13 | Cancel vs processing race | 🟡 | concurrency | Deterministic winner via atomic SQL |
| 14 | Duplicate scheduler startup | 🟡 | concurrency | Safe via atomic claiming |
| 15 | Network dies at send time | 🟡 | delivery | Classified transient, retry scheduled |
| 16 | LLM gives invalid schedule | 🟢 | validation | Validation rejects before SQLite |
| 17 | Timezone mismatch | 🟡 | timing | Explicit timezone, never system default |
| 18 | Email injection | 🔴 | security | Content treated as untrusted |
| 19 | Huge email (30 MB) | 🟢 | resource | Truncated, no context window crash |
| 20 | Very long thread (500 msgs) | 🟢 | resource | Paginated, not all sent to LLM |

## Tests Required
All 20 scenarios with:
1. Failure condition reproduced
2. System behavior matches "Required behavior" from doc 10
3. Event log has correct audit trail
4. Database in consistent state after recovery

**Priority order:** 🔴 Critical first, then 🟡 High, then 🟢 Medium.

## Acceptance Criteria
1. All 20 failure scenarios have corresponding tests
2. All 🔴 Critical scenarios pass
3. All 🟡 High scenarios pass
4. All 🟢 Medium scenarios pass
5. No test reveals an unhandled failure mode
6. Event log verifiable for every scenario

## Definition of Ready
- INTEGRATION-001 complete (full system available)

## Definition of Done
- All 20 scenario tests created and pass
- No unhandled failure modes discovered
- CURRENT-CHECKPOINT.md updated
- Commit: `test(email): RECOVERY-001 — add failure scenario tests`

## Checkpoint
Record: All 20 scenarios tested. List pass/fail for each. Document any new failure modes discovered.

## Next Tickets
Unlocks: FINAL-001

---

## AI Implementation Guardrail
```
You are implementing ONLY RECOVERY-001.
1. Read docs/10-FAILURE-SCENARIOS.md (ALL 20 scenarios).
2. Read CURRENT-CHECKPOINT.md — verify INTEGRATION-001 is complete.
3. Create test files for ALL scenarios. Start with 🔴 Critical.
4. Do NOT modify implementation code — only add tests.
5. Run tests. Report results for each scenario.
6. Update CURRENT-CHECKPOINT.md. Stop.
```
