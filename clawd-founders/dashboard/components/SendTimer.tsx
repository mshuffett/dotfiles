"use client";

import { useState, useEffect } from "react";

interface Props {
  founderName: string;
  expiresAt: number;
  onUndo: () => void;
  onSendNow: () => void;
}

export function SendTimer({ founderName, expiresAt, onUndo, onSendNow }: Props) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, expiresAt - Date.now());
      setRemaining(r);
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = (remaining / 30000) * 100;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl z-40 min-w-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">
          Sending to {founderName} in {seconds}s...
        </span>
        <button
          onClick={onSendNow}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <kbd className="text-xs">⌘⇧Z</kbd>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-100"
          style={{ width: `${100 - progress}%` }}
        />
      </div>

      <button
        onClick={onUndo}
        className="w-full px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center gap-2"
      >
        <kbd className="text-xs text-gray-400">z</kbd>
        Undo
      </button>
    </div>
  );
}
