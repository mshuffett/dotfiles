"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SuggestedAction, DraftOption } from "../../scripts/shared/types";
import { chatWithAI } from "@/app/actions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  draftId: string;
  currentMessage: string;
  currentTone: string;
  suggestedActions: SuggestedAction[];
  founderContext: {
    name: string;
    company: string;
    phone: string;
    demo_goal?: string | null;
    two_week_goal?: string | null;
    progress?: string | null;
    stage: string;
    messages?: Array<{ from: "us" | "them"; text: string; timestamp: string }>;
  };
  onMessageUpdate: (message: string, tone?: string) => void;
  onActionsUpdate: (actions: SuggestedAction[]) => void;
  onClose: () => void;
}

export function AIChat({
  draftId,
  currentMessage,
  currentTone,
  suggestedActions,
  founderContext,
  onMessageUpdate,
  onActionsUpdate,
  onClose,
}: Props) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingResponse]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStreamingResponse("");

    try {
      const result = await chatWithAI({
        draftId,
        userMessage,
        chatHistory,
        currentDraft: {
          message: currentMessage,
          tone: currentTone,
          actions: suggestedActions,
        },
        founderContext,
      });

      // Add assistant response to history
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);

      // Apply updates if present
      if (result.updatedMessage) {
        onMessageUpdate(result.updatedMessage, result.updatedTone);
      }
      if (result.updatedActions) {
        onActionsUpdate(result.updatedActions);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingResponse("");
    }
  }, [
    input,
    isLoading,
    draftId,
    chatHistory,
    currentMessage,
    currentTone,
    suggestedActions,
    founderContext,
    onMessageUpdate,
    onActionsUpdate,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <h5 className="text-xs text-gray-500 uppercase font-medium">
          AI Chat Assistant
        </h5>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Esc to close
        </button>
      </div>

      {/* Chat messages */}
      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
        {chatHistory.length === 0 && (
          <div className="text-gray-500 text-sm italic">
            Ask me to rewrite, shorten, change tone, add actions, etc.
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === "user" ? "text-blue-400" : "text-gray-300"
            }`}
          >
            <span className="font-medium">
              {msg.role === "user" ? "You: " : "AI: "}
            </span>
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {streamingResponse && (
          <div className="text-sm text-gray-300">
            <span className="font-medium">AI: </span>
            <span className="whitespace-pre-wrap">{streamingResponse}</span>
            <span className="animate-pulse">|</span>
          </div>
        )}
        {isLoading && !streamingResponse && (
          <div className="text-sm text-gray-500 italic flex items-center gap-2">
            <span className="animate-spin">-</span>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "make it shorter",
            "more casual",
            "add NPS question",
            "ask about investors",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-300 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
