# Todoist Triage (Reference)

This is the overview for calibrated Todoist triage.

The old "classify everything into an action immediately" model is not enough for Michael's workflow. Many Todoist items are shorthand, project residue, or latent strategy questions. The right system is a **copilot** that distinguishes between direct action, missing context, and genuine judgment calls.

## The model

Run triage in this order:

1. Recover context
2. Choose the right decision bucket
3. Recommend the smallest justified next step
4. Capture durable corrections as preference memory
5. Re-test the behavior in fresh sessions

## Read these references in order

1. [triage-policy.md](triage-policy.md)
2. [context-recovery.md](context-recovery.md)
3. [preference-memory.md](preference-memory.md) when the user corrects the system
4. [evals.md](evals.md) when improving or verifying behavior

## Fast rules

- Read comments before destructive recommendations.
- Prefer `needs_context` to a fake high-confidence answer.
- Prefer `needs_user_judgment` when the task encodes a real tradeoff.
- Use `convert_to_project_or_note` for idea fragments, strategy notes, and tasks that should become a better artifact.
- Use `probably_stale_or_close` only with concrete reasons.

## Output checklist

- Specific next step
- Honest confidence
- Evidence used
- Missing context called out when relevant
- No vague filler verbs
