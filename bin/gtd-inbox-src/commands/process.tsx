// gtd-inbox process - Full pipeline: fetch → classify → review → apply
import { defineCommand } from "citty";
import { spawn, execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { render } from "ink";
import React from "react";
import Anthropic from "@anthropic-ai/sdk";
import { ReviewApp } from "../components/ReviewApp";
import { loadConfig, loadProfile, ensureCacheDir } from "../lib/config";
import type { FetchedItem, ClassifiedItem, TodoistProfile, Category } from "../types";

export const processCommand = defineCommand({
  meta: {
    name: "process",
    description: "Run full pipeline: fetch → classify → review → apply",
  },
  args: {
    source: {
      type: "positional",
      description: "Source to process (todoist, email)",
      required: true,
    },
    copilot: {
      type: "boolean",
      description: "Enable copilot mode (background AI assistance)",
      default: false,
    },
    dryRun: {
      type: "boolean",
      alias: "n",
      description: "Don't apply changes (stop after review)",
      default: false,
    },
    limit: {
      type: "string",
      alias: "l",
      description: "Maximum number of items to process",
    },
    skipClassify: {
      type: "boolean",
      description: "Skip AI classification (use manual review only)",
      default: false,
    },
    resume: {
      type: "boolean",
      description: "Resume previous session",
      default: false,
    },
  },
  async run({ args }) {
    const source = args.source as string;
    const copilot = args.copilot as boolean;
    const dryRun = args.dryRun as boolean;
    const limit = args.limit as string | undefined;
    const skipClassify = args.skipClassify as boolean;
    const resume = args.resume as boolean;

    const cacheDir = ensureCacheDir();
    const sessionFile = join(cacheDir, "process-session.json");

    let items: FetchedItem[];
    let classified: ClassifiedItem[];

    // Check for resume
    if (resume && existsSync(sessionFile)) {
      console.error("📂 Resuming previous session...");
      const session = JSON.parse(readFileSync(sessionFile, "utf-8"));
      classified = session.classified;
    } else {
      // Step 1: Fetch
      console.error(`📥 Fetching items from ${source}...`);
      items = await fetchItems(source, limit);

      if (items.length === 0) {
        console.error("No items to process");
        process.exit(0);
      }

      console.error(`   Found ${items.length} items`);

      // Step 2: Classify
      if (skipClassify) {
        console.error("⏭️  Skipping classification...");
        classified = items.map((item) => ({
          ...item,
          classification: {
            category: "someday" as Category,
            confidence: 0,
            reasoning: "Not classified (skipped)",
          },
        }));
      } else {
        console.error("🤖 Classifying with AI...");
        classified = await classifyItems(items);
        console.error(`   Classified ${classified.length} items`);
      }

      // Save session for resume
      writeFileSync(
        sessionFile,
        JSON.stringify({ source, classified, started_at: new Date().toISOString() })
      );
    }

    // Step 3: Review (TUI)
    console.error("👀 Starting review...\n");

    // Create temp file for review output
    const reviewOutputFile = join(cacheDir, "reviewed.jsonl");

    // Render TUI and wait for completion
    await new Promise<void>((resolve) => {
      const { waitUntilExit } = render(
        <ReviewApp
          items={classified}
          outputFile={reviewOutputFile}
          copilotMode={copilot}
        />
      );
      waitUntilExit().then(resolve);
    });

    // Read review results
    if (!existsSync(reviewOutputFile)) {
      console.error("No decisions made");
      process.exit(0);
    }

    const reviewedContent = readFileSync(reviewOutputFile, "utf-8").trim();
    if (!reviewedContent) {
      console.error("No decisions made");
      process.exit(0);
    }

    const reviewedCount = reviewedContent.split("\n").length;

    // Step 4: Apply
    if (dryRun) {
      console.error(`\n✨ Review complete! ${reviewedCount} items reviewed.`);
      console.error("🏃 Dry run mode - skipping apply step");
      console.error(`📄 Decisions saved to: ${reviewOutputFile}`);
    } else {
      console.error(`\n🚀 Applying ${reviewedCount} decisions...`);

      // Run apply command
      const applyProcess = spawn(
        "bun",
        ["run", join(__dirname, "../index.tsx"), "apply", reviewOutputFile],
        {
          stdio: ["pipe", "pipe", "inherit"],
        }
      );

      let applyOutput = "";
      applyProcess.stdout.on("data", (data) => {
        applyOutput += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        applyProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Apply process exited with code ${code}`));
          }
        });
      });

      // Count successes
      const applied = applyOutput
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const successCount = applied.filter((a) => a.applied?.success).length;

      console.error(`✅ Applied ${successCount}/${reviewedCount} items successfully`);
    }

    // Clean up session file on success
    if (existsSync(sessionFile)) {
      writeFileSync(sessionFile, "");
    }
  },
});

// td CLI output types (camelCase fields)
interface TdPaginatedResponse<T> {
  results: T[];
  nextCursor?: string | null;
}

/** Shell-escape a string for safe interpolation into a command */
function shellEscape(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

// Uses td CLI instead of dead REST v2 API. No user input in shell commands.
async function fetchItems(
  source: string,
  limit?: string
): Promise<FetchedItem[]> {
  if (source !== "todoist") {
    throw new Error(`Unsupported source: ${source}`);
  }

  const profile = loadProfile<TodoistProfile>("todoist");

  // Get projects via td CLI
  const projectsRaw = execSync("td project list --json --all", {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
  const { results: projects } = JSON.parse(projectsRaw) as TdPaginatedResponse<{
    id: string;
    name: string;
    inboxProject?: boolean;
  }>;
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Find inbox project
  let projectFilter: string | undefined;
  if (profile.fetch.project_filter === "inbox") {
    const inbox = projects.find(
      (p) => p.name.toLowerCase() === "inbox" || p.inboxProject
    );
    if (inbox) projectFilter = `id:${inbox.id}`;
  }

  // Fetch tasks via td CLI (--full for addedAt timestamps)
  let cmd = "td task list --json --full --all";
  if (projectFilter) {
    cmd += ` --project ${shellEscape(projectFilter)}`;
  }

  const tasksRaw = execSync(cmd, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
  const { results: allTasks } = JSON.parse(tasksRaw) as TdPaginatedResponse<{
    id: string;
    content: string;
    description: string;
    addedAt?: string;
    due?: { date: string } | null;
    labels: string[];
    priority: number;
    parentId?: string | null;
    projectId: string;
  }>;

  // Apply limit
  let tasks = allTasks;
  if (limit) {
    tasks = allTasks.slice(0, parseInt(limit, 10));
  }

  // Sort by addedAt
  tasks.sort(
    (a, b) =>
      new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime()
  );

  return tasks.map((task) => ({
    id: `todoist-${task.id}`,
    text: task.content,
    source: "todoist" as const,
    source_id: task.id,
    created_at: task.addedAt,
    due_date: task.due?.date,
    labels: task.labels,
    priority: task.priority,
    description: task.description || undefined,
    parent_id: task.parentId || undefined,
    project_id: task.projectId,
    project_name: projectMap.get(task.projectId),
  }));
}

async function classifyItems(items: FetchedItem[]): Promise<ClassifiedItem[]> {
  const config = loadConfig();
  const client = new Anthropic();

  const GTD_CONTEXT = `
You are a GTD (Getting Things Done) expert helping categorize inbox items.

Categories:
- trash: Junk, spam, irrelevant items that should be discarded
- reference: Useful information to file for later (not actionable)
- someday: Ideas or wishes for the future (not current priority)
- do_now: Actionable and can be done in under 2 minutes
- delegate: Actionable but should be done by someone else
- context: Actionable task to add to a context list (@calls, @computer, @errands, @home, @office, @waiting)
- project: Multi-step project that needs planning

For each item, determine:
1. The most likely category
2. Your confidence (0.0-1.0)
3. Brief reasoning
4. If actionable: suggest a clear next action
5. If context: suggest which context (@calls, @computer, etc.)
6. If delegate: suggest who might do it
7. If reference: suggest where to file it (Obsidian Resources, Notion Notes, Bookmarks)
`;

  const classified: ClassifiedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    process.stderr.write(`   ${i + 1}/${items.length}: ${item.text.slice(0, 40)}...`);

    const prompt = `
${GTD_CONTEXT}

Classify this inbox item:

Text: ${item.text}
${item.description ? `Description: ${item.description}` : ""}
${item.labels?.length ? `Labels: ${item.labels.join(", ")}` : ""}
${item.due_date ? `Due: ${item.due_date}` : ""}
Source: ${item.source}

Respond with JSON only:
{
  "category": "trash|reference|someday|do_now|delegate|context|project",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "next_action": "if actionable, the clear next step",
  "context": "if context category, which @context",
  "delegate_to": "if delegate, who",
  "reference_location": "if reference, where to file"
}
`;

    try {
      const response = await client.messages.create({
        model: config.ai.model,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        classified.push({
          ...item,
          classification: {
            category: result.category,
            confidence: result.confidence,
            reasoning: result.reasoning,
            next_action: result.next_action,
            context: result.context,
            delegate_to: result.delegate_to,
            reference_location: result.reference_location,
            destination: getDestinationSuggestion(result),
          },
        });
        process.stderr.write(` → ${result.category} (${Math.round(result.confidence * 100)}%)\n`);
      } else {
        throw new Error("No JSON in response");
      }
    } catch (error) {
      process.stderr.write(` → error\n`);
      classified.push({
        ...item,
        classification: {
          category: "someday",
          confidence: 0.3,
          reasoning: "Classification failed",
        },
      });
    }
  }

  return classified;
}

function getDestinationSuggestion(result: {
  category: Category;
  reference_location?: string;
}): ClassifiedItem["classification"]["destination"] {
  switch (result.category) {
    case "trash":
      return { type: "discard", target: "trash" };
    case "reference":
      if (result.reference_location?.toLowerCase().includes("obsidian")) {
        return { type: "obsidian", target: "resources" };
      }
      return { type: "notion", target: "notes" };
    case "someday":
      return { type: "todoist", target: "areas" };
    case "do_now":
      return { type: "notion", target: "action_items", priority: "Immediate" };
    case "delegate":
      return { type: "notion", target: "action_items", priority: "Delegate" };
    case "context":
      return { type: "notion", target: "action_items" };
    case "project":
      return { type: "notion", target: "projects" };
    default:
      return { type: "discard", target: "unknown" };
  }
}
