# Phase 4 Review Advisory Follow-ups

## Objective

Resolve the non-blocking frontend recovery and backend reliability/diagnostic advisories from the approved Phase 4 native review.

## Problem and Why

The approved review left warnings for stale frontend retry state, unchecked API error metadata, post-commit cover cleanup failures, and insufficient diagnostics for unexpected backend errors. These can mislead users, replay completed actions, or make operational failures harder to diagnose.

## Authorized Scope

- Fix the four behavior areas represented by the seven advisory findings.
- Add focused regression tests and update this tracker with observed evidence.
- No remote operations, deployment, pull-request creation, or production secrets.

## Constraints

- Keep public error responses generic; logs must not contain request payloads, credentials, or sensitive exception messages/stacks.
- A failed deletion of an obsolete cover after the replacement is persisted must not turn the successful replacement into a 500 response.
- Validate untrusted error payload fields before exposing them in the UI.
- Conventional commits only; no Co-Authored-By.
- TDD mode: strict, previously explicitly authorized. RED must be observed before implementation, followed by GREEN and REFACTOR.
- Test runners: `npm run test:frontend` and `npm run test:backend`.
- Review mode: on (global); candidate-specific consent remains separate.
- Delivery strategy: `ask-on-risk`. Forecast: ~240 authored changed lines; one PR slice expected.

## Acceptance Criteria

- Successful library mutations clear stale global error and retry state; retries cannot replay a successful mutation through an obsolete control.
- API error payload parsing only accepts valid string metadata and safely falls back for malformed objects/arrays/primitive values.
- Cover replacement returns the committed updated item even if deleting the previous file fails; the cleanup failure is safely diagnosable.
- Unexpected backend failures retain useful sanitized classification in structured logs while clients receive only normalized public errors with request IDs.
- Focused tests and applicable full quality checks pass; each task has a Conventional Commit identity recorded below.

## Tasks

- [x] RA-01 — Clear frontend recovery state after successful mutations and validate API error payload fields.
  - Route: delegated direct.
  - Trigger evidence: API client, Zustand store, and their test files are non-trivial changes; mapping covered four files.
  - Checks: strict TDD RED (5 focused failures reported by delegated writer; raw transcript not retained), GREEN, and REFACTOR; `npm run test:frontend` passed (7 files, 33 tests); `npm run typecheck:frontend` and `npm run build:frontend` passed; `git diff --check` passed.
  - Work-unit commit identity: `5c50a4d` (`fix(frontend): clear stale recovery state`).
  - Native RDD assessment: medium, reason `executable_change`; outcome `under budget` (171 authored lines). Review deferred within the slice; continue to assess subsequent commits against this reviewed boundary.
- [x] RA-02 — Treat obsolete-cover cleanup as recoverable after a committed replacement.
  - Route: delegated direct.
  - Trigger evidence: upload route and backend shelf tests are non-trivial changes.
  - Checks: delegated RED observed (`500` instead of expected `200`); GREEN and REFACTOR; `npm run test:backend` passed (13 files, 79 tests); `npm run typecheck:backend`, `npm run build:backend`, and `git diff --check` passed. Initial sandbox access to PostgreSQL was denied; rerun with approved local DB access passed.
  - Work-unit commit identity: `27ecfdf` (`fix(uploads): tolerate obsolete cover cleanup failure`).
  - Native RDD assessment: medium, reason `executable_change`; outcome `under budget` (212 authored lines cumulative from base `5e864cd`). Review deferred within the slice; last reviewed boundary remains `5e864cd`.
- [x] RA-03 — Preserve safe diagnostics for unexpected backend errors.
  - Route: delegated direct.
  - Trigger evidence: error middleware and observability tests are non-trivial changes.
  - Checks: delegated RED observed (1 failing assertion: missing `errorType`); GREEN and REFACTOR; final `npm run quality` passed: format, lint, both typechecks, 80 backend tests, 33 frontend tests, and both builds. An initial quality run found Prettier drift in `apps/frontend/src/lib/api.ts`; normalized and reran successfully.
  - Work-unit commit identity: `6af52c6` (`fix(observability): log sanitized error classification`).
  - Native RDD assessment: medium, reason `executable_change`; outcome `under budget` (274 authored lines cumulative from base `5e864cd`). No review was due; the reviewed boundary remains `5e864cd`.

## Progress and Evidence

- Parent branch at start: `feat/upload-hardening-observability`, local HEAD `5e864cd`; user reported the PR was merged. No remote fetch was performed, so the merge was not independently verified.
- New local branch: `fix/phase4-review-advisories`.
- Local `.atl/` and `.codegraph/` artifacts remain untracked and must not be included.
- Read-only mapping completed with CodeGraph and a delegated explorer. Seven warnings group into four behavior areas: duplicate stale-retry findings, API payload validation, duplicate post-commit cleanup findings, and generic error diagnostics.
- RA-01 through RA-03 are implemented and verified locally. The final full quality run passed; no remote operations were performed.

## Next Step

All three tasks are complete and verified. The local branch is ready for delivery if separately authorized; this work did not push or create a pull request.
