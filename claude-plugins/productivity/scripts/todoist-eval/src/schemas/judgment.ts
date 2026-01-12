import { z } from "zod";

export const VerdictSchema = z.enum([
  "correct",
  "partially_correct",
  "incorrect",
]);

export const JudgmentSchema = z.object({
  taskId: z.string(),
  verdict: VerdictSchema.describe(
    "Overall verdict on classification correctness"
  ),
  score: z.number().min(0).max(100).describe("Numeric score 0-100"),
  reasoning: z.string().describe("Detailed explanation of the judgment"),
  criteriaAlignment: z
    .string()
    .describe("How well the classification matched the provided criteria"),
  quadrantCorrect: z.boolean().describe("Was the Eisenhower quadrant correct?"),
  actionCorrect: z.boolean().describe("Was the action category correct?"),
  suggestions: z
    .string()
    .nullable()
    .optional()
    .describe("Suggestions for improvement if incorrect"),
});

export const BatchJudgmentResultSchema = z.object({
  judgments: z.array(JudgmentSchema),
  summary: z.object({
    total: z.number(),
    correct: z.number(),
    partiallyCorrect: z.number(),
    incorrect: z.number(),
    avgScore: z.number(),
    quadrantAccuracy: z.number().describe("% of correct quadrant predictions"),
    actionAccuracy: z.number().describe("% of correct action predictions"),
  }),
});

export type Verdict = z.infer<typeof VerdictSchema>;
export type Judgment = z.infer<typeof JudgmentSchema>;
export type BatchJudgmentResult = z.infer<typeof BatchJudgmentResultSchema>;
