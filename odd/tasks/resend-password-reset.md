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
- [ ] P3-02 — Wire Resend delivery and safe error logging into the existing reset flow.
  - Route: delegated direct.
  - Trigger evidence: auth route plus mailer behavior are two non-trivial files.
  - Checks: observed RED/GREEN tests; verify neutral response and secret-free logs.
- [ ] P3-03 — Document environment variables and verify the work unit.
  - Route: inline.
  - Trigger evidence: mechanical documentation/config example update.
  - Checks: npm run quality; review assessment after commit.

## Progress and Evidence
- Branch created from refreshed origin/main at e0e86be.
- origin/main was stale locally before fetch; .atl/ and .codegraph/ are untracked local artifacts and excluded.
- Exploration found an account-enumeration side channel: delivery failures currently yield HTTP 500 for an existing account but 200 for a missing account. P3-02 must make those outcomes publicly identical.
- Strict TDD enabled.
- P3-01 implementation is present in the mail adapter/config boundary with 5 focused tests passing under a temporary no-database Vitest config.
- Backend typecheck passed. The normal backend test command remains pending because Prisma globalSetup cannot connect to PostgreSQL on localhost:5433.

## Next Step
Commit P3-01 as a work unit, then establish RED/GREEN for P3-02 route neutrality and startup validation.
