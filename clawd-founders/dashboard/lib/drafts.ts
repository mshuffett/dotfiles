import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { DRAFTS_PATH } from "./paths";
import type { Draft, DraftsState, DraftStatus } from "../../scripts/shared/types";

async function loadDraftsState(): Promise<DraftsState> {
  if (!existsSync(DRAFTS_PATH)) {
    return { drafts: [], last_updated: new Date().toISOString() };
  }
  const content = await readFile(DRAFTS_PATH, "utf-8");
  return JSON.parse(content);
}

async function saveDraftsState(state: DraftsState): Promise<void> {
  state.last_updated = new Date().toISOString();
  await writeFile(DRAFTS_PATH, JSON.stringify(state, null, 2));
}

export async function getPendingDrafts(): Promise<Draft[]> {
  const state = await loadDraftsState();
  return state.drafts
    .filter((d) => d.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getApprovedDrafts(): Promise<Draft[]> {
  const state = await loadDraftsState();
  return state.drafts
    .filter((d) => d.status === "approved")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getAllDrafts(): Promise<Draft[]> {
  const state = await loadDraftsState();
  return state.drafts.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getDraft(id: string): Promise<Draft | null> {
  const state = await loadDraftsState();
  return state.drafts.find((d) => d.id === id) || null;
}

export async function updateDraftStatus(
  id: string,
  status: DraftStatus,
  editedMessage?: string,
  instructions?: string
): Promise<Draft | null> {
  const state = await loadDraftsState();
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return null;
  }

  state.drafts[index] = {
    ...state.drafts[index],
    status,
    updated_at: new Date().toISOString(),
    ...(editedMessage && { edited_message: editedMessage }),
    ...(instructions && { user_instructions: instructions }),
  };

  await saveDraftsState(state);
  return state.drafts[index];
}

export async function approveDraft(
  id: string,
  editedMessage?: string
): Promise<Draft | null> {
  return updateDraftStatus(id, "approved", editedMessage);
}

export async function rejectDraft(
  id: string,
  instructions?: string
): Promise<Draft | null> {
  return updateDraftStatus(id, "rejected", undefined, instructions);
}

export async function markDraftSent(id: string): Promise<Draft | null> {
  return updateDraftStatus(id, "sent");
}

export async function updateDraftMessage(
  id: string,
  editedMessage: string,
  selectedDraftIndex?: number
): Promise<Draft | null> {
  const state = await loadDraftsState();
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return null;
  }

  state.drafts[index] = {
    ...state.drafts[index],
    edited_message: editedMessage,
    updated_at: new Date().toISOString(),
    ...(selectedDraftIndex !== undefined && { selected_draft_index: selectedDraftIndex }),
  };

  await saveDraftsState(state);
  return state.drafts[index];
}

export async function deferDraft(
  id: string,
  until: string | null
): Promise<Draft | null> {
  const state = await loadDraftsState();
  const index = state.drafts.findIndex((d) => d.id === id);

  if (index < 0) {
    return null;
  }

  state.drafts[index] = {
    ...state.drafts[index],
    deferred_until: until,
    updated_at: new Date().toISOString(),
  };

  await saveDraftsState(state);
  return state.drafts[index];
}

export async function unDeferDraft(id: string): Promise<Draft | null> {
  return deferDraft(id, null);
}
