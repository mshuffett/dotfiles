"use client";

import { useState } from "react";
import type { Draft, SuggestedAction } from "../../scripts/shared/types";
import { ConversationThread } from "./ConversationThread";
import { AIChat } from "./AIChat";

interface Props {
  draft: Draft;
  selectedDraftIndex: number;
  onSelectDraft: (index: number) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  showAIChat: boolean;
  onToggleChat: () => void;
  currentMessage: string;
  currentTone: string;
  onMessageUpdate: (message: string, tone?: string) => void;
  onActionsUpdate: (actions: SuggestedAction[]) => void;
  enabledActions: Set<string>;
  onToggleAction: (description: string) => void;
  onSend: () => void;
  onSnooze: () => void;
  isPendingSend: boolean;
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

export function ConversationDetail({
  draft,
  selectedDraftIndex,
  onSelectDraft,
  isEditing,
  onToggleEdit,
  showAIChat,
  onToggleChat,
  currentMessage,
  currentTone,
  onMessageUpdate,
  onActionsUpdate,
  enabledActions,
  onToggleAction,
  onSend,
  onSnooze,
  isPendingSend,
}: Props) {
  const [editedMessage, setEditedMessage] = useState("");

  const draftOptions = draft.drafts || [{ message: draft.message, tone: "default" }];

  const handleSelectDraft = (index: number) => {
    onSelectDraft(index);
    setEditedMessage("");
  };

  const handleEdit = () => {
    if (!isEditing) {
      setEditedMessage(draftOptions[selectedDraftIndex]?.message || draft.message);
    }
    onToggleEdit();
  };

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
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header with goals - fixed */}
      <div className="px-4 py-3 bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-medium text-white text-lg">{draft.founder_name}</h3>
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

      {/* Conversation - fills available space, scrolls when needed */}
      <div className="p-4 border-t border-gray-800 overflow-y-auto flex-1 min-h-0">
        <h4 className="text-xs text-gray-500 uppercase mb-3">Conversation</h4>
        <ConversationThread messages={messages} />
      </div>

      {/* Drafts section - fixed size, always visible */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        {/* Reasoning - collapsible */}
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
          Drafts (1/2/3 to select)
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
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                    selectedDraftIndex === index
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {index + 1}
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
              autoFocus
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
                    onChange={() => onToggleAction(action.description)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{action.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Current message preview (if AI-edited) */}
        {currentMessage !== (draftOptions[selectedDraftIndex]?.message || draft.message) && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h5 className="text-xs text-blue-400 uppercase mb-2">
              AI-Refined Message
            </h5>
            <p className="text-sm text-white whitespace-pre-wrap">{currentMessage}</p>
            <span className="text-xs text-blue-400 mt-1 inline-block">Tone: {currentTone}</span>
          </div>
        )}
      </div>

      {/* AI Chat Panel */}
      {showAIChat && (
        <AIChat
          draftId={draft.id}
          currentMessage={currentMessage}
          currentTone={currentTone}
          suggestedActions={draft.suggested_actions || []}
          founderContext={{
            name: draft.founder_name,
            company: draft.company,
            phone: draft.phone,
            demo_goal: draft.context.demo_goal,
            two_week_goal: draft.context.two_week_goal,
            progress: draft.context.progress,
            stage: draft.context.stage,
            messages: draft.context.messages,
          }}
          onMessageUpdate={onMessageUpdate}
          onActionsUpdate={onActionsUpdate}
          onClose={onToggleChat}
        />
      )}

      {/* Actions - fixed footer */}
      <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onSnooze}
          className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center gap-1"
        >
          <span className="text-gray-400 text-xs">h</span>
          Snooze
        </button>
        <button
          onClick={handleEdit}
          className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
            isEditing
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          <span className="text-gray-400 text-xs">e</span>
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <button
          onClick={onToggleChat}
          className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
            showAIChat
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          <span className="text-gray-400 text-xs">c</span>
          Chat
        </button>
        <div className="flex-1" />
        <button
          onClick={onSend}
          disabled={isPendingSend}
          className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-1"
        >
          <span className="text-green-300 text-xs">Enter</span>
          Send
        </button>
      </div>
    </div>
  );
}
