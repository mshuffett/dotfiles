"use client";

import { useState } from "react";
import type { Draft } from "../../scripts/shared/types";
import { NeedsResponseCard } from "./NeedsResponseCard";

interface Props {
  drafts: Draft[];
}

export function NeedsResponseList({ drafts }: Props) {
  const [sentDraftIds, setSentDraftIds] = useState<Set<string>>(new Set());

  const handleSent = (draftId: string) => {
    setSentDraftIds((prev) => new Set([...prev, draftId]));
  };

  // Filter to drafts that need response (last_wa_from === "them" and not yet sent)
  const needsResponseDrafts = drafts.filter(
    (d) =>
      d.context.last_wa_from === "them" &&
      d.status === "pending" &&
      !sentDraftIds.has(d.id)
  );

  // Recently sent drafts (in this session)
  const recentlySentDrafts = drafts.filter((d) => sentDraftIds.has(d.id));

  if (needsResponseDrafts.length === 0 && recentlySentDrafts.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-gray-400">No founders need a response right now</p>
        <p className="text-gray-500 text-sm mt-1">
          Click "Refresh & Generate Drafts" to check for new messages
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending responses */}
      {needsResponseDrafts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            Needs Response
            <span className="px-2 py-0.5 bg-red-600 rounded-full text-sm">
              {needsResponseDrafts.length}
            </span>
          </h2>
          <div className="space-y-4">
            {needsResponseDrafts.map((draft) => (
              <NeedsResponseCard
                key={draft.id}
                draft={draft}
                onSent={handleSent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently sent */}
      {recentlySentDrafts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4">
            Sent This Session ({recentlySentDrafts.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {recentlySentDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-white">
                    {draft.founder_name}
                  </span>
                  <span className="text-gray-400 ml-2">({draft.company})</span>
                </div>
                <span className="text-green-400 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
