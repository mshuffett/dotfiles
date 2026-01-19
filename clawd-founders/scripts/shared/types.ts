/**
 * Shared types for pipeline, dashboard, and agent workflows.
 */

// ============================================================================
// Pipeline Types
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

// ============================================================================
// Founder Types (from database)
// ============================================================================

export interface Founder {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  linkedin: string | null;
  batch: string | null;
  company: string | null;
  company_brief: string | null;
  subgroup: number | null;
  bookface: string | null;
  co_founder: string | null;
  repeat_yc: boolean;
  serial_founder: boolean;
  notes: string | null;
  demo_goal?: string | null;
  created_at: string;
}

export interface Goal {
  id: number;
  company: string;
  period: string;
  goal: string | null;
  progress: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Draft Types
// ============================================================================

export type DraftStatus = "pending" | "approved" | "rejected" | "sent";

export interface DraftOption {
  message: string;
  tone: string; // e.g., "direct", "supportive", "brief"
}

export type SuggestedActionType =
  | "log_interaction"
  | "update_outreach"
  | "create_followup"
  | "record_investor"
  | "record_nps"
  | "record_needs"
  | "create_note";

export interface SuggestedAction {
  type: SuggestedActionType;
  params: Record<string, unknown>;
  description: string; // human-readable for UI
  enabled: boolean; // user can toggle off
}

export interface Draft {
  id: string;
  phone: string;
  founder_name: string;
  company: string;
  message: string;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
  // Snooze/defer until this time (ISO timestamp)
  deferred_until?: string | null;
  // Context for the draft
  context: {
    stage: PipelineStage;
    demo_goal?: string | null;
    two_week_goal?: string | null;
    progress?: string | null;
    last_wa_message?: string | null;
    last_wa_from?: "us" | "them" | null;
    reasoning?: string; // Why this message was drafted
    messages?: WhatsAppMessage[]; // Full conversation history
  };
  // 3 draft options instead of 1
  drafts?: DraftOption[];
  // Reasoning for the approach
  reasoning?: string;
  // Suggested follow-up actions
  suggested_actions?: SuggestedAction[];
  // Which draft option user selected (default 0)
  selected_draft_index?: number;
  // Alternatives offered (legacy)
  alternatives?: string[];
  // If edited by user
  edited_message?: string;
  // Instructions from user for agent
  user_instructions?: string;
}

export interface DraftsState {
  drafts: Draft[];
  last_updated: string;
}

// ============================================================================
// Draft Generation Types
// ============================================================================

export interface FounderContext {
  // Basic info
  name: string;
  phone: string;
  company: string;
  company_brief?: string | null;
  location?: string | null;
  co_founder?: string | null;
  subgroup?: number | null;
  notes?: string | null;
  repeat_yc?: boolean;
  serial_founder?: boolean;

  // Goals
  demo_goal?: string | null;
  two_week_goal?: string | null;
  progress?: string | null;

  // Pipeline state
  stage: PipelineStage;
  nps?: number | null;
  needs?: string | null;
  nudge_count?: number;

  // Conversation
  messages: WhatsAppMessage[];

  // Past interactions from DB
  interactions?: Array<{
    summary: string;
    topics?: string;
    sentiment?: string;
    date: string;
  }>;
}

export interface GeneratedDraftResponse {
  drafts: DraftOption[];
  reasoning: string;
  suggested_actions: SuggestedAction[];
}

// ============================================================================
// Message History Types
// ============================================================================

export interface WhatsAppMessage {
  id: string;
  timestamp: string;
  from: "us" | "them";
  text: string;
  media_type?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PipelineStatusResponse {
  state: PipelineState;
  summary: {
    not_contacted: number;
    awaiting_reply: number;
    in_conversation: number;
    nps_collected: number;
    needs_collected: number;
    complete: number;
    needs_attention: number; // them replied, we haven't
  };
}

export interface FounderDetailResponse {
  founder: Founder;
  pipeline: FounderPipelineEntry | null;
  goals: Goal[];
  messages: WhatsAppMessage[];
}

// ============================================================================
// WebSocket Events
// ============================================================================

export type WSEventType =
  | "pipeline_update"
  | "draft_created"
  | "draft_updated"
  | "message_sent"
  | "message_received";

export interface WSEvent {
  type: WSEventType;
  timestamp: string;
  data: unknown;
}
