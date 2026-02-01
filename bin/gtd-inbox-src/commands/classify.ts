// gtd-inbox classify - Agentic classification with research tools
import { defineCommand } from "citty";
import Anthropic from "@anthropic-ai/sdk";
import { loadConfig } from "../lib/config";
import type { FetchedItem, ClassifiedItem, Category } from "../types";

export const classifyCommand = defineCommand({
  meta: {
    name: "classify",
    description: "Classify inbox items with AI agent (with research)",
  },
  args: {
    file: {
      type: "positional",
      description: "Input file (JSONL) or - for stdin",
      required: false,
    },
    maxIterations: {
      type: "string",
      alias: "i",
      description: "Maximum iterations per item (default: 8)",
      default: "8",
    },
    verbose: {
      type: "boolean",
      alias: "v",
      description: "Show agent reasoning and research steps",
      default: false,
    },
    format: {
      type: "string",
      alias: "f",
      description: "Output format: markdown (default) or json",
      default: "markdown",
    },
  },
  async run({ args }) {
    const items = await readItems(args.file as string | undefined);
    const maxIterations = parseInt(args.maxIterations as string, 10);
    const verbose = args.verbose as boolean;
    const format = (args.format as string) || "markdown";

    if (items.length === 0) {
      console.error("No items to classify");
      process.exit(1);
    }

    const config = loadConfig();
    const client = new Anthropic();

    // Build context about all items for better classification
    const itemsContext = items
      .slice(0, 15)
      .map((it, idx) => `${idx + 1}. ${it.text}`)
      .join("\n");

    const classifiedItems: ClassifiedItem[] = [];
    const startTime = Date.now();

    // Process items with agentic loop
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (verbose) {
        console.error(
          `\n━━━ Item ${i + 1}/${items.length}: ${item.text.slice(0, 50)}... ━━━`
        );
      }

      const classified = await classifyWithAgent(
        client,
        item,
        itemsContext,
        config.ai.model,
        maxIterations,
        verbose
      );

      classifiedItems.push(classified);

      if (format === "json") {
        console.log(JSON.stringify(classified));
      }
    }

    if (format === "markdown") {
      const report = generateExecutiveReport(classifiedItems, startTime);
      console.log(report);
    }
  },
});

async function readItems(filePath?: string): Promise<FetchedItem[]> {
  const items: FetchedItem[] = [];
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
    const { readFileSync, existsSync } = await import("fs");
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    content = readFileSync(filePath, "utf-8");
  }

  for (const line of content.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line) as FetchedItem);
    } catch {
      console.error(`Invalid JSON line: ${line}`);
    }
  }

  return items;
}

// Tool definitions for the agent
const tools: Anthropic.Tool[] = [
  {
    name: "fetch_url",
    description:
      "Fetch and extract content from a URL (GitHub PRs, docs, articles). Use this to research links in tasks.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to fetch" },
      },
      required: ["url"],
    },
  },
  {
    name: "search_notion",
    description:
      "Search Notion for related projects, action items, or notes. Use this to find context about people, projects, or topics mentioned in the task.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query (person name, project name, topic)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_todoist",
    description:
      "Search Todoist for existing tasks related to this item. Use this to check if similar tasks exist or to understand ongoing work.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_obsidian",
    description:
      "Search Obsidian notes for reference material, past decisions, or context. Use this for topics, people, or technical concepts.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "submit_classification",
    description:
      "Submit your classification for the inbox item. Call this when you have enough information.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: [
            "trash",
            "reference",
            "someday",
            "do_now",
            "delegate",
            "context",
            "project",
          ],
          description: "GTD category",
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence 0.0-1.0",
        },
        reasoning: { type: "string", description: "Why this classification" },
        next_action: {
          type: "string",
          description: "Clear next action if actionable",
        },
        context: {
          type: "string",
          description: "@context if applicable (@computer, @calls, etc.)",
        },
        delegate_to: { type: "string", description: "Who to delegate to" },
        reference_location: {
          type: "string",
          description: "Where to file if reference (Obsidian, Notion)",
        },
        needs_more_research: {
          type: "boolean",
          description: "Set true if you want to research more before finalizing",
        },
      },
      required: ["category", "confidence", "reasoning"],
    },
  },
];

// Execute tools
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  verbose: boolean
): Promise<string> {
  if (toolName === "search_notion") {
    const query = toolInput.query as string;
    if (verbose) console.error(`  🔍 Searching Notion: "${query}"`);
    return await searchNotion(query);
  }

  if (toolName === "search_todoist") {
    const query = toolInput.query as string;
    if (verbose) console.error(`  🔍 Searching Todoist: "${query}"`);
    return await searchTodoist(query);
  }

  if (toolName === "search_obsidian") {
    const query = toolInput.query as string;
    if (verbose) console.error(`  🔍 Searching Obsidian: "${query}"`);
    return await searchObsidian(query);
  }

  if (toolName === "fetch_url") {
    const url = toolInput.url as string;
    if (verbose) console.error(`  📡 Fetching: ${url}`);

    try {
      // GitHub PR handling
      if (url.includes("github.com") && url.includes("/pull/")) {
        const match = url.match(
          /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
        );
        if (match) {
          const [, owner, repo, prNumber] = match;
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
          const response = await fetch(apiUrl, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "GTD-Inbox-Agent/1.0",
              ...(process.env.GITHUB_TOKEN
                ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                : {}),
            },
          });

          if (!response.ok) {
            return `GitHub API error: ${response.status} ${response.statusText}`;
          }

          const pr = (await response.json()) as {
            title: string;
            body: string;
            state: string;
            user: { login: string };
            changed_files: number;
            additions: number;
            deletions: number;
            mergeable: boolean;
            labels: Array<{ name: string }>;
            created_at: string;
            updated_at: string;
          };

          return `## PR: ${pr.title}

**Author:** ${pr.user.login}
**State:** ${pr.state}
**Created:** ${pr.created_at}
**Updated:** ${pr.updated_at}
**Changes:** ${pr.changed_files} files (+${pr.additions}/-${pr.deletions})
**Labels:** ${pr.labels.map((l) => l.name).join(", ") || "none"}

### Description:
${pr.body?.slice(0, 1500) || "No description"}`;
        }
      }

      // GitHub issue handling
      if (url.includes("github.com") && url.includes("/issues/")) {
        const match = url.match(
          /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/
        );
        if (match) {
          const [, owner, repo, issueNumber] = match;
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
          const response = await fetch(apiUrl, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "GTD-Inbox-Agent/1.0",
              ...(process.env.GITHUB_TOKEN
                ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                : {}),
            },
          });

          if (!response.ok) {
            return `GitHub API error: ${response.status}`;
          }

          const issue = (await response.json()) as {
            title: string;
            body: string;
            state: string;
            user: { login: string };
            labels: Array<{ name: string }>;
          };

          return `## Issue: ${issue.title}

**Author:** ${issue.user.login}
**State:** ${issue.state}
**Labels:** ${issue.labels.map((l) => l.name).join(", ") || "none"}

### Description:
${issue.body?.slice(0, 1500) || "No description"}`;
        }
      }

      // Generic URL fetch
      const response = await fetch(url, {
        headers: { "User-Agent": "GTD-Inbox-Agent/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return `Fetch error: ${response.status} ${response.statusText}`;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        return JSON.stringify(json, null, 2).slice(0, 2000);
      }

      const html = await response.text();
      // Extract text from HTML
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);

      return text || "No readable content extracted";
    } catch (error) {
      return `Error fetching URL: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return `Unknown tool: ${toolName}`;
}

// Search Notion for context
async function searchNotion(query: string): Promise<string> {
  const notionToken = process.env.NOTION_API_KEY;
  if (!notionToken) {
    return "Notion API key not configured (NOTION_API_KEY)";
  }

  try {
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        query,
        page_size: 5,
      }),
    });

    if (!response.ok) {
      return `Notion API error: ${response.status}`;
    }

    const data = (await response.json()) as {
      results: Array<{
        object: string;
        id: string;
        properties?: Record<string, unknown>;
        title?: Array<{ plain_text: string }>;
        parent?: { type: string };
        url?: string;
      }>;
    };

    if (data.results.length === 0) {
      return `No Notion results for "${query}"`;
    }

    const results = data.results.slice(0, 5).map((item) => {
      let title = "Untitled";

      // Extract title from different property types
      if (item.properties) {
        const titleProp = item.properties.Name || item.properties.title || item.properties.Title;
        if (titleProp && typeof titleProp === "object") {
          const tp = titleProp as { title?: Array<{ plain_text: string }> };
          if (tp.title?.[0]?.plain_text) {
            title = tp.title[0].plain_text;
          }
        }
      }

      return `- [${item.object}] ${title}`;
    });

    return `## Notion results for "${query}":\n${results.join("\n")}`;
  } catch (error) {
    return `Notion search error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Search Todoist for related tasks
async function searchTodoist(query: string): Promise<string> {
  const todoistToken = process.env.TODOIST_API_TOKEN;
  if (!todoistToken) {
    return "Todoist API token not configured (TODOIST_API_TOKEN)";
  }

  try {
    // Get all tasks and filter locally (Todoist REST API doesn't have search)
    const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
      headers: {
        Authorization: `Bearer ${todoistToken}`,
      },
    });

    if (!response.ok) {
      return `Todoist API error: ${response.status}`;
    }

    const tasks = (await response.json()) as Array<{
      id: string;
      content: string;
      description: string;
      project_id: string;
      due?: { date: string };
    }>;

    // Simple search - filter tasks containing query words
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const matches = tasks.filter((task) => {
      const text = `${task.content} ${task.description || ""}`.toLowerCase();
      return queryWords.some((word) => text.includes(word));
    });

    if (matches.length === 0) {
      return `No Todoist tasks matching "${query}"`;
    }

    const results = matches.slice(0, 5).map((task) => {
      const due = task.due ? ` (due: ${task.due.date})` : "";
      return `- ${task.content}${due}`;
    });

    return `## Todoist tasks matching "${query}":\n${results.join("\n")}`;
  } catch (error) {
    return `Todoist search error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Search Obsidian vault for notes
async function searchObsidian(query: string): Promise<string> {
  const config = loadConfig();
  const vaultPath = config.destinations?.obsidian?.vault;

  if (!vaultPath) {
    return "Obsidian vault path not configured";
  }

  const { spawnSync } = await import("child_process");
  const { existsSync } = await import("fs");

  if (!existsSync(vaultPath)) {
    return `Obsidian vault not found: ${vaultPath}`;
  }

  try {
    // Use ripgrep to search the vault - using spawnSync for safety
    const result = spawnSync("rg", ["-l", "-i", "--max-count=1", query, vaultPath], {
      encoding: "utf-8",
      timeout: 5000,
    });

    const files = (result.stdout || "").trim().split("\n").filter(Boolean).slice(0, 10);

    if (files.length === 0) {
      return `No Obsidian notes matching "${query}"`;
    }

    // Get snippets from matching files
    const snippets = files.slice(0, 5).map((file) => {
      const relativePath = file.replace(vaultPath, "").replace(/^\//, "");
      const snippetResult = spawnSync("rg", ["-i", "-m", "1", "-C", "1", query, file], {
        encoding: "utf-8",
        timeout: 2000,
      });
      const snippet = (snippetResult.stdout || "").trim().slice(0, 300);
      return `### ${relativePath}\n${snippet || "(no snippet)"}`;
    });

    return `## Obsidian notes matching "${query}":\n\n${snippets.join("\n\n")}`;
  } catch (error) {
    return `Obsidian search error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const SYSTEM_PROMPT = `You are a GTD (Getting Things Done) expert. Analyze inbox items and classify them.

## Categories:

**trash**: ONLY for actual spam/junk mail. NEVER use for:
- Vague items you don't understand (those need clarification)
- Personal observations or reflections (those are reference)
- Acronyms or shorthand you can't decode (those need clarification)

**reference**: Information to file, NOT actionable:
- Personal reflections, observations ("X is really nice/good")
- Links to resources, notes about things working well
- Podcast/video recommendations

**someday**: Ideas for the future, NOT current priority

**do_now**: Actionable AND under 2 minutes

**delegate**: Someone else should do it

**context**: Actionable task for a context list (@computer, @calls, @errands, @home, @office, @waiting)
- Use this for VAGUE items too, but with LOW confidence and "Clarify..." as next_action

**project**: Multi-step initiative (3+ distinct steps)

## Critical Rules:

1. **Vague/unclear items** (single words, acronyms, cryptic notes):
   - Category: context (NOT trash)
   - Confidence: 0.30-0.45
   - next_action: "Clarify what [X] means and define specific action"

2. **Never trash something just because you don't understand it**

3. **Personal observations** ("X is really good/nice"):
   - Category: reference
   - Confidence: 0.85+

## When to Research:
- URLs present → fetch_url
- Person mentioned → search_notion
- Project/product mentioned → search_notion + search_obsidian
- Check for duplicates → search_todoist

## Confidence Calibration:
- Clear, specific, obvious category → 0.85-0.95
- Some ambiguity but reasonable guess → 0.65-0.80
- Vague, cryptic, unclear → 0.30-0.45

Research as needed, then call submit_classification with your answer.`;

interface Classification {
  category: Category;
  confidence: number;
  reasoning?: string;
  next_action?: string;
  context?: string;
  delegate_to?: string;
  reference_location?: string;
  needs_more_research?: boolean;
}

async function classifyWithAgent(
  client: Anthropic,
  item: FetchedItem,
  itemsContext: string,
  model: string,
  maxIterations: number,
  verbose: boolean
): Promise<ClassifiedItem> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `## Current Inbox (for context):
${itemsContext}

---

## Classify this item:

**Text:** ${item.text}
${item.description ? `**Description:** ${item.description}` : ""}
${item.labels?.length ? `**Labels:** ${item.labels.join(", ")}` : ""}
${item.due_date ? `**Due:** ${item.due_date}` : ""}
${item.priority ? `**Priority:** ${item.priority}` : ""}
**Source:** ${item.source}

Research any URLs, then submit your classification.`,
    },
  ];

  let lastClassification: Classification | null = null;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    if (verbose) {
      console.error(`  [Iteration ${iterations}/${maxIterations}]`);
    }

    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Process response
    let hasToolUse = false;
    const assistantContent: Anthropic.ContentBlock[] = [];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      assistantContent.push(block);

      if (block.type === "text" && verbose) {
        console.error(`  💭 ${block.text.slice(0, 100)}...`);
      }

      if (block.type === "tool_use") {
        hasToolUse = true;

        if (block.name === "submit_classification") {
          const input = block.input as Classification;
          lastClassification = input;

          if (verbose) {
            console.error(
              `  ✅ ${input.category} (${Math.round(input.confidence * 100)}%)${input.needs_more_research ? " [wants more research]" : ""}`
            );
          }

          // If high confidence or doesn't need more research, we're done
          if (!input.needs_more_research || input.confidence >= 0.85) {
            return buildClassifiedItem(item, lastClassification);
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Classification recorded. ${input.needs_more_research ? "Continuing research..." : "Done."}`,
          });
        } else {
          // Execute other tools (fetch_url, etc.)
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            verbose
          );

          if (verbose) {
            console.error(`  📄 Got ${result.length} chars`);
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }
    }

    // If no tool use and we have a classification, we're done
    if (!hasToolUse && lastClassification) {
      break;
    }

    // If stop reason is end_turn without classification, ask for one
    if (response.stop_reason === "end_turn" && !lastClassification) {
      messages.push({ role: "assistant", content: assistantContent });
      messages.push({
        role: "user",
        content:
          "Please submit your classification using the submit_classification tool.",
      });
      continue;
    }

    // Continue conversation with tool results
    if (toolResults.length > 0) {
      messages.push({ role: "assistant", content: assistantContent });
      messages.push({ role: "user", content: toolResults });

      // After 4+ iterations without classification, nudge the agent
      if (iterations >= 4 && !lastClassification) {
        messages.push({
          role: "user",
          content: "You've done several rounds of research. Please submit your classification now using the submit_classification tool.",
        });
      }
    } else {
      break;
    }
  }

  // Final verification for low confidence
  if (lastClassification && lastClassification.confidence < 0.6) {
    if (verbose) {
      console.error(`  [Final verification - low confidence]`);
    }

    messages.push({
      role: "user",
      content: `Your classification has only ${Math.round(lastClassification.confidence * 100)}% confidence. Take a fresh look - is "${lastClassification.category}" really the best fit? Submit your final answer.`,
    });

    const finalResponse = await client.messages.create({
      model,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    for (const block of finalResponse.content) {
      if (block.type === "tool_use" && block.name === "submit_classification") {
        lastClassification = block.input as Classification;
        if (verbose) {
          console.error(
            `  ✅ Final: ${lastClassification.category} (${Math.round(lastClassification.confidence * 100)}%)`
          );
        }
      }
    }
  }

  // Default if no classification
  if (!lastClassification) {
    lastClassification = {
      category: "someday",
      confidence: 0.3,
      reasoning: "Agent did not produce classification",
    };
  }

  return buildClassifiedItem(item, lastClassification);
}

function buildClassifiedItem(
  item: FetchedItem,
  classification: Classification
): ClassifiedItem {
  return {
    ...item,
    classification: {
      category: classification.category,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      next_action: classification.next_action,
      context: classification.context,
      delegate_to: classification.delegate_to,
      reference_location: classification.reference_location,
      destination: getDestinationSuggestion(classification),
    },
  };
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

function generateExecutiveReport(items: ClassifiedItem[], startTime: number): string {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group items by category and confidence
  const needsClarification = items.filter(
    (i) => i.classification.confidence < 0.5
  );
  const actionItems = items.filter(
    (i) =>
      ["context", "do_now", "delegate"].includes(i.classification.category) &&
      i.classification.confidence >= 0.5
  );
  const projects = items.filter(
    (i) =>
      i.classification.category === "project" &&
      i.classification.confidence >= 0.5
  );
  const reference = items.filter(
    (i) =>
      i.classification.category === "reference" &&
      i.classification.confidence >= 0.5
  );
  const someday = items.filter(
    (i) =>
      i.classification.category === "someday" &&
      i.classification.confidence >= 0.5
  );
  const trash = items.filter(
    (i) =>
      i.classification.category === "trash" &&
      i.classification.confidence >= 0.5
  );

  // Group action items by context
  const byContext: Record<string, ClassifiedItem[]> = {};
  const immediate: ClassifiedItem[] = [];
  const delegate: ClassifiedItem[] = [];

  for (const item of actionItems) {
    if (item.classification.category === "do_now") {
      immediate.push(item);
    } else if (item.classification.category === "delegate") {
      delegate.push(item);
    } else {
      const ctx = item.classification.context || "@misc";
      if (!byContext[ctx]) byContext[ctx] = [];
      byContext[ctx].push(item);
    }
  }

  // Calculate average confidence
  const avgConfidence =
    items.length > 0
      ? Math.round(
          (items.reduce((sum, i) => sum + i.classification.confidence, 0) /
            items.length) *
            100
        )
      : 0;

  // Build report
  const lines: string[] = [];

  lines.push("# Inbox Briefing");
  lines.push(`**${date} • ${items.length} items processed**`);
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  const summaryPoints: string[] = [];
  if (needsClarification.length > 0) {
    summaryPoints.push(
      `- ⚠️ **${needsClarification.length} item${needsClarification.length > 1 ? "s" : ""} need${needsClarification.length === 1 ? "s" : ""} your input** before processing`
    );
  }
  if (actionItems.length > 0) {
    summaryPoints.push(
      `- ✅ ${actionItems.length} action item${actionItems.length > 1 ? "s" : ""} ready for your lists`
    );
  }
  if (projects.length > 0) {
    summaryPoints.push(
      `- 📋 ${projects.length} new project${projects.length > 1 ? "s" : ""} identified`
    );
  }
  if (reference.length > 0) {
    summaryPoints.push(
      `- 📚 ${reference.length} item${reference.length > 1 ? "s" : ""} filed as reference`
    );
  }
  if (someday.length > 0) {
    summaryPoints.push(
      `- 💭 ${someday.length} item${someday.length > 1 ? "s" : ""} moved to someday/maybe`
    );
  }
  if (trash.length > 0) {
    summaryPoints.push(
      `- 🗑️ ${trash.length} item${trash.length > 1 ? "s" : ""} discarded`
    );
  }
  lines.push(summaryPoints.join("\n"));
  lines.push("");

  // Requires Your Input
  if (needsClarification.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## ⚠️ Requires Your Input");
    lines.push("");
    lines.push("| Item | Question |");
    lines.push("|------|----------|");
    for (const item of needsClarification) {
      const question = extractClarificationQuestion(item);
      const text = item.text.length > 40 ? item.text.slice(0, 40) + "..." : item.text;
      lines.push(`| ${text} | ${question} |`);
    }
    lines.push("");
  }

  // Action Items
  if (actionItems.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Action Items");
    lines.push("");

    if (immediate.length > 0) {
      lines.push("### ⚡ Immediate (2-min tasks)");
      for (const item of immediate) {
        const action = item.classification.next_action || item.text;
        lines.push(`- ${action}`);
      }
      lines.push("");
    }

    if (delegate.length > 0) {
      lines.push("### 👥 Delegate");
      for (const item of delegate) {
        const to = item.classification.delegate_to || "TBD";
        const action = item.classification.next_action || item.text;
        lines.push(`- ${action} → **${to}**`);
      }
      lines.push("");
    }

    for (const [context, contextItems] of Object.entries(byContext).sort()) {
      const emoji = getContextEmoji(context);
      lines.push(`### ${emoji} ${context}`);
      for (const item of contextItems) {
        const action = item.classification.next_action || item.text;
        const confidence = Math.round(item.classification.confidence * 100);
        lines.push(`- ${action} *(${confidence}%)*`);
      }
      lines.push("");
    }
  }

  // Projects
  if (projects.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 📋 Projects Identified");
    lines.push("");
    lines.push("| Project | First Action |");
    lines.push("|---------|--------------|");
    for (const item of projects) {
      const firstAction = item.classification.next_action || "Define next action";
      lines.push(`| ${item.text} | ${firstAction} |`);
    }
    lines.push("");
  }

  // Reference
  if (reference.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 📚 Filed as Reference");
    lines.push("");
    for (const item of reference) {
      const location = item.classification.reference_location || "Obsidian";
      lines.push(`- "${item.text}" → *${location}*`);
    }
    lines.push("");
  }

  // Someday/Maybe
  if (someday.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 💭 Someday/Maybe");
    lines.push("");
    for (const item of someday) {
      lines.push(`- ${item.text}`);
    }
    lines.push("");
  }

  // Discarded
  if (trash.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 🗑️ Discarded");
    lines.push("");
    for (const item of trash) {
      lines.push(`- ~~${item.text}~~`);
    }
    lines.push("");
  }

  // Appendix - Full Item Manifest
  lines.push("---");
  lines.push("");
  lines.push("## Appendix: Complete Item Manifest");
  lines.push("");
  lines.push("| # | Item | Category | Confidence | Destination | Action |");
  lines.push("|---|------|----------|------------|-------------|--------|");

  items.forEach((item, idx) => {
    const c = item.classification;
    const text = item.text.length > 35 ? item.text.slice(0, 35) + "..." : item.text;
    const confidence = `${Math.round(c.confidence * 100)}%`;
    const dest = formatDestination(c.destination);
    const action = c.next_action
      ? c.next_action.length > 30
        ? c.next_action.slice(0, 30) + "..."
        : c.next_action
      : "—";
    lines.push(
      `| ${idx + 1} | ${text} | ${c.category} | ${confidence} | ${dest} | ${action} |`
    );
  });
  lines.push("");

  // Footer
  lines.push("---");
  lines.push(
    `*Average confidence: ${avgConfidence}% • Processing time: ${elapsed}s*`
  );

  return lines.join("\n");
}

function extractClarificationQuestion(item: ClassifiedItem): string {
  const nextAction = item.classification.next_action || "";

  if (nextAction.toLowerCase().includes("clarify")) {
    const match = nextAction.match(/clarify\s+(?:what\s+)?(.+)/i);
    if (match) {
      let question = match[1];
      question = question.replace(/^(specific\s+)?/i, "");
      question = question.replace(/\s*-\s*.+$/, "");
      if (!question.endsWith("?")) question += "?";
      return question.charAt(0).toUpperCase() + question.slice(1);
    }
  }

  return `What action is needed for "${item.text.slice(0, 20)}..."?`;
}

function getContextEmoji(context: string): string {
  const emojis: Record<string, string> = {
    "@computer": "💻",
    "@calls": "📞",
    "@errands": "🚗",
    "@home": "🏠",
    "@office": "🏢",
    "@waiting": "⏳",
    "@misc": "📌",
  };
  return emojis[context] || "📌";
}

function formatDestination(
  dest: ClassifiedItem["classification"]["destination"]
): string {
  if (!dest) return "—";

  switch (dest.type) {
    case "notion":
      return `Notion/${dest.target}`;
    case "obsidian":
      return `Obsidian/${dest.target}`;
    case "todoist":
      return `Todoist/${dest.target}`;
    case "discard":
      return "Trash";
    default:
      return "—";
  }
}
