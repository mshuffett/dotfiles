import type { DecisionState, Category } from "./types";

export interface FlowNode {
  question: string;
  options: FlowOption[];
}

export interface FlowOption {
  key: string;
  label: string;
  next?: DecisionState;
  category?: Category;
  requiresInput?: "next_action" | "context" | "delegate" | "project";
}

export const gtdFlow: Record<DecisionState, FlowNode | null> = {
  actionable: {
    question: "Is this actionable?",
    options: [
      { key: "y", label: "Yes", next: "next_action_input" },
      { key: "n", label: "No", next: "not_actionable_choice" },
    ],
  },
  not_actionable_choice: {
    question: "What should happen to it?",
    options: [
      { key: "t", label: "Trash", category: "trash" },
      { key: "r", label: "Reference", next: "reference_input" },
      { key: "s", label: "Someday/Maybe", category: "someday" },
    ],
  },
  reference_input: null, // Text input for where to file it
  next_action_input: null, // Text input mode
  two_minute: {
    question: "Can you do it in under 2 minutes?",
    options: [
      { key: "<", label: "Under 2 min (Do Now)", category: "do_now" },
      { key: ">", label: "Over 2 min", next: "actionable_choice" },
    ],
  },
  actionable_choice: {
    question: "How will you handle it?",
    options: [
      { key: "d", label: "Delegate", next: "delegate_input" },
      { key: "c", label: "Add to Context", next: "context_input" },
      { key: "p", label: "Add to Project", next: "project_input" },
    ],
  },
  context_input: null, // Text input mode
  delegate_input: null, // Text input mode
  project_input: null, // Text input mode
  annotate: null, // Annotation mode (edit text + notes)
  done: null,
};

export function getFlowNode(state: DecisionState): FlowNode | null {
  return gtdFlow[state] || null;
}

export function isInputState(state: DecisionState): boolean {
  return [
    "next_action_input",
    "reference_input",
    "context_input",
    "delegate_input",
    "project_input",
  ].includes(state);
}

export function isAnnotateState(state: DecisionState): boolean {
  return state === "annotate";
}

export function getInputPrompt(state: DecisionState): string {
  switch (state) {
    case "next_action_input":
      return "What's the next action?";
    case "reference_input":
      return "Where should this be filed? (e.g., Notion, Docs, Bookmarks)";
    case "context_input":
      return "Which context? (@calls, @computer, etc.)";
    case "delegate_input":
      return "Delegate to whom?";
    case "project_input":
      return "Which project?";
    default:
      return "";
  }
}
