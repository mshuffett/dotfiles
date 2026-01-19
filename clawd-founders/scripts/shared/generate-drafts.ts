/**
 * generate-drafts.ts
 *
 * Generates draft responses for founders using Claude Opus API.
 * Reads SOUL.md, USER.md, CLAUDE.md for system context and builds
 * founder-specific prompts for high-quality personalized responses.
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { Database } from "bun:sqlite";
import type {
  FounderContext,
  GeneratedDraftResponse,
  PipelineStage,
  PipelineState,
  WhatsAppMessage,
  DraftOption,
  SuggestedAction,
} from "./types";
import { createDraft as saveDraftToFile } from "./drafts";

// ============================================================================
// Constants
// ============================================================================

const ROOT_DIR = dirname(dirname(import.meta.dir));
const SOUL_PATH = join(ROOT_DIR, "SOUL.md");
const USER_PATH = join(ROOT_DIR, "USER.md");
const CLAUDE_PATH = join(ROOT_DIR, "CLAUDE.md"); // Symlink to AGENTS.md
const DB_PATH = "/Users/michael/clawd-founders/data/founders.db";
const PIPELINE_PATH = "/Users/michael/clawd-founders/data/pipeline.json";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-5-20251101";

// ============================================================================
// System Prompt Loading
// ============================================================================

let cachedSystemPrompt: string | null = null;

async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  const parts: string[] = [];

  // Load SOUL.md (personality)
  if (existsSync(SOUL_PATH)) {
    const soul = await readFile(SOUL_PATH, "utf-8");
    parts.push("# Personality and Identity\n\n" + soul);
  }

  // Load USER.md (Michael's background)
  if (existsSync(USER_PATH)) {
    const user = await readFile(USER_PATH, "utf-8");
    parts.push("\n\n# About You (Michael)\n\n" + user);
  }

  // Load relevant sections from CLAUDE.md (message flow templates)
  if (existsSync(CLAUDE_PATH)) {
    const claude = await readFile(CLAUDE_PATH, "utf-8");
    // Extract message flow sections
    const messageFlowSection = extractMessageFlowSection(claude);
    if (messageFlowSection) {
      parts.push("\n\n# Message Guidelines\n\n" + messageFlowSection);
    }
  }

  cachedSystemPrompt = parts.join("");
  return cachedSystemPrompt;
}

function extractMessageFlowSection(claudeMd: string): string {
  // Extract relevant sections for message drafting
  const sections: string[] = [];

  // Get "Message Flow" sections
  const flowMatch = claudeMd.match(/### Message Flow[\s\S]*?(?=^##[^#]|\n---|\Z)/gm);
  if (flowMatch) {
    sections.push(...flowMatch);
  }

  // Get response guidelines
  const responseMatch = claudeMd.match(/## Response Behavior[\s\S]*?(?=^##[^#]|\n---|\Z)/gm);
  if (responseMatch) {
    sections.push(...responseMatch);
  }

  // Get data field definitions
  const dataMatch = claudeMd.match(/### Data Field Definitions[\s\S]*?(?=^##[^#]|\n---|\Z)/gm);
  if (dataMatch) {
    sections.push(...dataMatch);
  }

  return sections.join("\n\n").slice(0, 4000); // Limit size
}

// ============================================================================
// Database & Pipeline Access
// ============================================================================

function getDb(): Database {
  return new Database(DB_PATH);
}

async function loadPipelineState(): Promise<PipelineState> {
  if (!existsSync(PIPELINE_PATH)) {
    return {};
  }
  const content = await readFile(PIPELINE_PATH, "utf-8");
  return JSON.parse(content);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizePhoneForKey(phone: string): string {
  const digits = normalizePhone(phone);
  return digits.startsWith("+") ? digits : `+${digits}`;
}

// ============================================================================
// Founder Context Building
// ============================================================================

interface FounderRow {
  id: number;
  name: string;
  phone: string;
  company: string;
  company_brief: string | null;
  location: string | null;
  co_founder: string | null;
  subgroup: number | null;
  notes: string | null;
  repeat_yc: number;
  serial_founder: number;
  demo_goal: string | null;
}

interface GoalRow {
  goal: string | null;
  progress: string | null;
}

interface InteractionRow {
  summary: string;
  topics: string | null;
  sentiment: string | null;
  date: string;
}

export function getFounderContext(
  phone: string,
  pipelineState: PipelineState,
  messages: WhatsAppMessage[]
): FounderContext | null {
  const db = getDb();

  const normalized = normalizePhone(phone);
  const founder = db.query<FounderRow, [string]>(`
    SELECT * FROM founders
    WHERE REPLACE(phone, '+', '') LIKE '%' || ? || '%'
  `).get(normalized);

  if (!founder) {
    db.close();
    return null;
  }

  // Get current period goals
  const goal = db.query<GoalRow, [string]>(`
    SELECT goal, progress FROM goals
    WHERE company = ? AND period = '01/07/26'
  `).get(founder.company);

  // Get recent interactions
  const interactions = db.query<InteractionRow, [number]>(`
    SELECT summary, topics, sentiment, date
    FROM interactions
    WHERE founder_id = ?
    ORDER BY date DESC
    LIMIT 5
  `).all(founder.id);

  db.close();

  const normalizedKey = normalizePhoneForKey(phone);
  const pipelineEntry = pipelineState[normalizedKey];

  return {
    name: founder.name,
    phone: founder.phone,
    company: founder.company,
    company_brief: founder.company_brief,
    location: founder.location,
    co_founder: founder.co_founder,
    subgroup: founder.subgroup,
    notes: founder.notes,
    repeat_yc: Boolean(founder.repeat_yc),
    serial_founder: Boolean(founder.serial_founder),
    demo_goal: founder.demo_goal,
    two_week_goal: goal?.goal,
    progress: goal?.progress,
    stage: pipelineEntry?.stage || "not_contacted",
    nps: pipelineEntry?.nps,
    needs: pipelineEntry?.needs,
    nudge_count: pipelineEntry?.nudge_count,
    messages,
    interactions: interactions.map((i) => ({
      summary: i.summary,
      topics: i.topics || undefined,
      sentiment: i.sentiment || undefined,
      date: i.date,
    })),
  };
}

// ============================================================================
// User Prompt Building
// ============================================================================

function buildUserPrompt(context: FounderContext): string {
  const parts: string[] = [];

  // Founder profile
  parts.push(`FOUNDER PROFILE:
- Name: ${context.name}
- Company: ${context.company}
${context.company_brief ? `- Company Brief: ${context.company_brief}` : ""}
${context.location ? `- Location: ${context.location}` : ""}
${context.co_founder ? `- Co-founder: ${context.co_founder}` : ""}
${context.subgroup ? `- Subgroup: ${context.subgroup}` : ""}
${context.notes ? `- Notes: ${context.notes}` : ""}
${context.repeat_yc ? `- Repeat YC: Yes` : ""}
${context.serial_founder ? `- Serial Founder: Yes` : ""}`);

  // Goals
  parts.push(`\nGOALS:
- Demo Day Goal: ${context.demo_goal || "(not set)"}
- Current 2-Week Goal: ${context.two_week_goal || "(not set)"}
- Progress Update: ${context.progress || "(none)"}`);

  // Outreach state
  parts.push(`\nOUTREACH STATE:
- Pipeline Stage: ${context.stage}
${context.nps !== null && context.nps !== undefined ? `- NPS Score: ${context.nps}` : "- NPS: not collected"}
${context.needs ? `- Needs/Asks: ${context.needs}` : "- Needs: not collected"}
- Nudge Count: ${context.nudge_count || 0}`);

  // Conversation history
  if (context.messages.length > 0) {
    parts.push("\nFULL CONVERSATION (last 10 messages, oldest first):");
    // Reverse to show oldest first
    const sortedMessages = [...context.messages].reverse().slice(-10);
    for (const msg of sortedMessages) {
      const direction = msg.from === "us" ? "→ us" : "← them";
      const timestamp = formatTimestamp(msg.timestamp);
      parts.push(`[${timestamp}] ${direction}: ${msg.text}`);
    }
    parts.push(`\n← LATEST MESSAGE (needs response)`);
  }

  // Past interactions
  if (context.interactions && context.interactions.length > 0) {
    parts.push("\nPREVIOUS INTERACTIONS FROM DB:");
    for (const interaction of context.interactions) {
      parts.push(`- [${interaction.date}] ${interaction.summary}${interaction.topics ? ` (topics: ${interaction.topics})` : ""}`);
    }
  }

  // Instructions
  parts.push(`\n---

Generate a WhatsApp reply to ${context.name}'s latest message.

Requirements:
- Be Michael (casual, lowercase, WhatsApp-style)
- Reference their specific goals/progress if relevant
- Don't bombard with questions
- Keep it short (1-3 sentences typically)
- Think about what they actually need

Output JSON with 3 draft options AND suggested follow-up actions:
{
  "drafts": [
    { "message": "draft option 1", "tone": "brief description" },
    { "message": "draft option 2", "tone": "brief description" },
    { "message": "draft option 3", "tone": "brief description" }
  ],
  "reasoning": "explanation of the situation and your approach",
  "suggested_actions": [
    {
      "type": "log_interaction",
      "params": { "summary": "...", "topics": "..." },
      "description": "human-readable description",
      "enabled": true
    }
  ]
}

Action types available:
- log_interaction: Log this interaction to the database
- update_outreach: Update outreach stage (step: "nps_sent" | "needs_sent" | "complete")
- create_followup: Create a follow-up reminder (type, description, due_date)
- record_investor: Record investor interest (investor name, notes)
- record_nps: Record NPS score (score, comment)
- record_needs: Record their needs/asks (needs description)

Only include actions that make sense based on the conversation.`);

  return parts.join("\n");
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return `${diffDays}d ago`;
  } catch {
    return ts;
  }
}

// ============================================================================
// Claude API Call
// ============================================================================

async function callClaudeApi(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedDraftResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("No content in Claude API response");
  }

  // Parse the JSON from the response
  // Handle potential markdown code blocks
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return validateGeneratedResponse(parsed);
  } catch (e) {
    console.error("Failed to parse Claude response:", content);
    throw new Error(`Failed to parse Claude response: ${e}`);
  }
}

function validateGeneratedResponse(data: unknown): GeneratedDraftResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.drafts) || obj.drafts.length === 0) {
    throw new Error("Invalid response: missing drafts array");
  }

  const drafts: DraftOption[] = obj.drafts.map((d: unknown) => {
    if (!d || typeof d !== "object") {
      throw new Error("Invalid draft option");
    }
    const draft = d as Record<string, unknown>;
    return {
      message: String(draft.message || ""),
      tone: String(draft.tone || ""),
    };
  });

  const reasoning = String(obj.reasoning || "");

  const suggestedActions: SuggestedAction[] = [];
  if (Array.isArray(obj.suggested_actions)) {
    for (const action of obj.suggested_actions) {
      if (action && typeof action === "object") {
        const a = action as Record<string, unknown>;
        suggestedActions.push({
          type: a.type as SuggestedAction["type"],
          params: (a.params as Record<string, unknown>) || {},
          description: String(a.description || ""),
          enabled: a.enabled !== false,
        });
      }
    }
  }

  return { drafts, reasoning, suggested_actions: suggestedActions };
}

// ============================================================================
// Main Generation Functions
// ============================================================================

export async function generateDraftForFounder(
  phone: string,
  messages: WhatsAppMessage[]
): Promise<GeneratedDraftResponse | null> {
  const pipelineState = await loadPipelineState();
  const context = getFounderContext(phone, pipelineState, messages);

  if (!context) {
    console.error(`No founder found for phone: ${phone}`);
    return null;
  }

  const systemPrompt = await loadSystemPrompt();
  const userPrompt = buildUserPrompt(context);

  return callClaudeApi(systemPrompt, userPrompt);
}

export interface FounderNeedingResponse {
  phone: string;
  name: string;
  company: string;
  stage: PipelineStage;
  lastMessage: string;
  lastMessageAt: string;
}

export async function getFoundersNeedingResponse(): Promise<FounderNeedingResponse[]> {
  const pipelineState = await loadPipelineState();
  const founders: FounderNeedingResponse[] = [];

  const db = getDb();

  for (const [phone, entry] of Object.entries(pipelineState)) {
    // Check if they replied and we haven't responded
    if (entry.last_wa_from === "them" && entry.last_wa_message) {
      const normalized = normalizePhone(phone);
      const founder = db.query<{ name: string; company: string; notes: string | null }, [string]>(`
        SELECT name, company, notes FROM founders
        WHERE REPLACE(phone, '+', '') LIKE '%' || ? || '%'
      `).get(normalized);

      // Skip non-founders
      if (founder?.notes?.includes("not a founder")) {
        continue;
      }

      if (founder) {
        founders.push({
          phone,
          name: founder.name,
          company: founder.company,
          stage: entry.stage,
          lastMessage: entry.last_wa_message,
          lastMessageAt: entry.last_wa_message_at || "",
        });
      }
    }
  }

  db.close();

  // Sort by message timestamp (most recent first)
  return founders.sort((a, b) =>
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export interface GenerateDraftsResult {
  total: number;
  generated: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
}

export async function generateAllPendingDrafts(
  onProgress?: (current: number, total: number) => void
): Promise<GenerateDraftsResult> {
  const foundersNeedingResponse = await getFoundersNeedingResponse();
  const result: GenerateDraftsResult = {
    total: foundersNeedingResponse.length,
    generated: 0,
    failed: 0,
    errors: [],
  };

  // Generate drafts in parallel (with concurrency limit)
  const CONCURRENCY = 3;
  const chunks: FounderNeedingResponse[][] = [];
  for (let i = 0; i < foundersNeedingResponse.length; i += CONCURRENCY) {
    chunks.push(foundersNeedingResponse.slice(i, i + CONCURRENCY));
  }

  let processed = 0;
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (founder) => {
        try {
          // Fetch message history for this founder
          const messages = await fetchMessagesForFounder(founder.phone);

          // Generate draft
          const response = await generateDraftForFounder(founder.phone, messages);

          if (response) {
            // Save draft to drafts.json
            const pipelineState = await loadPipelineState();
            const normalizedKey = normalizePhoneForKey(founder.phone);
            const pipelineEntry = pipelineState[normalizedKey];

            const db = getDb();
            const founderRow = db.query<{ demo_goal: string | null }, [string]>(`
              SELECT demo_goal FROM founders
              WHERE company = ?
            `).get(founder.company);
            const goal = db.query<{ goal: string | null; progress: string | null }, [string]>(`
              SELECT goal, progress FROM goals
              WHERE company = ? AND period = '01/07/26'
            `).get(founder.company);
            db.close();

            await saveDraftToFile({
              phone: founder.phone,
              founder_name: founder.name,
              company: founder.company,
              message: response.drafts[0]?.message || "",
              alternatives: response.drafts.slice(1).map((d) => d.message),
              // New: include structured drafts with tones
              drafts: response.drafts,
              // New: include reasoning and suggested actions
              reasoning: response.reasoning,
              suggested_actions: response.suggested_actions,
              context: {
                stage: founder.stage,
                demo_goal: founderRow?.demo_goal,
                two_week_goal: goal?.goal,
                progress: goal?.progress,
                last_wa_message: founder.lastMessage,
                last_wa_from: "them",
                reasoning: response.reasoning,
                messages: messages, // Full conversation history
              },
            });

            result.generated++;
          } else {
            result.failed++;
            result.errors.push({ phone: founder.phone, error: "No response generated" });
          }
        } catch (e) {
          result.failed++;
          result.errors.push({ phone: founder.phone, error: String(e) });
        }

        processed++;
        onProgress?.(processed, foundersNeedingResponse.length);
      })
    );
  }

  return result;
}

// Helper to fetch messages using wacli CLI
async function fetchMessagesForFounder(phone: string): Promise<WhatsAppMessage[]> {
  const { $ } = await import("bun");
  const messages: WhatsAppMessage[] = [];
  const digits = normalizePhone(phone);
  const jid = `${digits}@s.whatsapp.net`;

  // Try phone JID
  try {
    const result = await $`wacli messages list --chat ${jid} --limit 10 --json`.text();
    const parsed = JSON.parse(result);
    const msgArray = parsed?.data?.messages || (Array.isArray(parsed) ? parsed : []);
    if (Array.isArray(msgArray)) {
      for (const raw of msgArray) {
        messages.push({
          id: raw.MsgID || raw.id || raw.ID || "",
          timestamp: raw.Timestamp || raw.timestamp || raw.ts || "",
          from: (raw.FromMe ?? raw.isFromMe ?? raw.IsFromMe ?? raw.fromMe ?? false) ? "us" : "them",
          text: raw.Text || raw.text || raw.body || raw.Body || "",
        });
      }
    }
  } catch (e) {
    // No messages or error - continue
  }

  // Try @lid JID if available
  try {
    const lidResult = await $`sqlite3 ~/.wacli/session.db "SELECT lid FROM whatsmeow_lid_map WHERE pn = '${digits}'"`.text();
    const lid = lidResult.trim();
    if (lid) {
      const lidJid = `${lid}@lid`;
      const result = await $`wacli messages list --chat ${lidJid} --limit 10 --json`.text();
      const parsed = JSON.parse(result);
      const msgArray = parsed?.data?.messages || (Array.isArray(parsed) ? parsed : []);
      if (Array.isArray(msgArray)) {
        for (const raw of msgArray) {
          messages.push({
            id: raw.MsgID || raw.id || raw.ID || "",
            timestamp: raw.Timestamp || raw.timestamp || raw.ts || "",
            from: (raw.FromMe ?? raw.isFromMe ?? raw.IsFromMe ?? raw.fromMe ?? false) ? "us" : "them",
            text: raw.Text || raw.text || raw.body || raw.Body || "",
          });
        }
      }
    }
  } catch (e) {
    // No messages or error - continue
  }

  // Sort by timestamp descending and dedupe by ID
  const seen = new Set<string>();
  return messages
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
}

// ============================================================================
// CLI Entry (for testing)
// ============================================================================

if (import.meta.main) {
  const phone = process.argv[2];

  if (!phone) {
    console.log(`
Usage: bun generate-drafts.ts <phone>

Examples:
  bun generate-drafts.ts +14155551234
  bun generate-drafts.ts --all
`);
    process.exit(1);
  }

  if (phone === "--all") {
    console.log("Generating drafts for all founders needing response...\n");
    const result = await generateAllPendingDrafts((current, total) => {
      process.stdout.write(`\rGenerating drafts... ${current}/${total}`);
    });
    console.log(`\n\nResults:`);
    console.log(`  Total: ${result.total}`);
    console.log(`  Generated: ${result.generated}`);
    console.log(`  Failed: ${result.failed}`);
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      for (const err of result.errors) {
        console.log(`    - ${err.phone}: ${err.error}`);
      }
    }
  } else {
    console.log(`Generating draft for ${phone}...\n`);
    const response = await generateDraftForFounder(phone, []);
    if (response) {
      console.log("Generated response:");
      console.log(JSON.stringify(response, null, 2));
    } else {
      console.log("Failed to generate response");
    }
  }
}
