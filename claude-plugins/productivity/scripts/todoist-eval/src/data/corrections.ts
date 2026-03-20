import { z } from "zod";
import YAML from "yaml";
import {
  DecisionBucketSchema,
  type TaskClassification,
} from "../schemas/classification.js";
import type { Dataset } from "./dataset.js";
import { updateExample, addExample } from "./dataset.js";

export const CorrectionInputSchema = z.object({
  taskId: z.string(),
  expected: z.object({
    bucket: DecisionBucketSchema,
    confidence: z.number().min(0).max(100).optional(),
    recommendedNextStep: z.string().optional(),
  }),
  criteria: z.string(),
  notes: z.string().optional(),
});

export type CorrectionInput = z.infer<typeof CorrectionInputSchema>;

export function parseCorrectionsFromReview(
  reviewContent: string
): CorrectionInput[] {
  const yamlBlockRegex = /```ya?ml\s*([\s\S]*?)```/g;
  const corrections: CorrectionInput[] = [];

  let match: RegExpExecArray | null;
  while ((match = yamlBlockRegex.exec(reviewContent)) !== null) {
    const yamlContent = match[1];

    try {
      const parsed = YAML.parse(yamlContent);

      if (parsed?.corrections && Array.isArray(parsed.corrections)) {
        for (const correction of parsed.corrections) {
          try {
            const validated = CorrectionInputSchema.parse(correction);
            corrections.push(validated);
          } catch {
            console.warn("Invalid correction format:", correction);
          }
        }
      }
    } catch {
      // Skip invalid YAML blocks
    }
  }

  return corrections;
}

export function applyCorrectionsToDataset(
  dataset: Dataset,
  corrections: CorrectionInput[],
  taskLookup: Map<string, { task: any; predicted: TaskClassification }>
): Dataset {
  let updated = dataset;

  for (const correction of corrections) {
    const taskData = taskLookup.get(correction.taskId);

    if (!taskData) {
      console.warn(`Task ${correction.taskId} not found in lookup`);
      continue;
    }

    const expected: TaskClassification = {
      taskId: correction.taskId,
      bucket: correction.expected.bucket,
      reasoning: correction.criteria,
      confidence: correction.expected.confidence ?? taskData.predicted.confidence,
      recommendedNextStep:
        correction.expected.recommendedNextStep ??
        taskData.predicted.recommendedNextStep,
      missingContext: [],
      evidenceUsed: [],
    };

    const existingIndex = updated.examples.findIndex(
      (e) => e.task.id === correction.taskId
    );

    if (existingIndex >= 0) {
      updated = updateExample(updated, correction.taskId, {
        expected,
        criteria: correction.criteria,
        notes: correction.notes,
      });
    } else {
      updated = addExample(
        updated,
        taskData.task,
        expected,
        correction.criteria,
        "correction",
        correction.notes
      );
    }
  }

  return updated;
}

export function analyzeCorrections(
  corrections: CorrectionInput[],
  predictions: Map<string, TaskClassification>
): string {
  const bucketTransitions: Record<string, number> = {};
  const bucketMisses: Record<string, number> = {};

  for (const correction of corrections) {
    const predicted = predictions.get(correction.taskId);
    if (!predicted) continue;

    const bucketKey = `${predicted.bucket} → ${correction.expected.bucket}`;
    bucketTransitions[bucketKey] = (bucketTransitions[bucketKey] || 0) + 1;

    if (predicted.bucket !== correction.expected.bucket) {
      bucketMisses[predicted.bucket] = (bucketMisses[predicted.bucket] || 0) + 1;
    }
  }

  let analysis = `## Correction Pattern Analysis

### Bucket Transitions (${corrections.length} corrections)
`;

  for (const [pattern, count] of Object.entries(bucketTransitions).sort(
    (a, b) => b[1] - a[1]
  )) {
    analysis += `- **${pattern}**: ${count} occurrences\n`;
  }

  if (Object.keys(bucketMisses).length > 0) {
    analysis += `\n### Buckets Most Often Wrong\n`;
    for (const [bucket, count] of Object.entries(bucketMisses).sort(
      (a, b) => b[1] - a[1]
    )) {
      analysis += `- ${bucket}: ${count} mistakes\n`;
    }
  }

  analysis += `\n### Suggested Prompt Improvements

Based on these patterns, consider adding rules for:
`;

  for (const [pattern] of Object.entries(bucketTransitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)) {
    const [from, to] = pattern.split(" → ");
    if (from !== to) {
      analysis += `- When to use **${to}** instead of **${from}**\n`;
    }
  }

  return analysis;
}
