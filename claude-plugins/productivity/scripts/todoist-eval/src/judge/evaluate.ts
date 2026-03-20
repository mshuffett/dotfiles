import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  JudgmentSchema,
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
- **Bucket**: ${predicted.bucket}
- **Confidence**: ${predicted.confidence}%
- **Reasoning**: ${predicted.reasoning}
- **Recommended Next Step**: ${predicted.recommendedNextStep || "None"}
${predicted.missingContext.length > 0 ? `- **Missing Context**: ${predicted.missingContext.join("; ")}` : ""}
${predicted.evidenceUsed.length > 0 ? `- **Evidence Used**: ${predicted.evidenceUsed.join("; ")}` : ""}
${predicted.userQuestion ? `- **User Question**: ${predicted.userQuestion}` : ""}
${predicted.destination ? `- **Destination**: ${predicted.destination}` : ""}
${predicted.proposedTitle ? `- **Proposed Title**: ${predicted.proposedTitle}` : ""}
${predicted.closeReason ? `- **Close Reason**: ${predicted.closeReason}` : ""}

### Expected Classification
- **Bucket**: ${expected.bucket}
- **Confidence**: ${expected.confidence}%
${expected.recommendedNextStep ? `- **Recommended Next Step**: ${expected.recommendedNextStep}` : ""}

### Criteria (from Michael)
${criteria}

---
Evaluate whether the prediction is correct, partially_correct, or incorrect.
`.trim();
}

export async function judgeClassificationsBatch(
  inputs: JudgeInput[]
): Promise<BatchJudgmentResult> {
  const systemPrompt = getJudgePrompt();

  const casesSummary = inputs
    .map((input, i) => formatJudgeCase(input, i))
    .join("\n\n===\n\n");

  const userPrompt = `Evaluate the following ${inputs.length} task triage classifications:

${casesSummary}

For each case, provide a judgment with verdict, score, reasoning, criteria alignment, bucket correctness, calibration correctness, and next step quality.`;

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

  const judgments = object.judgments;
  let correct = 0;
  let partiallyCorrect = 0;
  let incorrect = 0;
  let totalScore = 0;
  let bucketCorrect = 0;
  let calibrationCorrect = 0;
  let nextStepAppropriate = 0;

  for (const j of judgments) {
    totalScore += j.score;
    if (j.verdict === "correct") correct++;
    else if (j.verdict === "partially_correct") partiallyCorrect++;
    else incorrect++;

    if (j.bucketCorrect) bucketCorrect++;
    if (j.calibrationCorrect) calibrationCorrect++;
    if (j.nextStepAppropriate) nextStepAppropriate++;
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
      bucketAccuracy: (bucketCorrect / total) * 100,
      calibrationAccuracy: (calibrationCorrect / total) * 100,
      nextStepAccuracy: (nextStepAppropriate / total) * 100,
    },
  };
}

export async function judgeSingleClassification(
  input: JudgeInput
): Promise<Judgment> {
  const result = await judgeClassificationsBatch([input]);
  return result.judgments[0];
}

export type { JudgeInput };
