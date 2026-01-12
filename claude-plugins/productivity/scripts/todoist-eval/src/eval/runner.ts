import type { TodoistTask } from "../schemas/task.js";
import type { TaskClassification } from "../schemas/classification.js";
import type { Judgment, BatchJudgmentResult } from "../schemas/judgment.js";
import { classifyTasksBatch } from "../classify/batch.js";
import { judgeClassificationsBatch, type JudgeInput } from "../judge/evaluate.js";
import { loadDataset, getEvalExamples, type Dataset } from "../data/dataset.js";
import { generateBatchReport } from "./report.js";

export interface EvalResult {
  tasks: TodoistTask[];
  classifications: TaskClassification[];
  judgments?: BatchJudgmentResult;
  report: string;
  metrics: EvalMetrics;
}

export interface EvalMetrics {
  total: number;
  avgConfidence: number;
  lowConfidenceCount: number;
  // If judged against dataset
  accuracy?: {
    overall: number;
    quadrant: number;
    action: number;
  };
  judgeMetrics?: {
    avgScore: number;
    correctPercent: number;
    partialPercent: number;
    incorrectPercent: number;
  };
}

/**
 * Run classification only (no judging)
 */
export async function runClassification(
  tasks: TodoistTask[]
): Promise<{ classifications: TaskClassification[]; metrics: EvalMetrics }> {
  console.log(`Classifying ${tasks.length} tasks...`);

  const result = await classifyTasksBatch(tasks);

  const metrics: EvalMetrics = {
    total: result.classifications.length,
    avgConfidence: result.summary.avgConfidence,
    lowConfidenceCount: result.summary.lowConfidenceCount,
  };

  return { classifications: result.classifications, metrics };
}

/**
 * Run full eval pipeline: classify, then judge against dataset
 */
export async function runFullEval(
  tasks: TodoistTask[],
  datasetPath?: string
): Promise<EvalResult> {
  // Step 1: Classify
  console.log(`Step 1/3: Classifying ${tasks.length} tasks...`);
  const { classifications } = await runClassification(tasks);

  // Step 2: Load dataset for expected values
  console.log("Step 2/3: Loading dataset...");
  const dataset = loadDataset(datasetPath);
  const examples = getEvalExamples(dataset);

  // Build lookup for expected classifications
  const expectedMap = new Map(examples.map((e) => [e.task.id, e]));

  // Step 3: Judge classifications that have expected values
  console.log("Step 3/3: Running LLM judge...");
  const judgeInputs: JudgeInput[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const predicted = classifications[i];
    const expected = expectedMap.get(task.id);

    if (expected) {
      judgeInputs.push({
        task,
        predicted,
        expected: expected.expected,
        criteria: expected.criteria,
      });
    }
  }

  let judgments: BatchJudgmentResult | undefined;
  if (judgeInputs.length > 0) {
    judgments = await judgeClassificationsBatch(judgeInputs);
  }

  // Build report data
  const reportTasks = tasks.map((task, i) => {
    const predicted = classifications[i];
    const expected = expectedMap.get(task.id);
    const judgment = judgments?.judgments.find((j) => j.taskId === task.id);

    return {
      index: i + 1,
      task,
      predicted,
      expected: expected?.expected,
      criteria: expected?.criteria,
      judgment,
    };
  });

  const report = generateBatchReport(reportTasks, {
    includeJudgments: true,
    includeCorrectionsTemplate: true,
  });

  // Compute metrics
  const metrics = computeMetrics(classifications, judgments, expectedMap);

  return {
    tasks,
    classifications,
    judgments,
    report,
    metrics,
  };
}

/**
 * Run eval against dataset only (no live tasks)
 */
export async function runDatasetEval(datasetPath?: string): Promise<EvalResult> {
  const dataset = loadDataset(datasetPath);
  const examples = getEvalExamples(dataset);

  const tasks = examples.map((e) => e.task);
  return runFullEval(tasks, datasetPath);
}

function computeMetrics(
  classifications: TaskClassification[],
  judgments: BatchJudgmentResult | undefined,
  expectedMap: Map<string, { expected: TaskClassification; criteria: string }>
): EvalMetrics {
  let totalConfidence = 0;
  let lowConfidenceCount = 0;
  let quadrantCorrect = 0;
  let actionCorrect = 0;
  let matchedCount = 0;

  for (const c of classifications) {
    totalConfidence += c.confidence;
    if (c.confidence < 70) lowConfidenceCount++;

    const expected = expectedMap.get(c.taskId);
    if (expected) {
      matchedCount++;
      if (c.quadrant === expected.expected.quadrant) quadrantCorrect++;
      if (c.action === expected.expected.action) actionCorrect++;
    }
  }

  const metrics: EvalMetrics = {
    total: classifications.length,
    avgConfidence: totalConfidence / classifications.length,
    lowConfidenceCount,
  };

  if (matchedCount > 0) {
    metrics.accuracy = {
      overall:
        classifications.filter((c) => {
          const exp = expectedMap.get(c.taskId);
          return (
            exp &&
            c.quadrant === exp.expected.quadrant &&
            c.action === exp.expected.action
          );
        }).length / matchedCount,
      quadrant: quadrantCorrect / matchedCount,
      action: actionCorrect / matchedCount,
    };
  }

  if (judgments) {
    const { summary } = judgments;
    metrics.judgeMetrics = {
      avgScore: summary.avgScore,
      correctPercent: (summary.correct / summary.total) * 100,
      partialPercent: (summary.partiallyCorrect / summary.total) * 100,
      incorrectPercent: (summary.incorrect / summary.total) * 100,
    };
  }

  return metrics;
}
