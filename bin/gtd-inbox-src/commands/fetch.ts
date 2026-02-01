// gtd-inbox fetch - Fetch items from sources
import { defineCommand } from "citty";
import { loadProfile, getApiToken } from "../lib/config";
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

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  created_at: string;
  due?: {
    date: string;
    string: string;
  };
  labels: string[];
  priority: number;
  parent_id?: string;
  project_id: string;
  section_id?: string;
}

interface TodoistProject {
  id: string;
  name: string;
}

async function fetchTodoist(args: {
  limit?: string;
  project?: string;
}): Promise<void> {
  const profile = loadProfile<TodoistProfile>("todoist");
  const token = getApiToken(profile.api.token_env);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Get projects to resolve names
  const projectsRes = await fetch("https://api.todoist.com/rest/v2/projects", {
    headers,
  });
  if (!projectsRes.ok) {
    console.error(`Failed to fetch projects: ${projectsRes.statusText}`);
    process.exit(1);
  }
  const projects: TodoistProject[] = await projectsRes.json();
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Determine which project to fetch from
  let projectId: string | undefined;
  if (args.project) {
    // Check if it's an ID or name
    const matchById = projects.find((p) => p.id === args.project);
    const matchByName = projects.find(
      (p) => p.name.toLowerCase() === args.project?.toLowerCase()
    );
    projectId = matchById?.id || matchByName?.id;
    if (!projectId) {
      console.error(`Project not found: ${args.project}`);
      process.exit(1);
    }
  } else if (profile.fetch.project_filter === "inbox") {
    // Find inbox project
    const inbox = projects.find((p) => p.name.toLowerCase() === "inbox");
    projectId = inbox?.id;
  }

  // Fetch tasks
  let url = "https://api.todoist.com/rest/v2/tasks";
  if (projectId) {
    url += `?project_id=${projectId}`;
  }

  const tasksRes = await fetch(url, { headers });
  if (!tasksRes.ok) {
    console.error(`Failed to fetch tasks: ${tasksRes.statusText}`);
    process.exit(1);
  }

  let tasks: TodoistTask[] = await tasksRes.json();

  // Apply limit
  if (args.limit) {
    const limit = parseInt(args.limit, 10);
    tasks = tasks.slice(0, limit);
  }

  // Sort by created_at
  tasks.sort((a, b) => {
    if (profile.fetch.sort_order === "desc") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Convert to FetchedItem and output as JSONL
  for (const task of tasks) {
    const item: FetchedItem = {
      id: `todoist-${task.id}`,
      text: task.content,
      source: "todoist",
      source_id: task.id,
      created_at: task.created_at,
      due_date: task.due?.date,
      labels: task.labels,
      priority: task.priority,
      description: task.description || undefined,
      parent_id: task.parent_id,
      project_id: task.project_id,
      project_name: projectMap.get(task.project_id),
    };

    console.log(JSON.stringify(item));
  }
}
