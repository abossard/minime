# minime theory benchmark

A locally runnable Terminal-Bench 2.0 setup that A/B tests the theories this
harness builds on. The agent (Claude Code) and model stay constant across all
arms. The only variable is a short principle overlay appended to the system
prompt, so any score difference is attributable to the principle itself.

## The theories under test

| Arm | Theory | Overlay |
|-----|--------|---------|
| `baseline` | none (control) | none |
| `t1-evidence` | The agent should not trust itself, only working applications and real output | `overlays/t1-evidence.md` |
| `t2-facts` | The agent makes better decisions when it must decide with facts or data | `overlays/t2-facts.md` |
| `t3-assumptions` | The agent makes fewer critical assumptions when it must reveal its assumptions | `overlays/t3-assumptions.md` |
| `t4-fresh-review` | Quality improves when a fresh agent reviews the work | `overlays/t4-fresh-review.md` |
| `all` | all four combined | generated at run time |

The overlays are distilled from the minime skills (replicate's evidence loop,
the VOI gate, blueprint's assumption surfacing, and the frau inspection fork).
They are injected via `--append-system-prompt` instead of installing the full
plugin because benchmark containers have no session hook, no VIRTUCON_HQ, and
no human to answer `ask_user`. This isolates the principles from the plumbing.

## Prerequisites

- Docker running locally
- [Harbor](https://harborframework.com) (the Terminal-Bench 2.0 runner): `uv tool install harbor`
- `ANTHROPIC_API_KEY` exported

Smoke-test the setup first (runs reference solutions, no LLM cost):

```bash
harbor run -d terminal-bench/terminal-bench-2 -a oracle -l 5
```

## Run

```bash
cd benchmark
./run.sh
```

Defaults: `claude-haiku-4-5`, 10 tasks, 3 attempts per task, all six arms.
Override via environment variables:

```bash
MODEL=anthropic/claude-sonnet-4-5 N_TASKS=30 N_ATTEMPTS=5 ./run.sh   # bigger run
ARMS="baseline t4-fresh-review" ./run.sh                             # two arms only
```

Each arm is one Harbor job under `jobs/<arm>/`. An arm that already has a
`jobs/<arm>` directory is skipped, so you can add arms incrementally; delete
the directory to re-run one.

## Results

```bash
python3 collect.py
```

Prints per arm: trials, resolved rate, error count, total cost, cost per
solved task, and token usage, plus each arm's delta against baseline.
Raw logs, per-trial trajectories, and verifier output live under
`jobs/<arm>/`.

## Reading the numbers

- **Paired, not absolute.** Only compare arms from the same run (same model,
  same task list, same attempt count). Leaderboard numbers are not comparable.
- **Variance is real.** With 10 tasks x 3 attempts, differences under roughly
  5 points are noise. For a decision you trust, use 30+ tasks and 5 attempts.
- **Cost matters as much as pass rate.** A principle that holds pass rate
  while cutting cost per solved task is a win. Watch `$/solved`.
- **Rough cost guide**: 10 tasks x 3 attempts x 6 arms on Haiku is a few
  dollars; the same on Sonnet is on the order of tens of dollars.

## What this does not measure

Two minime claims need a different design and are out of scope here:

1. **Inspect-gate calibration** (does HIGH/LOW routing match reality) needs
   seeded-defect tasks and a human-gate stub.
2. **Wiki/memory payoff** needs repeated tasks on the same repository so
   extract's lessons can compound.

Both can be layered on later; this setup answers the prior question of
whether the four behavioral principles move the needle at all.
