import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  JudgmentSchema,
  BatchJudgmentResultSchema,
  type Judgment,
  type BatchJudgmentResult,
} from "../schemas/judgment.js";
import type { TaskClassification } from "../schemas/classification.js";
import type { TodoistTask } from "../schemas/task.js";
import { getJudgePrompt } from "../prompts/judge.js";

interface JudgeInput {
  task: TodoistTask;
  predicted: TaskClassification;
  expected: TaskClassification;
  criteria: string;
}

function formatJudgeCase(input: JudgeInput, index: number): string {
  const { task, predicted, expected, criteria } = input;

  return `
## Case ${index + 1}: ${task.content}

### Task Details
- **ID**: ${task.id}
- **Project**: ${task.project_name || "Unknown"}
- **Due**: ${task.due?.string || "No due date"}
- **Labels**: ${task.labels.join(", ") || "None"}
- **Description**: ${task.description || "None"}

### Classifier Prediction
- **Quadrant**: ${predicted.quadrant}
- **Action**: ${predicted.action}
- **Confidence**: ${predicted.confidence}%
- **Reasoning**: ${predicted.reasoning}
${predicted.nextAction ? `- **Next Action**: ${predicted.nextAction}` : ""}
${predicted.notionPriority ? `- **Notion Priority**: ${predicted.notionPriority}` : ""}
${predicted.obsidianFolder ? `- **Obsidian Folder**: ${predicted.obsidianFolder}` : ""}
${predicted.clarifyQuestion ? `- **Clarify Question**: ${predicted.clarifyQuestion}` : ""}

### Expected Classification
- **Quadrant**: ${expected.quadrant}
- **Action**: ${expected.action}

### Criteria (from Michael)
${criteria}

---
Evaluate whether the prediction is correct, partially_correct, or incorrect.
`.trim();
}

/**
 * Judge a batch of classifications using Opus
 */
export async function judgeClassificationsBatch(
  inputs: JudgeInput[]
): Promise<BatchJudgmentResult> {
  const systemPrompt = getJudgePrompt();

  const casesSummary = inputs
    .map((input, i) => formatJudgeCase(input, i))
    .join("\n\n===\n\n");

  const userPrompt = `Evaluate the following ${inputs.length} task classifications:

${casesSummary}

For each case, provide a judgment with verdict, score, reasoning, and criteria alignment.`;

  const BatchJudgmentSchema = z.object({
    judgments: z.array(
      JudgmentSchema.extend({
        taskId: z.string(),
      })
    ),
  });

  const { object } = await generateObject({
    model: anthropic("claude-opus-4-5-20251101"),
    schema: BatchJudgmentSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  // Compute summary statistics
  const judgments = object.judgments;
  let correct = 0;
  let partiallyCorrect = 0;
  let incorrect = 0;
  let totalScore = 0;
  let quadrantCorrect = 0;
  let actionCorrect = 0;

  for (const j of judgments) {
    totalScore += j.score;
    if (j.verdict === "correct") correct++;
    else if (j.verdict === "partially_correct") partiallyCorrect++;
    else incorrect++;

    if (j.quadrantCorrect) quadrantCorrect++;
    if (j.actionCorrect) actionCorrect++;
  }

  const total = judgments.length;

  return {
    judgments,
    summary: {
      total,
      correct,
      partiallyCorrect,
      incorrect,
      avgScore: totalScore / total,
      quadrantAccuracy: (quadrantCorrect / total) * 100,
      actionAccuracy: (actionCorrect / total) * 100,
    },
  };
}

/**
 * Judge a single classification
 */
export async function judgeSingleClassification(
  input: JudgeInput
): Promise<Judgment> {
  const result = await judgeClassificationsBatch([input]);
  return result.judgments[0];
}

export type { JudgeInput };
