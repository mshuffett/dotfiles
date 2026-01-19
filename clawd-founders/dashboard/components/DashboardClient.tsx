"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Draft } from "../../scripts/shared/types";
import type { PipelineStatusResponse } from "../../scripts/shared/types";
import { Sidebar } from "./Sidebar";
import { ConversationDetail } from "./ConversationDetail";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { SnoozeMenu } from "./SnoozeMenu";
import { SendTimer } from "./SendTimer";
import { snoozeDraft, sendDraftAndExecuteActions, type SnoozeOption } from "@/app/actions";
import { Toast } from "./Toast";

type ViewMode = "split" | "list";

interface Props {
  drafts: Draft[];
  pipelineStatus: PipelineStatusResponse;
}

interface PendingSend {
  draftId: string;
  founderName: string;
  message: string;
  selectedDraftIndex: number;
  enabledActions: string[];
  expiresAt: number;
}

export function DashboardClient({ drafts: initialDrafts, pipelineStatus }: Props) {
  // View mode: "split" (sidebar+detail) or "list" (full list, click to expand)
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  // Filter out snoozed drafts
  const now = Date.now();
  const activeDrafts = initialDrafts.filter(
    (d) => !d.deferred_until || new Date(d.deferred_until).getTime() <= now
  );
  const snoozedDrafts = initialDrafts.filter(
    (d) => d.deferred_until && new Date(d.deferred_until).getTime() > now
  );

  const [drafts, setDrafts] = useState(activeDrafts);
  const [snoozed, setSnoozed] = useState(snoozedDrafts);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDraftOptionIndex, setSelectedDraftOptionIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingSend, setPendingSend] = useState<PendingSend | null>(null);
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set());

  // In list mode, null means viewing the list, a value means viewing detail
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  const sendTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedDraft = drafts[selectedIndex] || null;

  // Initialize enabled actions when draft changes
  useEffect(() => {
    if (selectedDraft?.suggested_actions) {
      setEnabledActions(
        new Set(
          selectedDraft.suggested_actions
            .filter((a) => a.enabled)
            .map((a) => a.description)
        )
      );
    } else {
      setEnabledActions(new Set());
    }
    setSelectedDraftOptionIndex(0);
    setIsEditing(false);
  }, [selectedDraft?.id]);

  const selectNext = useCallback(() => {
    setSelectedIndex((i) => Math.min(i + 1, drafts.length - 1));
  }, [drafts.length]);

  const selectPrev = useCallback(() => {
    setSelectedIndex((i) => Math.max(i - 1, 0));
  }, []);

  const selectDraftOption = useCallback((index: number) => {
    const draft = drafts[selectedIndex];
    if (draft?.drafts && index < draft.drafts.length) {
      setSelectedDraftOptionIndex(index);
      setIsEditing(false);
    }
  }, [drafts, selectedIndex]);

  const toggleEdit = useCallback(() => {
    setIsEditing((e) => !e);
  }, []);

  const handleSnooze = useCallback(async (option: SnoozeOption) => {
    if (!selectedDraft) return;

    const result = await snoozeDraft(selectedDraft.id, option);
    if (result.success) {
      // Move draft from active to snoozed
      setDrafts((d) => d.filter((x) => x.id !== selectedDraft.id));
      setSnoozed((s) => [...s, { ...selectedDraft, deferred_until: (result.data as { until: string }).until }]);
      setToast({ message: `Snoozed ${selectedDraft.founder_name}`, type: "success" });
      // Adjust selection
      if (selectedIndex >= drafts.length - 1) {
        setSelectedIndex(Math.max(0, drafts.length - 2));
      }
    } else {
      setToast({ message: result.error || "Failed to snooze", type: "error" });
    }
    setShowSnoozeMenu(false);
  }, [selectedDraft, selectedIndex, drafts.length]);

  const handleSend = useCallback(() => {
    if (!selectedDraft) return;
    if (pendingSend) return; // Already have a pending send

    const draftOptions = selectedDraft.drafts || [{ message: selectedDraft.message, tone: "default" }];
    const message = draftOptions[selectedDraftOptionIndex]?.message || selectedDraft.message;
    const draftId = selectedDraft.id;
    const founderName = selectedDraft.founder_name;
    const actionsToExecute = Array.from(enabledActions);

    // Immediately remove from list and move to next
    setDrafts((d) => d.filter((x) => x.id !== draftId));
    if (selectedIndex >= drafts.length - 1) {
      setSelectedIndex(Math.max(0, drafts.length - 2));
    }

    // Start 30s timer
    const expiresAt = Date.now() + 30000;
    setPendingSend({
      draftId,
      founderName,
      message,
      selectedDraftIndex: selectedDraftOptionIndex,
      enabledActions: actionsToExecute,
      expiresAt,
    });

    sendTimerRef.current = setTimeout(async () => {
      // Actually send after timer
      const result = await sendDraftAndExecuteActions(
        draftId,
        selectedDraftOptionIndex,
        actionsToExecute
      );
      if (result.success) {
        setToast({ message: `Sent to ${founderName}`, type: "success" });
      } else {
        setToast({ message: result.error || "Failed to send", type: "error" });
      }
      setPendingSend(null);
    }, 30000);
  }, [selectedDraft, selectedDraftOptionIndex, enabledActions, pendingSend, selectedIndex, drafts.length]);

  const handleUndo = useCallback(() => {
    if (!pendingSend) return;

    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }

    // Restore the draft back to the list
    const restoredDraft = initialDrafts.find((d) => d.id === pendingSend.draftId);
    if (restoredDraft) {
      setDrafts((d) => [restoredDraft, ...d]);
    }

    setPendingSend(null);
    setToast({ message: "Send cancelled", type: "success" });
  }, [pendingSend, initialDrafts]);

  const handleSendNow = useCallback(async () => {
    if (!pendingSend) return;

    const { draftId, founderName, selectedDraftIndex: draftIdx, enabledActions: actions } = pendingSend;

    // Clear the timer and pending state immediately
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }
    setPendingSend(null);
    setToast({ message: `Sending to ${founderName}...`, type: "success" });

    // Send immediately
    const result = await sendDraftAndExecuteActions(draftId, draftIdx, actions);
    if (result.success) {
      setToast({ message: `Sent to ${founderName}`, type: "success" });
    } else {
      setToast({ message: result.error || "Failed to send", type: "error" });
    }
  }, [pendingSend]);

  const handleCancel = useCallback(() => {
    if (showSnoozeMenu) {
      setShowSnoozeMenu(false);
    } else if (showShortcuts) {
      setShowShortcuts(false);
    } else if (isEditing) {
      setIsEditing(false);
    } else if (viewMode === "list" && expandedDraftId) {
      setExpandedDraftId(null);
    }
  }, [showSnoozeMenu, showShortcuts, isEditing, viewMode, expandedDraftId]);

  const handleOpenDetail = useCallback(() => {
    if (viewMode === "list" && selectedDraft) {
      setExpandedDraftId(selectedDraft.id);
    }
  }, [viewMode, selectedDraft]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Allow Escape even when in input/textarea
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      // Ignore other keys if typing in input/textarea
      if (inInput) {
        return;
      }

      // Cmd+Shift+Z = send now
      if (e.key === "z" && e.shiftKey && e.metaKey && pendingSend) {
        e.preventDefault();
        handleSendNow();
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          selectNext();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          selectPrev();
          break;
        case "1":
        case "2":
        case "3":
          e.preventDefault();
          selectDraftOption(parseInt(e.key) - 1);
          break;
        case "e":
          e.preventDefault();
          toggleEdit();
          break;
        case "Enter":
          e.preventDefault();
          if (viewMode === "list" && !expandedDraftId) {
            handleOpenDetail();
          } else {
            handleSend();
          }
          break;
        case "h":
          e.preventDefault();
          setShowSnoozeMenu((s) => !s);
          break;
        case "z":
          if (pendingSend) {
            e.preventDefault();
            handleUndo();
          }
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((s) => !s);
          break;
        case "v":
          e.preventDefault();
          setViewMode((m) => (m === "split" ? "list" : "split"));
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectNext,
    selectPrev,
    selectDraftOption,
    toggleEdit,
    handleSend,
    handleUndo,
    handleSendNow,
    handleCancel,
    handleOpenDetail,
    pendingSend,
    viewMode,
    expandedDraftId,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
      }
    };
  }, []);

  const handleToggleAction = (description: string) => {
    setEnabledActions((prev) => {
      const next = new Set(prev);
      if (next.has(description)) {
        next.delete(description);
      } else {
        next.add(description);
      }
      return next;
    });
  };

  const handleDraftSent = (draftId: string) => {
    setDrafts((d) => d.filter((x) => x.id !== draftId));
    if (selectedIndex >= drafts.length - 1) {
      setSelectedIndex(Math.max(0, drafts.length - 2));
    }
  };

  // If in list mode and a draft is expanded, find it
  const expandedDraft = expandedDraftId
    ? drafts.find((d) => d.id === expandedDraftId) || null
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* View mode toggle in header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === "split"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            List View
          </button>
          <span className="text-gray-500 text-sm ml-2">(v to toggle)</span>
        </div>
        <button
          onClick={() => setShowShortcuts(true)}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          ? Shortcuts
        </button>
      </div>

      {/* Main content based on view mode */}
      {viewMode === "split" ? (
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          <div className="col-span-1 overflow-y-auto">
            <Sidebar
              drafts={drafts}
              snoozedDrafts={snoozed}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              pipelineStatus={pipelineStatus}
            />
          </div>
          <div className="col-span-3 overflow-y-auto">
            {selectedDraft ? (
              <ConversationDetail
                draft={selectedDraft}
                selectedDraftIndex={selectedDraftOptionIndex}
                onSelectDraft={setSelectedDraftOptionIndex}
                isEditing={isEditing}
                onToggleEdit={toggleEdit}
                enabledActions={enabledActions}
                onToggleAction={handleToggleAction}
                onSend={handleSend}
                onSnooze={() => setShowSnoozeMenu(true)}
                isPendingSend={pendingSend?.draftId === selectedDraft.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No conversations to review
              </div>
            )}
          </div>
        </div>
      ) : (
        // List view mode
        <div className="flex-1 overflow-y-auto">
          {expandedDraft ? (
            <div>
              <button
                onClick={() => setExpandedDraftId(null)}
                className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
              >
                <span>&larr;</span> Back to list (Escape)
              </button>
              <ConversationDetail
                draft={expandedDraft}
                selectedDraftIndex={selectedDraftOptionIndex}
                onSelectDraft={setSelectedDraftOptionIndex}
                isEditing={isEditing}
                onToggleEdit={toggleEdit}
                enabledActions={enabledActions}
                onToggleAction={handleToggleAction}
                onSend={handleSend}
                onSnooze={() => setShowSnoozeMenu(true)}
                isPendingSend={pendingSend?.draftId === expandedDraft.id}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft, index) => (
                <button
                  key={draft.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    setExpandedDraftId(draft.id);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedIndex === index
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">{draft.founder_name}</span>
                      <span className="text-gray-400 ml-2">{draft.company}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {draft.context.last_wa_message?.slice(0, 50)}...
                    </span>
                  </div>
                </button>
              ))}
              {drafts.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No conversations to review
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals and overlays */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showSnoozeMenu && (
        <SnoozeMenu
          onSelect={handleSnooze}
          onClose={() => setShowSnoozeMenu(false)}
        />
      )}

      {pendingSend && (
        <SendTimer
          founderName={pendingSend.founderName}
          expiresAt={pendingSend.expiresAt}
          onUndo={handleUndo}
          onSendNow={handleSendNow}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
