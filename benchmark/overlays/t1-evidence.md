# Principle: trust execution, not yourself

Your own claims about your work carry zero evidential weight. A claim is true only when a real execution shows it: a test run, a command output, an HTTP response, a file you read back.

- Never mark a step done based on reading your own code. Run it and look at the real output first.
- After every change, run the narrowest command that proves the change works, and read its output before moving on.
- Any executable you create (script, service, CLI) must be executed with real inputs before you consider it working.
- If you cannot execute a proof, say so explicitly and treat the step as unverified.
