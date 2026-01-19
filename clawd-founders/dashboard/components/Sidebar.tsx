"use client";

import type { Draft } from "../../scripts/shared/types";
import type { PipelineStatusResponse } from "../../scripts/shared/types";
import { useState } from "react";

interface Props {
  drafts: Draft[];
  snoozedDrafts: Draft[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  pipelineStatus: PipelineStatusResponse;
}

const stageColors: Record<string, string> = {
  not_contacted: "bg-gray-600",
  awaiting_reply: "bg-yellow-600",
  in_conversation: "bg-blue-600",
  nps_collected: "bg-purple-600",
  needs_collected: "bg-indigo-600",
  complete: "bg-green-600",
};

function formatSnoozeTime(until: string): string {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return "now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function Sidebar({
  drafts,
  snoozedDrafts,
  selectedIndex,
  onSelect,
  pipelineStatus,
}: Props) {
  const [snoozedExpanded, setSnoozedExpanded] = useState(false);
  const { summary } = pipelineStatus;

  return (
    <div className="space-y-4">
      {/* Pipeline stats */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <h3 className="text-xs uppercase text-gray-500 font-medium mb-2">
          Pipeline
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Needs reply</span>
            <span className="text-yellow-400 font-medium">
              {summary.needs_attention}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Awaiting</span>
            <span className="text-gray-300">{summary.awaiting_reply}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">In progress</span>
            <span className="text-blue-400">{summary.in_conversation}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Complete</span>
            <span className="text-green-400">{summary.complete}</span>
          </div>
        </div>
      </div>

      {/* Founder list */}
      <div className="space-y-1">
        <h3 className="text-xs uppercase text-gray-500 font-medium px-2">
          Needs Response ({drafts.length})
        </h3>
        {drafts.map((draft, index) => (
          <button
            key={draft.id}
            onClick={() => onSelect(index)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
              selectedIndex === index
                ? "bg-blue-600/20 border border-blue-500/50"
                : "hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedIndex === index && (
                <span className="text-blue-400 text-sm">&rarr;</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {draft.founder_name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stageColors[draft.context.stage] || "bg-gray-600"
                    }`}
                  />
                </div>
                <p className="text-sm text-gray-400 truncate">{draft.company}</p>
              </div>
            </div>
          </button>
        ))}
        {drafts.length === 0 && (
          <p className="text-gray-500 text-sm px-3 py-2">No drafts to review</p>
        )}
      </div>

      {/* Snoozed section */}
      {snoozedDrafts.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => setSnoozedExpanded(!snoozedExpanded)}
            className="w-full flex items-center justify-between px-2 text-xs uppercase text-gray-500 font-medium hover:text-gray-400"
          >
            <span>Snoozed ({snoozedDrafts.length})</span>
            <span>{snoozedExpanded ? "−" : "+"}</span>
          </button>
          {snoozedExpanded && (
            <div className="mt-2 space-y-1">
              {snoozedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {draft.founder_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {draft.deferred_until
                        ? formatSnoozeTime(draft.deferred_until)
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {draft.company}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
