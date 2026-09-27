# Phase 3 — Resend password reset

## Objective

Deliver password-reset emails through Resend in production while retaining a safe local development adapter and preserving neutral account-recovery responses.

## Problem and Why

The existing mailer logs password-reset links to the server console. That is acceptable only for local development; production needs an external provider, startup validation, and secret-safe operational logging.

## Authorized Scope

- Backend mail adapter, startup configuration, environment examples, tests, and documentation.
- No frontend behavior change unless verification exposes a required compatibility issue.
- No production secret values in the repository.

## Constraints

- Use Resend behind the existing mailer boundary.
- In production, require RESEND_API_KEY and MAIL_FROM at startup and fail fast if missing.
- Development remains usable without Resend and must not log reset URLs/tokens in production.
- Preserve neutral forgot-password responses for known and unknown accounts.
- Provider failures log a request identifier but never secrets, reset URLs, or tokens.
- Commits use Conventional Commits only; no Co-Authored-By.
- TDD: strict, explicitly authorized by the user; test runner is npm run test:backend (Vitest). Record observed RED/GREEN/REFACTOR evidence before closing each task.
- Delivery strategy: ask-on-risk. Forecast: ~220 authored changed lines; one PR slice expected.

## Acceptance Criteria

- A production-configured Resend adapter submits a password-reset email containing the supplied reset URL.
- Production startup exits with a clear configuration error when either Resend variable is absent.
- Development retains a safe local adapter without requiring Resend credentials.
- Production logs do not contain reset tokens or links; provider failures include only safe correlation metadata.
- Forgot-password responses remain indistinguishable for existing and non-existing accounts.
- Relevant backend tests, typecheck, lint, build, and full quality checks are recorded honestly.

## Tasks

- [x] P3-01 — Define the mail adapter and production configuration validation with focused tests.
  - Route: delegated direct.
  - Trigger evidence: mailer and startup configuration are separate non-trivial files; mapping spans 4+ files.
  - Checks: observed RED/GREEN tests; backend typecheck and build.

* [x] P3-02 — Wire Resend delivery and safe error logging into the existing reset flow.
  - Route: delegated direct.
  - Trigger evidence: auth route plus mailer behavior are two non-trivial files.
  - Checks: observed RED/GREEN tests; verify neutral response and secret-free logs.

- [x] P3-03 — Document environment variables and verify the work unit.
  - Route: inline.
  - Trigger evidence: mechanical documentation/config example update.
  - Checks: npm run quality; review assessment after commit.

## Progress and Evidence

- Branch created from refreshed origin/main at e0e86be.
- origin/main was stale locally before fetch; .atl/ and .codegraph/ are untracked local artifacts and excluded.
- Exploration found an account-enumeration side channel: delivery failures currently yield HTTP 500 for an existing account but 200 for a missing account. P3-02 must make those outcomes publicly identical.
- Strict TDD enabled.
- P3-01 implementation is present in the mail adapter/config boundary with 5 focused tests passing under a temporary no-database Vitest config.
- Backend typecheck passed. The initial focused test attempt was blocked because Prisma globalSetup could not connect to PostgreSQL on localhost:5433; the later full quality run passed.

* P3-01 work-unit commit: 71b4aa1 (feat(mail): add Resend password reset adapter).
* P3-02 work-unit commit: 5ee743d (fix(auth): keep password reset responses neutral).

- Native review assessment was high-risk but unavailable: untracked local .atl/.codegraph artifacts required inventory, and the prescribed read-only status preflight failed safely because the filesystem was read-only.
- P3-02 implementation passed backend build and 11 focused Phase 3 tests (mail adapter, route neutrality, and startup validation) using a temporary no-database Vitest config; the temporary config was removed.

* The first focused route run required escalated local listener permission; the rerun passed.
* Full npm run quality subsequently passed: formatting, lint, both typechecks, 63 backend tests, 27 frontend tests, and both builds. PostgreSQL was available for this run.
* Strict TDD exception: the user explicitly authorized closing P3-01 with its initial RED blocked by Prisma P1001 before tests executed. The focused GREEN and full quality evidence passed; the exception is not retroactive RED evidence.
* P3-03 work-unit commit: d62f443 (docs(mail): document Resend production configuration).

## Next Step

Phase implementation is complete locally. Await explicit remote authorization for push and pull request creation.
