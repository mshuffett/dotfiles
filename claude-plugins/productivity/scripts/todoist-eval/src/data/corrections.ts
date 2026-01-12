import { z } from "zod";
import YAML from "yaml";
import {
  EisenhowerQuadrantSchema,
  ActionCategorySchema,
  type TaskClassification,
} from "../schemas/classification.js";
import type { Dataset } from "./dataset.js";
import { updateExample, addExample } from "./dataset.js";

// Schema for correction in review document
export const CorrectionInputSchema = z.object({
  taskId: z.string(),
  expected: z.object({
    quadrant: EisenhowerQuadrantSchema,
    action: ActionCategorySchema,
  }),
  criteria: z.string(),
  notes: z.string().optional(),
});

export type CorrectionInput = z.infer<typeof CorrectionInputSchema>;

/**
 * Parse corrections from a review markdown document
 * Looks for YAML block with corrections array
 */
export function parseCorrectionsFromReview(
  reviewContent: string
): CorrectionInput[] {
  // Look for YAML blocks with corrections
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
      // Not valid YAML or no corrections key, skip
    }
  }

  return corrections;
}

/**
 * Apply corrections to dataset
 */
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

    // Build expected classification from correction
    const expected: TaskClassification = {
      taskId: correction.taskId,
      quadrant: correction.expected.quadrant,
      action: correction.expected.action,
      reasoning: correction.criteria,
      confidence: 100, // Manual correction = 100% confidence
    };

    // Check if example already exists
    const existingIndex = updated.examples.findIndex(
      (e) => e.task.id === correction.taskId
    );

    if (existingIndex >= 0) {
      // Update existing
      updated = updateExample(updated, correction.taskId, {
        expected,
        criteria: correction.criteria,
        notes: correction.notes,
      });
    } else {
      // Add new
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

/**
 * Analyze corrections to find patterns
 */
export function analyzeCorrections(
  corrections: CorrectionInput[],
  predictions: Map<string, TaskClassification>
): string {
  const patterns: Record<string, number> = {};
  const quadrantMisses: Record<string, number> = {};
  const actionMisses: Record<string, number> = {};

  for (const correction of corrections) {
    const predicted = predictions.get(correction.taskId);
    if (!predicted) continue;

    // Track action transitions
    const actionKey = `${predicted.action} → ${correction.expected.action}`;
    patterns[actionKey] = (patterns[actionKey] || 0) + 1;

    // Track quadrant transitions
    if (predicted.quadrant !== correction.expected.quadrant) {
      const qKey = `${predicted.quadrant} → ${correction.expected.quadrant}`;
      quadrantMisses[qKey] = (quadrantMisses[qKey] || 0) + 1;
    }

    // Track action misses
    if (predicted.action !== correction.expected.action) {
      actionMisses[predicted.action] = (actionMisses[predicted.action] || 0) + 1;
    }
  }

  let analysis = `## Correction Pattern Analysis

### Action Transitions (${corrections.length} corrections)
`;

  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  for (const [pattern, count] of sortedPatterns) {
    analysis += `- **${pattern}**: ${count} occurrences\n`;
  }

  if (Object.keys(quadrantMisses).length > 0) {
    analysis += `\n### Quadrant Misses\n`;
    for (const [pattern, count] of Object.entries(quadrantMisses).sort(
      (a, b) => b[1] - a[1]
    )) {
      analysis += `- ${pattern}: ${count}\n`;
    }
  }

  if (Object.keys(actionMisses).length > 0) {
    analysis += `\n### Action Categories Most Often Wrong\n`;
    for (const [action, count] of Object.entries(actionMisses).sort(
      (a, b) => b[1] - a[1]
    )) {
      analysis += `- ${action}: ${count} mistakes\n`;
    }
  }

  analysis += `\n### Suggested Prompt Improvements

Based on these patterns, consider adding rules for:
`;

  // Generate suggestions based on most common mistakes
  const topMistakes = sortedPatterns.slice(0, 3);
  for (const [pattern] of topMistakes) {
    const [from, to] = pattern.split(" → ");
    if (from !== to) {
      analysis += `- When to use **${to}** instead of **${from}**\n`;
    }
  }

  return analysis;
}
