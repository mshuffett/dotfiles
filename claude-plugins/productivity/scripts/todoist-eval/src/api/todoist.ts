import {
  TodoistTaskSchema,
  type TodoistTask,
  type TodoistComment,
} from "../schemas/task.js";

const TODOIST_API_BASE = "https://api.todoist.com/rest/v2";
const MICHAEL_USER_ID = "486423";

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new Error(
      "TODOIST_API_TOKEN not set. Add it to ~/.env.zsh or set it in the environment."
    );
  }
  return token;
}

async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getApiToken();
  const url = `${TODOIST_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export interface FetchTasksOptions {
  filter?: string;
  projectId?: string;
  includeMichaelOnly?: boolean;
}

/**
 * Fetch tasks from Todoist with optional filtering
 */
export async function fetchTasks(
  options: FetchTasksOptions = {}
): Promise<TodoistTask[]> {
  const { filter = "today|overdue", includeMichaelOnly = true } = options;

  const params = new URLSearchParams();
  if (filter) {
    params.set("filter", filter);
  }
  if (options.projectId) {
    params.set("project_id", options.projectId);
  }

  const endpoint = `/tasks?${params.toString()}`;
  const rawTasks = await fetchJson<unknown[]>(endpoint);

  // Parse and validate
  const tasks = rawTasks
    .map((raw) => {
      try {
        return TodoistTaskSchema.parse(raw);
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
 * Fetch comments for a task
 */
export async function fetchComments(taskId: string): Promise<TodoistComment[]> {
  const endpoint = `/comments?task_id=${taskId}`;
  const comments = await fetchJson<TodoistComment[]>(endpoint);
  return comments;
}

/**
 * Fetch all projects (for enriching task data)
 */
export async function fetchProjects(): Promise<
  Array<{ id: string; name: string }>
> {
  const endpoint = "/projects";
  return fetchJson<Array<{ id: string; name: string }>>(endpoint);
}

/**
 * Enrich tasks with project names and comments
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
 * Fetch and enrich tasks in one call
 */
export async function fetchAndEnrichTasks(
  options: FetchTasksOptions = {}
): Promise<TodoistTask[]> {
  const tasks = await fetchTasks(options);
  return enrichTasks(tasks);
}
