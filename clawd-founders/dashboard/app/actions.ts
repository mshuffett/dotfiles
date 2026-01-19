"use server";

import { revalidatePath } from "next/cache";
import * as draftsLib from "@/lib/drafts";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

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
      "bun /Users/michael/clawd-founders/scripts/pipeline.ts check-all",
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
      "source ~/.env.zsh && bun /Users/michael/clawd-founders/scripts/shared/generate-drafts.ts --all",
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
          `sqlite3 /Users/michael/clawd-founders/data/founders.db "INSERT INTO interactions (founder_id, summary, topics) SELECT id, '${summary.replace(/'/g, "''")}', '${topics.replace(/'/g, "''")}' FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%'"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_nps": {
        const score = Number(params.score);
        const comment = String(params.comment || "");
        await execAsync(
          `bun /Users/michael/clawd-founders/scripts/pipeline.ts nps ${phone} ${score} "${comment}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_needs": {
        const needs = String(params.needs || "");
        await execAsync(
          `bun /Users/michael/clawd-founders/scripts/pipeline.ts needs ${phone} "${needs}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "record_investor": {
        const investor = String(params.investor || "");
        const notes = String(params.notes || "");
        await execAsync(
          `bun /Users/michael/clawd-founders/scripts/pipeline.ts investor ${phone} "${investor}" "${notes}"`,
          { timeout: 5000 }
        );
        break;
      }
      case "update_outreach": {
        const step = String(params.step || "");
        if (step) {
          await execAsync(
            `sqlite3 /Users/michael/clawd-founders/data/founders.db "UPDATE outreach SET step = '${step}', updated_at = datetime('now') WHERE founder_id = (SELECT id FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%')"`,
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
          `sqlite3 /Users/michael/clawd-founders/data/founders.db "INSERT INTO followups (founder_id, type, description, due_date) SELECT id, '${type}', '${description.replace(/'/g, "''")}', '${dueDate}' FROM founders WHERE phone LIKE '%${phone.replace(/\D/g, "")}%'"`,
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
