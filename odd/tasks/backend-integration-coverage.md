# Feature: backend-integration-coverage

## Objective

Validate and prepare the backend integration-coverage change for delivery.

## Problem

The branch contains the integration-coverage commit, but local quality checks are blocked by a permissions error in `node_modules/.bin/prettier`, and the working tree contains uncommitted dependency/formatting changes that must be classified.

## Why

The change should be delivered only with reproducible local verification and a reviewable work-unit commit.

## Scope

- Diagnose and repair the local dependency execution problem without changing application behavior.
- Run the applicable quality checks, including backend/frontend tests and build.
- Classify unrelated generated or line-ending-only changes.
- Commit only the coherent work unit using a Conventional Commit.

## Constraints

- Do not add AI attribution to commits.
- Keep tests with the behavior they verify.
- Do not discard user work without evidence.
- Delivery strategy: `ask-on-risk` (forecast is below the chained-PR threshold).
- Route: direct inline; the work is already mapped and no delegated writer is available in this runtime.

## Tasks

- [ ] T1 — Diagnose dependency permissions and working-tree changes.
- [ ] T2 — Restore executable dependency tooling and run the full quality suite.
- [ ] T3 — Clean/classify incidental changes, commit the verified work unit, and record evidence.

## Acceptance Criteria

- `npm run quality` completes successfully, or every failed/skipped check is recorded with its cause.
- The final diff contains only intentional changes for backend integration coverage and required supporting files.
- A Conventional Commit is created on the feature branch.

## Verification

- `npm run quality`
- `git diff --check`
- `git status --short --branch`

## Progress

- T1: complete — `node_modules/.bin/prettier` and its target lacked executable bits; the tracked-file diffs were CRLF-only and `.atl/`/`.codegraph/` are local generated artifacts.
- T2: partial — formatting, lint, typecheck, frontend tests, and build pass; backend tests are blocked because PostgreSQL is unavailable at `localhost:5433`.
- T3: in progress — the frontend Vitest storage setup fix is ready to commit; generated artifacts remain untracked and excluded.

## Verification Evidence

- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test:frontend` — passed: 6 files, 27 tests.
- `npm run build` — passed: backend TypeScript build and frontend Vite build.
- `npm run test:backend` — blocked: Prisma `P1001`, cannot reach PostgreSQL at `localhost:5433`.

## Next Step

Commit the test-environment fix and task evidence; rerun backend tests when PostgreSQL is available.
