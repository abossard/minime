---
name: replicate
description: Replicate a planned task in a tight test-driven loop. Generate -> run -> observe REAL output -> fix. Re-injects blueprint constraints after context compaction or when switching focus. Returns evidence without self-chaining.
when_to_use: When the orchestrator dispatches a persisted blueprint, or whenever the user wants the implementation loop with grounded test execution.
allowed-tools: Read Edit Write Grep Glob Bash
---

# Skill: replicate

Implement the blueprint's active criteria in a tight execution-grounded loop: write the test, implement, run, read the real output, fix. No human review gate.

Trigger: the orchestrator dispatched a persisted blueprint, or the user invoked you directly with an existing plan.

## Agent
The replicate phase is ideally be done with a coding focused agent and model. E.g. GPT 5.3 Codex.

## Progress

Mark this phase `in_progress` on entry and `done` at handoff in the harness native todo tool. See `assets/ORCHESTRATION.md` § Progress tracking.

## Rely on blueprint

Locate the persisted blueprint at `VIRTUCON_HQ/<org>/_<repo>/blueprints/<date>-<name>.blueprint.md` (VIRTUCON_HQ is in the session nudge). **Read the file at the start of this phase to confirm it exists.** 

As you complete each criterion:
- Tick `[x]` the moment its test goes green. **Do not batch check-offs for later.**
- Paste raw shortened evidence (command output, test result, key lines) directly under the criterion line. A checkmark without inline proof is not a checkmark.
- Add any unknown you resolved to the Decisions table with its VOI level and source.
- Note a requirement you discover outside the original EARS, and leave it out of the criteria. Inspect owns that call.
- Work only on the current correction's active criteria. Archived criteria stay out of scope unless the blueprint marks their baseline proof invalidated.

Follow `assets/ORCHESTRATION.md` § Context engineering.

## What counts as evidence

Real output from real execution: test results, command output, HTTP responses, screenshots, logs. See `assets/ORCHESTRATION.md` § Evidence value chain.

## The loop

### Test first, minimal implementation second, TDD

Classify the touched surface and choose the narrowest proof.

1. **Identify what has changed or will change from the implementation**: list the files and directories this implementation step touches.
2. **Choose the narrowest test scope that proves the criterion.**
   - Primary method: find impacted tests through the real code/test dependency relationship, meaning callers and importers of the changed symbols, or an existing coverage/impact map.
   - Fallback when no dependency or impact map exists: use directory and module colocation. A single changed file maps to its colocated tests; a changed module maps to that module's suite.
   - A changed cross-cutting contract (API, schema, shared types) broadens to integration and contract tests.
3. **Broaden only when the touched contract demands it.** Reserve a full suite run for changes to shared infrastructure, build configuration, or dependency versions.
4. **Record what was tested and why** that scope was sufficient. 

### Scoped wiki entries

When entering a directory for the first time in a task, check the repo wiki for entries whose `Scope` field matches that directory. Apply matching active entries as constraints for work in that directory. Proceed normally when no scoped entries exist.

## Constraint re-injection

Re-read the blueprint's `## Constraints / non-negotiables` and `## Out of scope` sections:
- **(a)** after every context compaction event,
- **(b)** when switching to a new acceptance criterion,
- **(c)** when entering a directory for the first time.

When in doubt, re-read. Rules decay across long loops unless refreshed.

## Scope discipline

- Touch only what the blueprint and plan require. Record necessary work outside scope in the evidence package instead of silently expanding.
- Keep the diff as small as the blueprint allows. Small diffs are cheap to verify; large diffs force the reviewer to re-solve instead of check.
- **Evidence over interpretation.** Paste raw test output, command output, and observable data. Label any interpretation separately and put it after the raw evidence.

## Pre-handoff checkpoint (mandatory)

Before handing off, re-read the persisted blueprint and verify:

1. Every criterion whose test is green has `[x]` in the file. Edit the file now when any are missing.
2. The `Status:` field reflects the current state, for example `implementing` becomes `implemented`.
3. Decisions made during implementation are recorded in the Decisions table.
4. An `## Evidence collected` section lists all test commands run with raw shortened output, files changed, and assumptions made. This sits on top of the inline proof under each criterion so inspect can evaluate from disk with no chat context from this phase.

**Do not skip this step.** Inspect relies on the blueprint being accurate.

## Return

Return control to the orchestrator, or to the caller for direct manual use. Do not invoke another phase.

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field. Durable evidence, assumptions, and out-of-scope discoveries stay in the blueprint.
