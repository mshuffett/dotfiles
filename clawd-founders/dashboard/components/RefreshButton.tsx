"use client";

import { useState } from "react";
import { refreshPipeline, refreshAndGenerateDrafts } from "@/app/actions";

interface Props {
  mode?: "refresh" | "generate";
}

export function RefreshButton({ mode = "refresh" }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatus(null);
    try {
      if (mode === "generate") {
        setStatus("Checking WhatsApp...");
        const result = await refreshAndGenerateDrafts();
        if (result.success) {
          if (result.draftsGenerated !== undefined) {
            setStatus(`Generated ${result.draftsGenerated} drafts`);
          }
        } else {
          setStatus(result.error || "Failed");
        }
      } else {
        await refreshPipeline();
      }
    } finally {
      setIsRefreshing(false);
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {status && (
        <span className="text-sm text-gray-400">{status}</span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
      >
        <svg
          className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isRefreshing
          ? mode === "generate"
            ? "Generating Drafts..."
            : "Checking WhatsApp..."
          : mode === "generate"
            ? "Refresh & Generate Drafts"
            : "Refresh"}
      </button>
    </div>
  );
}
