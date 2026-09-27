# Secure authentication

## Objective

Replace browser-managed bearer tokens with HttpOnly cookie sessions, enforce CSRF protection for authenticated mutations, and invalidate existing sessions after a password reset.

## Problem and rationale

The frontend persists a JWT in `localStorage` and sends it in an `Authorization` header. This exposes the credential to XSS and leaves mutable API operations without CSRF protection. Password resets also do not revoke previously issued JWTs.

## Authorized scope

- Cookie-based JWT sessions for the existing authentication and shelf APIs.
- Double-submit CSRF protection for authenticated `POST`, `PATCH`, and `DELETE` requests.
- `sessionVersion` persisted on users and included in signed session claims.
- Logout endpoint and frontend session hydration/logout changes.
- Tests, Prisma migration, and documentation required by the changed behavior.

## Constraints

- Do not put session tokens in browser storage or return them from login/register responses.
- Session cookie: `HttpOnly`, `SameSite=Lax`, path `/api`, seven-day expiry, and `Secure` in production.
- CSRF cookie must be readable by browser JavaScript; mutations require the matching `X-CSRF-Token` header.
- Keep anonymous auth flows usable without a prior CSRF token, while requiring CSRF after a session is established.
- Preserve the feature-branch → PR → main workflow; do not push or create a PR without explicit authorization.

## Delivery and testing configuration

- Delivery strategy: `ask-on-risk`.
- Forecast: approximately 360 authored changed lines, excluding generated files.
- TDD: disabled; no explicit project or session TDD configuration exists. Focused and full checks remain required.
- Test runner: Vitest through `npm run test:backend` and `npm run test:frontend`; full gate `npm run quality`.
- RDD: enabled by global configuration; assess each work-unit commit with the native review command.

## Tasks

- [ ] **AUTH-01 — Establish cookie sessions and server-side CSRF enforcement**

  - Route: inline because delegation tooling is unavailable in this runtime; mapping trigger evidence: backend auth, middleware, app setup, schema, migration, and tests span more than four files.
  - Add `sessionVersion` with a committed Prisma migration.
  - Read session JWTs from an HttpOnly cookie and validate the embedded session version against the user record.
  - Set session and CSRF cookies on registration/login, add logout, require matching CSRF header for authenticated mutations, and increment the session version after password reset.
  - Checks: focused backend auth/shelf tests, Prisma migration deployment, backend build.

- [ ] **AUTH-02 — Migrate the frontend to credentialed cookie requests**

  - Route: inline because delegation tooling is unavailable in this runtime; writer trigger evidence: auth client, shelf API client, auth store, token removal, and frontend tests are non-trivial files.
  - Remove local token persistence and bearer headers.
  - Send credentialed requests, attach the CSRF header to authenticated mutations, and make logout call the API.
  - Checks: focused frontend auth-store/API tests, frontend build.

- [ ] **AUTH-03 — Verify secure-session behavior and close the delivery**
  - Route: inline verification; no source writer unless a check identifies a defect.
  - Run migration, focused auth/shelf tests, and the full quality gate; record observed results.
  - Commit: pending.
  - RDD: pending native assessment.

## Acceptance criteria

- Login and registration return public user data only and establish an HttpOnly session cookie.
- No application token is written to `localStorage`.
- `POST`, `PATCH`, and `DELETE` shelf requests without a valid CSRF header are rejected.
- Logout clears the session and CSRF cookies.
- Password reset invalidates sessions issued before the reset.
- All applicable tests, type checks, linting, formatting, and builds pass.

## Progress and evidence

- Branch: `feat/secure-authentication`, created from merged `origin/main` commit `9330b9a`.
- Next step: implement AUTH-01.
