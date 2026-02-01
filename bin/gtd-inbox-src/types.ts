// GTD Inbox Processor - Type Definitions
// Supports both TUI mode and pipeline mode

// =============================================================================
// Core Categories
// =============================================================================

export type Category =
  | "trash"
  | "reference"
  | "someday"
  | "do_now"
  | "delegate"
  | "context"
  | "project";

// =============================================================================
// Pipeline JSONL Schemas
// =============================================================================

/**
 * Raw inbox item from fetch stage (e.g., Todoist API)
 * Output of: gtd-inbox fetch todoist
 */
export interface FetchedItem {
  id: string;
  text: string;
  source: "todoist" | "email" | "manual";
  source_id?: string; // Original ID from source system
  created_at?: string;
  due_date?: string;
  labels?: string[];
  priority?: number; // 1-4 for Todoist
  description?: string;
  parent_id?: string;
  project_id?: string;
  project_name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI-classified item with suggestions
 * Output of: gtd-inbox classify
 */
export interface ClassifiedItem extends FetchedItem {
  classification: {
    category: Category;
    confidence: number; // 0.0 - 1.0
    reasoning?: string;
    next_action?: string;
    context?: string;
    delegate_to?: string;
    project_name?: string;
    reference_location?: string;
    destination?: DestinationSuggestion;
  };
  // Alternative classifications ranked by confidence
  alternatives?: Array<{
    category: Category;
    confidence: number;
    reasoning?: string;
  }>;
}

/**
 * Destination suggestion from AI
 */
export interface DestinationSuggestion {
  type: "notion" | "obsidian" | "todoist" | "discard";
  target: string; // e.g., "action_items", "resources", "areas"
  folder?: string; // For Obsidian
  priority?: string; // For Notion action items
}

/**
 * Human-reviewed decision
 * Output of: gtd-inbox review
 */
export interface ReviewedItem extends ClassifiedItem {
  decision: {
    accepted_suggestion: boolean;
    category: Category;
    next_action?: string;
    context?: string;
    delegate_to?: string;
    project_name?: string;
    reference_location?: string;
    notes?: string;
    destination: DestinationSuggestion;
    reviewed_at: string;
  };
}

/**
 * Applied item with results
 * Output of: gtd-inbox apply
 */
export interface AppliedItem extends ReviewedItem {
  applied: {
    success: boolean;
    applied_at: string;
    results: ApplyResult[];
    error?: string;
  };
}

/**
 * Result of applying to a single destination
 */
export interface ApplyResult {
  destination_type: "notion" | "obsidian" | "todoist" | "discard";
  success: boolean;
  created_id?: string; // ID of created resource
  created_url?: string;
  error?: string;
}

// =============================================================================
// Legacy Types (for backward compatibility with existing TUI)
// =============================================================================

export interface InboxItem {
  id: string;
  text: string;
  source?: string;
  notes?: string;
}

export interface ProcessedItem {
  id: string;
  original: string;
  category: Category;
  context?: string;
  next_action?: string;
  delegate_to?: string;
  project_name?: string;
  reference_location?: string;
  notes?: string;
}

export interface ProcessingResult {
  processed_at: string;
  items: ProcessedItem[];
  summary: Record<Category, number>;
}

export interface Session {
  input_file: string;
  items: InboxItem[];
  processed: ProcessedItem[];
  current_index: number;
  started_at: string;
}

// =============================================================================
// Decision Tree Types
// =============================================================================

export type DecisionState =
  | "actionable"
  | "not_actionable_choice"
  | "reference_input"
  | "next_action_input"
  | "two_minute"
  | "actionable_choice"
  | "context_input"
  | "delegate_input"
  | "project_input"
  | "annotate"
  | "done";

export interface DecisionContext {
  state: DecisionState;
  previousState?: DecisionState;
  next_action?: string;
  context?: string;
  delegate_to?: string;
  project_name?: string;
  reference_location?: string;
  notes?: string;
}

// =============================================================================
// Config Types
// =============================================================================

export interface Config {
  ai: {
    model: string;
    auto_approve_threshold: number;
    include_gtd_context: boolean;
  };
  destinations: {
    notion: {
      action_items: NotionDestination;
      projects: NotionDestination;
      notes: NotionDestination;
    };
    obsidian: {
      vault: string;
      folders: Record<string, string>;
    };
    todoist: {
      projects: Record<string, number>;
    };
  };
  category_destinations: Record<Category, DestinationConfig[]>;
  tui: {
    show_confidence: boolean;
    cycle_suggestions: boolean;
    theme: string;
  };
  session: {
    cache_dir: string;
    auto_save_interval: number;
  };
  copilot: {
    decision_log: string;
    suggestions_file: string;
    pattern_window: number;
  };
}

export interface NotionDestination {
  database_id: string;
  fields?: Record<string, string>;
}

export interface DestinationConfig {
  type: "notion" | "obsidian" | "todoist" | "discard";
  target?: string;
  priority?: string;
}

export interface TodoistProfile {
  api: {
    token_env: string;
  };
  fetch: {
    project_filter: string;
    include: string[];
    label_filter: string[];
    sort_by: string;
    sort_order: string;
  };
  after_apply: {
    complete_processed: boolean;
    add_label?: string;
  };
}

// =============================================================================
// Copilot Types
// =============================================================================

/**
 * Decision log entry written by TUI for copilot agent
 */
export interface DecisionLogEntry {
  timestamp: string;
  item_id: string;
  item_text: string;
  source: string;
  ai_suggestion: {
    category: Category;
    confidence: number;
  };
  user_decision: {
    category: Category;
    accepted_suggestion: boolean;
  };
  // Pattern hints
  sender?: string; // For emails
  labels?: string[];
}

/**
 * Suggestion from copilot agent
 */
export interface CopilotSuggestion {
  item_id: string;
  suggested_category: Category;
  confidence: number;
  reasoning?: string;
  pattern_match?: string; // e.g., "Similar to 3 previous newsletter items"
  updated_at: string;
}
