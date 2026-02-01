// gtd-inbox apply - Apply decisions to destinations
import { defineCommand } from "citty";
import { Client as NotionClient } from "@notionhq/client";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { loadConfig, loadProfile, getApiToken } from "../lib/config";
import type {
  ReviewedItem,
  AppliedItem,
  ApplyResult,
  TodoistProfile,
} from "../types";

export const applyCommand = defineCommand({
  meta: {
    name: "apply",
    description: "Apply decisions to destinations (Notion, Obsidian, Todoist)",
  },
  args: {
    file: {
      type: "positional",
      description: "Input file (JSONL) or - for stdin",
      required: false,
    },
    dryRun: {
      type: "boolean",
      alias: "n",
      description: "Show what would happen without making changes",
      default: false,
    },
    completeSource: {
      type: "boolean",
      alias: "c",
      description: "Complete/archive items in source system",
      default: true,
    },
  },
  async run({ args }) {
    const items = await readItems(args.file as string | undefined);

    if (items.length === 0) {
      console.error("No items to apply");
      process.exit(1);
    }

    const config = loadConfig();
    const dryRun = args.dryRun as boolean;
    const completeSource = args.completeSource as boolean;

    // Initialize clients
    const notion = new NotionClient({
      auth: process.env.NOTION_API_KEY,
    });

    for (const item of items) {
      const results: ApplyResult[] = [];

      if (dryRun) {
        console.error(
          `[DRY RUN] Would apply: ${item.text.slice(0, 50)}... → ${item.decision.destination.type}:${item.decision.destination.target}`
        );
        continue;
      }

      try {
        // Apply to destination
        const result = await applyToDestination(item, notion, config);
        results.push(result);

        // Complete in source if enabled and successful
        if (
          completeSource &&
          result.success &&
          item.source === "todoist" &&
          item.source_id
        ) {
          const sourceResult = await completeInTodoist(item.source_id);
          results.push(sourceResult);
        }

        const appliedItem: AppliedItem = {
          ...item,
          applied: {
            success: results.every((r) => r.success),
            applied_at: new Date().toISOString(),
            results,
          },
        };

        console.log(JSON.stringify(appliedItem));
      } catch (error) {
        const appliedItem: AppliedItem = {
          ...item,
          applied: {
            success: false,
            applied_at: new Date().toISOString(),
            results,
            error: error instanceof Error ? error.message : String(error),
          },
        };

        console.log(JSON.stringify(appliedItem));
      }
    }

    if (dryRun) {
      console.error(`\n[DRY RUN] Would apply ${items.length} items`);
    }
  },
});

async function readItems(filePath?: string): Promise<ReviewedItem[]> {
  const items: ReviewedItem[] = [];
  let content: string;

  if (!filePath || filePath === "-") {
    const chunks: Uint8Array[] = [];
    const reader = Bun.stdin.stream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    content = Buffer.concat(chunks).toString("utf-8");
  } else {
    const { readFileSync, existsSync } = require("fs");
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    content = readFileSync(filePath, "utf-8");
  }

  for (const line of content.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line) as ReviewedItem);
    } catch (e) {
      console.error(`Invalid JSON line: ${line}`);
    }
  }

  return items;
}

async function applyToDestination(
  item: ReviewedItem,
  notion: NotionClient,
  config: ReturnType<typeof loadConfig>
): Promise<ApplyResult> {
  const { destination } = item.decision;

  switch (destination.type) {
    case "notion":
      return applyToNotion(item, notion, config);
    case "obsidian":
      return applyToObsidian(item, config);
    case "todoist":
      return applyToTodoist(item, config);
    case "discard":
      return { destination_type: "discard", success: true };
    default:
      return {
        destination_type: destination.type,
        success: false,
        error: `Unknown destination type: ${destination.type}`,
      };
  }
}

async function applyToNotion(
  item: ReviewedItem,
  notion: NotionClient,
  config: ReturnType<typeof loadConfig>
): Promise<ApplyResult> {
  const { destination, category, next_action, context, delegate_to } =
    item.decision;

  let databaseId: string;
  switch (destination.target) {
    case "action_items":
      databaseId = config.destinations.notion.action_items.database_id;
      break;
    case "projects":
      databaseId = config.destinations.notion.projects.database_id;
      break;
    case "notes":
      databaseId = config.destinations.notion.notes.database_id;
      break;
    default:
      return {
        destination_type: "notion",
        success: false,
        error: `Unknown Notion target: ${destination.target}`,
      };
  }

  try {
    // Build properties based on target
    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: next_action || item.text } }],
      },
    };

    // Add priority if action item
    if (destination.target === "action_items" && destination.priority) {
      properties.Priority = {
        select: { name: destination.priority },
      };
    }

    // Add context if specified
    if (context) {
      properties.Context = {
        select: { name: context },
      };
    }

    // Add delegate info
    if (delegate_to) {
      properties["Delegate To"] = {
        rich_text: [{ text: { content: delegate_to } }],
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return {
      destination_type: "notion",
      success: true,
      created_id: response.id,
      created_url: (response as { url?: string }).url,
    };
  } catch (error) {
    return {
      destination_type: "notion",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function applyToObsidian(
  item: ReviewedItem,
  config: ReturnType<typeof loadConfig>
): Promise<ApplyResult> {
  const { destination, reference_location } = item.decision;
  const vault = config.destinations.obsidian.vault;
  const folder =
    config.destinations.obsidian.folders[destination.folder || destination.target] ||
    config.destinations.obsidian.folders.resources;

  // Create filename from item text
  const filename = item.text
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const filePath = join(vault, folder, `${filename}.md`);

  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Build markdown content
    const content = `# ${item.text}

${item.description || ""}

---

- Source: ${item.source}
- Created: ${new Date().toISOString()}
- Category: ${item.decision.category}
${reference_location ? `- Location: ${reference_location}` : ""}
`;

    writeFileSync(filePath, content);

    return {
      destination_type: "obsidian",
      success: true,
      created_id: filePath,
    };
  } catch (error) {
    return {
      destination_type: "obsidian",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function applyToTodoist(
  item: ReviewedItem,
  config: ReturnType<typeof loadConfig>
): Promise<ApplyResult> {
  const profile = loadProfile<TodoistProfile>("todoist");
  const token = getApiToken(profile.api.token_env);

  const { destination, next_action } = item.decision;
  const projectId =
    config.destinations.todoist.projects[destination.target] ||
    config.destinations.todoist.projects.areas;

  try {
    const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: next_action || item.text,
        project_id: String(projectId),
        description: item.description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.statusText}`);
    }

    const task = (await response.json()) as { id: string };

    return {
      destination_type: "todoist",
      success: true,
      created_id: task.id,
    };
  } catch (error) {
    return {
      destination_type: "todoist",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function completeInTodoist(taskId: string): Promise<ApplyResult> {
  const profile = loadProfile<TodoistProfile>("todoist");
  const token = getApiToken(profile.api.token_env);

  try {
    const response = await fetch(
      `https://api.todoist.com/rest/v2/tasks/${taskId}/close`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.statusText}`);
    }

    return {
      destination_type: "todoist",
      success: true,
      created_id: taskId,
    };
  } catch (error) {
    return {
      destination_type: "todoist",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
