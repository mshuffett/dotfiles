# Evolutionary Meta-Orchestrator

This orchestrator evolves agentic workflows through iterative improvement.

## Configuration
Read `.meta/config.md` for:
- Task specification (what to implement)
- Approaches to run
- Grading rubric
- Target score

## Output Locations
- `.meta/scratchpad.md` — Running state and progress
- `.meta/iteration.txt` — Current iteration number
- `.meta/results/grades-{N}.md` — Grades per iteration
- `.meta/results/analysis-{N}.md` — Error analysis per iteration
- `.meta/approaches/evolved-{N}/` — Evolved configs per iteration

## Workflow
1. 🎯 Orchestrator launches approaches in parallel
2. 📊 Grader scores each against rubric
3. 🔬 Analyzer identifies failure patterns
4. 🧬 Evolver generates improved approach
5. Loop until target score achieved
