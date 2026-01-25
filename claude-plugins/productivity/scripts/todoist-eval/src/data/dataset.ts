import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { TodoistTaskSchema, type TodoistTask } from "../schemas/task.js";
import {
  TaskClassificationSchema,
  type TaskClassification,
} from "../schemas/classification.js";

// Labeled example with criteria explaining WHY the classification is correct
export const LabeledExampleSchema = z.object({
  task: TodoistTaskSchema,
  expected: TaskClassificationSchema,
  criteria: z
    .string()
    .describe("Why this is correct - what the judge should look for"),
  source: z.enum(["manual", "approved", "correction"]),
  addedAt: z.string().datetime(),
  notes: z.string().optional(),
});

export type LabeledExample = z.infer<typeof LabeledExampleSchema>;

// Full dataset schema
export const DatasetSchema = z.object({
  version: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  examples: z.array(LabeledExampleSchema),
  metadata: z.object({
    totalExamples: z.number(),
    byAction: z.record(z.string(), z.number()),
    byQuadrant: z.record(z.string(), z.number()),
    bySource: z.record(z.string(), z.number()),
  }),
});

export type Dataset = z.infer<typeof DatasetSchema>;

// Default dataset path
export const DEFAULT_DATASET_PATH =
  process.env.HOME +
  "/.dotfiles/claude/skills/todoist-triage/fixtures/eval-dataset.json";

/**
 * Load dataset from file
 */
export function loadDataset(path: string = DEFAULT_DATASET_PATH): Dataset {
  if (!existsSync(path)) {
    return createEmptyDataset();
  }

  const content = readFileSync(path, "utf-8");
  const parsed = JSON.parse(content);
  return DatasetSchema.parse(parsed);
}

/**
 * Save dataset to file
 */
export function saveDataset(
  dataset: Dataset,
  path: string = DEFAULT_DATASET_PATH
): void {
  // Update metadata before saving
  const updated = updateMetadata(dataset);
  const content = JSON.stringify(updated, null, 2);
  writeFileSync(path, content, "utf-8");
}

/**
 * Create an empty dataset
 */
export function createEmptyDataset(): Dataset {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    examples: [],
    metadata: {
      totalExamples: 0,
      byAction: {},
      byQuadrant: {},
      bySource: {},
    },
  };
}

/**
 * Update dataset metadata from examples
 */
function updateMetadata(dataset: Dataset): Dataset {
  const byAction: Record<string, number> = {};
  const byQuadrant: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const example of dataset.examples) {
    byAction[example.expected.action] =
      (byAction[example.expected.action] || 0) + 1;
    byQuadrant[example.expected.quadrant] =
      (byQuadrant[example.expected.quadrant] || 0) + 1;
    bySource[example.source] = (bySource[example.source] || 0) + 1;
  }

  return {
    ...dataset,
    updatedAt: new Date().toISOString(),
    metadata: {
      totalExamples: dataset.examples.length,
      byAction,
      byQuadrant,
      bySource,
    },
  };
}

/**
 * Add a new example to the dataset
 */
export function addExample(
  dataset: Dataset,
  task: TodoistTask,
  expected: TaskClassification,
  criteria: string,
  source: "manual" | "approved" | "correction" = "manual",
  notes?: string
): Dataset {
  const example: LabeledExample = {
    task,
    expected,
    criteria,
    source,
    addedAt: new Date().toISOString(),
    notes,
  };

  return {
    ...dataset,
    examples: [...dataset.examples, example],
  };
}

/**
 * Find example by task ID
 */
export function findExampleByTaskId(
  dataset: Dataset,
  taskId: string
): LabeledExample | undefined {
  return dataset.examples.find((e) => e.task.id === taskId);
}

/**
 * Update an existing example (e.g., from correction)
 */
export function updateExample(
  dataset: Dataset,
  taskId: string,
  updates: Partial<Pick<LabeledExample, "expected" | "criteria" | "notes">>
): Dataset {
  const examples = dataset.examples.map((e) => {
    if (e.task.id === taskId) {
      return {
        ...e,
        ...updates,
        source: "correction" as const,
      };
    }
    return e;
  });

  return { ...dataset, examples };
}

/**
 * Get examples for evaluation (returns tasks and expected classifications)
 */
export function getEvalExamples(
  dataset: Dataset
): Array<{
  task: TodoistTask;
  expected: TaskClassification;
  criteria: string;
}> {
  return dataset.examples.map((e) => ({
    task: e.task,
    expected: e.expected,
    criteria: e.criteria,
  }));
}
