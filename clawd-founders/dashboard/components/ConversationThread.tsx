"use client";

import type { WhatsAppMessage } from "../../scripts/shared/types";

interface Props {
  messages: WhatsAppMessage[];
  maxHeight?: string;
}

function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return `${diffDays}d ago`;
  } catch {
    return timestamp;
  }
}

export function ConversationThread({ messages, maxHeight }: Props) {
  // Sort oldest first (for natural reading order)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sortedMessages.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic py-4">
        No message history
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 ${maxHeight ? "overflow-y-auto pr-2" : ""}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {sortedMessages.map((msg, index) => {
        const isFromUs = msg.from === "us";
        const isLatest = index === sortedMessages.length - 1;

        return (
          <div
            key={msg.id || index}
            className={`flex ${isFromUs ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                isFromUs
                  ? "bg-blue-600/30 border border-blue-600/50"
                  : isLatest
                    ? "bg-green-600/30 border border-green-600/50 ring-2 ring-green-500/30"
                    : "bg-gray-700/50 border border-gray-600/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-medium ${
                    isFromUs ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {isFromUs ? "→ You" : "← Them"}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(msg.timestamp)}
                </span>
                {isLatest && !isFromUs && (
                  <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                    NEEDS RESPONSE
                  </span>
                )}
              </div>
              <p className="text-sm text-white whitespace-pre-wrap break-words">
                {msg.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
