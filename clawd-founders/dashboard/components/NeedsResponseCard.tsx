"use client";

import { useState } from "react";
import type { Draft, DraftOption, SuggestedAction } from "../../scripts/shared/types";
import { ConversationThread } from "./ConversationThread";
import { sendDraftAndExecuteActions } from "@/app/actions";
import { Toast } from "./Toast";

interface Props {
  draft: Draft;
  onSent: (draftId: string) => void;
}

const stageLabels: Record<string, string> = {
  not_contacted: "Not Contacted",
  awaiting_reply: "Awaiting Reply",
  in_conversation: "In Conversation",
  nps_collected: "NPS Collected",
  needs_collected: "Needs Collected",
  complete: "Complete",
};

const stageColors: Record<string, string> = {
  not_contacted: "bg-gray-600",
  awaiting_reply: "bg-yellow-600",
  in_conversation: "bg-blue-600",
  nps_collected: "bg-purple-600",
  needs_collected: "bg-indigo-600",
  complete: "bg-green-600",
};

export function NeedsResponseCard({ draft, onSent }: Props) {
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const [enabledActions, setEnabledActions] = useState<Set<string>>(
    new Set(draft.suggested_actions?.filter((a) => a.enabled).map((a) => a.description) || [])
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const draftOptions = draft.drafts || [{ message: draft.message, tone: "default" }];

  const handleToggleAction = (description: string) => {
    setEnabledActions((prev) => {
      const next = new Set(prev);
      if (next.has(description)) {
        next.delete(description);
      } else {
        next.add(description);
      }
      return next;
    });
  };

  const handleSelectDraft = (index: number) => {
    setSelectedDraftIndex(index);
    setIsEditing(false);
    setEditedMessage("");
  };

  const handleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedMessage("");
    } else {
      setEditedMessage(draftOptions[selectedDraftIndex]?.message || draft.message);
      setIsEditing(true);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Pass edited message if in edit mode
      const result = await sendDraftAndExecuteActions(
        draft.id,
        selectedDraftIndex,
        Array.from(enabledActions),
        isEditing ? editedMessage : undefined
      );

      if (result.success) {
        const actionCount = enabledActions.size;
        setToast({
          message: `Sent to ${draft.founder_name}${actionCount > 0 ? ` + ${actionCount} action${actionCount > 1 ? "s" : ""} executed` : ""}`,
          type: "success",
        });
        onSent(draft.id);
      } else {
        setError(result.error || "Failed to send");
        setToast({ message: result.error || "Failed to send", type: "error" });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSending(false);
    }
  };

  const currentMessage = isEditing
    ? editedMessage
    : draftOptions[selectedDraftIndex]?.message || draft.message;

  // Use full messages from context, fallback to single last message
  const messages = draft.context.messages?.length
    ? draft.context.messages
    : draft.context.last_wa_message
      ? [
          {
            id: "last",
            timestamp: new Date().toISOString(),
            from: draft.context.last_wa_from || ("them" as const),
            text: draft.context.last_wa_message,
          },
        ]
      : [];

  // Build compact goals string
  const goalParts: string[] = [];
  if (draft.context.demo_goal) goalParts.push(`Demo: ${draft.context.demo_goal}`);
  if (draft.context.two_week_goal) goalParts.push(`2wk: ${draft.context.two_week_goal}`);
  if (draft.context.progress) goalParts.push(`Progress: ${draft.context.progress}`);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header with goals */}
      <div className="px-4 py-3 bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-medium text-white">{draft.founder_name}</h3>
              <p className="text-sm text-gray-400">{draft.company}</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
              stageColors[draft.context.stage] || "bg-gray-600"
            }`}
          >
            {stageLabels[draft.context.stage]}
          </span>
        </div>
        {/* Goals in header */}
        {goalParts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {goalParts.map((goal, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-300">
                {goal}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Conversation - full width, no max height */}
      <div className="p-4 border-t border-gray-800">
        <h4 className="text-xs text-gray-500 uppercase mb-3">Conversation</h4>
        <ConversationThread messages={messages} />
      </div>

      {/* Drafts section */}
      <div className="p-4 border-t border-gray-800">
        {/* Reasoning - collapsible, above drafts */}
        {draft.reasoning && (
          <details className="mb-4">
            <summary className="text-xs text-gray-500 uppercase cursor-pointer hover:text-gray-400 select-none">
              Reasoning
            </summary>
            <p className="mt-2 text-sm text-gray-300 pl-2 border-l-2 border-gray-700">
              {draft.reasoning}
            </p>
          </details>
        )}

        {/* Draft options */}
        <h4 className="text-xs text-gray-500 uppercase mb-3">
          Drafts (select one)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {draftOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectDraft(index)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedDraftIndex === index
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedDraftIndex === index
                      ? "border-blue-500"
                      : "border-gray-600"
                  }`}
                >
                  {selectedDraftIndex === index && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-xs text-gray-400 capitalize">
                  {option.tone || `Option ${index + 1}`}
                </span>
              </div>
              <p className="text-sm text-white whitespace-pre-wrap">{option.message}</p>
            </button>
          ))}
        </div>

        {/* Edit mode */}
        {isEditing && (
          <div className="mb-4">
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
            />
          </div>
        )}

        {/* Suggested actions */}
        {draft.suggested_actions && draft.suggested_actions.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs text-gray-500 uppercase mb-2">
              Actions (after send)
            </h5>
            <div className="space-y-2">
              {draft.suggested_actions.map((action, index) => (
                <label
                  key={index}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabledActions.has(action.description)}
                    onChange={() => handleToggleAction(action.description)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{action.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center gap-2">
        <button
          onClick={handleEdit}
          className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          {isEditing ? "Cancel Edit" : "Edit"}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSend}
          disabled={isSending}
          className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50"
        >
          {isSending ? "Sending..." : "Send & Execute Actions"}
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
