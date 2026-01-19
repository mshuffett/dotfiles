"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Draft } from "../../scripts/shared/types";
import type { PipelineStatusResponse } from "../../scripts/shared/types";
import { Sidebar } from "./Sidebar";
import { ConversationDetail } from "./ConversationDetail";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { SnoozeMenu } from "./SnoozeMenu";
import { snoozeDraft, sendDraftAndExecuteActions, type SnoozeOption } from "@/app/actions";

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
  toastId: string | number;
  timeoutId: NodeJS.Timeout;
}

const SEND_DELAY_MS = 15000; // 15 seconds

export function DashboardClient({ drafts: initialDrafts, pipelineStatus: initialPipelineStatus }: Props) {
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
  const [pipelineStatus, setPipelineStatus] = useState(initialPipelineStatus);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDraftOptionIndex, setSelectedDraftOptionIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set());
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  // Track edited messages per draft
  const [editedMessages, setEditedMessages] = useState<Map<string, { message: string; tone: string }>>(new Map());

  // Queue of pending sends (supports multiple)
  const pendingSendsRef = useRef<Map<string, PendingSend>>(new Map());

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
    setShowAIChat(false);
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
      setDrafts((d) => d.filter((x) => x.id !== selectedDraft.id));
      setSnoozed((s) => [...s, { ...selectedDraft, deferred_until: (result.data as { until: string }).until }]);
      toast.success(`Snoozed ${selectedDraft.founder_name}`);
      if (selectedIndex >= drafts.length - 1) {
        setSelectedIndex(Math.max(0, drafts.length - 2));
      }
    } else {
      toast.error(result.error || "Failed to snooze");
    }
    setShowSnoozeMenu(false);
  }, [selectedDraft, selectedIndex, drafts.length]);

  const handleSend = useCallback(() => {
    if (!selectedDraft) return;
    if (pendingSendsRef.current.has(selectedDraft.id)) return;

    const draftOptions = selectedDraft.drafts || [{ message: selectedDraft.message, tone: "default" }];
    const message = draftOptions[selectedDraftOptionIndex]?.message || selectedDraft.message;
    const draftId = selectedDraft.id;
    const founderName = selectedDraft.founder_name;
    const actionsToExecute = Array.from(enabledActions);
    const draftIdx = selectedDraftOptionIndex;

    // Immediately remove from list and move to next
    setDrafts((d) => d.filter((x) => x.id !== draftId));
    if (selectedIndex >= drafts.length - 1) {
      setSelectedIndex(Math.max(0, drafts.length - 2));
    }

    // Update pipeline counts (needs_attention -> awaiting_reply)
    setPipelineStatus((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        needs_attention: Math.max(0, prev.summary.needs_attention - 1),
        awaiting_reply: prev.summary.awaiting_reply + 1,
      },
    }));

    const expiresAt = Date.now() + SEND_DELAY_MS;

    // Show toast with progress and undo action
    const toastId = toast(`Sending to ${founderName}...`, {
      duration: SEND_DELAY_MS,
      action: {
        label: "Undo (z)",
        onClick: () => undoSend(draftId),
      },
    });

    const timeoutId = setTimeout(async () => {
      pendingSendsRef.current.delete(draftId);
      const result = await sendDraftAndExecuteActions(draftId, draftIdx, actionsToExecute);
      toast.dismiss(toastId);
      if (result.success) {
        toast.success(`Sent to ${founderName}`);
      } else {
        toast.error(result.error || "Failed to send");
      }
    }, SEND_DELAY_MS);

    pendingSendsRef.current.set(draftId, {
      draftId,
      founderName,
      message,
      selectedDraftIndex: draftIdx,
      enabledActions: actionsToExecute,
      expiresAt,
      toastId,
      timeoutId,
    });
  }, [selectedDraft, selectedDraftOptionIndex, enabledActions, selectedIndex, drafts.length]);

  const undoSend = useCallback((draftId: string) => {
    const pending = pendingSendsRef.current.get(draftId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    toast.dismiss(pending.toastId);
    pendingSendsRef.current.delete(draftId);

    // Restore the draft back to the list
    const restoredDraft = initialDrafts.find((d) => d.id === draftId);
    if (restoredDraft) {
      setDrafts((d) => [restoredDraft, ...d]);
    }

    // Restore pipeline counts
    setPipelineStatus((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        needs_attention: prev.summary.needs_attention + 1,
        awaiting_reply: Math.max(0, prev.summary.awaiting_reply - 1),
      },
    }));

    toast.success("Send cancelled");
  }, [initialDrafts]);

  const handleUndoLast = useCallback(() => {
    // Undo the most recent pending send
    const entries = Array.from(pendingSendsRef.current.entries());
    if (entries.length === 0) return;

    // Get the one with the latest expiresAt (most recently added)
    const [draftId] = entries.reduce((latest, current) =>
      current[1].expiresAt > latest[1].expiresAt ? current : latest
    );
    undoSend(draftId);
  }, [undoSend]);

  const handleSendNow = useCallback(async (draftId?: string) => {
    // Send the specified one or the most recent
    let pending: PendingSend | undefined;

    if (draftId) {
      pending = pendingSendsRef.current.get(draftId);
    } else {
      const entries = Array.from(pendingSendsRef.current.entries());
      if (entries.length === 0) return;
      const [, p] = entries.reduce((latest, current) =>
        current[1].expiresAt > latest[1].expiresAt ? current : latest
      );
      pending = p;
    }

    if (!pending) return;

    const { draftId: id, founderName, selectedDraftIndex: draftIdx, enabledActions: actions, toastId, timeoutId } = pending;

    clearTimeout(timeoutId);
    toast.dismiss(toastId);
    pendingSendsRef.current.delete(id);

    toast.loading(`Sending to ${founderName}...`);
    const result = await sendDraftAndExecuteActions(id, draftIdx, actions);
    toast.dismiss();

    if (result.success) {
      toast.success(`Sent to ${founderName}`);
    } else {
      toast.error(result.error || "Failed to send");
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (showSnoozeMenu) {
      setShowSnoozeMenu(false);
    } else if (showShortcuts) {
      setShowShortcuts(false);
    } else if (showAIChat) {
      setShowAIChat(false);
    } else if (isEditing) {
      setIsEditing(false);
    } else if (viewMode === "list" && expandedDraftId) {
      setExpandedDraftId(null);
    }
  }, [showSnoozeMenu, showShortcuts, showAIChat, isEditing, viewMode, expandedDraftId]);

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

      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (inInput) return;

      // Cmd+Shift+Z = send now
      if (e.key === "z" && e.shiftKey && e.metaKey && pendingSendsRef.current.size > 0) {
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
          setShowAIChat(false); // Close chat if open
          toggleEdit();
          break;
        case "c":
          e.preventDefault();
          setIsEditing(false); // Close edit if open
          setShowAIChat((s) => !s);
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
          if (pendingSendsRef.current.size > 0) {
            e.preventDefault();
            handleUndoLast();
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
    handleUndoLast,
    handleSendNow,
    handleCancel,
    handleOpenDetail,
    viewMode,
    expandedDraftId,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      pendingSendsRef.current.forEach((p) => clearTimeout(p.timeoutId));
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

  // Handler for AI chat message updates
  const handleAIChatMessageUpdate = useCallback((message: string, tone?: string) => {
    if (!selectedDraft) return;
    setEditedMessages((prev) => {
      const next = new Map(prev);
      next.set(selectedDraft.id, { message, tone: tone || "ai-refined" });
      return next;
    });
  }, [selectedDraft]);

  // Handler for AI chat action updates
  const handleAIChatActionsUpdate = useCallback((actions: Array<{ type: string; params: Record<string, unknown>; description: string; enabled: boolean }>) => {
    // Update enabled actions based on the new actions
    const newEnabled = new Set(
      actions.filter((a) => a.enabled).map((a) => a.description)
    );
    setEnabledActions(newEnabled);

    // Also update the draft's suggested_actions in state
    if (selectedDraft) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === selectedDraft.id
            ? { ...d, suggested_actions: actions as typeof d.suggested_actions }
            : d
        )
      );
    }
  }, [selectedDraft]);

  // Get the current message for a draft (edited or original)
  const getCurrentMessage = useCallback((draft: typeof selectedDraft) => {
    if (!draft) return "";
    const edited = editedMessages.get(draft.id);
    if (edited) return edited.message;
    const draftOptions = draft.drafts || [{ message: draft.message, tone: "default" }];
    return draftOptions[selectedDraftOptionIndex]?.message || draft.message;
  }, [editedMessages, selectedDraftOptionIndex]);

  const getCurrentTone = useCallback((draft: typeof selectedDraft) => {
    if (!draft) return "default";
    const edited = editedMessages.get(draft.id);
    if (edited) return edited.tone;
    const draftOptions = draft.drafts || [{ message: draft.message, tone: "default" }];
    return draftOptions[selectedDraftOptionIndex]?.tone || "default";
  }, [editedMessages, selectedDraftOptionIndex]);

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
          <div className="col-span-3 min-h-0">
            {selectedDraft ? (
              <ConversationDetail
                draft={selectedDraft}
                selectedDraftIndex={selectedDraftOptionIndex}
                onSelectDraft={setSelectedDraftOptionIndex}
                isEditing={isEditing}
                onToggleEdit={toggleEdit}
                showAIChat={showAIChat}
                onToggleChat={() => setShowAIChat((s) => !s)}
                currentMessage={getCurrentMessage(selectedDraft)}
                currentTone={getCurrentTone(selectedDraft)}
                onMessageUpdate={handleAIChatMessageUpdate}
                onActionsUpdate={handleAIChatActionsUpdate}
                enabledActions={enabledActions}
                onToggleAction={handleToggleAction}
                onSend={handleSend}
                onSnooze={() => setShowSnoozeMenu(true)}
                isPendingSend={pendingSendsRef.current.has(selectedDraft.id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No conversations to review
              </div>
            )}
          </div>
        </div>
      ) : (
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
                showAIChat={showAIChat}
                onToggleChat={() => setShowAIChat((s) => !s)}
                currentMessage={getCurrentMessage(expandedDraft)}
                currentTone={getCurrentTone(expandedDraft)}
                onMessageUpdate={handleAIChatMessageUpdate}
                onActionsUpdate={handleAIChatActionsUpdate}
                enabledActions={enabledActions}
                onToggleAction={handleToggleAction}
                onSend={handleSend}
                onSnooze={() => setShowSnoozeMenu(true)}
                isPendingSend={pendingSendsRef.current.has(expandedDraft.id)}
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

      {/* Modals */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showSnoozeMenu && (
        <SnoozeMenu
          onSelect={handleSnooze}
          onClose={() => setShowSnoozeMenu(false)}
        />
      )}
    </div>
  );
}
