# Production database readiness

## Objective

Deliver roadmap phases 0 and 1: prepare a safe PostgreSQL 16-to-18 upgrade path, make committed Prisma migrations authoritative, and expose database-aware readiness without weakening liveness checks.

## Problem and rationale

The Docker runtime and integration tests currently use `prisma db push --accept-data-loss`, bypassing the two committed migrations. The Compose stack uses PostgreSQL 16 while PostgreSQL 18.6 is the current stable release. The API exposes liveness only, so orchestration cannot detect database unavailability.

## Authorized scope

- PostgreSQL 18.6 Compose configuration and environment contract.
- Backup, restore, baseline, rollback, and local upgrade documentation.
- Migration-driven Docker, CI, and integration-test lifecycle.
- `/api/ready`, graceful Prisma shutdown, and container health checks.
- Deterministic Docker dependency installation where touched by this work.
- The previously requested local `PROJECT_PLAN.md` ignore rule.

## Constraints

- Preserve the existing PostgreSQL 16 volume; never mount it into PostgreSQL 18.
- Back up existing local databases before switching versions.
- Preserve the two existing Prisma migrations; do not create a redundant baseline.
- Do not push branches, create pull requests, or merge without explicit authorization.
- Use local Git identity `33krs`; never add co-author or AI attribution.
- Keep `.atl/`, `.codegraph/`, and ignored `PROJECT_PLAN.md` in place.

## Delivery and testing configuration

- Delivery strategy: `ask-on-risk`.
- Forecast: approximately 350 authored changed lines, excluding generated files.
- Chain strategy: not required unless the running count exceeds approximately 400 lines.
- TDD: disabled; no explicit project or session TDD configuration exists. Ordinary focused and full checks remain mandatory.
- Test runner: Vitest through `npm run test:backend`; full gate is `npm run quality`.
- RDD: enabled by global configuration. Assess each work-unit commit with the native review command.

## Tasks

- [x] **DB-01 — Upgrade PostgreSQL and define the environment contract**
  - Route: delegated direct; mapping and writer triggers apply because the work spans Compose, environment documentation, and operational documentation.
  - Use PostgreSQL `18.6-alpine` with a new volume identity.
  - Add safe backup, restore, fresh-volume, and rollback instructions.
  - Include `.gitignore` in this configuration work unit.
  - Checks: Compose config passed; PostgreSQL 18.6 image pulled; verified backup SHA-256 `7c453d0752323b04bdc27c52cdaafcc563620373a88ff3592bf529e0b7bfc004`; both `pgdata` and `pgdata18` volumes preserved; documentation formatted.
  - Commit: pending creation (`chore(db): prepare PostgreSQL 18 upgrade`).
  - RDD: pending.
- [ ] **DB-02 — Make migrations authoritative**
  - Route: delegated direct; writer trigger applies across Docker startup, test setup, CI, and scripts.
  - Replace production and test `db push` flows with `prisma migrate deploy` against guarded databases.
  - Preserve and verify the two existing migrations.
  - Checks: empty-database deploy, idempotent deploy, backend tests, CI configuration review.
  - Commit: pending.
  - RDD: pending.
- [ ] **DB-03 — Add readiness and graceful shutdown**
  - Route: delegated direct; writer trigger applies across backend runtime, tests, and Compose health checks.
  - Keep `/api/health` as liveness; add `/api/ready` with a lightweight database probe and `503` failure behavior.
  - Disconnect Prisma during SIGINT/SIGTERM shutdown.
  - Checks: readiness success/failure tests, backend build, container health behavior.
  - Commit: pending.
  - RDD: pending.
- [ ] **DB-04 — Validate the complete upgrade path**
  - Route: inline verification; no source writer is planned unless verification identifies a defect.
  - Restore or initialize PostgreSQL 18, deploy migrations twice, run all quality checks, and smoke-test health/readiness.
  - Checks: `npm run quality`, Docker Compose health, schema status, data-count validation.
  - Commit: pending if documentation evidence changes.
  - RDD: pending.

## Acceptance criteria

- PostgreSQL 18.6 runs on a new volume while the PostgreSQL 16 volume remains recoverable.
- Runtime, CI, and integration tests exercise committed migrations instead of destructive schema push.
- Migration deployment succeeds on an empty database and is idempotent.
- `/api/health` remains independent of PostgreSQL; `/api/ready` returns `200` with the database and `503` without it.
- The backend shuts down cleanly and disconnects Prisma.
- Full project quality checks pass.

## Progress and evidence

- Current branch: `chore/production-database-readiness`.
- PostgreSQL official release evidence: 18.6 is stable; PostgreSQL 19 Beta 4 is not production-ready.
- Existing migrations: `20260906020329_init` and `20260906092325_add_password_reset_token`.
- Next step: commit DB-01 and complete DB-02.
