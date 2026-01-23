"use server";

import { revalidatePath } from "next/cache";
import * as draftsLib from "@/lib/drafts";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { SuggestedAction } from "../../scripts/shared/types";
import { SCRIPTS_DIR, DB_PATH, SOUL_PATH } from "@/lib/paths";
import { join } from "node:path";

const execAsync = promisify(exec);

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-5-20251101";

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface RefreshResult extends ActionResult {
  draftsGenerated?: number;
  draftErrors?: number;
}

export async function approveDraft(
  id: string,
  editedMessage?: string
): Promise<ActionResult> {
  try {
    const draft = await draftsLib.approveDraft(id, editedMessage);
    if (!draft) {
      return { success: false, error: "Draft not found" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to approve draft:", e);
    return { success: false, error: String(e) };
  }
}

export async function rejectDraft(
  id: string,
  instructions?: string
): Promise<ActionResult> {
  try {
    const draft = await draftsLib.rejectDraft(id, instructions);
    if (!draft) {
      return { success: false, error: "Draft not found" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to reject draft:", e);
    return { success: false, error: String(e) };
  }
}

export async function sendMessage(
  phone: string,
  message: string
): Promise<ActionResult> {
  try {
    // Use clawdbot to send the message
    const escapedMessage = message.replace(/'/g, "'\\''");
    const cmd = `clawdbot message send --channel whatsapp --to "${phone}" --json --message '${escapedMessage}'`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

    if (stderr && !stdout) {
      return { success: false, error: stderr };
    }

    // Parse the response to check for success
    try {
      const result = JSON.parse(stdout);
      if (result.payload?.result?.messageId) {
        revalidatePath("/");
        return { success: true };
      }
      return { success: false, error: "No message ID in response" };
    } catch {
      // If it's not JSON, check if stdout contains success indicators
      if (stdout.includes("Message sent") || stdout.includes("messageId")) {
        revalidatePath("/");
        return { success: true };
      }
      return { success: false, error: stdout || "Unknown error" };
    }
  } catch (e) {
    console.error("Failed to send message:", e);
    return { success: false, error: String(e) };
  }
}

export async function refreshPipeline(): Promise<RefreshResult> {
  try {
    // Run pipeline check-all to refresh all founder states
    const { stderr } = await execAsync(
      `bun ${join(SCRIPTS_DIR, "pipeline.ts")} check-all`,
      { timeout: 120000 }
    );

    if (stderr) {
      console.warn("Pipeline refresh stderr:", stderr);
    }

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to refresh pipeline:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateDrafts(): Promise<RefreshResult> {
  try {
    // Run generate-drafts script with --all flag
    // Source env file to get ANTHROPIC_API_KEY
    const { stdout, stderr } = await execAsync(
      `source ~/.env.zsh && bun ${join(SCRIPTS_DIR, "shared/generate-drafts.ts")} --all`,
      {
        timeout: 300000, // 5 minutes for API calls
        shell: "/bin/zsh",
        env: { ...process.env },
      }
    );

    if (stderr) {
      console.warn("Generate drafts stderr:", stderr);
    }

    // Parse the output to get stats
    let draftsGenerated = 0;
    let draftErrors = 0;

    const generatedMatch = stdout.match(/Generated:\s*(\d+)/);
    const failedMatch = stdout.match(/Failed:\s*(\d+)/);

    if (generatedMatch) draftsGenerated = parseInt(generatedMatch[1], 10);
    if (failedMatch) draftErrors = parseInt(failedMatch[1], 10);

    revalidatePath("/");
    return { success: true, draftsGenerated, draftErrors };
  } catch (e) {
    console.error("Failed to generate drafts:", e);
    return { success: false, error: String(e) };
  }
}

export async function refreshAndGenerateDrafts(): Promise<RefreshResult> {
  // First refresh pipeline state
  const refreshResult = await refreshPipeline();
  if (!refreshResult.success) {
    return refreshResult;
  }

  // Then generate drafts for founders needing response
  const generateResult = await generateDrafts();

  return {
    ...generateResult,
    success: true,
  };
}

export async function sendDraftAndExecuteActions(
  draftId: string,
  selectedDraftIndex: number,
  enabledActions: string[], // action descriptions that are enabled
  editedMessage?: string // optional edited message
): Promise<ActionResult> {
  try {
    const draft = await draftsLib.getDraft(draftId);
    if (!draft) {
      return { success: false, error: "Draft not found" };
    }

    // Get the message to send
    let message: string;
    if (editedMessage) {
      // Use the edited message passed in
      message = editedMessage;
    } else if (draft.edited_message) {
      message = draft.edited_message;
    } else if (draft.drafts && draft.drafts[selectedDraftIndex]) {
      message = draft.drafts[selectedDraftIndex].message;
    } else {
      message = draft.message;
    }

    // Send the message
    const escapedMessage = message.replace(/'/g, "'\\''");
    const cmd = `clawdbot message send --channel whatsapp --to "${draft.phone}" --json --message '${escapedMessage}'`;

    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

    if (stderr && !stdout) {
      return { success: false, error: stderr };
    }

    // Execute enabled actions
    if (draft.suggested_actions) {
      for (const action of draft.suggested_actions) {
        if (enabledActions.includes(action.description) && action.enabled) {
          await executeAction(draft.phone, action.type, action.params);
        }
      }
    }

    // Mark draft as sent
    await draftsLib.markDraftSent(draftId);

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to send draft:", e);
    return { success: false, error: String(e) };
  }
}

async function executeAction(
  phone: string,
  actionType: string,
  params: Record<string, unknown>
): Promise<void> {
  try {
    switch (actionType) {
      case "log_interaction": {
        const summary = String(params.summary || "");
        const topics = String(params.topics || "");
        await execAsync(
          `sqlite3 ${DB_PATH} "INSERT INTO interactions (founder_id, summary, topics) SELECT id, '${summary.replace(/'/g, "''")}', '${topics.replace(/'/g, "''")}' FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%'"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_nps": {
        const score = Number(params.score);
        const comment = String(params.comment || "");
        await execAsync(
          `bun ${join(SCRIPTS_DIR, "pipeline.ts")} nps ${phone} ${score} "${comment}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_needs": {
        const needs = String(params.needs || "");
        await execAsync(
          `bun ${join(SCRIPTS_DIR, "pipeline.ts")} needs ${phone} "${needs}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_investor": {
        const investor = String(params.investor || "");
        const notes = String(params.notes || "");
        await execAsync(
          `bun ${join(SCRIPTS_DIR, "pipeline.ts")} investor ${phone} "${investor}" "${notes}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "update_outreach": {
        const step = String(params.step || "");
        if (step) {
          await execAsync(
            `sqlite3 ${DB_PATH} "UPDATE outreach SET step = '${step}', updated_at = datetime('now') WHERE founder_id = (SELECT id FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%')"`,
            { timeout: 5000 }
          );
        }
        break;
      }
      case "create_followup": {
        const type = String(params.type || "check_in");
        const description = String(params.description || "");
        const dueDate = String(params.due_date || "");
        await execAsync(
          `sqlite3 ${DB_PATH} "INSERT INTO followups (founder_id, type, description, due_date) SELECT id, '${type}', '${description.replace(/'/g, "''")}', '${dueDate}' FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%'"`,
          { timeout: 5000 }
        );
        break;
      }
      case "create_note": {
        const category = String(params.category || "context");
        const content = String(params.content || "");
        await execAsync(
          `sqlite3 ${DB_PATH} "INSERT INTO notes (founder_id, category, content) SELECT id, '${category}', '${content.replace(/'/g, "''")}' FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%'"`,
          { timeout: 5000 }
        );
        break;
      }
    }
  } catch (e) {
    console.error(`Failed to execute action ${actionType}:`, e);
  }
}

export async function refreshPage(): Promise<ActionResult> {
  revalidatePath("/");
  return { success: true };
}

export type SnoozeOption = "1h" | "4h" | "tomorrow" | "next_week";

function getSnoozeUntil(option: SnoozeOption): string {
  const now = new Date();
  switch (option) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "4h":
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    case "next_week": {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek.toISOString();
    }
  }
}

export async function snoozeDraft(
  id: string,
  option: SnoozeOption
): Promise<ActionResult> {
  try {
    const until = getSnoozeUntil(option);
    const draft = await draftsLib.deferDraft(id, until);
    if (!draft) {
      return { success: false, error: "Draft not found" };
    }
    revalidatePath("/");
    return { success: true, data: { until } };
  } catch (e) {
    console.error("Failed to snooze draft:", e);
    return { success: false, error: String(e) };
  }
}

export async function unsnoozeDraft(id: string): Promise<ActionResult> {
  try {
    const draft = await draftsLib.unDeferDraft(id);
    if (!draft) {
      return { success: false, error: "Draft not found" };
    }
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to unsnooze draft:", e);
    return { success: false, error: String(e) };
  }
}

// ============================================================================
// AI Chat Assistant
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatWithAIInput {
  draftId: string;
  userMessage: string;
  chatHistory: ChatMessage[];
  currentDraft: {
    message: string;
    tone: string;
    actions: SuggestedAction[];
  };
  founderContext: {
    name: string;
    company: string;
    phone: string;
    demo_goal?: string | null;
    two_week_goal?: string | null;
    progress?: string | null;
    stage: string;
    messages?: Array<{ from: "us" | "them"; text: string; timestamp: string }>;
  };
}

interface ChatWithAIResult {
  response: string;
  updatedMessage?: string;
  updatedTone?: string;
  updatedActions?: SuggestedAction[];
}

async function loadSoulPrompt(): Promise<string> {
  if (existsSync(SOUL_PATH)) {
    return await readFile(SOUL_PATH, "utf-8");
  }
  return "";
}

export async function chatWithAI(input: ChatWithAIInput): Promise<ChatWithAIResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const soul = await loadSoulPrompt();

  // Build system prompt for chat assistant
  const systemPrompt = `You are helping Michael refine a WhatsApp message to a founder.

${soul ? `# Personality\n${soul.slice(0, 2000)}\n` : ""}

# Your Role
You're a helpful assistant that can:
1. Rewrite/shorten/change the tone of the current draft message
2. Add, remove, or modify suggested actions
3. Have a conversation to understand what Michael wants

# Scheduling
Michael's Cal.com links for booking meetings:
- 15 min: https://cal.com/everythingai/15min
- 30 min: https://cal.com/everythingai/30min

When scheduling meetings, use these links instead of proposing generic times.

# Current Context

## Founder
- Name: ${input.founderContext.name}
- Company: ${input.founderContext.company}
- Stage: ${input.founderContext.stage}
${input.founderContext.demo_goal ? `- Demo Goal: ${input.founderContext.demo_goal}` : ""}
${input.founderContext.two_week_goal ? `- 2-Week Goal: ${input.founderContext.two_week_goal}` : ""}
${input.founderContext.progress ? `- Progress: ${input.founderContext.progress}` : ""}

## Current Draft Message
${input.currentDraft.message}

## Current Tone
${input.currentDraft.tone || "default"}

## Current Suggested Actions
${JSON.stringify(input.currentDraft.actions, null, 2)}

# Action Types Available
- log_interaction: Log this interaction to the database (params: summary, topics)
- update_outreach: Update outreach stage (params: step = "nps_sent" | "needs_sent" | "complete")
- create_followup: Create a follow-up reminder (params: type, description, due_date)
- record_investor: Record investor interest (params: investor, notes)
- record_nps: Record NPS score (params: score, comment)
- record_needs: Record their needs/asks (params: needs)
- create_note: Save a learning/insight to the notes database (params: category, content)
  Categories: context, research, personal, goal

# Instructions
Respond conversationally to Michael's request. If you make changes to the message or actions, include them in XML tags at the end of your response:

<message>new message text here</message>
<tone>brief tone description</tone>
<actions>
[
  { "type": "log_interaction", "params": { "summary": "...", "topics": "..." }, "description": "...", "enabled": true }
]
</actions>

Only include these tags if you're actually making changes. The message should be casual, WhatsApp-style, lowercase.`;

  // Build conversation messages
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Add chat history
  for (const msg of input.chatHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current user message
  messages.push({ role: "user", content: input.userMessage });

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content in response");
    }

    // Parse the response
    const result: ChatWithAIResult = { response: content };

    // Extract updated message if present
    const messageMatch = content.match(/<message>([\s\S]*?)<\/message>/);
    if (messageMatch) {
      result.updatedMessage = messageMatch[1].trim();
      // Remove the tag from the visible response
      result.response = result.response.replace(/<message>[\s\S]*?<\/message>/g, "").trim();
    }

    // Extract updated tone if present
    const toneMatch = content.match(/<tone>([\s\S]*?)<\/tone>/);
    if (toneMatch) {
      result.updatedTone = toneMatch[1].trim();
      result.response = result.response.replace(/<tone>[\s\S]*?<\/tone>/g, "").trim();
    }

    // Extract updated actions if present
    const actionsMatch = content.match(/<actions>([\s\S]*?)<\/actions>/);
    if (actionsMatch) {
      try {
        const actionsJson = actionsMatch[1].trim();
        result.updatedActions = JSON.parse(actionsJson);
        result.response = result.response.replace(/<actions>[\s\S]*?<\/actions>/g, "").trim();
      } catch (e) {
        console.error("Failed to parse actions:", e);
      }
    }

    // Clean up response (remove empty lines at end)
    result.response = result.response.replace(/\n+$/, "");

    return result;
  } catch (e) {
    console.error("Chat with AI error:", e);
    throw e;
  }
}
