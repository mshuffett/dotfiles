# Harness Engineering Audit Checklist

Use this checklist to assess a repo's agent-readiness. Score each area 0-2:
- **0** = Missing or broken
- **1** = Exists but incomplete or stale
- **2** = Solid, enforced, up-to-date

Total score interpretation:
- **0-6**: Minimal harness — agents will struggle significantly
- **7-12**: Partial harness — agents can handle simple tasks
- **13-18**: Strong harness — agents can work semi-autonomously
- **19-24**: Production-grade — agents can operate with minimal supervision

---

## 1. Agent Documentation (0-2)

- [ ] `CLAUDE.md`, `AGENTS.md`, or equivalent exists at repo root
- [ ] Contains: project overview, directory structure, key commands
- [ ] Contains: architectural constraints and module boundaries
- [ ] Is concise (under 2000 tokens for Tier 1)
- [ ] Last updated within the past 3 months
- [ ] Subdirectory-level docs exist for complex modules

**Score**: ___

## 2. Linting & Formatting (0-2)

- [ ] Linter configured (ESLint, Ruff, clippy, etc.)
- [ ] Formatter configured (Prettier, Black, rustfmt, etc.)
- [ ] Linter runs in CI on every PR
- [ ] Linter rules cover architectural constraints (import boundaries, naming)
- [ ] Pre-commit hooks enforce lint + format

**Score**: ___

## 3. Type Safety (0-2)

- [ ] Type system enabled (TypeScript strict, Python type hints + mypy/pyright, etc.)
- [ ] Type checks run in CI
- [ ] Module boundaries expressed through types/interfaces
- [ ] No widespread `any` / `# type: ignore` / `as unknown` escape hatches

**Score**: ___

## 4. Test Infrastructure (0-2)

- [ ] Tests exist and pass
- [ ] Full suite runnable with a single command (documented in agent docs)
- [ ] Tests cover critical paths, not just happy paths
- [ ] Test output is grep-friendly (clear pass/fail, error messages on single lines)
- [ ] Integration/E2E tests exist for key workflows

**Score**: ___

## 5. Architecture Clarity (0-2)

- [ ] Clear module/package boundaries visible from directory structure
- [ ] Dependency direction is documented and enforced
- [ ] Shared types/interfaces live in dedicated locations
- [ ] No circular dependencies
- [ ] Entry points are obvious (main files, route handlers, etc.)

**Score**: ___

## 6. Context Accessibility (0-2)

- [ ] Key architectural decisions are in the repo (ADRs, design docs, or code comments)
- [ ] No critical knowledge trapped only in Slack, Confluence, or meetings
- [ ] Environment setup documented and reproducible
- [ ] API contracts/schemas are machine-readable (OpenAPI, protobuf, etc.)
- [ ] Error messages are descriptive and actionable

**Score**: ___

## 7. CI/CD Pipeline (0-2)

- [ ] CI runs on every PR
- [ ] CI checks: lint, type-check, test, build
- [ ] CI feedback is fast (under 10 minutes for core checks)
- [ ] CI output clearly identifies what failed and why
- [ ] Deployment is automated or well-documented

**Score**: ___

## 8. Feedback Loops (0-2)

- [ ] Agents can run tests locally before pushing
- [ ] Agents can run linters locally before committing
- [ ] Build errors surface during development, not just in CI
- [ ] Observability data (logs, metrics) is accessible for debugging
- [ ] PR templates or checklists guide verification

**Score**: ___

## 9. Entropy Controls (0-2)

- [ ] Code review process exists (human or automated)
- [ ] Architectural metrics tracked (complexity, coupling, coverage)
- [ ] Periodic cleanup or audit process exists
- [ ] Stale code/docs have a removal process
- [ ] Pattern violations are caught proactively, not just reactively

**Score**: ___

## 10. Agent Specialization Readiness (0-2)

- [ ] Tasks can be scoped to specific modules/directories
- [ ] Read-only exploration is possible without risk of side effects
- [ ] Write access can be restricted to specific paths
- [ ] Parallel work on different modules won't cause conflicts
- [ ] Agent output can be verified independently per task

**Score**: ___

## 11. Persistent Memory (0-2)

- [ ] Research/analysis docs accumulate in a known location
- [ ] Decision log or ADR system captures "why" behind choices
- [ ] Progress on multi-session work is trackable from the filesystem
- [ ] No critical state trapped in conversation history alone

**Score**: ___

## 12. Console & Output Hygiene (0-2)

- [ ] Minimal console noise during normal operations
- [ ] Error formats are single-line and grep-friendly
- [ ] Build/test output is structured (not walls of text)
- [ ] Large outputs are paginated or summarized
- [ ] Agent-relevant status is surfaced clearly

**Score**: ___

---

## Generating Recommendations

After scoring, prioritize fixes by:

1. **Highest-impact, lowest-effort first** — Adding a CLAUDE.md takes 30 minutes and immediately helps
2. **Mechanical enforcement over documentation** — A linter rule beats a paragraph of instructions
3. **Feedback loops over constraints** — An agent that can self-verify is more reliable than one with more rules
4. **Progressive improvement** — Don't try to build a Level 3 harness in one pass; start at Level 1 and iterate
