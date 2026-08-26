---
name: inspect
description: Inspect the current-task delta in a fresh subagent context. Verifies active EARS criteria and invalidated baseline proofs, computes an uncertainty-based risk tier, and returns evidence without dispatching another phase. Surfaces evidence, never a verdict.
when_to_use: When the orchestrator dispatches review, or whenever the user wants a bounded evidence review.
context: fork
agent: minime:frau
---

# Skill: inspect

Verify the current-task delta against its active criteria and hand the human evidence, never a verdict.

Trigger: the orchestrator dispatched the current-task evidence package, or the user directly requested bounded review.

The orchestrator dispatches this skill through `task` as a fresh `minime:frau` worker. The `context: fork` frontmatter reinforces that boundary only where the harness honors it. A fresh context removes the sunk-cost blindness of the agent that wrote the code. If inspect finds itself running inside the implementing context, return `blocked` instead of reviewing.

Use strong high reasoning for standard and fast-path inspection. When the harness supports explicit model selection, prefer the strongest available reasoning model. Fast-path scope never lowers model strength or reasoning effort.

## Progress

The orchestrating agent marks this phase `in_progress` on entry and `done` at handoff in the harness native todo tool. The forked inspector does not manage the list. Visibility aid, never a gate. See `assets/ORCHESTRATION.md` § Progress tracking.

## Inspector mutation boundary

Inspection may gather evidence and run tests. It may create temporary investigation artifacts outside the repository and must clean them up. It must not modify implementation source or implementation tests, apply fixes, resolve conflicts, revert, restore, or stash working-tree state, or perform Git mutations including staging or committing. If a prohibited action is requested or seems necessary, return it as evidence to the orchestrator.

## Step 1: Validate blueprint integrity

Read the persisted blueprint. Before verifying criteria, check:

- Does every current active criterion with passing test evidence have `[x]`? Flag a missing one as a process gap.
- Is the `Status:` field consistent with the actual state, for example all criteria done while status still says `planning`?
- Are the Decisions table entries filled in?
- Does the blueprint have an `## Evidence collected` section from replicate? Use it as a starting point and re-verify independently.
- Which archived baseline proofs are invalidated by a changed or missing referenced artifact, or by a changed proof definition? Keep unchanged archived proofs excluded.

Report mismatches under "Process gaps".

## Step 2: Verify scoped criteria against evidence

Read the persisted blueprint (`VIRTUCON_HQ/<org>/_<repo>/blueprints/<date>-<name>.blueprint.md`).

### Review contract

- **Treat all findings as advisory.** Verify every finding by reading the real code path and adjacent files. Read dependency docs, source, or types when the finding depends on external behavior.
- **Reject speculative risks.** Leave out unrealistic edge cases, hypothetical failures without evidence, broad rewrites, and fixes that over-complicate the codebase. A finding needs a concrete code path or observable failure to be actionable.
- **Stop when clean; one gate, not seven.** Once the review pass produces no accepted actionable findings, stop. Running another cycle or spawning a second reviewer multiplies cost and blind spots without adding safety. One bounded pass plus the human is the design.
- **Scope-match findings.** When the repo wiki has `Scope`-tagged entries matching the changed directories, verify those rules were respected and flag violations as findings.

Build a traceability row for each current active criterion and each invalidated archived baseline proof. Do not replay unchanged archived criteria.

| Criterion | Evidence method | Test at boundary? | Error cases? | Test passes? (raw output) | Untested uncertainty |
|-----------|:---:|:---:|:---:|:---:|---|
| When X, system shall Y | tool + boundary | yes/internal/missing | yes/no | paste output | what's uncertain |

- **Test at boundary?** Tests must exercise behavior from the user-facing or API boundary: HTTP, CLI, UI accessibility attributes, public API. Flag a test that only exercises internals such as private methods or internal state as "weak evidence".
- **Error cases?** Every criterion needs at least one error or wrong-input test. Flag missing error coverage.

Verify the low-level artifact (code) against the high-level artifact (EARS criteria). A criterion with no genuine test is evidence of uncertainty. Surface it.

## Step 3: Backfill discovered criteria into the EARS

When the review surfaces requirements that belong in the original EARS:

- Return each discovered requirement with a proposed EARS criterion and VOI level.
- Return human feedback verbatim. Do NOT paraphrase.
- The orchestrator decides whether to open a correction-scoped active section and persists the returned source.

## Step 4: Gather only the inspection scope

Use only the orchestrator-supplied:
- current-task delta bounded to `changed_files[]`
- current active criteria
- invalidated archived baseline proofs identified in Step 1

Leave the full branch, the repository, unrelated working-tree changes, and every unchanged archived criterion out. When the supplied current-task boundary is missing or ambiguous, return `blocked` instead of expanding scope.

## Step 5: Compute the risk tier

Risk is **correctness uncertainty in the reviewed artifact and its declared contract**, not a domain checklist. Inability to mechanically prove future agent or model compliance with instruction prose is not a risk driver by itself.

For operational instruction changes, the inspector must verify the scoped source text, deployed copy when applicable, referenced paths and commands, contradictions, and existing executable checks. Concrete contradictions or missing runtime references remain HIGH.

Uncertainty drivers, any of them present and unmitigated:
- **Low test coverage**: new or changed behavior without tests. Mitigated only by inspector-executed boundary test output covering the changed behavior and an error case.
- **High branching complexity**: many conditional paths, meaning untested states. Mitigated only by inspector-executed output covering each reachable changed branch, or a read code path proving an omitted branch unreachable.
- **Weak type safety**: untyped or `any`-heavy code, meaning runtime surprises. Mitigated only by executed type-check output plus inspector-executed boundary tests for the untyped paths.
- **Backwards compatibility surface**: shared interfaces, contracts, schemas. Mitigated only by inspector-executed compatibility or contract output against prior supported inputs and outputs.
- **Assumption density**: many unverified assumptions. Mitigated only when each assumption cites inspector-executed output or an exact read code path that verifies it.
- **External state dependency**: DB, network, filesystem, third-party APIs. Mitigated only by inspector-executed integration output against representative state, including a failure path.
- **Novelty**: unfamiliar codebase area, unestablished patterns. Mitigated only by a read established analogous code path plus inspector-executed boundary output for the changed behavior.
- **New executable without execution evidence**: any runnable artifact never executed with real inputs during implementation. Mitigated only when the inspector independently executes it with representative real and wrong input and captures the output.

A present driver is mitigated only when the inspector independently gathers its named evidence.
**HIGH** when any driver is present and unmitigated, or when the reviewer's honest confidence is below "high".
**LOW** only when every present driver has its named mitigating evidence and the reviewer's confidence is high. **When in doubt, HIGH.**

## Step 6: Build the evidence package

THE ONE RULE: hand the human **evidence, not a verdict.**

Evidence is real output from real execution. See `assets/ORCHESTRATION.md` § Evidence value chain.

The package contains ONLY:

1. **Criterion traceability table** with evidence methods, boundary assessment, and error coverage (Step 2).
2. **Scoped diff** of the current-task delta, nothing extra.
3. **Test output**: verbatim raw output for every criterion-proving run and every failing run. A one-line summary is permitted only for a bulk passing suite that proves no active criterion. Never summarize criterion-proving or failing runs.
4. **Assumptions made**, a plain list.
5. **Least-sure points**, 2-3 specific lines or decisions phrased as questions. State the uncertainty and leave it unresolved.
6. **Out-of-scope work discovered**, when any exists.
7. **Process gaps**, the blueprint integrity issues found in Step 1.
8. **Inconsistencies and contradictions**, an explicit list of conflicts across the gathered evidence such as a diff that contradicts a stated assumption or two evidence sources that disagree, or `none found`. Keep this separate from "Least-sure points", which holds unresolved uncertainty, and state each conflict plainly.

**Evidence-first principle.** Present raw data (test output, command output, diff) FIRST. Label any analysis or interpretation separately and after the raw evidence. Data outranks interpretation. When they conflict, the data wins.

FORBIDDEN: "this looks correct / LGTM / safe to merge / I'm confident", any verdict, any score, any persuasion, and any reasoning trace offered as proof. Longer explanation is not stronger evidence; the human adjudicates on executed output.

## Step 7: Return

Return accepted active criterion IDs, invalidated proof results, the risk tier, and the evidence package in compact excerpts. The orchestrator owns user routing, archival, correction loops, and every later phase transition. Staging requires exact current-task permission and is not a prerequisite for inspect, extract, or completion.

Return control to the orchestrator, or to the caller for direct manual use. Do not invoke another phase.

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field. Use `evidence_excerpts[]` for the accepted IDs, risk tier, and raw evidence package pointers.

Follow `assets/ORCHESTRATION.md` § Context engineering.
