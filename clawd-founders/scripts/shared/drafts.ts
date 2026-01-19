/**
 * Draft manager for reading/writing drafts.json
 *
 * Used by both pipeline.ts (to create drafts) and dashboard (to display/approve them)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Draft, DraftsState, DraftStatus, PipelineStage } from "./types";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DRAFTS_PATH = join(
  dirname(dirname(import.meta.dir)),
  "data",
  "drafts.json"
);

// ============================================================================
// State Management
// ============================================================================

export async function loadDrafts(
  path: string = DEFAULT_DRAFTS_PATH
): Promise<DraftsState> {
  if (!existsSync(path)) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const initial: DraftsState = { drafts: [], last_updated: new Date().toISOString() };
    await writeFile(path, JSON.stringify(initial, null, 2));
    return initial;
  }

  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}

export async function saveDrafts(
  state: DraftsState,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<void> {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  state.last_updated = new Date().toISOString();
  await writeFile(path, JSON.stringify(state, null, 2));
}

// ============================================================================
// Draft CRUD Operations
// ============================================================================

function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateDraftInput {
  phone: string;
  founder_name: string;
  company: string;
  message: string;
  alternatives?: string[];
  // New: structured draft options with tones
  drafts?: Array<{ message: string; tone: string }>;
  // New: reasoning for the approach
  reasoning?: string;
  // New: suggested follow-up actions
  suggested_actions?: Array<{
    type: string;
    params: Record<string, unknown>;
    description: string;
    enabled: boolean;
  }>;
  context: {
    stage: PipelineStage;
    demo_goal?: string | null;
    two_week_goal?: string | null;
    progress?: string | null;
    last_wa_message?: string | null;
    last_wa_from?: "us" | "them" | null;
    reasoning?: string;
  };
}

export async function createDraft(
  input: CreateDraftInput,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft> {
  const state = await loadDrafts(path);

  // Check if there's already a pending draft for this phone
  const existingIndex = state.drafts.findIndex(
    (d) => d.phone === input.phone && d.status === "pending"
  );

  const now = new Date().toISOString();
  const draft: Draft = {
    id: generateId(),
    phone: input.phone,
    founder_name: input.founder_name,
    company: input.company,
    message: input.message,
    status: "pending",
    created_at: now,
    updated_at: now,
    context: input.context,
    alternatives: input.alternatives,
    // New fields for AI-generated drafts
    drafts: input.drafts,
    reasoning: input.reasoning,
    suggested_actions: input.suggested_actions,
    selected_draft_index: 0,
  };

  if (existingIndex >= 0) {
    // Replace existing pending draft
    state.drafts[existingIndex] = draft;
  } else {
    state.drafts.push(draft);
  }

  await saveDrafts(state, path);
  return draft;
}

export async function getDraft(
  id: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  const state = await loadDrafts(path);
  return state.drafts.find((d) => d.id === id) || null;
}

export async function getDraftByPhone(
  phone: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  const state = await loadDrafts(path);
  // Return the most recent pending draft for this phone
  const pending = state.drafts
    .filter((d) => d.phone === phone && d.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return pending[0] || null;
}

export async function updateDraft(
  id: string,
  updates: Partial<Pick<Draft, "message" | "status" | "edited_message" | "user_instructions">>,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  const state = await loadDrafts(path);
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return null;
  }

  state.drafts[index] = {
    ...state.drafts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await saveDrafts(state, path);
  return state.drafts[index];
}

export async function approveDraft(
  id: string,
  editedMessage?: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  return updateDraft(
    id,
    {
      status: "approved",
      edited_message: editedMessage,
    },
    path
  );
}

export async function rejectDraft(
  id: string,
  instructions?: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  return updateDraft(
    id,
    {
      status: "rejected",
      user_instructions: instructions,
    },
    path
  );
}

export async function markDraftSent(
  id: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  return updateDraft(id, { status: "sent" }, path);
}

export async function deleteDraft(
  id: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<boolean> {
  const state = await loadDrafts(path);
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return false;
  }

  state.drafts.splice(index, 1);
  await saveDrafts(state, path);
  return true;
}

export async function deferDraft(
  id: string,
  until: string | null,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  const state = await loadDrafts(path);
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return null;
  }

  state.drafts[index] = {
    ...state.drafts[index],
    deferred_until: until,
    updated_at: new Date().toISOString(),
  };

  await saveDrafts(state, path);
  return state.drafts[index];
}

export async function unDeferDraft(
  id: string,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft | null> {
  return deferDraft(id, null, path);
}

// ============================================================================
// Query Operations
// ============================================================================

export async function getPendingDrafts(
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft[]> {
  const state = await loadDrafts(path);
  return state.drafts
    .filter((d) => d.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getApprovedDrafts(
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft[]> {
  const state = await loadDrafts(path);
  return state.drafts
    .filter((d) => d.status === "approved")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getRejectedDrafts(
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft[]> {
  const state = await loadDrafts(path);
  return state.drafts
    .filter((d) => d.status === "rejected")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getDraftsByStatus(
  status: DraftStatus,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft[]> {
  const state = await loadDrafts(path);
  return state.drafts
    .filter((d) => d.status === status)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getAllDrafts(
  path: string = DEFAULT_DRAFTS_PATH
): Promise<Draft[]> {
  const state = await loadDrafts(path);
  return state.drafts.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

// ============================================================================
// Cleanup Operations
// ============================================================================

export async function cleanupOldDrafts(
  maxAgeDays: number = 7,
  path: string = DEFAULT_DRAFTS_PATH
): Promise<number> {
  const state = await loadDrafts(path);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const originalCount = state.drafts.length;
  state.drafts = state.drafts.filter((d) => {
    // Keep pending and approved drafts
    if (d.status === "pending" || d.status === "approved") {
      return true;
    }
    // Remove old rejected/sent drafts
    return new Date(d.updated_at) > cutoff;
  });

  const removedCount = originalCount - state.drafts.length;
  if (removedCount > 0) {
    await saveDrafts(state, path);
  }

  return removedCount;
}
