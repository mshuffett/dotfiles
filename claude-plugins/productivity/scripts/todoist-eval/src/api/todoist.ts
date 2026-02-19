import { execFileSync } from "child_process";
import {
  TodoistTaskSchema,
  type TodoistTask,
  type TodoistComment,
} from "../schemas/task.js";

const MICHAEL_USER_ID = "486423";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run the `td` CLI with the given args array and parse the JSON output. */
function td<T = unknown>(args: string[]): T {
  const out = execFileSync("td", args, { encoding: "utf-8" }).trim();
  return JSON.parse(out) as T;
}

interface TdPaginatedResult<T> {
  results: T[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// CLI → Schema transforms
// The `td` CLI returns camelCase fields; our Zod schemas expect snake_case.
// ---------------------------------------------------------------------------

/** Map a single raw CLI task object to the shape expected by TodoistTaskSchema. */
// biome-ignore lint/suspicious/noExplicitAny: raw CLI output
function normalizeTask(raw: any): unknown {
  return {
    id: raw.id,
    content: raw.content,
    description: raw.description ?? "",
    project_id: raw.projectId,
    section_id: raw.sectionId ?? null,
    due: raw.due
      ? {
          date: raw.due.date,
          string: raw.due.string,
          datetime: raw.due.datetime ?? null,
          timezone: raw.due.timezone ?? null,
          is_recurring: raw.due.isRecurring ?? false,
        }
      : null,
    labels: raw.labels ?? [],
    priority: raw.priority ?? 1,
    assignee_id: raw.responsibleUid ?? null,
    assigner_id: raw.assignedByUid ?? null,
    comment_count: raw.noteCount ?? 0,
    url: raw.url,
    created_at: raw.addedAt,
  };
}

/** Map a single raw CLI comment object to the shape expected by TodoistCommentSchema. */
// biome-ignore lint/suspicious/noExplicitAny: raw CLI output
function normalizeComment(raw: any): TodoistComment {
  return {
    id: raw.id,
    content: raw.content,
    posted_at: raw.postedAt ?? raw.addedAt ?? "",
    attachment: raw.attachment ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FetchTasksOptions {
  filter?: string;
  projectId?: string;
  includeMichaelOnly?: boolean;
}

/**
 * Fetch tasks from Todoist via the `td` CLI with optional filtering.
 */
export async function fetchTasks(
  options: FetchTasksOptions = {}
): Promise<TodoistTask[]> {
  const { filter = "today|overdue", includeMichaelOnly = true } = options;

  let args: string[];
  if (options.projectId) {
    args = ["task", "list", "--project", options.projectId, "--all", "--json", "--full"];
  } else if (filter === "today|overdue" || filter === "today | overdue") {
    args = ["today", "--all", "--json", "--full"];
  } else {
    // Use --filter for arbitrary Todoist filter expressions
    args = ["task", "list", "--filter", filter, "--all", "--json", "--full"];
  }

  const data = td<TdPaginatedResult<unknown>>(args);
  const rawTasks = data.results;

  // Normalize CLI camelCase → schema snake_case, then validate
  const tasks = rawTasks
    .map((raw) => {
      try {
        return TodoistTaskSchema.parse(normalizeTask(raw));
      } catch {
        console.warn("Failed to parse task:", raw);
        return null;
      }
    })
    .filter((t): t is TodoistTask => t !== null);

  // Filter to Michael's tasks only
  if (includeMichaelOnly) {
    return tasks.filter(
      (t) => t.assignee_id === null || t.assignee_id === MICHAEL_USER_ID
    );
  }

  return tasks;
}

/**
 * Fetch comments for a task via the `td` CLI.
 */
export async function fetchComments(taskId: string): Promise<TodoistComment[]> {
  const data = td<TdPaginatedResult<unknown>>(
    ["comment", "list", `id:${taskId}`, "--all", "--json", "--full"]
  );
  return data.results.map(normalizeComment);
}

/**
 * Fetch all projects via the `td` CLI (for enriching task data).
 */
export async function fetchProjects(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = td<TdPaginatedResult<{ id: string; name: string }>>(
    ["project", "list", "--all", "--json"]
  );
  return data.results;
}

/**
 * Enrich tasks with project names and comments.
 */
export async function enrichTasks(tasks: TodoistTask[]): Promise<TodoistTask[]> {
  // Fetch projects for name lookup
  const projects = await fetchProjects();
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Enrich each task
  const enriched = await Promise.all(
    tasks.map(async (task) => {
      const enrichedTask = { ...task };

      // Add project name
      enrichedTask.project_name = projectMap.get(task.project_id) ?? "Unknown";

      // Fetch comments if there are any
      if (task.comment_count > 0) {
        try {
          enrichedTask.comments = await fetchComments(task.id);
        } catch {
          console.warn(`Failed to fetch comments for task ${task.id}`);
        }
      }

      return enrichedTask;
    })
  );

  return enriched;
}

/**
 * Fetch and enrich tasks in one call.
 */
export async function fetchAndEnrichTasks(
  options: FetchTasksOptions = {}
): Promise<TodoistTask[]> {
  const tasks = await fetchTasks(options);
  return enrichTasks(tasks);
}
