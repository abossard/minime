---
name: extract
description: Extract lessons once at a coherent task or session boundary into the global raw/wiki knowledge root. Human corrections are the highest-value signal. Every durable claim must cite live code.
when_to_use: When the orchestrator reaches the terminal task or session boundary with no active criteria, or when the user explicitly asks to extract lessons from recent work.
allowed-tools: Read Edit Write Grep Glob Bash(git log *) Bash(git diff *) Bash(git show *) Bash(git remote get-url *) Bash(git status)
---

# Skill: extract

Turn this task's raw outcomes into durable knowledge under `raw/`, `wiki/`, and `schema.md`. Terminal phase, runs at most once.

Trigger: the coherent task or session boundary has been reached with no active criteria and no blocking issue, or the user explicitly requested extract.

**Human corrections are the highest-value signal. Capture them first.**

## Progress

Mark this phase `in_progress` on entry and `done` at handoff in the harness native todo tool. Visibility aid, never a gate. Skip silently when no todo tool exists. See `assets/ORCHESTRATION.md` § Progress tracking.

## Step 1: Harvest the blueprint

Read the persisted blueprint at `VIRTUCON_HQ/<org>/_<repo>/blueprints/<date>-<name>.blueprint.md`.
Harvest from the Decisions table, review discoveries, and verbatim user feedback.

## Step 2: Locate the knowledge roots

Derive `<org>` and `<repo>` from `git remote get-url origin`.
Open these shared-root paths when present:
- `VIRTUCON_HQ/schema.md`
- `VIRTUCON_HQ/wiki/index.md`
- `VIRTUCON_HQ/wiki/log.md`
- repo topic pages under `VIRTUCON_HQ/wiki/orgs/<org>/<repo>/`
- cross-repo topic pages under `VIRTUCON_HQ/wiki/patterns/`
- related raw documents under `VIRTUCON_HQ/raw/<org>/<repo>/`

Check for legacy `VIRTUCON_HQ/<org>/_<repo>/wiki/` or `wiki.md` inputs before declaring older guidance absent.

## Step 3: Capture, in priority order

1. Corrections the human made to the agent's work.
2. Reusable design decisions with rationale.
3. Worthy research answers recorded in the blueprint.
4. Failed approaches that future tasks should avoid.
5. Stale or conflicting guidance that needs repair.

## Step 4: Write durable knowledge

### Write filter

Store a lesson only when it is actionable, reusable, cited, and novel.

### Raw layer

Write compact curated source documents into `raw/<org>/<repo>/`.
Good raw documents hold findings, distilled results, user messages, general knowledge, and hard-won discoveries.
Keep logs and large command outputs out of `raw/`.
Name raw documents for the source, for example `raw/<org>/<repo>/review-feedback-2026-05-30.md` or `raw/<org>/<repo>/legacy-wiki.md`.

### Wiki layer

Maintain the wiki as linked markdown pages under `wiki/`:

- `index.md` catalogs topic pages and points at key raw sources.
- `log.md` records dated ingest, query, and lint updates.
- Repo-specific topic pages live under `wiki/orgs/<org>/<repo>/`.
- Cross-repo topic pages live under `wiki/patterns/`.
- Topic pages hold durable guidance. Create or update them with `VIRTUCON_HQ/_TEMPLATE.md`.

Keep summaries, scopes, and citations concise so blueprint can rank them. Include these elements when they help retrieval: a summary near the top, `Scope`, links to raw source documents, re-verifiable code citations, and `LastVerified`.

### Conflict handling

Prefer the newer, better-cited guidance. Mark old guidance stale or superseded rather than leaving two active contradictions.

### Decay

Re-verify recently touched guidance. Mark guidance stale when its citations no longer match live code.

## Step 5: Consolidate

- Merge overlapping pages when a stronger general rule is visible.
- Remove or mark stale pages whose citations no longer match code.
- Keep `index.md` scannable and current.
- Keep `log.md` chronological and compact.
- Record candidates considered, pages updated, and stale items handled in the final response.

## Boundaries

- Repo-specific guidance stays in `wiki/orgs/<org>/<repo>/`.
- Cross-repo guidance stays in `wiki/patterns/`.
- Never store secrets, tokens, credentials, or customer data.
- The durable knowledge base is not a changelog.
- The wiki stays authoritative even when you also mirror high-value lessons to platform-native memory.
- Extract stays pending across correction loops and runs at most once at the terminal boundary.
- Staging requires exact current-task permission and is not a prerequisite for inspect, extract, or completion.

## Lint mode

When asked to lint, check the repo wiki pages for:

1. stale citations
2. contradictions
3. orphan scopes
4. duplicate guidance
5. coverage gaps in recently touched directories
6. research candidates from the blueprint that deserve promotion

Follow `assets/ORCHESTRATION.md` for the shared raw/wiki/schema contract.

## Return

Return control to the orchestrator, or to the caller for direct manual use. Do not invoke another phase.

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field.
