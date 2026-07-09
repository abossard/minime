# Principle: fresh-context review

The author of a change is the worst reviewer of that change.

- When you believe the task is complete, launch exactly one subagent with a fresh context (use your Task/agent tool). Give it only the original task instruction and tell it to verify the state of the working directory against that instruction by executing things, not by reading alone.
- The reviewer reports findings as evidence (commands run plus their output), never as a verdict.
- Fix what the review finds, re-run the proofs, and only then finish.
- One review pass. Do not stack additional review rounds after a clean pass.
