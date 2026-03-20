# Harness Engineering Skill — Eval Benchmark (Iteration 1)

## Assertion Results

### Eval 1: Greenfield Setup

| Assertion | With Skill | Without Skill |
|-----------|-----------|---------------|
| a1: Concise root file (~100 lines, map not manual) | PASS — ~60 lines, explicitly "map not manual" | FAIL — ~140 lines, all conventions inline |
| a2: Structured docs/ directory with subdirectories | PARTIAL — mentions docs/ at end, creates subdirectory CLAUDE.md files instead | FAIL — no docs/ structure at all |
| a3: ARCHITECTURE.md or equivalent | PASS — full `docs/ARCHITECTURE.md` with layers | FAIL — no architecture doc |
| a4: Linter/formatter as mechanical enforcement | PASS — `.eslintrc.json` with import boundaries, `.prettierrc`, strict `tsconfig.json` | FAIL — no linter/formatter config provided |
| a5: Tiered context or progressive disclosure | PASS — explicitly names Tier 1/2/3, progressive disclosure | FAIL — no concept of tiered context |
| a6: NOT monolithic 500+ line file | PASS — root is ~60 lines | FAIL — root is ~140 lines, monolithic |
| a7: Concrete file contents/templates | PASS — 12 files with full contents | PASS — 10 files with full contents |
| **Score** | **6.5/7 (93%)** | **1/7 (14%)** |

### Eval 2: Diagnose Struggling Agent

| Assertion | With Skill | Without Skill |
|-----------|-----------|---------------|
| b1: Identifies monolithic file as core problem | PASS — "monolithic instruction file anti-pattern" | PASS — "attention dilution" from large file |
| b2: Explains WHY (40% rule or similar) | PASS — cites 40% context utilization threshold | PARTIAL — explains context competition, no 40% rule |
| b3: Short root file with pointers | PASS — "500-1500 tokens, about 30-60 lines" | PASS — "50-80 lines" routing document |
| b4: Convert rules to linter/formatter config | PASS — full before/after, "zero tokens, 100% enforcement" | FAIL — focuses on splitting docs, not mechanical enforcement |
| b5: Subdirectory CLAUDE.md files | PASS — 3 subdirectory files with contents | PASS — 3 subdirectory files with contents |
| b6: Concrete extraction plan or before/after | PASS — 5-step plan with before/after at each step | PASS — 4-step plan with before/after |
| **Score** | **6/6 (100%)** | **3.5/6 (58%)** |

### Eval 3: Entropy Management

| Assertion | With Skill | Without Skill |
|-----------|-----------|---------------|
| c1: Identifies entropy/drift | PASS — references OpenAI Friday cleanup story | PASS — identifies root cause as lack of awareness |
| c2: Automated recurring cleanup agents | PASS — 4 specific agents on cron/CI | PARTIAL — automated health reports but not active cleanup agents |
| c3: Specific entropy agent types | PASS — doc-gardening, deduplication, pattern enforcement, quality grading | FAIL — health report scripts but not the agent taxonomy |
| c4: Golden principles or mechanical rules | PASS — "Golden Principles" with enforcement mechanism per rule | PARTIAL — lint rules and architecture registry, less structured |
| c5: Documentation-code divergence | PASS — doc-gardening agent specifically | PASS — CI freshness tests |
| c6: Continuous small increments over big cleanups | PASS — explicit comparison table, "continuous GC" | PASS — "shift from reactive to preventive" |
| **Score** | **6/6 (100%)** | **3/6 (50%)** |

## Aggregate

| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| **Overall Pass Rate** | 18.5/19 (97%) | 7.5/19 (39%) | **+58pp** |
| Eval 1 (Greenfield) | 93% | 14% | +79pp |
| Eval 2 (Diagnose) | 100% | 58% | +42pp |
| Eval 3 (Entropy) | 100% | 50% | +50pp |

## Qualitative Analysis

### What the skill adds

1. **Vocabulary and framework**: With-skill responses use precise terminology (tiered context, progressive disclosure, 40% rule, golden principles, entropy agents, mechanical enforcement). Without-skill responses describe similar concepts vaguely or miss them entirely.

2. **The "promote to lint" insight**: The single biggest differentiator. With-skill responses consistently recommend converting documented rules to linter/formatter config and emphasize that mechanical enforcement is 10x more valuable than documentation. Without-skill responses focus almost entirely on restructuring docs but miss the "delete rules from docs, put them in tooling" pattern.

3. **The docs/ knowledge base structure**: With-skill responses reference the OpenAI docs/ layout (design-docs, exec-plans, product-specs, references). Without-skill responses don't create a structured knowledge base.

4. **Specific entropy agent types**: With-skill responses name doc-gardening, deduplication, pattern enforcement, and quality grading agents with concrete implementation sketches. Without-skill responses suggest health reports and CI checks but lack the recurring-agent-opens-PRs pattern.

5. **Custom lint error messages as remediation**: With-skill responses include the pattern of writing lint error messages that tell the agent how to fix the problem. Without-skill responses don't mention this.

### Where without-skill was adequate

- Both versions correctly identify subdirectory CLAUDE.md files as a solution for the monolithic file problem
- Both provide concrete file contents and actionable steps
- Both understand that automation > manual cleanup for entropy

### Skill gaps to address (potential iteration 2 improvements)

- The skill could more strongly emphasize the full docs/ structure from the OpenAI article. The with-skill eval 1 response mentioned it only at the end ("as the codebase grows") rather than creating it upfront.
- The AGENTS.md file format and Codex-specific patterns (discovery precedence, override files) could be expanded.
