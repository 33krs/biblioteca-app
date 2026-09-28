# Phase 4 — Upload hardening and observability

## Objective

Secure cover uploads and make production failures traceable without logging sensitive data.

## Problem and Why

The current cover upload trusts the original filename extension, uses predictable time/random names, and lacks explicit content-signature validation or structured request correlation. Phase 4 closes those security and operability gaps.

## Authorized Scope

- Backend upload validation, cleanup, secure serving, structured error handling, frontend recovery UX, tests, and documentation.
- No remote deployment, credential changes, or production secrets.

## Constraints

- Accept only JPEG, PNG, and WebP up to 5 MiB after inspecting file signatures.
- Generate UUID names and server-controlled extensions.
- Remove rejected or unauthorized temporary uploads.
- Serve uploads with nosniff.
- Add request IDs, structured safe logs, and JSON errors with requestId.
- Never log bodies, credentials, cookies, tokens, or private links.
- Conventional commits only; no Co-Authored-By.
+ TDD mode: strict, explicitly authorized by the user. Test runners: npm run test:backend and npm run test:frontend; record observed RED/GREEN/REFACTOR evidence.
- Delivery strategy: ask-on-risk. Forecast: ~350 authored changed lines; one PR slice expected.

## Acceptance Criteria

- Invalid signatures, oversize files, and unsupported types are rejected without orphan files.
- Stored cover names are UUID based with controlled extensions.
- Errors are JSON, carry requestId, and can be correlated with safe backend logs.
- Frontend presents useful errors and retry actions.
- Applicable quality checks are recorded honestly.

## Tasks

- [x] P4-01 — Harden cover upload validation, storage, cleanup, and serving headers.
  - Route: delegated direct.
  - Trigger evidence: upload route, storage handling, app static serving, and tests span 4+ files.
  - Checks: strict TDD RED/GREEN/REFACTOR observed; `npm run test:backend` passed (74 tests); backend typecheck/build passed.
- [x] P4-02 — Add request correlation, safe structured logs, and normalized backend errors.
  - Route: delegated direct.
  - Trigger evidence: middleware, app wiring, route error paths, and tests are non-trivial files.
  - Checks: strict TDD RED/GREEN/REFACTOR observed; focused observability tests passed (3 tests); `npm run test:backend` passed (77 tests); lint, backend typecheck/build, and `git diff --check` passed.
- [ ] P4-03 — Surface recoverable errors and retries in the frontend; document and verify.
  - Route: delegated direct.
  - Trigger evidence: API client, store/components, tests, and docs are non-trivial files.
  - Checks: TDD mode resolution; frontend tests; npm run quality; review assessment.

## Progress and Evidence

- Branch created from refreshed origin/main at 6aeb34e.
- Local .atl/ and .codegraph/ are untracked artifacts and excluded.
- Delegated Phase 4 architecture mapping completed: uploads are written before authorization, trust filename extensions, use predictable names, lack nosniff, and leave error correlation/retry gaps.
- Product decision accepted: delete the prior custom cover file after a replacement succeeds, because it belongs to one UserBook and prevents orphan accumulation.
- P4-01 implementation completed locally: signature validation, 5 MiB limit, UUID/server-controlled filenames, in-memory uploads, cleanup on rejection/authorization/database failure, replacement deletion after success, and `nosniff` serving headers.
- Fixed a discovered schema mismatch: `customCoverUrl` now accepts server-relative `/uploads/<safe-filename>` URLs; previously Zod accepted only absolute URLs, so replacement cleanup silently had no prior URL to remove.
- TDD evidence: RED observed with the replacement-cleanup test failing; GREEN observed with 74 backend tests passing (12 files); REFACTOR completed by extracting the bounded custom-cover URL schema.
- Verification: `npm run typecheck:backend` passed; `npm run build:backend` passed; `git diff --check` passed.
- PostgreSQL test database was started in local Docker using ephemeral test credentials; no project secret files were changed.
- Commit identity: `4d09fab` (`feat(uploads): harden cover file handling`).
- Review assessment: native assessment classified the committed range as high risk but could not proceed because the negotiated read-only review status failed on the repository filesystem; review remains unavailable and no review authority was granted.
- P4-02 implementation completed locally: UUID request IDs are propagated via `X-Request-ID`, safe structured error/info logs omit query strings and error bodies, and JSON errors include stable codes plus `requestId`.
- TDD evidence: RED observed with 3 failing observability tests; GREEN observed with 3 focused tests and 77 backend tests passing; REFACTOR completed by centralizing request IDs and error responses.
- A lint failure from unused caught upstream errors was corrected by using bindingless `catch` blocks; final `npm run lint` passed.
- P4-02 work-unit commit identity: `16c7cac` (`feat(observability): correlate backend errors`).

## Next Step

Review and commit P4-02 as one work unit, then establish RED for P4-03 frontend recovery and retry UX.
