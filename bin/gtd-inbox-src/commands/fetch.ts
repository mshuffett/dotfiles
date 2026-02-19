// gtd-inbox fetch - Fetch items from sources
import { defineCommand } from "citty";
import { execSync } from "child_process";
import { loadProfile } from "../lib/config";
import type { FetchedItem, TodoistProfile } from "../types";

export const fetchCommand = defineCommand({
  meta: {
    name: "fetch",
    description: "Fetch inbox items from a source",
  },
  args: {
    source: {
      type: "positional",
      description: "Source to fetch from (todoist, email)",
      required: true,
    },
    limit: {
      type: "string",
      alias: "n",
      description: "Maximum number of items to fetch",
    },
    project: {
      type: "string",
      alias: "p",
      description: "Project ID or name to fetch from (overrides profile)",
    },
  },
  async run({ args }) {
    const source = args.source as string;

    switch (source) {
      case "todoist":
        await fetchTodoist(args);
        break;
      case "email":
        console.error("Email source not yet implemented");
        process.exit(1);
        break;
      default:
        console.error(`Unknown source: ${source}`);
        console.error("Available sources: todoist, email");
        process.exit(1);
    }
  },
});

// td CLI output types (camelCase fields)
interface TdTask {
  id: string;
  content: string;
  description: string;
  addedAt?: string; // only present with --full
  due?: { date: string; string?: string } | null;
  labels: string[];
  priority: number;
  parentId?: string | null;
  projectId: string;
  sectionId?: string | null;
}

interface TdProject {
  id: string;
  name: string;
  inboxProject?: boolean;
}

interface TdPaginatedResponse<T> {
  results: T[];
  nextCursor?: string | null;
}

/** Shell-escape a string for safe interpolation into a command */
function shellEscape(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Run a td CLI command and parse its JSON output */
function tdJson<T>(cmd: string): TdPaginatedResponse<T> {
  const raw = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
  return JSON.parse(raw) as TdPaginatedResponse<T>;
}

async function fetchTodoist(args: {
  limit?: string;
  project?: string;
}): Promise<void> {
  const profile = loadProfile<TodoistProfile>("todoist");

  // Get projects to resolve names
  const { results: projects } = tdJson<TdProject>("td project list --json --all");
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Determine which project to fetch from
  let projectFilter: string | undefined;
  if (args.project) {
    // Check if it's an ID or name
    const matchById = projects.find((p) => p.id === args.project);
    const matchByName = projects.find(
      (p) => p.name.toLowerCase() === args.project?.toLowerCase()
    );
    const matched = matchById || matchByName;
    if (!matched) {
      console.error(`Project not found: ${args.project}`);
      process.exit(1);
    }
    projectFilter = `id:${matched.id}`;
  } else if (profile.fetch.project_filter === "inbox") {
    // Find inbox project
    const inbox = projects.find(
      (p) => p.name.toLowerCase() === "inbox" || p.inboxProject
    );
    if (inbox) projectFilter = `id:${inbox.id}`;
  }

  // Fetch tasks (use --full to get addedAt timestamps)
  let cmd = "td task list --json --full --all";
  if (projectFilter) {
    cmd += ` --project ${shellEscape(projectFilter)}`;
  }

  const { results: tasks } = tdJson<TdTask>(cmd);

  // Apply limit
  let limited = tasks;
  if (args.limit) {
    const limit = parseInt(args.limit, 10);
    limited = tasks.slice(0, limit);
  }

  // Sort by addedAt
  limited.sort((a, b) => {
    const aTime = new Date(a.addedAt || 0).getTime();
    const bTime = new Date(b.addedAt || 0).getTime();
    if (profile.fetch.sort_order === "desc") {
      return bTime - aTime;
    }
    return aTime - bTime;
  });

  // Convert to FetchedItem and output as JSONL
  for (const task of limited) {
    const item: FetchedItem = {
      id: `todoist-${task.id}`,
      text: task.content,
      source: "todoist",
      source_id: task.id,
      created_at: task.addedAt,
      due_date: task.due?.date,
      labels: task.labels,
      priority: task.priority,
      description: task.description || undefined,
      parent_id: task.parentId || undefined,
      project_id: task.projectId,
      project_name: projectMap.get(task.projectId),
    };

    console.log(JSON.stringify(item));
  }
}
