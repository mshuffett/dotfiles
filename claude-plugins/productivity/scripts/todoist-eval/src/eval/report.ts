import type { TodoistTask } from "../schemas/task.js";
import type { TaskClassification } from "../schemas/classification.js";
import type { Judgment } from "../schemas/judgment.js";

const BUCKET_ICONS: Record<string, string> = {
  clear_action: "✅",
  needs_context: "🔎",
  needs_user_judgment: "❓",
  probably_stale_or_close: "🧹",
  convert_to_project_or_note: "📝",
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

export function generateBatchReport(
  results: ReportTask[],
  options: ReportOptions = {}
): string {
  const { includeCorrectionsTemplate = true, includeJudgments = true } = options;
  const timestamp = new Date().toISOString().split("T")[0];

  let report = `# Todoist Triage Review - ${timestamp}

**Tasks Processed**: ${results.length}

## Legend

| Icon | Bucket |
|------|--------|
| ✅ | clear_action |
| 🔎 | needs_context |
| ❓ | needs_user_judgment |
| 🧹 | probably_stale_or_close |
| 📝 | convert_to_project_or_note |

---

## Results

`;

  for (const r of results) {
    const icon = BUCKET_ICONS[r.predicted.bucket] || "❓";
    const confidenceBar = getConfidenceBar(r.predicted.confidence);

    report += `### ${r.index}. ${r.task.content}

**Task ID**: \`${r.task.id}\`
**Project**: ${r.task.project_name || "Unknown"}
**Due**: ${r.task.due?.string || "No due date"}
`;

    if (r.task.comments && r.task.comments.length > 0) {
      report += `**Comments**:\n`;
      for (const comment of r.task.comments) {
        const c = comment as {
          content?: string;
          attachment?: { file_name?: string; resource_type?: string };
        };
        const parts: string[] = [];
        if (c.content?.trim()) {
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

    report += `**Predicted**: ${icon} ${r.predicted.bucket} (${r.predicted.confidence}% ${confidenceBar})
**Reasoning**: ${r.predicted.reasoning}
`;

    if (r.predicted.recommendedNextStep) {
      report += `**Recommended Next Step**: ${r.predicted.recommendedNextStep}\n`;
    }
    if (r.predicted.userQuestion) {
      report += `**Question**: ${r.predicted.userQuestion}\n`;
    }
    if (r.predicted.destination) {
      report += `**Destination**: ${r.predicted.destination}\n`;
    }
    if (r.predicted.proposedTitle) {
      report += `**Proposed Title**: ${r.predicted.proposedTitle}\n`;
    }
    if (r.predicted.closeReason) {
      report += `**Close Reason**: ${r.predicted.closeReason}\n`;
    }
    if (r.predicted.missingContext.length > 0) {
      report += `**Missing Context**:\n`;
      for (const item of r.predicted.missingContext) {
        report += `- ${item}\n`;
      }
    }
    if (r.predicted.evidenceUsed.length > 0) {
      report += `**Evidence Used**:\n`;
      for (const item of r.predicted.evidenceUsed) {
        report += `- ${item}\n`;
      }
    }

    if (r.expected) {
      const expectedIcon = BUCKET_ICONS[r.expected.bucket] || "❓";
      const match = r.predicted.bucket === r.expected.bucket;
      report += `
**Expected**: ${expectedIcon} ${r.expected.bucket} ${match ? "✅" : "❌"}
`;
      if (r.expected.recommendedNextStep) {
        report += `**Expected Next Step**: ${r.expected.recommendedNextStep}\n`;
      }
      if (r.criteria) {
        report += `**Criteria**: ${r.criteria}\n`;
      }
    }

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

  report += generateSummarySection(results);

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
  const byBucket: Record<string, number> = {};
  let totalConfidence = 0;
  let lowConfidence = 0;
  let correct = 0;
  let incorrect = 0;
  let judged = 0;

  for (const r of results) {
    byBucket[r.predicted.bucket] = (byBucket[r.predicted.bucket] || 0) + 1;
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
### By Bucket
`;

  for (const [bucket, count] of Object.entries(byBucket).sort(
    (a, b) => b[1] - a[1]
  )) {
    const icon = BUCKET_ICONS[bucket] || "";
    summary += `- ${icon} ${bucket}: ${count}\n`;
  }

  return summary + "\n";
}

function generateCorrectionsTemplate(results: ReportTask[]): string {
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
    const nextStep =
      r.expected?.recommendedNextStep ||
      r.predicted.recommendedNextStep ||
      "Explain the concrete next step";

    template += `  # ${r.task.content.slice(0, 50)}${r.task.content.length > 50 ? "..." : ""}
  - taskId: "${r.task.id}"
    expected:
      bucket: "${r.expected?.bucket || r.predicted.bucket}"
      confidence: ${r.expected?.confidence || r.predicted.confidence}
      recommendedNextStep: "${nextStep.replace(/"/g, '\\"')}"
    criteria: "Explain why this bucket and calibration are correct"

`;
  }

  template += `\`\`\`

### Tasks Needing Review (${needsReview.length})

`;

  for (const r of needsReview) {
    const icon = BUCKET_ICONS[r.predicted.bucket] || "";
    const reason =
      r.judgment?.verdict === "incorrect"
        ? "Judge: incorrect"
        : r.judgment?.verdict === "partially_correct"
          ? "Judge: partially correct"
          : r.predicted.confidence < 70
            ? `Low confidence (${r.predicted.confidence}%)`
            : "No expected classification";

    template += `- [ ] **${r.task.content.slice(0, 60)}** - ${icon} ${r.predicted.bucket} - ${reason}\n`;
  }

  return template;
}

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
