"use client";

interface Props {
  onClose: () => void;
}

const shortcuts = [
  { key: "j / ↓", action: "Next conversation" },
  { key: "k / ↑", action: "Previous conversation" },
  { key: "1 2 3", action: "Select draft option" },
  { key: "e", action: "Toggle edit mode" },
  { key: "Enter", action: "Send (30s timer)" },
  { key: "z", action: "Undo pending send" },
  { key: "⌘⇧Z", action: "Send now (skip timer)" },
  { key: "h", action: "Snooze conversation" },
  { key: "v", action: "Toggle view mode" },
  { key: "Esc", action: "Cancel / Close" },
  { key: "?", action: "Show this help" },
];

export function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Esc
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
            >
              <span className="text-gray-300">{s.action}</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm font-mono text-gray-400">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
