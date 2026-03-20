import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { TodoistTaskSchema, type TodoistTask } from "../schemas/task.js";
import {
  TaskClassificationSchema,
  type TaskClassification,
} from "../schemas/classification.js";

export const LabeledExampleSchema = z.object({
  task: TodoistTaskSchema,
  expected: TaskClassificationSchema,
  criteria: z
    .string()
    .describe("Why this triage decision is correct"),
  source: z.enum(["manual", "approved", "correction"]),
  addedAt: z.string().datetime(),
  notes: z.string().optional(),
});

export type LabeledExample = z.infer<typeof LabeledExampleSchema>;

export const DatasetSchema = z.object({
  version: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  examples: z.array(LabeledExampleSchema),
  metadata: z.object({
    totalExamples: z.number(),
    byBucket: z.record(z.string(), z.number()),
    bySource: z.record(z.string(), z.number()),
  }),
});

export type Dataset = z.infer<typeof DatasetSchema>;

export const DEFAULT_DATASET_PATH =
  process.env.HOME +
  "/.dotfiles/agents/skills/todoist/fixtures/eval-dataset.json";

export function loadDataset(path: string = DEFAULT_DATASET_PATH): Dataset {
  if (!existsSync(path)) {
    return createEmptyDataset();
  }

  const content = readFileSync(path, "utf-8");
  const parsed = JSON.parse(content);
  return DatasetSchema.parse(parsed);
}

export function saveDataset(
  dataset: Dataset,
  path: string = DEFAULT_DATASET_PATH
): void {
  const updated = updateMetadata(dataset);
  const content = JSON.stringify(updated, null, 2);
  writeFileSync(path, content, "utf-8");
}

export function createEmptyDataset(): Dataset {
  const now = new Date().toISOString();
  return {
    version: "2.0.0",
    createdAt: now,
    updatedAt: now,
    examples: [],
    metadata: {
      totalExamples: 0,
      byBucket: {},
      bySource: {},
    },
  };
}

function updateMetadata(dataset: Dataset): Dataset {
  const byBucket: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const example of dataset.examples) {
    byBucket[example.expected.bucket] =
      (byBucket[example.expected.bucket] || 0) + 1;
    bySource[example.source] = (bySource[example.source] || 0) + 1;
  }

  return {
    ...dataset,
    updatedAt: new Date().toISOString(),
    metadata: {
      totalExamples: dataset.examples.length,
      byBucket,
      bySource,
    },
  };
}

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

export function findExampleByTaskId(
  dataset: Dataset,
  taskId: string
): LabeledExample | undefined {
  return dataset.examples.find((e) => e.task.id === taskId);
}

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
