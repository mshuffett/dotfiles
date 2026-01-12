import { z } from "zod";

export const EisenhowerQuadrantSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const ActionCategorySchema = z.enum([
  "Notion",
  "Quick",
  "Clarify",
  "Obsidian",
  "Complete",
  "Delete",
  "Consolidate",
]);

export const NotionPrioritySchema = z.enum([
  "Immediate",
  "Quick",
  "Scheduled",
  "1st Priority",
  "2nd Priority",
  "3rd Priority",
  "4th Priority",
  "5th Priority",
  "Errand",
  "Remember",
]);

export const ObsidianFolderSchema = z.enum([
  "3-Resources/R-Wisdom/",
  "3-Resources/Tools/",
  "3-Resources/Raw Ideas/",
  "2-Areas/Vision/",
  "2-Areas/Coaching/",
  "2-Areas/Agents/",
  "Other",
]);

export const TaskClassificationSchema = z.object({
  taskId: z.string(),
  quadrant: EisenhowerQuadrantSchema.describe(
    "Q1=Urgent+Important, Q2=Important, Q3=Urgent, Q4=Neither"
  ),
  action: ActionCategorySchema.describe("Primary action to take"),
  reasoning: z
    .string()
    .describe("Brief explanation of classification decision"),
  confidence: z.number().min(0).max(100).describe("Confidence percentage"),
  // Action-specific fields (optional based on action)
  notionPriority: NotionPrioritySchema.optional().describe(
    "For Notion action: priority level"
  ),
  notionProject: z.string().optional().describe("For Notion: linked project"),
  nextAction: z
    .string()
    .optional()
    .describe("For Notion/Quick: specific next step"),
  obsidianFolder: ObsidianFolderSchema.optional().describe(
    "For Obsidian: target folder"
  ),
  obsidianTitle: z
    .string()
    .optional()
    .describe("For Obsidian: suggested note title"),
  clarifyQuestion: z
    .string()
    .optional()
    .describe("For Clarify: question to ask Michael"),
  consolidateWith: z
    .string()
    .optional()
    .describe("For Consolidate: task ID to merge with"),
  completeReason: z
    .string()
    .optional()
    .describe("For Complete: why task is done"),
  deleteReason: z
    .string()
    .optional()
    .describe("For Delete: why task should be removed"),
});

export const BatchClassificationResultSchema = z.object({
  classifications: z.array(TaskClassificationSchema),
  summary: z.object({
    total: z.number(),
    byAction: z.record(z.string(), z.number()),
    byQuadrant: z.record(z.string(), z.number()),
    avgConfidence: z.number(),
    lowConfidenceCount: z
      .number()
      .describe("Count of items with confidence < 70%"),
  }),
});

export type EisenhowerQuadrant = z.infer<typeof EisenhowerQuadrantSchema>;
export type ActionCategory = z.infer<typeof ActionCategorySchema>;
export type NotionPriority = z.infer<typeof NotionPrioritySchema>;
export type ObsidianFolder = z.infer<typeof ObsidianFolderSchema>;
export type TaskClassification = z.infer<typeof TaskClassificationSchema>;
export type BatchClassificationResult = z.infer<
  typeof BatchClassificationResultSchema
>;
