# Blueprint: <short-name>

Created: <date>  |  Status: planning  |  Repo: <org/repo>

## User's original request (verbatim; do not edit or interpret)
> <paste the user's exact words here, unmodified>

## Goal
<2–4 sentences. What outcome, and why. Not how.>

## Active criteria

### Correction <C0>: <short correction name>

#### Correction source (verbatim; do not edit or interpret)
> <paste the exact task or correction words here, unmodified>

Only this correction's new, failed, or invalidated criteria belong here. Do not copy completed criteria from earlier corrections back into this section.

#### EARS criteria (each must be independently testable)

Patterns: each criterion collapses to one checkable claim:
- Ubiquitous:  The system shall <requirement>.
- Event:       When <trigger>, the system shall <response>.
- State:       While <state>, the system shall <response>.
- Conditional: If <condition>, then the system shall <response>.
- Optional:    Where <feature included>, the system shall <response>.

- [ ] <criterion 1> | VOI: <level> | Evidence: <tool, boundary, pass/fail>
- [ ] <criterion 2> | VOI: <level> | Evidence: <tool, boundary, pass/fail>
- [ ] <criterion 3> | VOI: <level> | Evidence: <tool, boundary, pass/fail>

#### EARS quality check (quick self-check before planning)
- Each criterion has exactly one verifiable behavior.
- At least one criterion uses an explicit trigger (`When ... shall ...`) when behavior is event-driven.
- Edge/error behavior is captured with `If ... then ... shall ...` when relevant.
- Wording avoids implementation details (state outcomes, not code structure).
- **Every criterion has an evidence method** specifying tool, boundary layer, and pass/fail definition.
- **Evidence targets the user-facing or API boundary**, not internal implementation details.
- A test can be named for each criterion without adding extra interpretation.

## Criteria archive

Move a criterion here only after fresh inspect accepts it. Remove its active record and raw inline evidence after sealing the hashes.

| ID | Correction | Criterion | Artifact refs | Artifact hash | Evidence method | Evidence hash | Completed |
|----|------------|-----------|---------------|---------------|-----------------|---------------|-----------|

Hash artifact bytes with SHA-256. For multiple artifacts, hash a sorted manifest of repository-relative path plus each file's SHA-256. Hash the exact compact raw proof bytes before removing them. Prefix both hashes with `sha256:`.

## Out of scope
<Explicitly list what NOT to touch. Prevents scope drift.>

## Constraints / non-negotiables
<Perf budgets, libraries to use or avoid, patterns to follow. The agent
re-injects these mid-implementation, so be concrete.>

## Decisions made
| Unknown | VOI level | Resolution | Source |
|---------|-----------|------------|--------|
| | | | |

## Discovered during review
<!-- Criteria surfaced by review feedback that should have been in the original EARS.
     Each gets its own checkbox and VOI level. -->

## User feedback (verbatim; append, never edit or reinterpret)
<!-- Paste exact user feedback as received, with timestamps. This is raw signal. -->

---
**Principles**: preserve raw user words, derive actions separately, assess with evidence.
This file lives at `VIRTUCON_HQ/<org>/_<repo>/blueprints/<date>-<short-name>.blueprint.md` and
is the durable state bus for orchestrator-owned phase transitions. Phase workers return to the
orchestrator and never invoke a successor. Checkmarks track active correction progress;
VOI levels track how each unknown was resolved.
