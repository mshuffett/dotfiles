"use client";

import type { PipelineStatus } from "@/lib/pipeline";

interface Props {
  status: PipelineStatus;
}

const stageConfig: Record<string, { label: string; color: string }> = {
  not_contacted: { label: "Not Contacted", color: "bg-gray-600" },
  awaiting_reply: { label: "Awaiting Reply", color: "bg-yellow-600" },
  in_conversation: { label: "In Conversation", color: "bg-blue-600" },
  nps_collected: { label: "NPS Collected", color: "bg-purple-600" },
  needs_collected: { label: "Needs Collected", color: "bg-indigo-600" },
  complete: { label: "Complete", color: "bg-green-600" },
};

export function PipelineOverview({ status }: Props) {
  const { summary } = status;
  const total = Object.values(summary).reduce((a, b) => a + b, 0) - summary.needs_attention;

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Pipeline Status</h2>

      {/* Needs attention alert */}
      {summary.needs_attention > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 font-medium">
            {summary.needs_attention} founder{summary.needs_attention > 1 ? "s" : ""} need{summary.needs_attention === 1 ? "s" : ""} your response
          </p>
        </div>
      )}

      {/* Stage breakdown */}
      <div className="space-y-3">
        {Object.entries(stageConfig).map(([stage, config]) => {
          const count = summary[stage as keyof typeof summary] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={stage}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{config.label}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.color} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Founders</span>
          <span className="text-white font-bold">{total}</span>
        </div>
      </div>
    </div>
  );
}
