# Blueprint: <short-name>

Created: <YYYY-MM-DD HH:MM ±TZ>  |  Status: planning  |  Repo: <org>/<repo>

<!-- Authoring guide. Fill every section in the order below, then delete every HTML comment and
     every <angle-bracket> placeholder before handoff.
     The Minime canvas parser (`.github/extensions/minime-flow/lib/blueprints.mjs`) reads
     `## Goal` and `## Active criteria` byte-exact. Keep those two headings unchanged. -->

## Goal

<2-4 sentences. The outcome and why it matters. Not how.>

## Active criteria

### Correction <C0>: <short correction name>

#### Correction source

> <the exact task or correction words, unmodified>

<!-- Only this correction's new, failed, or invalidated criteria belong here.
     Completed criteria from earlier corrections stay in the archive. -->

<!-- EARS patterns. Each criterion collapses to one checkable claim:
       Ubiquitous:  The system shall <requirement>.
       Event:       When <trigger>, the system shall <response>.
       State:       While <state>, the system shall <response>.
       Conditional: If <condition>, then the system shall <response>.
       Optional:    Where <feature included>, the system shall <response>.
     Quality check before planning:
       - one verifiable behavior per criterion
       - an explicit `When ... shall ...` trigger for event-driven behavior
       - `If ... then ... shall ...` for edge and error behavior
       - outcomes rather than code structure
       - an evidence method naming tool, boundary, and pass/fail signal
       - evidence at the user-facing or API boundary
       - one nameable test per criterion -->

- [ ] `<C0-1>` <criterion> | VOI: <decided-by-data|needs-research|undecidable-now> | Evidence: <tool, boundary, pass/fail>
- [ ] `<C0-2>` <criterion> | VOI: <decided-by-data|needs-research|undecidable-now> | Evidence: <tool, boundary, pass/fail>

## Criteria archive

<!-- Append a record only after fresh inspect accepts a criterion, then remove its active record
     and its inline raw evidence. Hash artifact bytes with SHA-256. For multiple artifacts, hash a
     sorted manifest of repository-relative path plus each file's SHA-256. Hash the exact compact
     raw proof bytes before removing them. Prefix both hashes with `sha256:`.
     Write one line stating the absence while the table is empty. -->

| ID | Correction | Criterion | Artifact refs | Artifact hash | Evidence method | Evidence hash | Completed |
|----|------------|-----------|---------------|---------------|-----------------|---------------|-----------|

## Plan summary

<!-- Files to touch, implementation order, fix shape per area, what proves each criterion,
     and the wiki constraints that shaped the plan. -->

| Order | File | Change |
|------:|------|--------|
| 1 | `<path>` | <change> |

## Constraints / non-negotiables

<!-- Concrete rules replicate re-injects mid-implementation: budgets, libraries, patterns to follow. -->

- <constraint>

## Out of scope

- <explicit non-goal>

## User's original request

<!-- The user's exact words. Append later corrections; edit nothing. -->

> <the user's exact request>

## Decisions made

| Unknown | VOI level | Resolution | Source |
|---------|-----------|------------|--------|
| <unknown> | <level> | <resolution> | <file:line or command output> |

## Relevant verified wiki entries

<!-- Only entries selected for this task. Tag each `active`, `stale`, or `superseded` against live code. -->

- **<status>** `<wiki path>`: <claim>. Verified against `<file:line>`.

## Research resolved

- <needs-research item and the raw proof that closed it>

## Discovered skills and agents

<!-- Include the writing skills applied to this document, or state that none was available. -->

- `<skill or agent>`: <why it matters here>
- Writing skills applied: <skills, or `none available; readability contract applied`>

## Evidence collected

- <compact raw excerpt or command output>

## Test strategy critique

- <rubber-duck finding per criterion, including the meaningful edge case>

## Self-challenge

- Riskiest assumption: <text>
- When this approach is wrong: <text>
- Remaining ambiguity: <text>

## Handoff

Invoke `skill("replicate")` with this blueprint path.

## Discovered during review

<!-- Criteria surfaced by review feedback that belonged in the original EARS.
     Each gets its own checkbox and VOI level. -->

None.

## User feedback

<!-- Exact user feedback with timestamps. Append, never edit or reinterpret. -->

None.
