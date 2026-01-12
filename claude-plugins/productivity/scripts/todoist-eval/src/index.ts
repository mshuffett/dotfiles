#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fetchAndEnrichTasks } from "./api/todoist.js";
import { classifyTasksBatch } from "./classify/batch.js";
import { judgeClassificationsBatch, type JudgeInput } from "./judge/evaluate.js";
import {
  loadDataset,
  saveDataset,
  addExample,
  getEvalExamples,
  DEFAULT_DATASET_PATH,
} from "./data/dataset.js";
import {
  parseCorrectionsFromReview,
  applyCorrectionsToDataset,
  analyzeCorrections,
} from "./data/corrections.js";
import { generateBatchReport, generateClassificationReport } from "./eval/report.js";
import { runFullEval, runDatasetEval, runClassification } from "./eval/runner.js";
import type { TodoistTask } from "./schemas/task.js";
import type { TaskClassification } from "./schemas/classification.js";

const program = new Command();

program
  .name("todoist-eval")
  .description("Todoist triage evaluation and calibration system")
  .version("1.0.0");

// Fetch command
program
  .command("fetch")
  .description("Fetch current Todoist tasks for evaluation")
  .option("-f, --filter <filter>", "Todoist filter", "today|overdue")
  .option("-o, --output <path>", "Output file path", "/tmp/todoist-tasks.json")
  .action(async (options) => {
    console.log(chalk.blue("Fetching tasks from Todoist..."));
    console.log(chalk.dim(`Filter: ${options.filter}`));

    try {
      const tasks = await fetchAndEnrichTasks({ filter: options.filter });
      console.log(chalk.green(`✓ Fetched ${tasks.length} tasks`));

      writeFileSync(options.output, JSON.stringify(tasks, null, 2));
      console.log(chalk.dim(`Saved to ${options.output}`));

      // Print summary
      console.log("\n" + chalk.bold("Tasks:"));
      for (const task of tasks.slice(0, 10)) {
        console.log(`  - ${task.content.slice(0, 60)}${task.content.length > 60 ? "..." : ""}`);
      }
      if (tasks.length > 10) {
        console.log(chalk.dim(`  ... and ${tasks.length - 10} more`));
      }
    } catch (error) {
      console.error(chalk.red("Error fetching tasks:"), error);
      process.exit(1);
    }
  });

// Classify command
program
  .command("classify")
  .description("Classify tasks using the current prompt")
  .option("-i, --input <path>", "Input tasks file", "/tmp/todoist-tasks.json")
  .option("-o, --output <path>", "Output report path", "/tmp/triage-review.md")
  .action(async (options) => {
    console.log(chalk.blue("Loading tasks..."));

    if (!existsSync(options.input)) {
      console.error(chalk.red(`File not found: ${options.input}`));
      console.log(chalk.dim("Run 'pnpm fetch' first to fetch tasks"));
      process.exit(1);
    }

    const tasks: TodoistTask[] = JSON.parse(readFileSync(options.input, "utf-8"));
    console.log(chalk.dim(`Loaded ${tasks.length} tasks`));

    console.log(chalk.blue("\nClassifying with Sonnet..."));
    const result = await classifyTasksBatch(tasks);

    console.log(chalk.green(`✓ Classified ${result.classifications.length} tasks`));
    console.log(chalk.dim(`Average confidence: ${result.summary.avgConfidence.toFixed(1)}%`));
    console.log(chalk.dim(`Low confidence: ${result.summary.lowConfidenceCount}`));

    // Generate report
    const report = generateClassificationReport(tasks, result.classifications);
    writeFileSync(options.output, report);
    console.log(chalk.green(`\n✓ Report saved to ${options.output}`));

    // Save classifications for judging
    const classificationsPath = options.output.replace(".md", ".json");
    writeFileSync(
      classificationsPath,
      JSON.stringify(result.classifications, null, 2)
    );
    console.log(chalk.dim(`Classifications saved to ${classificationsPath}`));
  });

// Judge command
program
  .command("judge")
  .description("Run LLM judge on classifications")
  .option("-c, --classifications <path>", "Classifications file", "/tmp/triage-review.json")
  .option("-d, --dataset <path>", "Dataset path", DEFAULT_DATASET_PATH)
  .option("-o, --output <path>", "Output report path", "/tmp/triage-judged.md")
  .action(async (options) => {
    console.log(chalk.blue("Loading data..."));

    if (!existsSync(options.classifications)) {
      console.error(chalk.red(`Classifications not found: ${options.classifications}`));
      console.log(chalk.dim("Run 'pnpm classify' first"));
      process.exit(1);
    }

    const classifications: TaskClassification[] = JSON.parse(
      readFileSync(options.classifications, "utf-8")
    );

    // Load tasks
    const tasksPath = options.classifications.replace(".json", "").replace("-review", "-tasks") + ".json";
    let tasks: TodoistTask[] = [];
    if (existsSync(tasksPath)) {
      tasks = JSON.parse(readFileSync(tasksPath, "utf-8"));
    } else if (existsSync("/tmp/todoist-tasks.json")) {
      tasks = JSON.parse(readFileSync("/tmp/todoist-tasks.json", "utf-8"));
    }

    // Load dataset
    const dataset = loadDataset(options.dataset);
    const examples = getEvalExamples(dataset);
    const expectedMap = new Map(examples.map((e) => [e.task.id, e]));

    // Build judge inputs
    const judgeInputs: JudgeInput[] = [];
    for (let i = 0; i < classifications.length; i++) {
      const classification = classifications[i];
      const expected = expectedMap.get(classification.taskId);
      const task = tasks.find((t) => t.id === classification.taskId);

      if (expected && task) {
        judgeInputs.push({
          task,
          predicted: classification,
          expected: expected.expected,
          criteria: expected.criteria,
        });
      }
    }

    if (judgeInputs.length === 0) {
      console.log(chalk.yellow("No tasks found in dataset to judge against"));
      console.log(chalk.dim("Add examples to dataset first with 'pnpm apply'"));
      return;
    }

    console.log(chalk.blue(`\nJudging ${judgeInputs.length} tasks with Opus...`));
    const judgments = await judgeClassificationsBatch(judgeInputs);

    console.log(chalk.green(`✓ Judged ${judgments.summary.total} tasks`));
    console.log(
      `  Correct: ${chalk.green(judgments.summary.correct)} | ` +
      `Partial: ${chalk.yellow(judgments.summary.partiallyCorrect)} | ` +
      `Incorrect: ${chalk.red(judgments.summary.incorrect)}`
    );
    console.log(chalk.dim(`Average score: ${judgments.summary.avgScore.toFixed(1)}/100`));

    // Generate full report
    const reportTasks = judgeInputs.map((input, i) => ({
      index: i + 1,
      task: input.task,
      predicted: input.predicted,
      expected: input.expected,
      criteria: input.criteria,
      judgment: judgments.judgments[i],
    }));

    const report = generateBatchReport(reportTasks, {
      includeJudgments: true,
      includeCorrectionsTemplate: true,
    });

    writeFileSync(options.output, report);
    console.log(chalk.green(`\n✓ Report saved to ${options.output}`));
  });

// Apply corrections command
program
  .command("apply")
  .description("Apply corrections from a review document to dataset")
  .option("-r, --review <path>", "Review document with corrections", "/tmp/triage-review.md")
  .option("-d, --dataset <path>", "Dataset path", DEFAULT_DATASET_PATH)
  .action(async (options) => {
    console.log(chalk.blue("Parsing corrections..."));

    if (!existsSync(options.review)) {
      console.error(chalk.red(`Review file not found: ${options.review}`));
      process.exit(1);
    }

    const reviewContent = readFileSync(options.review, "utf-8");
    const corrections = parseCorrectionsFromReview(reviewContent);

    if (corrections.length === 0) {
      console.log(chalk.yellow("No corrections found in review document"));
      console.log(chalk.dim("Add corrections in YAML format to the review document"));
      return;
    }

    console.log(chalk.green(`✓ Found ${corrections.length} corrections`));

    // Load tasks and classifications for context
    let tasks: TodoistTask[] = [];
    let classifications: TaskClassification[] = [];

    if (existsSync("/tmp/todoist-tasks.json")) {
      tasks = JSON.parse(readFileSync("/tmp/todoist-tasks.json", "utf-8"));
    }

    const classPath = options.review.replace(".md", ".json");
    if (existsSync(classPath)) {
      classifications = JSON.parse(readFileSync(classPath, "utf-8"));
    }

    // Build lookup
    const taskLookup = new Map<string, { task: TodoistTask; predicted: TaskClassification }>();
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const predicted = classifications.find((c) => c.taskId === task.id);
      if (predicted) {
        taskLookup.set(task.id, { task, predicted });
      }
    }

    // Load and update dataset
    let dataset = loadDataset(options.dataset);
    const beforeCount = dataset.examples.length;

    dataset = applyCorrectionsToDataset(dataset, corrections, taskLookup);
    saveDataset(dataset, options.dataset);

    const afterCount = dataset.examples.length;
    const added = afterCount - beforeCount;

    console.log(chalk.green(`\n✓ Dataset updated`));
    console.log(chalk.dim(`  Examples: ${beforeCount} → ${afterCount} (+${added})`));
    console.log(chalk.dim(`  Saved to ${options.dataset}`));

    // Analyze patterns
    const predictionMap = new Map(classifications.map((c) => [c.taskId, c]));
    const analysis = analyzeCorrections(corrections, predictionMap);
    console.log("\n" + analysis);
  });

// Full eval command
program
  .command("eval")
  .description("Run full evaluation pipeline")
  .option("-f, --filter <filter>", "Todoist filter (or use --dataset-only)", "today|overdue")
  .option("-d, --dataset <path>", "Dataset path", DEFAULT_DATASET_PATH)
  .option("--dataset-only", "Only eval against dataset, don't fetch live tasks")
  .option("-o, --output <path>", "Output report path", "/tmp/triage-eval.md")
  .action(async (options) => {
    console.log(chalk.bold("Todoist Triage Evaluation\n"));

    try {
      let result;

      if (options.datasetOnly) {
        console.log(chalk.blue("Running dataset-only evaluation..."));
        result = await runDatasetEval(options.dataset);
      } else {
        console.log(chalk.blue("Fetching live tasks..."));
        const tasks = await fetchAndEnrichTasks({ filter: options.filter });
        console.log(chalk.dim(`Fetched ${tasks.length} tasks`));

        result = await runFullEval(tasks, options.dataset);
      }

      // Print metrics
      console.log("\n" + chalk.bold("Metrics:"));
      console.log(`  Total tasks: ${result.metrics.total}`);
      console.log(`  Avg confidence: ${result.metrics.avgConfidence.toFixed(1)}%`);
      console.log(`  Low confidence: ${result.metrics.lowConfidenceCount}`);

      if (result.metrics.accuracy) {
        console.log(
          `  Accuracy: ${(result.metrics.accuracy.overall * 100).toFixed(1)}% ` +
          `(Q: ${(result.metrics.accuracy.quadrant * 100).toFixed(1)}%, ` +
          `A: ${(result.metrics.accuracy.action * 100).toFixed(1)}%)`
        );
      }

      if (result.metrics.judgeMetrics) {
        const jm = result.metrics.judgeMetrics;
        console.log(
          `  Judge: ${jm.correctPercent.toFixed(1)}% correct, ` +
          `${jm.incorrectPercent.toFixed(1)}% incorrect ` +
          `(avg score: ${jm.avgScore.toFixed(1)})`
        );
      }

      // Save report
      writeFileSync(options.output, result.report);
      console.log(chalk.green(`\n✓ Report saved to ${options.output}`));
    } catch (error) {
      console.error(chalk.red("Evaluation failed:"), error);
      process.exit(1);
    }
  });

// Dataset info command
program
  .command("info")
  .description("Show dataset information")
  .option("-d, --dataset <path>", "Dataset path", DEFAULT_DATASET_PATH)
  .action(async (options) => {
    const dataset = loadDataset(options.dataset);

    console.log(chalk.bold("Dataset Info\n"));
    console.log(`  Version: ${dataset.version}`);
    console.log(`  Created: ${dataset.createdAt}`);
    console.log(`  Updated: ${dataset.updatedAt}`);
    console.log(`  Examples: ${dataset.metadata.totalExamples}`);

    if (dataset.metadata.totalExamples > 0) {
      console.log("\n" + chalk.bold("By Action:"));
      for (const [action, count] of Object.entries(dataset.metadata.byAction)) {
        console.log(`  ${action}: ${count}`);
      }

      console.log("\n" + chalk.bold("By Source:"));
      for (const [source, count] of Object.entries(dataset.metadata.bySource)) {
        console.log(`  ${source}: ${count}`);
      }
    }
  });

program.parse();
