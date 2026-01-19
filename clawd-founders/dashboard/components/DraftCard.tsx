"use client";

import { useState } from "react";
import type { Draft, DraftStatus } from "../../scripts/shared/types";
import { approveDraft, rejectDraft, sendMessage } from "@/app/actions";

interface Props {
  draft: Draft;
  onAction: (draftId: string, action: DraftStatus) => void;
  readonly?: boolean;
}

const stageLabels: Record<string, string> = {
  not_contacted: "Not Contacted",
  awaiting_reply: "Awaiting Reply",
  in_conversation: "In Conversation",
  nps_collected: "NPS Collected",
  needs_collected: "Needs Collected",
  complete: "Complete",
};

export function DraftCard({ draft, onAction, readonly }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(draft.message);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await approveDraft(
        draft.id,
        isEditing ? editedMessage : undefined
      );
      if (result.success) {
        onAction(draft.id, "approved");
      } else {
        setError(result.error || "Failed to approve");
      }
    } catch {
      setError("Failed to approve draft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAndSend = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First approve
      const approveResult = await approveDraft(
        draft.id,
        isEditing ? editedMessage : undefined
      );
      if (!approveResult.success) {
        setError(approveResult.error || "Failed to approve");
        return;
      }

      // Then send
      const message = isEditing ? editedMessage : draft.message;
      const sendResult = await sendMessage(draft.phone, message);
      if (sendResult.success) {
        onAction(draft.id, "sent");
      } else {
        setError(sendResult.error || "Failed to send");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (showInstructions && instructions.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await rejectDraft(draft.id, instructions);
        if (result.success) {
          onAction(draft.id, "rejected");
        } else {
          setError(result.error || "Failed to reject");
        }
      } catch {
        setError("Failed to reject draft");
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const statusBadge = {
    pending: "bg-yellow-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
    sent: "bg-blue-600",
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-medium text-white">{draft.founder_name}</h3>
            <p className="text-sm text-gray-400">{draft.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {stageLabels[draft.context.stage]}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-white ${statusBadge[draft.status]}`}
          >
            {draft.status}
          </span>
        </div>
      </div>

      {/* Context */}
      {(draft.context.last_wa_message || draft.context.reasoning) && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/20">
          {draft.context.last_wa_message && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 uppercase">
                Last from {draft.context.last_wa_from === "them" ? "them" : "us"}:
              </span>
              <p className="text-sm text-gray-300 mt-1">
                {draft.context.last_wa_message}
              </p>
            </div>
          )}
          {draft.context.reasoning && (
            <div>
              <span className="text-xs text-gray-500 uppercase">Reasoning:</span>
              <p className="text-sm text-gray-400 mt-1">{draft.context.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
          />
        ) : (
          <p className="text-white whitespace-pre-wrap">{draft.message}</p>
        )}

        {/* Alternatives */}
        {draft.alternatives && draft.alternatives.length > 0 && !isEditing && (
          <details className="mt-3">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
              {draft.alternatives.length} alternative{draft.alternatives.length > 1 ? "s" : ""}
            </summary>
            <div className="mt-2 space-y-2">
              {draft.alternatives.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setEditedMessage(alt);
                    setIsEditing(true);
                  }}
                  className="block w-full text-left p-2 rounded bg-gray-800 text-sm text-gray-300 hover:bg-gray-700"
                >
                  {alt}
                </button>
              ))}
            </div>
          </details>
        )}

        {/* Instructions input for rejection */}
        {showInstructions && (
          <div className="mt-3">
            <label className="text-xs text-gray-500 uppercase block mb-1">
              Instructions for new draft:
            </label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={2}
              placeholder="e.g., Make it more casual, reference their recent progress..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      {!readonly && draft.status === "pending" && (
        <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600"
          >
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30"
          >
            {showInstructions ? "Submit Rejection" : "Reject"}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
          >
            Approve
          </button>
          <button
            onClick={handleApproveAndSend}
            disabled={isLoading}
            className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 font-medium"
          >
            {isLoading ? "Sending..." : "Approve & Send"}
          </button>
        </div>
      )}
    </div>
  );
}
