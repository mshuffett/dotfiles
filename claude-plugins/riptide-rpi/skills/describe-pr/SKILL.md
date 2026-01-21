---
name: describe-pr
description: Generate PR Description in CI (no user input)
---

# Generate PR Description

You are tasked with generating a comprehensive pull request description using the repository's standard template with rich linking and deviation analysis.

## Steps to follow:

1. **Read the PR description template:**

   `Read({SKILLBASE}/references/pr_description_template.md)`

2. **Identify the PR to describe:**
   - Check if the current branch has an associated PR: `gh pr view --json url,number,title,state,headRefName 2>/dev/null`
   - If no PR exists for the current branch, list open PRs: `gh pr list --limit 10 --json number,title,headRefName,author`
   - Select or ask about the target PR

3. **Gather PR metadata:**
   - Get PR info: `gh pr view {number} --json url,number,title,state,baseRefName,headRefName,commits,files`
   - Get repo info: `gh repo view --json owner,name`
   - Store the PR URL for diff link generation

4. **Discover task directory and ticket:**
   - Get branch name from PR: extract `headRefName` from step 2
   - Extract task slug (strip prefix before `/`, e.g., `dexter/eng-2612-feature` -> `eng-2612-feature`)
   - Extract ticket ID (e.g., `ENG-2612` or `LL-25` from the slug)
   - Check for task directory: `ls rpi/tasks/ | grep -i "{ticket-id}"`
   - [if applicable] Get Linear ticket URL: `linear get-issue-v2 {TICKET_ID} --fields url 2>/dev/null`
       - if linear tools not found or ticket not found, skip this step that's fine
   - If task directory exists, set `TASK_DIR` and generate permalink:
     `rpi permalink rpi/tasks/{task-dir-name}`

5. **Generate diff URLs:**
   - Run: `scripts/pr_diff_urls.sh {pr_number}`
   - Store the output for use in the description

6. **Gather comprehensive PR information:**
   - Get full PR diff: `gh pr diff {number}`
   - Read through the entire diff carefully
   - For context, read any files referenced but not shown in the diff
   - Understand the purpose and impact of each change
   - Identify user-facing changes vs internal implementation details

7. **Analyze for plan deviations (if plan file exists):**
   - Check if task directory has a plan file: `ls rpi/tasks/{task-dir}/*-plan.md 2>/dev/null`
   - If plan file exists, use the Task tool with `subagent_type=implementation-reviewer`:
     ```
     Analyze deviations between the plan at rpi/tasks/{task-dir}/{plan-file}
     and the current implementation. Compare against the base branch.
     ```
   - Include the agent's output in the "Deviations from the plan" section

8. **Determine output path:**
   - If task directory exists: `rpi/tasks/{task-slug}/pr-description.md`
   - If no task directory: `rpi/tasks/pr-{number}/description.md`

9. **Generate the description:**
   Fill out each section from the template:
   - **Header links**: Include Linear ticket link and rpi task dir link (if available)
   - **What problems**: Based on ticket/plan context and code changes
   - **What user-facing changes**: Bulleted list with diff permalinks from step 5
   - **How I implemented it**: Journey through the PR with file/line permalinks
   - **Deviations from plan**: Include agent output from step 7 (or "No plan file found")
   - **How to verify it**: Include worktree setup commands with actual branch name
   - **Changelog entry**: Concise one-line summary

10. **Save and sync the description:**
    - Write the completed description to the path from step 8
    - Run `rpi sync` to sync
    - Show the generated description

11. **Update the PR:**
    - Update PR: `gh pr edit {number} --body-file {output-path}`
    - Confirm the update was successful

12. **Update the user:**
    - Read the final output template:
    `Read({SKILLBASE}/references/describe_pr_final_answer.md)`
    - Respond with a summary following the template, including the PR URL and key details.

## Important notes:
- Always read the template from `{SKILLBASE}/references/pr_description_template.md`
- Generate diff URLs using `scripts/pr_diff_urls.sh` for consistency
- Use the `implementation-reviewer` agent for deviation analysis when a plan exists
- Focus on the "why" as much as the "what"
- Include breaking changes or migration notes prominently

Remember, you must respond to the user according to the output template at `{SKILLBASE}/references/describe_pr_final_answer.md`
