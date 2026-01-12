import { z } from "zod";

export const TodoistDueSchema = z.object({
  date: z.string(),
  string: z.string().optional(),
  datetime: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  is_recurring: z.boolean().optional(),
});

export const TodoistAttachmentSchema = z.object({
  file_name: z.string().optional(),
  file_type: z.string().optional(),
  file_url: z.string().optional(),
  resource_type: z.string().optional(),
});

export const TodoistCommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  posted_at: z.string(),
  attachment: TodoistAttachmentSchema.nullable().optional(),
});

export const TodoistTaskSchema = z.object({
  id: z.string(),
  content: z.string(),
  description: z.string().optional().default(""),
  project_id: z.string(),
  project_name: z.string().optional(),
  section_id: z.string().nullable().optional(),
  due: TodoistDueSchema.nullable().optional(),
  labels: z.array(z.string()).default([]),
  priority: z.number().min(1).max(4).default(1),
  assignee_id: z.string().nullable().optional(),
  assigner_id: z.string().nullable().optional(),
  comment_count: z.number().default(0),
  comments: z.array(TodoistCommentSchema).optional(),
  url: z.string().optional(),
  created_at: z.string().optional(),
});

export type TodoistDue = z.infer<typeof TodoistDueSchema>;
export type TodoistComment = z.infer<typeof TodoistCommentSchema>;
export type TodoistTask = z.infer<typeof TodoistTaskSchema>;
