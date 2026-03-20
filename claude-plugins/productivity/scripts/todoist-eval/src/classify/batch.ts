import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  TaskClassificationSchema,
  type TaskClassification,
  type BatchClassificationResult,
} from "../schemas/classification.js";
import type { TodoistTask } from "../schemas/task.js";
import { getClassifierPrompt } from "../prompts/classifier.js";

interface CommentWithAttachment {
  content: string;
  posted_at: string;
  attachment?: {
    file_name?: string;
    file_type?: string;
    resource_type?: string;
  };
}

function formatComment(comment: CommentWithAttachment): string {
  const parts: string[] = [];

  if (comment.content?.trim()) {
    parts.push(comment.content.trim());
  }

  if (comment.attachment) {
    const att = comment.attachment;
    if (att.resource_type === "image") {
      parts.push(`[Image: ${att.file_name || "screenshot"}]`);
    } else if (att.file_name) {
      parts.push(`[Attachment: ${att.file_name}]`);
    }
  }

  if (parts.length === 0) {
    return "[Empty comment]";
  }

  return parts.join(" ");
}

function formatTaskForClassification(task: TodoistTask, index: number): string {
  const dueStr = task.due?.string || task.due?.date || "No due date";
  const labelsStr = task.labels.length > 0 ? task.labels.join(", ") : "None";
  const priorityStr = `P${5 - task.priority}`;
  const descStr = task.description?.trim() || "None";

  let comments = "";
  if (task.comments && task.comments.length > 0) {
    comments = (task.comments as CommentWithAttachment[])
      .map((c) => `  - ${formatComment(c)}`)
      .join("\n");
  }

  return `
## Task ${index + 1}: ${task.content}
- **ID**: ${task.id}
- **Project**: ${task.project_name || "Unknown"}
- **Due**: ${dueStr}
- **Priority**: ${priorityStr}
- **Labels**: ${labelsStr}
- **Description**: ${descStr}
${comments ? `- **Comments**:\n${comments}` : ""}
`.trim();
}

export async function classifyTasksBatch(
  tasks: TodoistTask[]
): Promise<BatchClassificationResult> {
  const systemPrompt = getClassifierPrompt();

  const taskSummary = tasks
    .map((task, i) => formatTaskForClassification(task, i))
    .join("\n\n---\n\n");

  const userPrompt = `Triage the following ${tasks.length} tasks. Return one classification per task with its taskId.

${taskSummary}`;

  const ClassificationWithIdSchema = TaskClassificationSchema.extend({
    taskId: z.string(),
  });

  const BatchSchema = z.object({
    classifications: z.array(ClassificationWithIdSchema),
  });

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: BatchSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  const classifications = object.classifications;
  const byBucket: Record<string, number> = {};
  let totalConfidence = 0;
  let lowConfidenceCount = 0;

  for (const c of classifications) {
    byBucket[c.bucket] = (byBucket[c.bucket] || 0) + 1;
    totalConfidence += c.confidence;
    if (c.confidence < 70) lowConfidenceCount++;
  }

  return {
    classifications,
    summary: {
      total: classifications.length,
      byBucket,
      avgConfidence: totalConfidence / classifications.length,
      lowConfidenceCount,
    },
  };
}

export async function classifySingleTask(
  task: TodoistTask
): Promise<TaskClassification> {
  const result = await classifyTasksBatch([task]);
  return result.classifications[0];
}
