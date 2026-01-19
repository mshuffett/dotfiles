"use client";

import { useEffect } from "react";
import type { SnoozeOption } from "@/app/actions";

interface Props {
  onSelect: (option: SnoozeOption) => void;
  onClose: () => void;
}

const options: { key: string; value: SnoozeOption; label: string }[] = [
  { key: "1", value: "1h", label: "1 hour" },
  { key: "2", value: "4h", label: "4 hours" },
  { key: "3", value: "tomorrow", label: "Tomorrow 9am" },
  { key: "4", value: "next_week", label: "Next week" },
];

export function SnoozeMenu({ onSelect, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const option = options.find((o) => o.key === e.key);
      if (option) {
        onSelect(option.value);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelect, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-64"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-white mb-3">Snooze until...</h3>
        <div className="space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-left"
            >
              <kbd className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center text-xs font-mono text-gray-400">
                {option.key}
              </kbd>
              <span className="text-gray-300">{option.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Press number or Esc to cancel</p>
      </div>
    </div>
  );
}
