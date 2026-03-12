---
name: writing-iteration-loop
description: >-
  Use when iteratively improving any prose document through multiple revision
  passes with dual-reviewer subagents. Especially useful for cover letters, but
  works for essays, reports, grant applications, speeches, or any writing that
  benefits from systematic refinement. Use when the user says "improve this",
  "make this better", "iterate on this", "run it through reviewers", "polish
  this writing", or "keep refining until it's ready". Invokes the
  writing-clearly-and-concisely skill internally and uses parallel subagent
  reviewers that iterate until convergence.
---

# Writing Iteration Loop

Systematically improve prose through parallel dual-reviewer subagents that iterate until the writing stabilizes. Each pass applies style rules (Strunk) and domain-specific quality criteria, producing a versioned trail of improvements.

## When to Use

- Improving a cover letter, essay, report, grant application, speech, or any prose
- The user wants iterative refinement ("keep going until it's good")
- The user provides source documents to align the writing with (job descriptions, brochures, decks)
- After a first draft, when the writing needs systematic tightening

## Prerequisites

This skill depends on `writing-clearly-and-concisely` for style rules. If it's available as a project or global skill, reference it. If not, read `references/strunk-composition-rules.md` bundled with this skill for the core rules.

## Workflow

### Phase 1: Gather Inputs

Collect these before starting:

1. **The document** to improve (the prose itself)
2. **Source documents** (optional but high-value): job descriptions, position brochures, company decks, RFPs, grant guidelines — anything that defines what "good" means for this context
3. **Quality criteria** appropriate to the document type (see Domain References below)

If source documents are provided as PDFs or long files, dispatch subagents to extract relevant intelligence into markdown notes before starting the loop:

```
Extract from [document]:
- Key requirements, qualifications, or evaluation criteria
- Exact terminology and framing used
- Data points, statistics, or facts that could strengthen the writing
- Names, titles, organizations mentioned
Write findings to [filename]-notes.md
```

### Phase 2: Initial Analysis

Before the first revision, analyze the document against:

1. **Style rules** — Read `writing-clearly-and-concisely` skill (or `references/strunk-composition-rules.md`). Focus on Rules 10-18 (composition principles). Flag specific violations.
2. **Domain criteria** — Apply the relevant quality checklist (see Domain References).
3. **Source alignment** — If source documents exist, identify gaps: terminology not used, requirements not addressed, data not deployed.

Write v2 incorporating all findings. Save as `[document]-v2.md`.

### Phase 3: Dual-Reviewer Iteration Loop

This is the core of the skill. Run two independent reviewer subagents in parallel on each version. They must not share context — this prevents groupthink and catches different classes of issues.

#### Reviewer A: Style Copy Editor

```
You are a copy editor applying Strunk's Elements of Style to prose.

Read the style rules in [path to strunk rules].

Review this document: [current version]

For each issue found, cite the specific rule number and explain the fix.
Apply these categories:
- CRITICAL: Changes that fix errors or significantly improve clarity
- SUGGESTED: Changes that tighten or polish

If you find no critical issues, respond with: READY
Otherwise, list your edits as: [original] → [revision] (Rule N: reason)
```

#### Reviewer B: Domain Quality Evaluator

```
You are a [domain] quality evaluator.

Review this [document type] against these criteria:
[Insert quality checklist for the domain — see Domain References]

Also check alignment with these source documents:
[Insert extracted notes from source documents]

For each issue, explain what's missing or weak and suggest a fix.
If the document meets all criteria, respond with: READY
Otherwise, list issues ranked by impact.
```

#### The Loop

```
repeat:
  1. Dispatch Reviewer A and Reviewer B in parallel on current version
  2. Collect both reviews
  3. If BOTH say READY → stop, current version is final
  4. Otherwise:
     a. Synthesize feedback from both reviewers
     b. Apply changes, resolving any conflicts (style wins for wording, domain wins for content)
     c. Save as [document]-v{N+1}.md
     d. Increment version, go to step 1

  Safety: stop after 8 iterations regardless (diminishing returns)
```

#### Convergence Signals

Stop the loop when:
- Both reviewers say READY in the same round
- Reviewers are only suggesting trivial changes (word swaps, comma preferences)
- The document has not materially changed between two consecutive versions
- You've hit 8 iterations

### Phase 4: Produce Outputs

After stabilization:

1. **Final version**: `[document]-final.md`
2. **Change report** (optional): Use `prose-diff-review` skill if available, or write a markdown change report comparing v1 to final
3. **Diff review page** (optional): Generate the interactive HTML diff page per `prose-diff-review`

## Domain References

### Cover Letters

Quality checklist for Reviewer B when the document is a cover letter:

1. Opens with a hook, not "I am writing to apply"
2. Does not start with "I" as the first word
3. Mentions specific knowledge about the organization/role
4. Connects experience directly to job requirements with specifics
5. Includes at least one concrete metric or achievement
6. Addresses obvious qualification gaps (if any)
7. Confident but not arrogant tone
8. Ends with a clear call to action naming a specific person if known
9. 250-400 words, 3-4 paragraphs
10. No AI writing patterns (puffery, empty -ing phrases, promotional adjectives)

Additional cover letter signals to check:
- **Cultural equity / DEI language**: If the position emphasizes equity, ensure the letter signals it authentically (not performatively)
- **Exact terminology**: Use the position's own terms (e.g., "change management", "cultural equity", "essential infrastructure") — don't paraphrase what should be mirrored
- **Named specifics**: Name the organization's programs, leaders, or initiatives rather than referring to them generically
- **Economic/data case**: If source documents provide data (budgets, ROI, impact stats), deploy them in the letter — data persuades where assertions don't

For the full cover letter framework, see the `cover-letter-generator` skill if installed, or `references/cover-letter-framework.md`.

### Essays / Reports

Quality checklist for Reviewer B when the document is an essay or report:

1. Clear thesis or central argument stated early
2. Each paragraph has a topic sentence that advances the argument
3. Evidence supports claims (not just assertions)
4. Logical flow between paragraphs (transitions earn their place)
5. Conclusion does more than restate the introduction
6. Appropriate tone for the audience
7. No filler paragraphs or sections that don't advance the argument

### Grant Applications / RFPs

Quality checklist for Reviewer B:

1. Directly addresses every evaluation criterion in the RFP
2. Uses the funder's terminology and framing
3. Budget/resource claims are specific and justified
4. Theory of change or logic model is clear
5. Differentiators are concrete, not generic
6. Compliance requirements met (word count, formatting, required sections)

## Subagent Dispatch Pattern

When dispatching reviewer subagents, include:
- The full text of the current version
- The relevant rules/checklist (inline, not as a file path — subagents may not have file access)
- Source document notes (if any)
- Clear instruction on the READY signal

Run both reviewers in parallel using the Task tool. Each should be a separate subagent with `subagent_type: "general-purpose"` and `model: "sonnet"` (fast enough for review, saves cost).

## Tips

- **Don't over-iterate.** Most documents stabilize in 3-5 passes. If you're on iteration 7 and still getting material changes, something is wrong with the criteria — step back and re-examine.
- **Preserve voice.** The goal is to sharpen the author's voice, not replace it. If the original has a distinctive style, protect it.
- **Source documents are high-leverage.** A cover letter that mirrors the position brochure's exact terminology will outperform one that paraphrases. Extract and deploy.
- **Version trail is valuable.** Keep every version. The user may prefer v4 over v7 for a particular paragraph.
