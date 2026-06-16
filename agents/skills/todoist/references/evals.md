# Todoist Triage Evals

Use this when improving Todoist triage behavior or validating that a new rule generalizes.

## Two eval tracks

Run both tracks. A system that only scores action correctness will learn false confidence.

### 1. Behavior evals

Question:

- Given enough context, does the model choose the right bucket and next step?

Score:

- bucket correctness
- action specificity
- evidence use
- task-to-note/project conversion quality
- cross-app action readiness when the task requires Gmail / notes / Notion context

### 2. Calibration evals

Question:

- Given incomplete context, does the model recover context or ask instead of hallucinating?

Score:

- chooses `needs_context` when appropriate
- chooses `needs_user_judgment` when appropriate
- names the missing information precisely
- avoids fake certainty

### 3. Cross-app recovery evals

Question:

- Given only a Todoist task, does the model recover the relevant people/project context from other systems and produce the right reversible next action?

Score:

- searches the right systems without being told the answer
- identifies the named person and relationship context
- connects recovered evidence to the task intent
- drafts the outbound message when justified
- prepares a task comment with reasoning and draft
- asks before modifying Todoist or creating/sending email

## Failure taxonomy

Tag each failure with one primary cause:

| Tag | Meaning |
|-----|---------|
| `bad_policy` | The rule itself is wrong or underspecified |
| `missing_context` | The task needed more evidence than was used |
| `retrieval_failure` | The right evidence existed but was not recovered |
| `memory_drift` | Preference memory failed to carry forward cleanly |
| `overfit_rule` | A correction was promoted too broadly |
| `format_only` | Output looked polished but did not improve decision quality |
| `unsafe_action` | The model modified Todoist/Gmail without explicit approval |

## Dataset shape

The v2 triage dataset lives at `fixtures/triage-evals.v2.json`.
Cross-app recovery cases live at `fixtures/private/cross-app-context-evals.json` (gitignored — contains real PII).

Each eval should include:

- raw task
- visible extra context
- gold bucket
- gold next step
- whether the case is behavior or calibration focused
- acceptable alternatives when there is more than one good answer

## Review standard

For each eval, ask:

1. Did it choose the right bucket?
2. If direct action was recommended, was it specific?
3. If confidence was high, was that justified?
4. If context was missing, did it say what was missing?
5. Would this still work in a fresh session?

## Fresh-session requirement

Do not trust:

- "worked after a long back-and-forth"
- "the model remembered from earlier in the same session"

Trust:

- paired runs in fresh sessions
- eval results using only the intended skill references and preference entries
- repeated success on newly added examples

## Practical loop

1. Add or update a small set of labeled examples.
2. Run the triage prompt cold.
3. Review failures by taxonomy.
4. Update the smallest artifact that should change:
   - policy
   - context recovery
   - preference memory
   - eval set
5. Re-run fresh.
