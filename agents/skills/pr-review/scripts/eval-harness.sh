#!/usr/bin/env bash
set -euo pipefail

# PR Review Skill — Eval Harness
# Creates a fresh PR from known commits, runs the skill, grades the output, cleans up.
#
# Usage:
#   ./eval-harness.sh <repo> <base-tag> <feature-tag> [--keep-pr]
#
# Example:
#   ./eval-harness.sh mshuffett/pr-review-test-react v1-base v1-feature
#
# The repo must have two tags:
#   - <base-tag>: clean code (becomes main-like base)
#   - <feature-tag>: code with intentional bugs (becomes the PR branch)
#
# What it does:
#   1. Clones the repo fresh to /tmp
#   2. Creates a branch from feature-tag
#   3. Opens a PR against the base-tag branch
#   4. Runs claude with the pr-review skill
#   5. Grades the output
#   6. Optionally cleans up the PR

REPO="${1:?Usage: eval-harness.sh <owner/repo> <base-tag> <feature-tag>}"
BASE_TAG="${2:?Missing base-tag}"
FEATURE_TAG="${3:?Missing feature-tag}"
KEEP_PR="${4:-}"

SKILL_PATH="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="/tmp/pr-review-eval-$(echo "$REPO" | tr '/' '-')-$(date +%s)"
RESULTS_DIR="$SKILL_PATH/eval-results/$(date +%Y%m%d-%H%M%S)-$(echo "$REPO" | tr '/' '-')"
BRANCH_NAME="eval/pr-review-$(date +%s)"

mkdir -p "$RESULTS_DIR"

echo "=== PR Review Eval Harness ==="
echo "Repo: $REPO"
echo "Base: $BASE_TAG → Feature: $FEATURE_TAG"
echo "Work dir: $WORK_DIR"
echo "Results: $RESULTS_DIR"
echo ""

# 1. Clone fresh
echo "→ Cloning $REPO..."
git clone "https://github.com/$REPO.git" "$WORK_DIR" 2>/dev/null
cd "$WORK_DIR"

# 2. Set up base branch from tag
echo "→ Setting up base from $BASE_TAG..."
git checkout "$BASE_TAG" -b eval-base 2>/dev/null
git push origin eval-base 2>/dev/null || true

# 3. Create feature branch from tag
echo "→ Creating feature branch from $FEATURE_TAG..."
git checkout "$FEATURE_TAG" -b "$BRANCH_NAME" 2>/dev/null
git push -u origin "$BRANCH_NAME" 2>/dev/null

# 4. Open PR
echo "→ Opening PR..."
PR_URL=$(gh pr create \
  --repo "$REPO" \
  --title "eval: PR review test $(date +%Y-%m-%d-%H%M)" \
  --body "Automated eval run for pr-review skill. This PR will be closed after grading." \
  --base eval-base \
  --head "$BRANCH_NAME" 2>/dev/null)
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')
echo "   PR: $PR_URL"

# 5. Run the skill via claude
echo "→ Running pr-review skill..."
PROMPT="Review this PR. Follow the pr-review skill exactly. The repo is at $(pwd) and the PR branch is checked out. Run all tests, capture screenshots if there are UI changes, fix all issues, generate the report, post it as a PR comment to $REPO#$PR_NUMBER, and commit everything."

claude -p "$PROMPT" \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
  --skill "$SKILL_PATH/SKILL.md" \
  > "$RESULTS_DIR/transcript.txt" 2>&1 || true

# 6. Grade
echo "→ Grading..."
GRADE_FILE="$RESULTS_DIR/grade.json"

# Programmatic checks
REPORT_EXISTS=$([ -f pr-review-report.md ] && echo true || echo false)
SCREENSHOTS=$(ls screenshots/*.png 2>/dev/null | wc -l | tr -d ' ')
GIF_EXISTS=$([ -f screenshots/ui-demo.gif ] && echo true || echo false)
COMMIT_MADE=$(git log --oneline eval-base..HEAD | grep -c "pr-review" || echo 0)
PR_COMMENTS=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" --jq 'length' 2>/dev/null || echo 0)

# Check report content
if [ "$REPORT_EXISTS" = "true" ]; then
  HAS_BADGES=$(grep -c 'img.shields.io' pr-review-report.md || echo 0)
  HAS_CAUTION=$(grep -c '!\[CAUTION\]' pr-review-report.md || echo 0)
  HAS_SCREENSHOTS=$(grep -c '!\[' pr-review-report.md || echo 0)
  HAS_CODE_LINKS=$(grep -c 'github.com.*blob' pr-review-report.md || echo 0)
else
  HAS_BADGES=0; HAS_CAUTION=0; HAS_SCREENSHOTS=0; HAS_CODE_LINKS=0
fi

cat > "$GRADE_FILE" << GRADE
{
  "repo": "$REPO",
  "pr_url": "$PR_URL",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "checks": {
    "report_exists": $REPORT_EXISTS,
    "screenshot_count": $SCREENSHOTS,
    "gif_recorded": $GIF_EXISTS,
    "commit_made": $([ "$COMMIT_MADE" -gt 0 ] && echo true || echo false),
    "pr_comment_posted": $([ "$PR_COMMENTS" -gt 0 ] && echo true || echo false),
    "report_has_badges": $([ "$HAS_BADGES" -gt 0 ] && echo true || echo false),
    "report_has_caution_block": $([ "$HAS_CAUTION" -gt 0 ] && echo true || echo false),
    "report_has_screenshot_refs": $([ "$HAS_SCREENSHOTS" -gt 0 ] && echo true || echo false),
    "report_has_code_links": $([ "$HAS_CODE_LINKS" -gt 0 ] && echo true || echo false)
  },
  "counts": {
    "screenshots": $SCREENSHOTS,
    "pr_comments": $PR_COMMENTS,
    "badges": $HAS_BADGES,
    "code_links": $HAS_CODE_LINKS
  }
}
GRADE

echo ""
echo "=== Grade ==="
cat "$GRADE_FILE" | python3 -m json.tool 2>/dev/null || cat "$GRADE_FILE"

# 7. Cleanup
if [ "$KEEP_PR" != "--keep-pr" ]; then
  echo ""
  echo "→ Cleaning up PR..."
  gh pr close "$PR_NUMBER" --repo "$REPO" --delete-branch 2>/dev/null || true
  git push origin --delete eval-base 2>/dev/null || true
fi

# Copy outputs
cp -r pr-review-report.md "$RESULTS_DIR/" 2>/dev/null || true
cp -r screenshots/ "$RESULTS_DIR/" 2>/dev/null || true

echo ""
echo "=== Done ==="
echo "Results: $RESULTS_DIR"
echo "Grade: $GRADE_FILE"
