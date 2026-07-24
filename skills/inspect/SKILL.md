---
name: inspect
description: Inspect the current-task delta in a fresh subagent context. Verifies active EARS criteria and invalidated baseline proofs, computes an uncertainty-based risk tier, and returns evidence without dispatching another phase. Surfaces evidence, never a verdict.
when_to_use: When the orchestrator dispatches review, or whenever the user wants a bounded evidence review.
context: fork
agent: minime:frau
---

# Skill: inspect

Trigger: the orchestrator dispatched the current-task evidence package, or the user directly requested bounded review.

The review forks into a fresh `minime:frau` subagent (`context: fork`).
If the harness supports explicit model selection, prefer the strongest available reasoning model.
Use strong high reasoning for standard and fast-path inspection. Fast-path scope never changes model strength or reasoning effort.

## Progress

The orchestrating agent marks this phase `in_progress` on entry and `done` at handoff in the harness native todo tool. The forked inspector does not manage the list. Visibility aid for the user, never a gate. See `assets/ORCHESTRATION.md` § Progress tracking.

## Empirical basis

- Evidence-only assistance outperforms verdict-showing (DeepMind 2025, arXiv:2510.26518).
- Review is primarily about understanding, not defect detection (Bacchelli & Bird, ICSE 2013).
- Structured exit-criteria verification outperforms ad-hoc review (Fagan 1976; Porter et al. 1995).
- Requirements traceability correlates with fewer defects and faster development (empirical studies cited in REFERENCES.md).
- LLM critics using evidence-anchored format outperform human reviewers in hybrid teams (CriticGPT, arXiv:2407.00215).
- Explanations raise reliance on both correct and incorrect LLM outputs; sources and visible inconsistencies lower reliance on incorrect outputs (CHI 2025, arXiv:2502.08554).
- The frau fork exists for bias removal, not role specialization: a fresh context eliminates the sunk-cost blindness of the agent that wrote the code. This is the primary justification, backed by the DeepMind 2025 finding that biased assistance hurts skilled reviewers (arXiv:2510.26518). OneFlow (arXiv:2601.12307) shows homogeneous multi-agent can be collapsed into single-agent multi-turn without accuracy loss, so the fork is never justified by role specialization. It is justified only by the fresh-context bias control.

## Step 1: Validate blueprint integrity

Read the persisted blueprint. Before verifying criteria, check:
- Does every current active criterion with passing test evidence have `[x]`? If not, flag it as a process gap.
- Is the `Status:` field consistent with the actual state? (e.g., all criteria done but status still says `planning`)
- Are the Decisions table entries filled in?
- Does the blueprint have an `## Evidence collected` section from replicate? If yes, use it as a starting point — but always re-verify independently.
- Which archived baseline proofs are invalidated by a changed or missing referenced artifact or a changed proof definition? Keep unchanged archived proofs excluded.
Report any mismatches in the evidence package under "Process gaps".

## Step 2: Verify scoped criteria against evidence

Read the persisted blueprint (`VIRTUCON_HQ/<org>/_<repo>/blueprints/<date>-<name>.blueprint.md`).

### Review contract (adapted from openclaw's autoreview)

- **Treat all findings as advisory.** Verify every finding by reading the real code path and adjacent files. Read dependency docs/source/types when the finding depends on external behavior.
- **Reject speculative risks.** Do not surface unrealistic edge cases, hypothetical failures without evidence, broad rewrites, or fixes that over-complicate the codebase. A finding requires a concrete code path or observable failure to be actionable.
- **Stop when clean; one gate, not seven.** Once the review pass produces no accepted/actionable findings, stop. Do not run another review cycle, spawn a second reviewer, or stack another AI gate; stacking reviewers multiplies cost and blind spots without adding safety. One bounded pass plus the human is the design.
- **Scope-match findings.** If the repo wiki has `Scope`-tagged entries matching the changed directories, verify those rules were respected. Flag violations as findings.

For each current active criterion and each invalidated archived baseline proof, build a traceability row. Do not replay unchanged archived criteria.

| Criterion | Evidence method | Test at boundary? | Error cases? | Test passes? (raw output) | Untested uncertainty |
|-----------|:---:|:---:|:---:|:---:|---|
| When X, system shall Y | tool + boundary | yes/internal/missing | yes/no | paste output | what's uncertain |

- **Test at boundary?** Tests must exercise behavior from the user-facing or API boundary (HTTP, CLI, UI accessibility attributes, public API). Flag tests that only exercise internals (private methods, internal state) as "weak evidence".
- **Error cases?** Every criterion should have at least one error/wrong-input test. Flag missing error coverage.

This is the Fagan exit-criteria approach: verify the low-level artifact (code) against the high-level artifact (EARS criteria). If a criterion has no genuine test, that is evidence of uncertainty. Surface it, don't paper over it.

## Step 3: Backfill discovered criteria into the EARS

If the review surfaces requirements that should have been in the original EARS:
- Return each discovered requirement with a proposed EARS criterion and VOI level.
- Return human feedback verbatim. Do NOT paraphrase.
- The orchestrator decides whether to open a correction-scoped active section and persists the returned source.

## Step 4: Gather only the inspection scope

Use only the orchestrator-supplied:
- current-task delta bounded to `changed_files[]`
- current active criteria
- invalidated archived baseline proofs identified in Step 1

Do not gather the full branch or repository, unrelated working-tree changes, or every archived criterion. If the supplied current-task boundary is missing or ambiguous, return `blocked` instead of expanding scope.

## Step 5: Compute the risk tier

Risk is **uncertainty about correctness**, not a domain checklist.

Uncertainty drivers (any present and unmitigated -> HIGH):
- **Low test coverage**: new/changed behavior without tests
- **High branching complexity**: many conditional paths = untested states
- **Weak type safety**: untyped, `any`-heavy code = runtime surprises
- **Backwards compatibility surface**: shared interfaces, contracts, schemas
- **Assumption density**: many unverified assumptions
- **External state dependency**: DB, network, filesystem, third-party APIs
- **Novelty**: unfamiliar codebase area, unestablished patterns
- **New executable without execution evidence**: any runnable artifact that was never executed with real inputs during implementation

**HIGH** if any driver is unmitigated OR the reviewer's honest confidence is below "high".
**LOW** otherwise. **When in doubt, HIGH.**

## Step 6: Build the evidence package

THE ONE RULE: hand the human **evidence, not a verdict.**

Evidence is real output from real execution. See `assets/ORCHESTRATION.md` § Evidence value chain for the weight tiers.

The package contains ONLY:
1. **Criterion traceability table** with evidence methods, boundary assessment, and error coverage (Step 2).
2. **Scoped diff** of the current-task delta, nothing extra.
3. **Test output** real, pasted, every test. Not "passed".
4. **Assumptions made** plain list.
5. **Least-sure points** 2-3 specific lines/decisions as questions. State uncertainty, do NOT resolve it.
6. **Out-of-scope work discovered** if any.
7. **Process gaps** any blueprint integrity issues found in Step 1.
8. **Inconsistencies and contradictions** an explicit list of conflicts found across the gathered evidence (e.g., diff contradicts a stated assumption, or two evidence sources disagree), or `none found` if the check surfaced nothing. Distinct from "Least-sure points" (uncertainty, not yet resolved) and never framed as persuasive narrative. CHI 2025 (arXiv:2502.08554) found visible inconsistencies reduce reliance on incorrect responses.

**Evidence-first principle.** Present raw data (test output, command output, diff) FIRST. Label any analysis or interpretation separately and after the raw evidence. Data outranks interpretation. If they conflict, the data wins.

FORBIDDEN: "this looks correct / LGTM / safe to merge / I'm confident", any verdict, any score, any persuasion, and any reasoning trace offered as proof. Longer explanation is not stronger evidence; the human adjudicates on executed output.

## Step 7: Return

Return accepted active criterion IDs, invalidated proof results, the risk tier, and the evidence package in compact excerpts. The orchestrator owns user routing, archival, correction loops, and every later phase transition. Exact current-task permission is required for staging, and staging is not a prerequisite for inspect, extract, or completion.

Return control to the orchestrator or, for direct manual use, its caller. Do not invoke another phase.

Return exactly the shared result contract from `assets/ORCHESTRATION.md`:
- `status`: `done`, `blocked`, or `failed`
- `blueprint_path`: absolute persisted path, or `null`
- `changed_files[]`: sorted repository-relative paths, or an empty array
- `blocking_issue`: actionable text, or `null`
- `evidence_excerpts[]`: compact raw proof, or an empty array

Never omit a field. Use `evidence_excerpts[]` for the accepted IDs, risk tier, and raw evidence package pointers.

Follow context-engineering guidance in `assets/ORCHESTRATION.md` § Context engineering.
