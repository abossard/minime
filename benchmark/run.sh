#!/usr/bin/env bash
# Terminal-Bench 2.0 A/B harness for the minime theories.
# Runs one Harbor job per arm, same model and task set, overlay as the only variable.
# Results land in benchmark/jobs/<arm>/result.json. Summarize with: python3 collect.py
set -euo pipefail

cd "$(dirname "$0")"

DATASET="${DATASET:-terminal-bench/terminal-bench-2}"
MODEL="${MODEL:-anthropic/claude-haiku-4-5}"
N_TASKS="${N_TASKS:-10}"
N_ATTEMPTS="${N_ATTEMPTS:-3}"
CONCURRENCY="${CONCURRENCY:-4}"
ARMS="${ARMS:-baseline t1-evidence t2-facts t3-assumptions t4-fresh-review all}"

command -v harbor >/dev/null 2>&1 || {
  echo "harbor not found. Install it with: uv tool install harbor" >&2
  exit 1
}
docker info >/dev/null 2>&1 || {
  echo "Docker is not running. Start Docker and retry." >&2
  exit 1
}
[ -n "${ANTHROPIC_API_KEY:-}" ] || {
  echo "ANTHROPIC_API_KEY is not set." >&2
  exit 1
}

# The all arm concatenates the four theory overlays.
cat overlays/t1-evidence.md overlays/t2-facts.md overlays/t3-assumptions.md overlays/t4-fresh-review.md \
  > overlays/.all.md

for arm in $ARMS; do
  if [ -d "jobs/$arm" ]; then
    echo "skip   $arm (jobs/$arm exists; delete it to re-run)"
    continue
  fi

  overlay=""
  case "$arm" in
    baseline) ;;
    all) overlay="overlays/.all.md" ;;
    *) overlay="overlays/$arm.md" ;;
  esac
  if [ -n "$overlay" ] && [ ! -f "$overlay" ]; then
    echo "unknown arm '$arm' (no $overlay)" >&2
    exit 1
  fi

  args=(
    run
    -d "$DATASET"
    -a claude-code
    -m "$MODEL"
    -l "$N_TASKS"
    -k "$N_ATTEMPTS"
    -n "$CONCURRENCY"
    -o jobs
    --job-name "$arm"
  )
  if [ -n "$overlay" ]; then
    args+=( --ak "append_system_prompt=$(cat "$overlay")" )
  fi

  echo "=== arm: $arm (model=$MODEL tasks=$N_TASKS attempts=$N_ATTEMPTS) ==="
  harbor "${args[@]}"
done

python3 collect.py
