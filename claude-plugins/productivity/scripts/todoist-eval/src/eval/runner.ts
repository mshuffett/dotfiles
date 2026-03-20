import type { TodoistTask } from "../schemas/task.js";
import { type TaskClassification } from "../schemas/classification.js";
import type { BatchJudgmentResult } from "../schemas/judgment.js";
import { classifyTasksBatch } from "../classify/batch.js";
import { judgeClassificationsBatch, type JudgeInput } from "../judge/evaluate.js";
import { loadDataset, getEvalExamples } from "../data/dataset.js";
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
  accuracy?: {
    overall: number;
    bucket: number;
    calibration: number;
  };
  judgeMetrics?: {
    avgScore: number;
    correctPercent: number;
    partialPercent: number;
    incorrectPercent: number;
  };
}

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

export async function runFullEval(
  tasks: TodoistTask[],
  datasetPath?: string
): Promise<EvalResult> {
  console.log(`Step 1/3: Classifying ${tasks.length} tasks...`);
  const { classifications } = await runClassification(tasks);

  console.log("Step 2/3: Loading dataset...");
  const dataset = loadDataset(datasetPath);
  const examples = getEvalExamples(dataset);
  const expectedMap = new Map(examples.map((e) => [e.task.id, e]));

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

  const metrics = computeMetrics(classifications, judgments, expectedMap);

  return {
    tasks,
    classifications,
    judgments,
    report,
    metrics,
  };
}

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
  let bucketCorrect = 0;
  let calibrationCorrect = 0;
  let matchedCount = 0;

  for (const c of classifications) {
    totalConfidence += c.confidence;
    if (c.confidence < 70) lowConfidenceCount++;

    const expected = expectedMap.get(c.taskId);
    if (expected) {
      matchedCount++;
      if (c.bucket === expected.expected.bucket) bucketCorrect++;
      if (Math.abs(c.confidence - expected.expected.confidence) <= 15) {
        calibrationCorrect++;
      }
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
            c.bucket === exp.expected.bucket &&
            Math.abs(c.confidence - exp.expected.confidence) <= 15
          );
        }).length / matchedCount,
      bucket: bucketCorrect / matchedCount,
      calibration: calibrationCorrect / matchedCount,
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
