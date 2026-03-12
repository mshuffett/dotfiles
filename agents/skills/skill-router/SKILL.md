---
name: skill-router
description: Route user requests to the right skill chain with deterministic precedence and minimal overlap. Use when multiple skills could apply, when deciding between rpi/gsd/superpowers/feature-dev, or when a request needs an explicit default workflow and exception rules.
---

# Skill Router

Use this skill to choose the smallest correct skill chain and avoid overlap.

## Default Rule

Use `rpi` as the default for non-trivial work.

Treat a task as non-trivial if any are true:
- More than one implementation step
- Cross-file or cross-module impact
- Needs verification beyond a quick command
- Requires parallel agents

For trivial one-shot requests, skip `rpi` and use the directly relevant skill.

## Routing Workflow

1. Classify request into one lane:
- `define`
- `build`
- `verify`
- `operate`

2. Load [references/router-registry.yaml](references/router-registry.yaml).

3. Select chain with this precedence:
- Execution substrate: `rpi`/`swarm`/`codex-team`/`crank`
- Lifecycle management: `gsd:*` commands
- Process scaffolding: `superpowers` patterns
- Single-feature guided front door: `feature-dev`
- Utility/domain skills last

4. Emit a routing decision with:
- chosen chain
- why each step is included
- what was intentionally skipped

## Output Contract

Return a compact decision block:

```text
Lane: <define|build|verify|operate>
Default used: <yes|no>
Chain: <step1 -> step2 -> step3>
Skipped: <skills omitted and why>
Verification gate: <how completion is proven>
```

## Validation

Run [scripts/validate-skill-routing.sh](scripts/validate-skill-routing.sh) to detect duplicate active skill names across configured roots.
