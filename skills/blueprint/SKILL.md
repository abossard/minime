---
name: blueprint
description: "Blueprint a coding task from inline context or an existing blueprint. Reads the repo and org wiki page collections, scores and verifies them, thinks silently, self-challenges, and returns a persisted plan. No human review gate. The blueprint is the durable handoff artifact."
when_to_use: "When the user has a task to plan, whether as an existing blueprint file, inline conversation context, or a verbal description. This skill starts the orchestration flow."
allowed-tools: Read Edit Grep Glob Bash(git remote get-url *) Bash(git log *) Bash(git status) Bash(ls *) Bash(mkdir *) Write
---

# Skill: blueprint

Turn the task into a persisted executable plan. Runs first in the four-phase flow. No human review gate.

Trigger: the user has a task to plan, or the orchestrator started a run.

## Agent
The blueprint can be done by an agent that has reasoning and capabilities to start research and other agents. Strong models with reasoning preferred, e.g. Opus 5 or GPT 5.6 Sol.

## Progress

Mark this phase `in_progress` on entry and `done` at handoff in the harness native todo tool. Visibility aid, never a gate. Skip silently when no todo tool exists. See `assets/ORCHESTRATION.md` § Progress tracking.

## Steps

1. **Persist the living blueprint first.**
   Derive `<org>` and `<repo>` from `git remote get-url origin`. Take VIRTUCON_HQ from the session nudge, then the env var, then `~/.minime`.
   Create or update `VIRTUCON_HQ/<org>/_<repo>/blueprints/<YYYY-MM-DD>-<short-name>.blueprint.md` from `VIRTUCON_HQ/templates/blueprint.template.md`.
   When an older HQ template lacks the correction-scoped `## Active criteria` or `## Criteria archive` sections, normalize the living blueprint and leave the user's template file untouched. Move only uncompleted criteria into the current correction. Never copy completed criteria back into active state and never fabricate archive hashes; leave unsealed legacy completion text for later independent inspection.
   Read the file back from disk before continuing.

2. **Accept the task source from wherever it lives.**
   Preserve the user's original request verbatim.
   Nudge for EARS completeness with the minimum clarification when criteria are vague.
   Give every criterion an evidence method that names the proving tool, the boundary it exercises, and the pass/fail signal.

3. **Locate wiki sources.**
   Read these paths when present:
   - `VIRTUCON_HQ/schema.md`
   - `VIRTUCON_HQ/wiki/index.md`
   - `VIRTUCON_HQ/wiki/log.md`
   - repo topic pages under `VIRTUCON_HQ/wiki/orgs/<org>/<repo>/`
   - cross-repo topic pages under `VIRTUCON_HQ/wiki/patterns/`
   - related raw documents under `VIRTUCON_HQ/raw/<org>/<repo>/`
   When the repo topic directory is empty, continue with zero repo wiki context and note that in the blueprint instead of blocking.
   Treat legacy `VIRTUCON_HQ/<org>/_<repo>/wiki/` and `wiki.md` files as compatibility input only. Prefer the global wiki tree whenever both exist.

4. **Discover domain-specific skills and agents.**
   Scan local and installed skills or agents that fit the task.

5. **Run VOI triage.**
   Resolve `decided-by-data` unknowns directly.
   Dispatch only strong `general-purpose` subagents for `needs-research` items, and require raw proof such as URLs, exact quotes, and code paths ahead of any interpretation.
   Use `ask_user` only for `undecidable-now` tradeoffs.
   Record every resolution in the Decisions table.
   See `assets/ORCHESTRATION.md` § VOI taxonomy and § Ask_user rule.

6. **Rank wiki pages before reading them deeply.**
   Rank by `Scope` match, title or summary match, active status, stronger code citations, recency, and user-correction origin.
   Read only the small set the task needs. Treat `index.md` and `log.md` as navigation aids, not final truth.

7. **Verify before trusting.**
   Open the cited code paths from selected pages.
   Mark an uncited claim as a lead only.
   When a cited claim no longer matches live code, ignore it for planning and flag it for extract as stale.
   Tag every entry carried into `## Relevant verified wiki entries` with an inline `active`, `stale`, or `superseded` status against live code.

8. **Plan silently and persist the handoff.**
   Write `## Plan summary` with files to touch, implementation order, fix shape, tests, and resolved wiki constraints.

9. **Critique the test strategy.**
   Rubber-duck each criterion until it is backed by a user-facing proof and at least one meaningful edge case.

10. **Self-challenge briefly.**
    State the riskiest assumption, when the approach would be wrong, and any remaining ambiguity.

11. **Return.**
    Return control to the orchestrator, or to the caller for direct manual use. Do not invoke another phase.

## Result contract

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field. Return to the caller without self-chaining.

## Rules

- Do not create a plan approval gate.
- Prefer the smallest plan that satisfies the criteria.
- Preserve raw user wording.
- Evidence beats interpretation.
- Follow `assets/ORCHESTRATION.md` for the shared raw/wiki/schema contract.
