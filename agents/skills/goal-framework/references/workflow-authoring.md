# Authoring a pursuit workflow

When a goal is agent-actionable, write a workflow that drives it to its verified criterion. Do not force every goal into one shape. Write the workflow that fits the goal, following the rules below.

## Rules (these are the gotchas; obey all five)

1. `args` arrives as a JSON **string**. Parse it first: `const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})`.
2. Scripts have **no filesystem access**. Agents do file work. The skill writes results back to the tracking file.
3. **Bound** the iterations. Add a **fail-fast guard** that returns immediately on empty objective or criterion. An unbounded loop on a bad input once cost 560k tokens.
4. The verifier returns a **schema** and checks reality. Default `met=false` without hard evidence. Never let the verifier rubber-stamp the pursue agent's claim.
5. `meta` is a **pure literal** and the first thing in the file. No variables or interpolation inside it.

## Choosing a shape

| Goal shape | Example below |
|------------|---------------|
| one end-state to reach | Example 1: pursue-verify loop |
| several independent checks | Example 2: parallel sub-criteria |
| a number against a target | Example 3: measure-act loop |

Pick the closest. Adapt it. If none fit, write your own following the rules.

## Example 1: single milestone (pursue, then verify, loop to done)

```js
export const meta = {
  name: 'run-goal',
  description: 'Pursue a goal until its falsifiable criterion verifies',
  phases: [{ title: 'Pursue' }, { title: 'Verify' }],
}
const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const { objective, criterion, workdir = '.', maxIterations = 6 } = a
if (!objective || !criterion) return { met: false, error: 'missing-objective-or-criterion' }

const VERDICT = { type: 'object', required: ['met', 'evidence', 'nextStep'], properties: {
  met: { type: 'boolean' }, evidence: { type: 'string' }, nextStep: { type: 'string' } } }

const history = []; let verdict = null, met = false
for (let i = 1; i <= maxIterations && !met; i++) {
  phase('Pursue')
  const progress = await agent(
    `Pursue this goal in ${workdir} (absolute paths only).\nGOAL: ${objective}\nDONE WHEN: ${criterion}\n` +
    `So far:\n${history.join('\n') || '(nothing)'}\n` +
    (verdict ? `Do next: ${verdict.nextStep}\n` : '') +
    `Take the single most valuable action now. Report what you did and the observable result.`,
    { label: `pursue#${i}`, phase: 'Pursue' })
  history.push(progress)
  phase('Verify')
  verdict = await agent(
    `Verify the criterion is NOW met in ${workdir}.\nCRITERION: ${criterion}\nClaimed: ${progress}\n` +
    `Actually check it. Default met=false without hard evidence.`,
    { label: `verify#${i}`, phase: 'Verify', schema: VERDICT })
  met = !!verdict?.met
}
return { met, iterations: history.length, finalEvidence: verdict?.evidence, history }
```

## Example 2: milestone with N independent sub-criteria

Same `meta` / args-parse / `VERDICT` header as Example 1, then:

```js
const subs = a.subCriteria  // [{ id, objective, criterion }, ...]
const results = await pipeline(subs,
  s => agent(`Pursue: ${s.objective}\nDONE WHEN: ${s.criterion}\nWork in ${a.workdir}.`,
             { phase: 'Pursue', label: `pursue:${s.id}` }),
  (progress, s) => agent(`Verify "${s.criterion}". Claimed: ${progress}. Default met=false.`,
             { phase: 'Verify', label: `verify:${s.id}`, schema: VERDICT }))
return { met: results.every(r => r?.met), subs: results.map((r, i) => ({ id: subs[i].id, ...r })) }
```

## Example 3: metric goal (measure, act if short, re-measure)

Same header, plus a numeric verdict:

```js
const MEASURE = { type: 'object', required: ['value', 'evidence'], properties: {
  value: { type: 'number' }, evidence: { type: 'string' } } }
const { measureInstruction, target, workdir = '.', maxIterations = 5 } = a
let last = null
for (let i = 1; i <= maxIterations; i++) {
  phase('Verify')
  const m = await agent(`Measure, change nothing: ${measureInstruction}. Return the number.`,
                        { label: `measure#${i}`, phase: 'Verify', schema: MEASURE })
  last = m
  if (m.value >= target) return { met: true, value: m.value, evidence: m.evidence }
  phase('Pursue')
  await agent(`Metric is ${m.value}, target ${target}. Take one concrete action in ${workdir} to close the gap.`,
              { label: `act#${i}`, phase: 'Pursue' })
}
return { met: false, value: last?.value, evidence: last?.evidence }
```

## Do not

- Do not set `model: 'fable'` on fan-out agents. It is the most expensive tier.
- Do not skip the fail-fast guard. A bad input should cost milliseconds, not a full loop.
- Do not trust the pursue agent's claim. The verifier checks the world.
