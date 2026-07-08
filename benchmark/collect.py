#!/usr/bin/env python3
"""Summarize Harbor benchmark arms into one comparison table.

Reads benchmark/jobs/<arm>/result.json files written by run.sh and prints
per-arm: trials, resolved rate, cost, and token usage. No dependencies
beyond the standard library.
"""

import json
import sys
from pathlib import Path


def summarize_arm(result_file: Path) -> dict | None:
    data = json.loads(result_file.read_text())
    trials = data.get("trial_results", [])
    if not trials:
        return None

    n = len(trials)
    solved = 0.0
    unverified = 0
    errors = 0
    cost = 0.0
    input_tokens = 0
    output_tokens = 0

    for trial in trials:
        verifier = trial.get("verifier_result") or {}
        rewards = verifier.get("rewards") or {}
        if rewards:
            solved += max(rewards.values())
        else:
            unverified += 1
        if trial.get("exception_info"):
            errors += 1
        agent = trial.get("agent_result") or {}
        cost += agent.get("cost_usd") or 0.0
        input_tokens += agent.get("n_input_tokens") or 0
        output_tokens += agent.get("n_output_tokens") or 0

    return {
        "arm": result_file.parent.name,
        "trials": n,
        "resolved": solved / n,
        "unverified": unverified,
        "errors": errors,
        "cost_usd": cost,
        "cost_per_solved": (cost / solved) if solved else float("nan"),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }


def main() -> int:
    jobs_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "jobs"
    result_files = sorted(jobs_dir.glob("*/result.json"))
    if not result_files:
        print(f"No result.json files under {jobs_dir}. Run ./run.sh first.")
        return 1

    rows = [r for r in (summarize_arm(f) for f in result_files) if r]
    rows.sort(key=lambda r: r["resolved"], reverse=True)

    header = f"{'arm':<18} {'trials':>6} {'resolved':>9} {'unver':>5} {'err':>4} {'cost $':>8} {'$/solved':>9} {'in tok':>12} {'out tok':>10}"
    print(header)
    print("-" * len(header))
    for r in rows:
        print(
            f"{r['arm']:<18} {r['trials']:>6} {r['resolved']:>8.1%} {r['unverified']:>5} "
            f"{r['errors']:>4} {r['cost_usd']:>8.2f} {r['cost_per_solved']:>9.2f} "
            f"{r['input_tokens']:>12,} {r['output_tokens']:>10,}"
        )

    baseline = next((r for r in rows if r["arm"] == "baseline"), None)
    if baseline and baseline["resolved"] > 0:
        print()
        print("Delta vs baseline (resolved rate):")
        for r in rows:
            if r["arm"] == "baseline":
                continue
            delta = r["resolved"] - baseline["resolved"]
            print(f"  {r['arm']:<18} {delta:+.1%}")

    print()
    print("Read with care: attempts are noisy. Differences smaller than a few points")
    print("on a small task set are not signal. Increase N_TASKS and N_ATTEMPTS before")
    print("drawing conclusions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
