#!/usr/bin/env bun
/**
 * pipeline.ts
 *
 * Agentic outreach pipeline management for founder outreach.
 *
 * Usage:
 *   bun pipeline.ts status              # Show pipeline overview
 *   bun pipeline.ts history +1415...    # Read recent messages (required before send)
 *   bun pipeline.ts context +1415...    # Show founder details from DB
 *   bun pipeline.ts send +1415... "msg" # Send message, update state
 *   bun pipeline.ts nps +1415... 8 "comment"     # Record NPS score
 *   bun pipeline.ts needs +1415... "description" # Record needs/asks
 *   bun pipeline.ts investor +1415... "Name" "notes"  # Record investor mention
 *   bun pipeline.ts draft +1415... "msg" "reason"  # Create draft for dashboard
 *   bun pipeline.ts drafts              # List pending drafts
 *   bun pipeline.ts check-all           # Read history for all founders
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { $ } from "bun";
import { Database } from "bun:sqlite";
import { createDraft, getPendingDrafts, type CreateDraftInput } from "./shared/drafts";

// ============================================================================
// Types
// ============================================================================

export type PipelineStage =
  | "not_contacted"
  | "awaiting_reply"
  | "in_conversation"
  | "nps_collected"
  | "needs_collected"
  | "complete";

export interface FounderPipelineEntry {
  stage: PipelineStage;
  last_sent?: string | null;
  last_received?: string | null;
  last_checked_at?: string | null;
  last_wa_message_at?: string | null;
  last_wa_message?: string | null;
  last_wa_from?: "us" | "them" | null;
  nps?: number | null;
  nps_comment?: string | null;
  needs?: string | null;
  notes?: string | null;
  nudge_count?: number;
}

export interface PipelineState {
  [phone: string]: FounderPipelineEntry;
}

export interface CanSendResult {
  allowed: boolean;
  reason?: string;
}

export interface StatusSummary {
  not_contacted: Array<{ phone: string; entry: FounderPipelineEntry }>;
  awaiting_reply: Array<{ phone: string; entry: FounderPipelineEntry }>;
  stale_awaiting: Array<{ phone: string; entry: FounderPipelineEntry; days_since: number }>;
  in_conversation: Array<{ phone: string; entry: FounderPipelineEntry }>;
  nps_collected: Array<{ phone: string; entry: FounderPipelineEntry }>;
  needs_collected: Array<{ phone: string; entry: FounderPipelineEntry }>;
  complete: Array<{ phone: string; entry: FounderPipelineEntry }>;
  new_messages: Array<{ phone: string; message: string; from: string; timestamp: string }>;
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_ORDER: PipelineStage[] = [
  "not_contacted",
  "awaiting_reply",
  "in_conversation",
  "nps_collected",
  "needs_collected",
  "complete",
];

import { DB_PATH, PIPELINE_PATH as CONFIG_PIPELINE_PATH } from "./shared/paths";

const DEFAULT_PIPELINE_PATH = CONFIG_PIPELINE_PATH;

// Safety check: require history check within this many minutes before sending
const HISTORY_CHECK_FRESHNESS_MINUTES = 10;

// Stale awaiting reply threshold
const STALE_AWAITING_DAYS = 2;

// ============================================================================
// State Management
// ============================================================================

export async function loadState(path: string = DEFAULT_PIPELINE_PATH): Promise<PipelineState> {
  if (!existsSync(path)) {
    // Create directory if needed
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    // Create empty state file
    await writeFile(path, JSON.stringify({}, null, 2));
    return {};
  }

  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}

export async function saveState(
  path: string = DEFAULT_PIPELINE_PATH,
  state: PipelineState
): Promise<void> {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(state, null, 2));
}

export function getDefaultEntry(): FounderPipelineEntry {
  return {
    stage: "not_contacted",
    last_sent: null,
    last_received: null,
    last_checked_at: null,
    last_wa_message_at: null,
    last_wa_message: null,
    last_wa_from: null,
    nps: null,
    nps_comment: null,
    needs: null,
    notes: null,
    nudge_count: 0,
  };
}

export function updateFounder(
  state: PipelineState,
  phone: string,
  updates: Partial<FounderPipelineEntry>
): PipelineState {
  const normalizedPhone = normalizePhoneForKey(phone);
  const existing = state[normalizedPhone] || getDefaultEntry();

  return {
    ...state,
    [normalizedPhone]: {
      ...existing,
      ...updates,
    },
  };
}

// ============================================================================
// Phone Number Utilities
// ============================================================================

/**
 * Normalize phone to digits only (no + prefix)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normalize phone for use as state key (with + prefix for readability)
 */
function normalizePhoneForKey(phone: string): string {
  const digits = normalizePhone(phone);
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * Convert phone to WhatsApp JID format
 */
export function phoneToJid(phone: string): string {
  const digits = normalizePhone(phone);
  return `${digits}@s.whatsapp.net`;
}

// ============================================================================
// Stage Management
// ============================================================================

export function stageOrder(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function advanceStage(currentStage: PipelineStage): PipelineStage {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return currentStage;
  }
  return STAGE_ORDER[currentIndex + 1];
}

// ============================================================================
// Safety Checks
// ============================================================================

export function canSend(
  state: PipelineState,
  phone: string
): CanSendResult {
  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone];

  if (!entry) {
    return { allowed: false, reason: "Founder not in pipeline state" };
  }

  if (!entry.last_checked_at) {
    return { allowed: false, reason: "Must check history first - run: pipeline.ts history " + phone };
  }

  // Check if history check is fresh enough
  const checkedAt = new Date(entry.last_checked_at);
  const now = new Date();
  const minutesSinceCheck = (now.getTime() - checkedAt.getTime()) / (1000 * 60);

  if (minutesSinceCheck > HISTORY_CHECK_FRESHNESS_MINUTES) {
    return {
      allowed: false,
      reason: `History check is stale (${Math.round(minutesSinceCheck)} min ago). Re-run: pipeline.ts history ${phone}`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// Status Summary
// ============================================================================

export function getStatusSummary(state: PipelineState): StatusSummary {
  const summary: StatusSummary = {
    not_contacted: [],
    awaiting_reply: [],
    stale_awaiting: [],
    in_conversation: [],
    nps_collected: [],
    needs_collected: [],
    complete: [],
    new_messages: [],
  };

  const now = new Date();

  for (const [phone, entry] of Object.entries(state)) {
    const item = { phone, entry };

    // Group by stage
    switch (entry.stage) {
      case "not_contacted":
        summary.not_contacted.push(item);
        break;
      case "awaiting_reply":
        summary.awaiting_reply.push(item);
        // Check if stale
        if (entry.last_sent) {
          const sentAt = new Date(entry.last_sent);
          const daysSince = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince > STALE_AWAITING_DAYS) {
            summary.stale_awaiting.push({ ...item, days_since: Math.floor(daysSince) });
          }
        }
        break;
      case "in_conversation":
        summary.in_conversation.push(item);
        break;
      case "nps_collected":
        summary.nps_collected.push(item);
        break;
      case "needs_collected":
        summary.needs_collected.push(item);
        break;
      case "complete":
        summary.complete.push(item);
        break;
    }

    // Check for new messages (last_wa_message_at > last_checked_at and from them)
    if (
      entry.last_wa_message_at &&
      entry.last_checked_at &&
      entry.last_wa_from === "them" &&
      new Date(entry.last_wa_message_at) > new Date(entry.last_checked_at)
    ) {
      summary.new_messages.push({
        phone,
        message: entry.last_wa_message || "(no message content)",
        from: "them",
        timestamp: entry.last_wa_message_at,
      });
    }
  }

  return summary;
}

// ============================================================================
// Recording Information
// ============================================================================

export function recordNPS(
  state: PipelineState,
  phone: string,
  score: number,
  comment?: string
): PipelineState {
  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone] || getDefaultEntry();

  // Determine new stage - advance to nps_collected if not already past it
  let newStage = entry.stage;
  if (stageOrder(entry.stage) < stageOrder("nps_collected")) {
    newStage = "nps_collected";
  }

  return {
    ...state,
    [normalizedPhone]: {
      ...entry,
      stage: newStage,
      nps: score,
      nps_comment: comment || entry.nps_comment,
    },
  };
}

export function recordNeeds(
  state: PipelineState,
  phone: string,
  needs: string
): PipelineState {
  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone] || getDefaultEntry();

  // Determine new stage - advance to needs_collected if not already past it
  let newStage = entry.stage;
  if (stageOrder(entry.stage) < stageOrder("needs_collected")) {
    newStage = "needs_collected";
  }

  return {
    ...state,
    [normalizedPhone]: {
      ...entry,
      stage: newStage,
      needs: needs,
    },
  };
}

// ============================================================================
// WhatsApp Integration
// ============================================================================

interface WaMessage {
  id: string;
  timestamp: string;
  from: string;
  text?: string;
  isFromMe: boolean;
}

/**
 * Get LID JID for a phone number if it exists in wacli's mapping table
 */
async function getLidJid(phone: string): Promise<string | null> {
  const digits = normalizePhone(phone);
  try {
    const result = await $`sqlite3 ~/.wacli/session.db "SELECT lid FROM whatsmeow_lid_map WHERE pn = '${digits}'"`.text();
    const lid = result.trim();
    if (lid) {
      return `${lid}@lid`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch WhatsApp messages for a phone number (checks both JID formats)
 */
export async function fetchWhatsAppHistory(
  phone: string,
  limit: number = 10
): Promise<WaMessage[]> {
  const jid = phoneToJid(phone);
  const messages: WaMessage[] = [];

  // Try phone JID
  try {
    const result = await $`wacli messages list --chat ${jid} --limit ${limit} --json`.text();
    const parsed = JSON.parse(result);
    // wacli wraps messages in { success, data: { messages: [...] } }
    const msgArray = parsed?.data?.messages || (Array.isArray(parsed) ? parsed : []);
    if (Array.isArray(msgArray)) {
      messages.push(...msgArray.map(normalizeWaMessage));
    }
  } catch (e) {
    // No messages or error - continue
  }

  // Try @lid JID if available
  const lidJid = await getLidJid(phone);
  if (lidJid) {
    try {
      const result = await $`wacli messages list --chat ${lidJid} --limit ${limit} --json`.text();
      const parsed = JSON.parse(result);
      const msgArray = parsed?.data?.messages || (Array.isArray(parsed) ? parsed : []);
      if (Array.isArray(msgArray)) {
        messages.push(...msgArray.map(normalizeWaMessage));
      }
    } catch (e) {
      // No messages or error - continue
    }
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

function normalizeWaMessage(raw: any): WaMessage {
  return {
    id: raw.MsgID || raw.id || raw.ID || "",
    timestamp: raw.Timestamp || raw.timestamp || raw.ts || "",
    from: raw.SenderJID || raw.from || raw.From || raw.sender || "",
    text: raw.Text || raw.text || raw.body || raw.Body || "",
    isFromMe: raw.FromMe ?? raw.isFromMe ?? raw.IsFromMe ?? raw.fromMe ?? false,
  };
}

/**
 * Check history and update state with latest message info
 */
export async function checkHistory(
  state: PipelineState,
  phone: string,
  limit: number = 10
): Promise<{ state: PipelineState; messages: WaMessage[] }> {
  const messages = await fetchWhatsAppHistory(phone, limit);
  const normalizedPhone = normalizePhoneForKey(phone);
  const now = new Date().toISOString();

  const entry = state[normalizedPhone] || getDefaultEntry();

  // Find the most recent message
  const latestMessage = messages[0];

  const updates: Partial<FounderPipelineEntry> = {
    last_checked_at: now,
  };

  if (latestMessage) {
    updates.last_wa_message_at = latestMessage.timestamp;
    updates.last_wa_message = latestMessage.text;
    updates.last_wa_from = latestMessage.isFromMe ? "us" : "them";

    // Smart stage detection based on message history
    if (entry.stage === "not_contacted" || entry.stage === "awaiting_reply") {
      // Check if they have replied at all in the message history
      const hasTheirReply = messages.some((m) => !m.isFromMe);
      const hasOurMessage = messages.some((m) => m.isFromMe);

      if (hasTheirReply && hasOurMessage) {
        // Active conversation - they've replied to us
        updates.stage = "in_conversation";
        const theirLatest = messages.find((m) => !m.isFromMe);
        if (theirLatest) {
          updates.last_received = theirLatest.timestamp;
        }
      } else if (hasOurMessage && !hasTheirReply) {
        // We've sent but they haven't replied
        updates.stage = "awaiting_reply";
        const ourLatest = messages.find((m) => m.isFromMe);
        if (ourLatest && !entry.last_sent) {
          updates.last_sent = ourLatest.timestamp;
        }
      }
    }
  }

  const newState = updateFounder(state, phone, updates);

  return { state: newState, messages };
}

/**
 * Quick check for new messages since last_wa_message_at
 * Used by send safety check
 */
export async function hasNewMessagesSince(
  phone: string,
  since: string
): Promise<{ hasNew: boolean; latestMessage?: WaMessage }> {
  const messages = await fetchWhatsAppHistory(phone, 1);
  if (messages.length === 0) {
    return { hasNew: false };
  }

  const latest = messages[0];
  const sinceDate = new Date(since);
  const latestDate = new Date(latest.timestamp);

  if (latestDate > sinceDate && !latest.isFromMe) {
    return { hasNew: true, latestMessage: latest };
  }

  return { hasNew: false };
}

// ============================================================================
// Database Integration
// ============================================================================

function getDb(): Database {
  return new Database(DB_PATH);
}

/**
 * Get founder info from database by phone
 */
export function getFounderByPhone(phone: string): any | null {
  const db = getDb();
  const normalized = normalizePhone(phone);
  const founder = db.query(`
    SELECT * FROM founders
    WHERE REPLACE(phone, '+', '') LIKE '%' || ? || '%'
  `).get(normalized);
  db.close();
  return founder;
}

/**
 * Log an interaction to the database
 */
export function logInteraction(
  phone: string,
  summary: string,
  topics: string,
  direction: "inbound" | "outbound" = "outbound"
): void {
  const db = getDb();
  const founder = getFounderByPhone(phone);
  if (!founder) {
    console.error(`No founder found for phone: ${phone}`);
    db.close();
    return;
  }

  db.run(
    `INSERT INTO interactions (founder_id, summary, topics, direction)
     VALUES (?, ?, ?, ?)`,
    [founder.id, summary, topics, direction]
  );
  db.close();
}

/**
 * Add NPS score to outreach table
 */
export function logNPSToDb(phone: string, score: number, comment?: string): void {
  const db = getDb();
  const founder = getFounderByPhone(phone);
  if (!founder) {
    console.error(`No founder found for phone: ${phone}`);
    db.close();
    return;
  }

  db.run(
    `INSERT INTO outreach (founder_id, nps_score, nps_response, step)
     VALUES (?, ?, ?, 'nps_sent')
     ON CONFLICT(founder_id) DO UPDATE SET
       nps_score = excluded.nps_score,
       nps_response = excluded.nps_response,
       step = CASE WHEN step IN ('not_started', 'initial_sent') THEN 'nps_sent' ELSE step END,
       updated_at = datetime('now')`,
    [founder.id, score, comment || null]
  );

  // Also log as interaction
  logInteraction(phone, `NPS score: ${score}${comment ? ` - ${comment}` : ""}`, "nps,feedback");

  db.close();
}

/**
 * Add needs to outreach table
 */
export function logNeedsToDb(phone: string, needs: string): void {
  const db = getDb();
  const founder = getFounderByPhone(phone);
  if (!founder) {
    console.error(`No founder found for phone: ${phone}`);
    db.close();
    return;
  }

  db.run(
    `INSERT INTO outreach (founder_id, needs_response, step)
     VALUES (?, ?, 'needs_sent')
     ON CONFLICT(founder_id) DO UPDATE SET
       needs_response = excluded.needs_response,
       step = CASE WHEN step IN ('not_started', 'initial_sent', 'nps_sent') THEN 'needs_sent' ELSE step END,
       updated_at = datetime('now')`,
    [founder.id, needs]
  );

  // Also log as interaction
  logInteraction(phone, `Needs: ${needs}`, "needs,asks");

  db.close();
}

/**
 * Add investor to wishlist file
 */
export async function logInvestorWishlist(
  phone: string,
  investor: string,
  notes?: string
): Promise<void> {
  const wishlistPath = join(dirname(import.meta.dir), "data", "investor-wishlist.md");
  const founder = getFounderByPhone(phone);
  const founderName = founder?.name || phone;

  let content = "";
  if (existsSync(wishlistPath)) {
    content = await readFile(wishlistPath, "utf-8");
  } else {
    content = "# Investor Wishlist\n\n";
  }

  // Check if investor already listed
  const investorRegex = new RegExp(`^## ${investor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  if (investorRegex.test(content)) {
    // Add to existing entry
    content = content.replace(
      investorRegex,
      `## ${investor}\n- ${founderName}${notes ? `: ${notes}` : ""}`
    );
  } else {
    // Add new entry
    content += `\n## ${investor}\n- ${founderName}${notes ? `: ${notes}` : ""}\n`;
  }

  await writeFile(wishlistPath, content);

  // Log as followup
  const db = getDb();
  if (founder) {
    db.run(
      `INSERT INTO followups (founder_id, type, description, status)
       VALUES (?, 'intro', ?, 'pending')`,
      [founder.id, `Wants intro to ${investor}${notes ? ` - ${notes}` : ""}`]
    );
  }
  db.close();
}

// ============================================================================
// Send Message
// ============================================================================

export async function sendMessage(
  state: PipelineState,
  phone: string,
  message: string,
  skipSafetyCheck: boolean = false
): Promise<{ success: boolean; error?: string; state: PipelineState }> {
  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone];

  // Safety check
  if (!skipSafetyCheck) {
    const canSendResult = canSend(state, phone);
    if (!canSendResult.allowed) {
      return { success: false, error: canSendResult.reason, state };
    }

    // Quick check for new messages
    if (entry?.last_wa_message_at) {
      const newCheck = await hasNewMessagesSince(phone, entry.last_wa_message_at);
      if (newCheck.hasNew && newCheck.latestMessage) {
        return {
          success: false,
          error: `New message from them: "${newCheck.latestMessage.text}" - re-check history before sending`,
          state,
        };
      }
    }
  }

  // Send via clawdbot
  const digits = normalizePhone(phone);
  try {
    await $`clawdbot message send --channel whatsapp --to "+${digits}" --json --message ${message}`;
  } catch (e) {
    return {
      success: false,
      error: `Failed to send: ${e}`,
      state,
    };
  }

  // Update state
  const now = new Date().toISOString();
  const updates: Partial<FounderPipelineEntry> = {
    last_sent: now,
    last_wa_message_at: now,
    last_wa_from: "us",
  };

  // Advance stage if needed
  if (!entry || entry.stage === "not_contacted") {
    updates.stage = "awaiting_reply";
  }

  const newState = updateFounder(state, phone, updates);

  // Log interaction
  logInteraction(phone, `Sent: ${message.substring(0, 100)}...`, "outreach");

  return { success: true, state: newState };
}

// ============================================================================
// CLI Commands
// ============================================================================

async function cmdStatus(args: string[]): Promise<void> {
  const state = await loadState();
  const summary = getStatusSummary(state);

  console.log("\n=== Outreach Pipeline ===\n");

  if (summary.new_messages.length > 0) {
    console.log("📬 New Messages Since Last Check:");
    for (const msg of summary.new_messages) {
      const founder = getFounderByPhone(msg.phone);
      const name = founder?.name || msg.phone;
      console.log(`  - ${name}: "${msg.message.substring(0, 50)}..." (${formatTimeAgo(msg.timestamp)})`);
    }
    console.log("");
  }

  if (summary.stale_awaiting.length > 0) {
    console.log("⏰ Awaiting Reply (> 2 days):");
    for (const { phone, days_since } of summary.stale_awaiting) {
      const founder = getFounderByPhone(phone);
      const name = founder?.name || phone;
      console.log(`  - ${name} (${phone}) - sent ${days_since} days ago`);
    }
    console.log("");
  }

  if (summary.in_conversation.length > 0) {
    console.log("💬 In Conversation:");
    for (const { phone, entry } of summary.in_conversation) {
      const founder = getFounderByPhone(phone);
      const name = founder?.name || phone;
      const npsStatus = entry.nps ? `NPS: ${entry.nps}` : "NPS: pending";
      console.log(`  - ${name} - ${npsStatus}`);
    }
    console.log("");
  }

  if (summary.nps_collected.length > 0) {
    console.log("📊 NPS Collected (needs pending):");
    for (const { phone, entry } of summary.nps_collected) {
      const founder = getFounderByPhone(phone);
      const name = founder?.name || phone;
      console.log(`  - ${name} - NPS: ${entry.nps}`);
    }
    console.log("");
  }

  console.log("📈 Summary:");
  console.log(`  Not contacted: ${summary.not_contacted.length}`);
  console.log(`  Awaiting reply: ${summary.awaiting_reply.length}`);
  console.log(`  In conversation: ${summary.in_conversation.length}`);
  console.log(`  NPS collected: ${summary.nps_collected.length}`);
  console.log(`  Needs collected: ${summary.needs_collected.length}`);
  console.log(`  Complete: ${summary.complete.length}`);
}

async function cmdHistory(args: string[]): Promise<void> {
  const phone = args[0];
  if (!phone) {
    console.error("Usage: pipeline.ts history +14155551234");
    process.exit(1);
  }

  console.log(`\nChecking WhatsApp history for ${phone}...\n`);

  let state = await loadState();
  const result = await checkHistory(state, phone, 10);
  state = result.state;
  await saveState(DEFAULT_PIPELINE_PATH, state);

  const founder = getFounderByPhone(phone);
  if (founder) {
    console.log(`=== ${founder.name} (${founder.company}) ===\n`);
  }

  if (result.messages.length === 0) {
    console.log("No messages found.");
    return;
  }

  console.log("Recent messages:");
  for (const msg of result.messages.slice(0, 10)) {
    const direction = msg.isFromMe ? "→" : "←";
    const time = formatTimeAgo(msg.timestamp);
    console.log(`  ${direction} [${time}] ${msg.text?.substring(0, 80) || "(no text)"}`);
  }

  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone];
  console.log(`\nPipeline state: ${entry?.stage || "not in pipeline"}`);
  console.log(`Last checked: ${entry?.last_checked_at || "never"}`);
}

async function cmdContext(args: string[]): Promise<void> {
  const phone = args[0];
  if (!phone) {
    console.error("Usage: pipeline.ts context +14155551234");
    process.exit(1);
  }

  // Use existing query-db script
  await $`bun ${join(import.meta.dir, "query-db.ts")} phone ${phone}`;
}

async function cmdSend(args: string[]): Promise<void> {
  const phone = args[0];
  const message = args.slice(1).join(" ");

  if (!phone || !message) {
    console.error("Usage: pipeline.ts send +14155551234 'message here'");
    process.exit(1);
  }

  let state = await loadState();
  const result = await sendMessage(state, phone, message);

  if (!result.success) {
    console.error(`\n❌ Send blocked: ${result.error}`);
    process.exit(1);
  }

  await saveState(DEFAULT_PIPELINE_PATH, result.state);
  console.log(`\n✓ Message sent to ${phone}`);

  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = result.state[normalizedPhone];
  console.log(`Pipeline state: ${entry?.stage}`);
}

async function cmdNps(args: string[]): Promise<void> {
  const phone = args[0];
  const score = parseInt(args[1], 10);
  const comment = args.slice(2).join(" ");

  if (!phone || isNaN(score)) {
    console.error("Usage: pipeline.ts nps +14155551234 8 'optional comment'");
    process.exit(1);
  }

  let state = await loadState();
  state = recordNPS(state, phone, score, comment);
  await saveState(DEFAULT_PIPELINE_PATH, state);

  // Also log to database
  logNPSToDb(phone, score, comment);

  const founder = getFounderByPhone(phone);
  const name = founder?.name || phone;
  console.log(`\n✓ Recorded NPS ${score} for ${name}`);
  if (comment) console.log(`  Comment: ${comment}`);
}

async function cmdNeeds(args: string[]): Promise<void> {
  const phone = args[0];
  const needs = args.slice(1).join(" ");

  if (!phone || !needs) {
    console.error("Usage: pipeline.ts needs +14155551234 'description of needs'");
    process.exit(1);
  }

  let state = await loadState();
  state = recordNeeds(state, phone, needs);
  await saveState(DEFAULT_PIPELINE_PATH, state);

  // Also log to database
  logNeedsToDb(phone, needs);

  const founder = getFounderByPhone(phone);
  const name = founder?.name || phone;
  console.log(`\n✓ Recorded needs for ${name}: ${needs}`);
}

async function cmdInvestor(args: string[]): Promise<void> {
  const phone = args[0];
  const investor = args[1];
  const notes = args.slice(2).join(" ");

  if (!phone || !investor) {
    console.error("Usage: pipeline.ts investor +14155551234 'Sequoia' 'optional notes'");
    process.exit(1);
  }

  await logInvestorWishlist(phone, investor, notes);

  const founder = getFounderByPhone(phone);
  const name = founder?.name || phone;
  console.log(`\n✓ Added ${investor} to wishlist for ${name}`);
}

async function cmdDraft(args: string[]): Promise<void> {
  const phone = args[0];
  const message = args[1];
  const reasoning = args[2];

  if (!phone || !message) {
    console.error("Usage: pipeline.ts draft +14155551234 'message' 'optional reasoning'");
    process.exit(1);
  }

  const founder = getFounderByPhone(phone);
  if (!founder) {
    console.error(`No founder found with phone: ${phone}`);
    process.exit(1);
  }

  const state = await loadState();
  const normalizedPhone = normalizePhoneForKey(phone);
  const entry = state[normalizedPhone] || getDefaultEntry();

  // Get goals if available
  const db = getDb();
  const goal = db.query(`
    SELECT goal, progress FROM goals
    WHERE company = ? AND period = '01/07/26'
  `).get(founder.company) as { goal: string | null; progress: string | null } | null;
  db.close();

  const input: CreateDraftInput = {
    phone,
    founder_name: founder.name,
    company: founder.company || "Unknown",
    message,
    context: {
      stage: entry.stage,
      demo_goal: founder.demo_goal,
      two_week_goal: goal?.goal,
      progress: goal?.progress,
      last_wa_message: entry.last_wa_message,
      last_wa_from: entry.last_wa_from,
      reasoning,
    },
  };

  const draft = await createDraft(input);
  console.log(`\n✓ Created draft for ${founder.name}`);
  console.log(`  ID: ${draft.id}`);
  console.log(`  Message: ${message.substring(0, 60)}...`);
}

async function cmdDrafts(): Promise<void> {
  const drafts = await getPendingDrafts();

  if (drafts.length === 0) {
    console.log("\nNo pending drafts.");
    return;
  }

  console.log(`\n${drafts.length} pending draft(s):\n`);

  for (const draft of drafts) {
    console.log(`• ${draft.founder_name} (${draft.company})`);
    console.log(`  ${draft.message.substring(0, 80)}${draft.message.length > 80 ? "..." : ""}`);
    console.log(`  ID: ${draft.id}`);
    console.log();
  }
}

async function cmdCheckAll(args: string[]): Promise<void> {
  const db = getDb();
  let query = "SELECT phone FROM founders WHERE phone IS NOT NULL";

  // Filter by subgroup if specified
  const subgroupIdx = args.indexOf("--subgroup");
  if (subgroupIdx !== -1 && args[subgroupIdx + 1]) {
    query += ` AND subgroup = ${parseInt(args[subgroupIdx + 1], 10)}`;
  }

  const founders = db.query(query).all() as { phone: string }[];
  db.close();

  console.log(`\nChecking WhatsApp history for ${founders.length} founders...\n`);

  let state = await loadState();
  let checked = 0;
  let withMessages = 0;

  for (const { phone } of founders) {
    try {
      const result = await checkHistory(state, phone, 5);
      state = result.state;
      checked++;
      if (result.messages.length > 0) withMessages++;

      // Progress indicator
      process.stdout.write(`\rChecked ${checked}/${founders.length}...`);

      // Small delay to avoid rate limiting
      await Bun.sleep(100);
    } catch (e) {
      console.error(`\nError checking ${phone}: ${e}`);
    }
  }

  await saveState(DEFAULT_PIPELINE_PATH, state);
  console.log(`\n\n✓ Checked ${checked} founders, ${withMessages} have messages`);
}

// ============================================================================
// Utilities
// ============================================================================

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

// ============================================================================
// Main CLI Entry
// ============================================================================

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "status":
    await cmdStatus(args);
    break;
  case "history":
    await cmdHistory(args);
    break;
  case "context":
    await cmdContext(args);
    break;
  case "send":
    await cmdSend(args);
    break;
  case "nps":
    await cmdNps(args);
    break;
  case "needs":
    await cmdNeeds(args);
    break;
  case "investor":
    await cmdInvestor(args);
    break;
  case "draft":
    await cmdDraft(args);
    break;
  case "drafts":
    await cmdDrafts();
    break;
  case "check-all":
    await cmdCheckAll(args);
    break;
  default:
    console.log(`
Agentic Outreach Pipeline

Usage:
  bun pipeline.ts status              # Show pipeline overview
  bun pipeline.ts history +1415...    # Read recent messages (required before send)
  bun pipeline.ts context +1415...    # Show founder details from DB
  bun pipeline.ts send +1415... "msg" # Send message, update state
  bun pipeline.ts nps +1415... 8 "comment"     # Record NPS score
  bun pipeline.ts needs +1415... "description" # Record needs/asks
  bun pipeline.ts investor +1415... "Name" "notes"  # Record investor mention
  bun pipeline.ts draft +1415... "msg" "reason"  # Create draft for dashboard
  bun pipeline.ts drafts              # List pending drafts
  bun pipeline.ts check-all           # Read history for all founders
  bun pipeline.ts check-all --subgroup 1  # Check specific subgroup
    `);
}
