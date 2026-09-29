# Resolve Conflicts for Phase 4 Advisory PR #9

## Objective

Bring PR #9 up to date with the current `main`, resolve any real merge conflicts without merging the PR, verify the result, and update its existing branch.

## Problem and Why

GitHub reported PR #9 as `DIRTY`, while local `origin/main` was stale and a local merge preview did not confirm conflicts. Current remote base/head refs must be refreshed before determining the actual resolution.

## Authorized Scope

- Repository: `33krs/biblioteca-app`; PR #9; branch `fix/phase4-review-advisories`; base `main`.
- User authorized refreshing the remote state, resolving conflicts, and pushing the corrected branch using the authenticated `gh` session.
- Do not merge PR #9, change product scope, or deploy.
- Preserve `.atl/` and `.codegraph/` as local-only artifacts.

## Constraints and Checks

- Prefer a merge of current `main` into the PR branch over rewriting history; avoid force-push.
- Preserve the Phase 4 implementation and RA-01–RA-03 behavior/tests; make only conflict-resolution edits.
- TDD is strict for behavior changes under prior explicit user authorization. If conflict resolution is mechanical integration only, run ordinary functional verification; runner: `npm run quality`.
- Conventional Commit; no `Co-Authored-By` or AI attribution.
- Delivery strategy: `single-pr` (the existing PR #9); forecast ~275 authored changed lines from the existing RA work, with conflict-resolution delta to be measured after merge. This is under the ~400-line delivery budget.

## Tasks

- [ ] PR9-01 — Refresh current refs, integrate latest `main` into the PR branch, and resolve only observed conflicts.
  - Route: delegated direct.
  - Trigger evidence: actual three-way preview against refreshed refs reports conflicts in 8 non-trivial files; a delegated mapper is comparing both sides before the writer acts.
  - Acceptance: the PR branch is based on current `main`, conflicts are resolved without dropping either side's intended behavior, and no force-push or PR merge occurs.
  - Checks: conflict index cleared (0 unmerged paths); `npm run quality` passed (format, lint, both typechecks, 80 backend tests, 33 frontend tests, both builds); `git diff --check` passed.
  - Evidence: refreshed `origin/main` at `e866d4d`; resolved 7 files manually and 1 merged automatically. Resulting file contents match the PR head exactly, so the merge records ancestry without introducing additional file-content changes. Merge commit not yet created.
  - Commit identity: pending.
- [ ] PR9-02 — Push the verified resolution to the existing PR branch and confirm PR #9 is no longer dirty.
  - Route: direct delivery of PR9-01's verified work unit.
  - Acceptance: remote branch contains the resolution commit; PR remains open and is not merged; report latest status checks/reviews.
  - Checks: remote branch SHA and PR metadata read-back.
  - Evidence: pending.
  - Commit identity: same resolution work-unit commit as PR9-01.

## Progress and Evidence

- Local HEAD and `origin/fix/phase4-review-advisories`: `5421616d1516db4c00d7bcb9cb20e6274626cb32`.
- Local `origin/main`: `6aeb34e1b08d85b601f4476d88aa7f7cae747572`; last local fetch was 2026-09-27, so it is stale.
- GitHub reported PR #9 `DIRTY`, open, no reviews, and no status checks in the latest query.
- Authorized `git fetch origin main` refreshed `origin/main` to `e866d4d6da5d1692aae38efcf3ab6a26acd60e28`; PR head remains `5421616d1516db4c00d7bcb9cb20e6274626cb32`.
- Three-way merge preview against refreshed refs identified conflicts in `apps/backend/src/middleware/errorHandler.ts`, `apps/backend/src/routes/shelf.ts`, `apps/backend/tests/phase4-observability.test.ts`, `apps/backend/tests/shelf.test.ts`, `apps/frontend/src/lib/api.test.ts`, `apps/frontend/src/lib/api.ts`, `apps/frontend/src/store/useLibraryStore.test.ts`, and `apps/frontend/src/store/useLibraryStore.ts`.
- Delegated mapper confirmed main/PR intent on both sides. Conflict markers and unmerged index entries are cleared; source file tree is unchanged from the PR head. The merge is still in progress (`MERGE_HEAD=e866d4d`); only task tracking is a new untracked file at this point.

## Next Step

Create a conventional merge commit, assess the work unit, then push the updated branch and confirm PR #9 remains open and unmerged.

## Relevant Files

- `odd/tasks/phase4-review-advisories.md` — completed Phase 4 advisory implementation and verification evidence.
- `PROJECT_PLAN.md` — project phase roadmap; unchanged by this task.
