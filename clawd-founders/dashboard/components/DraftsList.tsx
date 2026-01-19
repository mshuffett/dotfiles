"use client";

import { useState } from "react";
import type { Draft, DraftStatus } from "../../scripts/shared/types";
import { DraftCard } from "./DraftCard";

interface Props {
  drafts: Draft[];
}

export function DraftsList({ drafts }: Props) {
  const [localDrafts, setLocalDrafts] = useState(drafts);

  const handleDraftAction = (draftId: string, action: DraftStatus) => {
    setLocalDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, status: action } : d))
    );
  };

  const pendingDrafts = localDrafts.filter((d) => d.status === "pending");
  const processedDrafts = localDrafts.filter((d) => d.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending drafts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Pending Drafts
          {pendingDrafts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-600 rounded-full text-sm">
              {pendingDrafts.length}
            </span>
          )}
        </h2>

        {pendingDrafts.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
            <p className="text-gray-400">No pending drafts</p>
            <p className="text-gray-500 text-sm mt-1">
              Drafts will appear here when Claude generates them
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onAction={handleDraftAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Processed drafts (collapsed) */}
      {processedDrafts.length > 0 && (
        <details className="group">
          <summary className="text-gray-400 cursor-pointer hover:text-white">
            {processedDrafts.length} processed draft{processedDrafts.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-4 space-y-4 opacity-60">
            {processedDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onAction={handleDraftAction}
                readonly
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
