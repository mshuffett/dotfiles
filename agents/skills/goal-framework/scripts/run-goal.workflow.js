export const meta = {
  name: 'run-goal',
  description: 'Pursue a tracked goal until its falsifiable success criterion verifies — the autonomous-pursuit engine the goal skill launches',
  phases: [
    { title: 'Pursue', detail: 'one agent takes the next concrete action' },
    { title: 'Verify', detail: 'an independent skeptic checks the criterion' },
  ],
}

// args arrives as a JSON STRING in this runtime — parse before use.
const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const goalId    = a.goalId        ?? 'unnamed-goal'
const objective = a.objective     ?? ''
const criterion = a.criterion     ?? ''
const workdir   = a.workdir       ?? '.'
const maxIters  = a.maxIterations ?? 6

// Fail-fast: never loop on an empty objective/criterion (the bug that cost 560k tokens once).
if (!objective || !criterion) {
  log(`ABORT [${goalId}]: missing objective or criterion — nothing to pursue.`)
  return { goalId, met: false, iterations: 0, error: 'missing-objective-or-criterion' }
}

const VERDICT = {
  type: 'object',
  required: ['met', 'evidence', 'nextStep'],
  properties: {
    met:      { type: 'boolean', description: 'Is the criterion OBJECTIVELY satisfied right now?' },
    evidence: { type: 'string',  description: 'The concrete check performed: command output, file state, observed value' },
    nextStep: { type: 'string',  description: 'If not met, the single highest-value next action' },
  },
}

const history = []
let verdict = null
let met = false

for (let i = 1; i <= maxIters && !met; i++) {
  if (budget.total && budget.remaining() < 50_000) {
    log(`[${goalId}] stopping at iter ${i}: token budget nearly exhausted`)
    break
  }

  phase('Pursue')
  const progress = await agent(
    `You are pursuing a goal. Work ONLY inside ${workdir}, using absolute paths.\n\n` +
    `GOAL: ${objective}\n` +
    `SUCCESS CRITERION (definition of done): ${criterion}\n\n` +
    `Progress so far:\n${history.map((h, n) => `  ${n + 1}. ${h}`).join('\n') || '  (nothing yet)'}\n\n` +
    (verdict ? `Verifier's last feedback — do this next: ${verdict.nextStep}\n\n` : '') +
    `Take the single most valuable concrete action toward the criterion now, then report what you did and the observable result.`,
    { label: `pursue#${i}`, phase: 'Pursue' }
  )
  history.push(progress)

  phase('Verify')
  verdict = await agent(
    `Adversarially verify whether the success criterion is NOW objectively met. Working dir: ${workdir}.\n\n` +
    `CRITERION: ${criterion}\n\nClaimed progress:\n${progress}\n\n` +
    `Actually check it — run the command, inspect the file/state. Default to met=false unless you have hard evidence.`,
    { label: `verify#${i}`, phase: 'Verify', schema: VERDICT }
  )
  met = !!verdict?.met
  log(`[${goalId}] iter ${i}: met=${met} — ${verdict?.evidence ?? 'no evidence'}`)
}

// Pure return — the SKILL writes this back into the tracking file's check-in log.
return {
  goalId,
  met,
  iterations: history.length,
  finalEvidence: verdict?.evidence ?? null,
  lastNextStep: met ? null : (verdict?.nextStep ?? null),
  history,
}
