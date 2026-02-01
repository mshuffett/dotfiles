import { useState, useCallback } from "react";
import type {
  DecisionState,
  DecisionContext,
  Category,
  InboxItem,
  ProcessedItem,
} from "../types";
import { getFlowNode } from "../gtd-flow";

interface UseDecisionTreeOptions {
  onComplete: (item: ProcessedItem) => void;
}

export function useDecisionTree(
  currentItem: InboxItem | null,
  { onComplete }: UseDecisionTreeOptions
) {
  const [state, setState] = useState<DecisionState>("actionable");
  const [context, setContext] = useState<DecisionContext>({
    state: "actionable",
  });

  const reset = useCallback(() => {
    setState("actionable");
    setContext({ state: "actionable" });
  }, []);

  const handleChoice = useCallback(
    (key: string) => {
      const node = getFlowNode(state);
      if (!node) return;

      const option = node.options.find((o) => o.key === key);
      if (!option) return;

      if (option.category && currentItem) {
        // Terminal state - complete the item
        const processed: ProcessedItem = {
          id: currentItem.id,
          original: currentItem.text,
          category: option.category,
          next_action: context.next_action,
          context: context.context,
          delegate_to: context.delegate_to,
          project_name: context.project_name,
          notes: context.notes || currentItem.notes,
        };
        onComplete(processed);
        reset();
      } else if (option.next) {
        setState(option.next);
        setContext((prev) => ({ ...prev, state: option.next! }));
      }
    },
    [state, currentItem, context, onComplete, reset]
  );

  const handleTextInput = useCallback(
    (value: string) => {
      if (!currentItem) return;

      switch (state) {
        case "next_action_input":
          setContext((prev) => ({ ...prev, next_action: value }));
          setState("two_minute");
          break;

        case "reference_input": {
          const processed: ProcessedItem = {
            id: currentItem.id,
            original: currentItem.text,
            category: "reference",
            reference_location: value,
            notes: context.notes || currentItem.notes,
          };
          onComplete(processed);
          reset();
          break;
        }

        case "context_input": {
          const processed: ProcessedItem = {
            id: currentItem.id,
            original: currentItem.text,
            category: "context",
            next_action: context.next_action,
            context: value,
            notes: context.notes || currentItem.notes,
          };
          onComplete(processed);
          reset();
          break;
        }

        case "delegate_input": {
          const processed: ProcessedItem = {
            id: currentItem.id,
            original: currentItem.text,
            category: "delegate",
            next_action: context.next_action,
            delegate_to: value,
            notes: context.notes || currentItem.notes,
          };
          onComplete(processed);
          reset();
          break;
        }

        case "project_input": {
          const processed: ProcessedItem = {
            id: currentItem.id,
            original: currentItem.text,
            category: "project",
            next_action: context.next_action,
            project_name: value,
            notes: context.notes || currentItem.notes,
          };
          onComplete(processed);
          reset();
          break;
        }
      }
    },
    [state, currentItem, context, onComplete, reset]
  );

  const enterAnnotateMode = useCallback(() => {
    setContext((prev) => ({ ...prev, previousState: state }));
    setState("annotate");
  }, [state]);

  const exitAnnotateMode = useCallback(() => {
    setState(context.previousState || "actionable");
  }, [context.previousState]);

  const goBack = useCallback(() => {
    // Simple back navigation within decision tree
    if (state === "not_actionable_choice") {
      setState("actionable");
    } else if (state === "reference_input") {
      setState("not_actionable_choice");
    } else if (state === "two_minute") {
      setState("next_action_input");
    } else if (state === "actionable_choice") {
      setState("two_minute");
    } else if (
      ["context_input", "delegate_input", "project_input"].includes(state)
    ) {
      setState("actionable_choice");
    } else if (state === "annotate") {
      exitAnnotateMode();
    }
  }, [state, exitAnnotateMode]);

  return {
    state,
    context,
    handleChoice,
    handleTextInput,
    enterAnnotateMode,
    exitAnnotateMode,
    goBack,
    reset,
  };
}
