import type { TodoistTask } from "../schemas/task.js";
import type { TaskClassification } from "../schemas/classification.js";
import type { Judgment } from "../schemas/judgment.js";

const ACTION_ICONS: Record<string, string> = {
  Notion: "📋",
  Quick: "⚡",
  Clarify: "💭",
  Obsidian: "📝",
  Complete: "✅",
  Delete: "🗑️",
  Consolidate: "🔗",
};

const VERDICT_ICONS: Record<string, string> = {
  correct: "✅",
  partially_correct: "🟡",
  incorrect: "❌",
};

interface ReportTask {
  index: number;
  task: TodoistTask;
  predicted: TaskClassification;
  expected?: TaskClassification;
  criteria?: string;
  judgment?: Judgment;
}

interface ReportOptions {
  includeCorrectionsTemplate?: boolean;
  includeJudgments?: boolean;
}

/**
 * Generate a batch review report in markdown format
 */
export function generateBatchReport(
  results: ReportTask[],
  options: ReportOptions = {}
): string {
  const { includeCorrectionsTemplate = true, includeJudgments = true } = options;
  const timestamp = new Date().toISOString().split("T")[0];

  let report = `# Todoist Triage Review - ${timestamp}

**Tasks Processed**: ${results.length}

## Legend

| Quadrant | Meaning |
|----------|---------|
| Q1 | Urgent + Important (Do) |
| Q2 | Not Urgent + Important (Schedule) |
| Q3 | Urgent + Not Important (Quick) |
| Q4 | Not Urgent + Not Important (Eliminate) |

| Icon | Action |
|------|--------|
| 📋 | Notion - Create Action Item |
| ⚡ | Quick - Do now (< 5 min) |
| 💭 | Clarify - Need input |
| 📝 | Obsidian - File as knowledge |
| ✅ | Complete - Mark done |
| 🗑️ | Delete - Remove |
| 🔗 | Consolidate - Merge |

---

## Results

`;

  for (const r of results) {
    const icon = ACTION_ICONS[r.predicted.action] || "❓";
    const confidenceBar = getConfidenceBar(r.predicted.confidence);

    report += `### ${r.index}. ${r.task.content}

**Task ID**: \`${r.task.id}\`
**Project**: ${r.task.project_name || "Unknown"}
**Due**: ${r.task.due?.string || "No due date"}
`;

    // Add comments if present
    if (r.task.comments && r.task.comments.length > 0) {
      report += `**Comments**:\n`;
      for (const comment of r.task.comments) {
        const c = comment as { content?: string; attachment?: { file_name?: string; resource_type?: string } };
        const parts: string[] = [];
        if (c.content?.trim()) {
          // Truncate long comments
          const content = c.content.trim();
          parts.push(content.length > 200 ? content.slice(0, 200) + "..." : content);
        }
        if (c.attachment) {
          if (c.attachment.resource_type === "image") {
            parts.push(`[Image: ${c.attachment.file_name || "screenshot"}]`);
          } else if (c.attachment.file_name) {
            parts.push(`[File: ${c.attachment.file_name}]`);
          }
        }
        if (parts.length > 0) {
          report += `> ${parts.join(" ")}\n`;
        }
      }
      report += "\n";
    }

    report += `**Predicted**: ${r.predicted.quadrant} / ${icon} ${r.predicted.action} (${r.predicted.confidence}% ${confidenceBar})
**Reasoning**: ${r.predicted.reasoning}
`;

    // Add action-specific details
    if (r.predicted.nextAction) {
      report += `**Next Action**: ${r.predicted.nextAction}\n`;
    }
    if (r.predicted.notionPriority) {
      report += `**Priority**: ${r.predicted.notionPriority}\n`;
    }
    if (r.predicted.obsidianFolder) {
      report += `**Folder**: ${r.predicted.obsidianFolder}\n`;
    }
    if (r.predicted.clarifyQuestion) {
      report += `**Question**: ${r.predicted.clarifyQuestion}\n`;
    }

    // Add expected if available
    if (r.expected) {
      const expectedIcon = ACTION_ICONS[r.expected.action] || "❓";
      const match =
        r.predicted.quadrant === r.expected.quadrant &&
        r.predicted.action === r.expected.action;
      report += `
**Expected**: ${r.expected.quadrant} / ${expectedIcon} ${r.expected.action} ${match ? "✅" : "❌"}
`;
      if (r.criteria) {
        report += `**Criteria**: ${r.criteria}\n`;
      }
    }

    // Add judgment if available
    if (includeJudgments && r.judgment) {
      const verdictIcon = VERDICT_ICONS[r.judgment.verdict] || "❓";
      report += `
**Judge**: ${verdictIcon} ${r.judgment.verdict} (${r.judgment.score}/100)
**Judge Reasoning**: ${r.judgment.reasoning}
`;
      if (r.judgment.suggestions) {
        report += `**Suggestions**: ${r.judgment.suggestions}\n`;
      }
    }

    report += `
---

`;
  }

  // Summary statistics
  report += generateSummarySection(results);

  // Corrections template
  if (includeCorrectionsTemplate) {
    report += generateCorrectionsTemplate(results);
  }

  return report;
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function generateSummarySection(results: ReportTask[]): string {
  const byAction: Record<string, number> = {};
  const byQuadrant: Record<string, number> = {};
  let totalConfidence = 0;
  let lowConfidence = 0;
  let correct = 0;
  let incorrect = 0;
  let judged = 0;

  for (const r of results) {
    byAction[r.predicted.action] = (byAction[r.predicted.action] || 0) + 1;
    byQuadrant[r.predicted.quadrant] =
      (byQuadrant[r.predicted.quadrant] || 0) + 1;
    totalConfidence += r.predicted.confidence;
    if (r.predicted.confidence < 70) lowConfidence++;

    if (r.judgment) {
      judged++;
      if (r.judgment.verdict === "correct") correct++;
      else if (r.judgment.verdict === "incorrect") incorrect++;
    }
  }

  let summary = `## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tasks | ${results.length} |
| Average Confidence | ${(totalConfidence / results.length).toFixed(1)}% |
| Low Confidence (< 70%) | ${lowConfidence} |
`;

  if (judged > 0) {
    summary += `| Judge: Correct | ${correct} / ${judged} (${((correct / judged) * 100).toFixed(1)}%) |
| Judge: Incorrect | ${incorrect} / ${judged} |
`;
  }

  summary += `
### By Action
`;
  for (const [action, count] of Object.entries(byAction).sort(
    (a, b) => b[1] - a[1]
  )) {
    const icon = ACTION_ICONS[action] || "";
    summary += `- ${icon} ${action}: ${count}\n`;
  }

  summary += `
### By Quadrant
`;
  for (const [q, count] of Object.entries(byQuadrant).sort()) {
    summary += `- ${q}: ${count}\n`;
  }

  return summary + "\n";
}

function generateCorrectionsTemplate(results: ReportTask[]): string {
  // Find tasks that need correction (low confidence, incorrect judgment, or no expected)
  const needsReview = results.filter(
    (r) =>
      r.predicted.confidence < 70 ||
      r.judgment?.verdict === "incorrect" ||
      r.judgment?.verdict === "partially_correct" ||
      !r.expected
  );

  if (needsReview.length === 0) {
    return `
## Corrections

No corrections needed - all classifications look good!
`;
  }

  let template = `
## Corrections

For each task that needs correction, fill in below:

\`\`\`yaml
corrections:
`;

  for (const r of needsReview.slice(0, 5)) {
    // Show first 5 as examples
    template += `  # ${r.task.content.slice(0, 50)}${r.task.content.length > 50 ? "..." : ""}
  - taskId: "${r.task.id}"
    expected:
      quadrant: "${r.expected?.quadrant || r.predicted.quadrant}"
      action: "${r.expected?.action || r.predicted.action}"
    criteria: "Explain why this classification is correct"

`;
  }

  template += `\`\`\`

### Tasks Needing Review (${needsReview.length})

`;

  for (const r of needsReview) {
    const icon = ACTION_ICONS[r.predicted.action] || "";
    const reason =
      r.judgment?.verdict === "incorrect"
        ? "Judge: incorrect"
        : r.judgment?.verdict === "partially_correct"
          ? "Judge: partially correct"
          : r.predicted.confidence < 70
            ? `Low confidence (${r.predicted.confidence}%)`
            : "No expected classification";

    template += `- [ ] **${r.task.content.slice(0, 60)}** - ${icon} ${r.predicted.action} - ${reason}\n`;
  }

  return template;
}

/**
 * Generate a simple classification-only report (no judge)
 */
export function generateClassificationReport(
  tasks: TodoistTask[],
  classifications: TaskClassification[]
): string {
  const results: ReportTask[] = tasks.map((task, i) => ({
    index: i + 1,
    task,
    predicted: classifications[i],
  }));

  return generateBatchReport(results, {
    includeJudgments: false,
    includeCorrectionsTemplate: true,
  });
}
