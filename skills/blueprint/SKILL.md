---
name: blueprint
description: "Blueprint a coding task from inline context or an existing blueprint. Reads the repo and org wiki page collections, scores and verifies them, thinks silently, self-challenges, and returns a persisted plan. No human review gate. The blueprint is the durable handoff artifact."
when_to_use: "When the user has a task to plan, whether as an existing blueprint file, inline conversation context, or a verbal description. This skill starts the orchestration flow."
allowed-tools: Read Edit Grep Glob Bash(git remote get-url *) Bash(git log *) Bash(git status) Bash(ls *) Bash(mkdir *) Write
---

# Skill: blueprint

Runs first in the four-phase flow. No human review gate. The output is an executable plan returned to the caller.

## Progress

Mark this phase in the harness native todo tool: `in_progress` on entry, `done` at handoff. Visibility aid for the user, never a gate. Skip silently if no todo tool is available. See `assets/ORCHESTRATION.md` § Progress tracking.

## Steps

1. **Persist the living blueprint first.**
   Derive `<org>` and `<repo>` from `git remote get-url origin`. Use VIRTUCON_HQ from the session nudge, then env var, then `~/.minime`.
   Create or update `VIRTUCON_HQ/<org>/_<repo>/blueprints/<YYYY-MM-DD>-<short-name>.blueprint.md`.
   Use `VIRTUCON_HQ/templates/blueprint.template.md`.
   Normalize the living blueprint when an older HQ template lacks the required correction-scoped `## Active criteria` or `## Criteria archive` sections. Preserve the user's template file itself. Move only uncompleted criteria into the current correction. Do not copy completed criteria back into active state or fabricate archive hashes; leave unsealed legacy completion text in place for later independent inspection.
   Read the file back from disk before proceeding.

2. **Accept the task source from wherever it lives.**
   Preserve the user's original request verbatim.
   If criteria are vague, nudge for EARS completeness with the minimum needed clarification.
   Every criterion must include an evidence method that names the proving tool, boundary, and pass/fail signal.

3. **Locate wiki sources from the global layout.**
   Read these paths when present:
   - `VIRTUCON_HQ/schema.md`
   - `VIRTUCON_HQ/wiki/index.md`
   - `VIRTUCON_HQ/wiki/log.md`
   - repo topic pages under `VIRTUCON_HQ/wiki/orgs/<org>/<repo>/`
   - cross-repo topic pages under `VIRTUCON_HQ/wiki/patterns/`
   - related raw documents under `VIRTUCON_HQ/raw/<org>/<repo>/`
   If the repo topic directory is empty, continue with zero repo wiki context and note that in the blueprint instead of blocking.
   Legacy `VIRTUCON_HQ/<org>/_<repo>/wiki/` and `wiki.md` files are compatibility input only. Prefer the global wiki tree whenever both exist.

4. **Discover domain-specific skills and agents.**
   Scan local and installed skills or agents that might help the task.

5. **Run VOI triage** (see `assets/ORCHESTRATION.md` § VOI taxonomy for the full classification).
   Resolve `decided-by-data` unknowns directly.
   Dispatch only strong `general-purpose` subagents for `needs-research` items.
   Research returns must lead with raw proof such as URLs, exact quotes, and code paths before interpretation.
   Use `ask_user` only for `undecidable-now` tradeoffs.
   Record every resolution in the Decisions table.

6. **Rank wiki pages before reading them deeply.**
   Rank by `Scope` match, title or summary match, active status, stronger code citations, recency, and user-correction origin.
   Read only the small set needed for the task.
   Treat `index.md` and `log.md` as navigation aids first, not as final truth.

7. **Verify before trusting.**
   Open cited code paths from selected pages.
   If a page makes an uncited claim, mark it as a lead only.
   If a cited claim no longer matches live code, ignore it for planning and flag it for extract as stale.
   Tag each entry carried into the `## Relevant verified wiki entries` section with an inline `active` / `stale` / `superseded` status against live code. Memora (arXiv:2604.20006) found LLM memory agents frequently reused invalid memories and failed to reconcile evolving ones; this tag makes supersession/staleness explicit per citation instead of silently trusted.

8. **Plan silently and persist the handoff.**
   Write a `## Plan summary` with files to touch, implementation order, fix shape, tests, and resolved wiki constraints.

9. **Critique the test strategy.**
   Use a rubber-duck style review so each criterion is backed by a user-facing proof and at least one meaningful edge case.

10. **Self-challenge briefly.**
   State the riskiest assumption, when the approach would be wrong, and any remaining ambiguity.

11. **Return.**
   Return control to the orchestrator or, for direct manual use, its caller. Do not invoke another phase.

## Result contract

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field. Return control to its caller without self-chaining.

## Rules

- Do not create a plan approval gate.
- Prefer the smallest plan that satisfies the criteria.
- Preserve raw user wording.
- Evidence beats interpretation.
- Follow `assets/ORCHESTRATION.md` for the shared raw/wiki/schema contract.
