# FOUND-002 — Test Framework Setup

---

## Ticket ID
`FOUND-002`

## Title
Test Framework Setup

## Level
Level 0

## Priority
P0

## Risk
LOW

## Depends On
None

## Blocks
All subsequent tickets (every ticket requires tests)

## Parallelizable
YES (with FOUND-001)

---

## Purpose
Configure a test framework so that every subsequent ticket can include automated tests. The project currently has no test infrastructure — the `test` script in `package.json` is a no-op placeholder.

## Current State
- `package.json` → `"test": "echo \"Error: no test specified\" && exit 1"`
- `test/` directory contains 3 ad-hoc debug scripts (not real tests)
- No test framework dependency installed

## Required Change
1. Configure Node.js built-in test runner (zero additional dependencies)
2. Update `package.json` test script to run email agent tests
3. Create test directory structure for email agent tests
4. Create a smoke test that proves the framework works
5. Preserve existing test files (do not delete them)

## Scope
- Update `package.json` test scripts
- Create `test/email/` directory structure
- Create one smoke test file
- Verify test runner works

## Out of Scope
- Do NOT write application code
- Do NOT install test framework packages (use Node.js built-in)
- Do NOT delete existing test files
- Do NOT write tests for code that doesn't exist yet

## Expected Files / Modules
**Modified:**
- `package.json` — update `"test"` script

**Created:**
- `test/email/unit/smoke.test.js` — framework smoke test
- `test/email/` directory tree (matching test strategy structure)

## Forbidden Files / Modules
- `src/**` — do not modify
- `notion/**` — do not modify
- `email/**` — do not modify (not creating implementation yet)

## Interfaces / Contracts
Test script convention:
```json
{
  "test": "node --test test/email/",
  "test:unit": "node --test test/email/unit/",
  "test:integration": "node --test test/email/integration/",
  "test:failure": "node --test test/email/failure/"
}
```

## Data Changes
None.

## Behavior
Running `npm test` should execute the smoke test and report pass/fail.

## Security
None.

## Failure Cases
- Node.js version doesn't support `node:test` (requires Node 18+) → document minimum version
- Test runner doesn't find files → verify glob pattern

## Edge Cases
- Existing test files in `test/` should not interfere (they are not in `test/email/`)

## Tests Required
1. Smoke test: `test/email/unit/smoke.test.js`
   - `describe("Test Framework Smoke Test")` with at least one passing assertion
   - Verifies `node:test` and `node:assert` work correctly with ESM

## Acceptance Criteria
1. `npm test` runs and produces output showing test results
2. Smoke test passes
3. Existing test files are not deleted or modified
4. Test directory structure `test/email/{unit,integration,failure,e2e}/` exists
5. Package.json has `test`, `test:unit`, `test:integration`, `test:failure` scripts

## Definition of Ready
- Node.js 18+ is available (project requires 20+, so this is guaranteed)

## Definition of Done
- `npm test` runs successfully
- Smoke test passes
- Test directory structure created
- Package.json updated
- CURRENT-CHECKPOINT.md updated
- Commit: `feat(email): FOUND-002 — configure test framework`

## Checkpoint
Record: Test framework type, test scripts, smoke test result, Node.js version confirmed.

## Next Tickets
Unlocks: DOMAIN-001 (combined with FOUND-001)

---

## AI Implementation Guardrail

```
You are implementing ONLY FOUND-002.

1. Read docs/implementation/CURRENT-CHECKPOINT.md.
2. Verify Node.js version supports node:test.
3. Create test/email/ directory structure.
4. Create smoke test file.
5. Update package.json test scripts.
6. Run npm test and verify pass.
7. Update CURRENT-CHECKPOINT.md.
8. Stop.

Do NOT create application code.
Do NOT install packages.
Do NOT modify existing test files.
```
