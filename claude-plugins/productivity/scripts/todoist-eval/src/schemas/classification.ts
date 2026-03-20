import { z } from "zod";

export const DecisionBucketSchema = z.enum([
  "clear_action",
  "needs_context",
  "needs_user_judgment",
  "probably_stale_or_close",
  "convert_to_project_or_note",
]);

export const ConfidenceBandSchema = z.enum([
  "high",
  "medium",
  "low",
  "very_low",
]);

export const TaskClassificationSchema = z.object({
  taskId: z.string(),
  bucket: DecisionBucketSchema.describe("Primary triage decision bucket"),
  reasoning: z
    .string()
    .describe("Brief explanation of the bucket choice and tradeoff"),
  confidence: z.number().min(0).max(100).describe("Confidence percentage"),
  recommendedNextStep: z
    .string()
    .optional()
    .describe("The concrete next step to take"),
  missingContext: z
    .array(z.string())
    .default([])
    .describe("Specific missing evidence or facts needed to decide"),
  evidenceUsed: z
    .array(z.string())
    .default([])
    .describe("What evidence was used to make the decision"),
  userQuestion: z
    .string()
    .optional()
    .describe("For needs_user_judgment: the exact question to ask Michael"),
  destination: z
    .string()
    .optional()
    .describe("For convert_to_project_or_note: destination note/project"),
  proposedTitle: z
    .string()
    .optional()
    .describe("For convert_to_project_or_note: proposed note/project title"),
  closeReason: z
    .string()
    .optional()
    .describe("For probably_stale_or_close: reason for closure recommendation"),
});

export const BatchClassificationResultSchema = z.object({
  classifications: z.array(TaskClassificationSchema),
  summary: z.object({
    total: z.number(),
    byBucket: z.record(z.string(), z.number()),
    avgConfidence: z.number(),
    lowConfidenceCount: z.number(),
  }),
});

export function confidenceToBand(
  confidence: number
): z.infer<typeof ConfidenceBandSchema> {
  if (confidence >= 90) return "high";
  if (confidence >= 70) return "medium";
  if (confidence >= 50) return "low";
  return "very_low";
}

export type DecisionBucket = z.infer<typeof DecisionBucketSchema>;
export type ConfidenceBand = z.infer<typeof ConfidenceBandSchema>;
export type TaskClassification = z.infer<typeof TaskClassificationSchema>;
export type BatchClassificationResult = z.infer<
  typeof BatchClassificationResultSchema
>;
