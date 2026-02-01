import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Header } from "./components/Header";
import { ItemDisplay } from "./components/ItemDisplay";
import { DecisionTree } from "./components/DecisionTree";
import { KeyHints } from "./components/KeyHints";
import { FlashMessage } from "./components/FlashMessage";
import { Summary } from "./components/Summary";
import { AnnotateMode } from "./components/AnnotateMode";
import { useDecisionTree } from "./hooks/useDecisionTree";
import { useSession, clearSession } from "./hooks/useSession";
import { isInputState, isAnnotateState } from "./gtd-flow";
import { colors } from "./colors";
import type { ProcessedItem, ProcessingResult, Category } from "./types";

interface AppProps {
  items: { id: string; text: string; source?: string; notes?: string }[];
  inputFile: string;
  outputFile?: string;
  resume?: boolean;
  fresh?: boolean;
}

export function App({ items: initialItems, inputFile, outputFile, resume, fresh }: AppProps) {
  const { exit } = useApp();
  const [flash, setFlash] = useState<{ message: string; category?: Category } | null>(null);

  const session = useSession({
    inputFile,
    items: initialItems,
    resume,
    fresh,
  });

  const handleComplete = useCallback(
    (processed: ProcessedItem) => {
      session.addProcessed(processed);
      setFlash({ message: "Processed!", category: processed.category });
      setTimeout(() => setFlash(null), 1000);
    },
    [session]
  );

  const decision = useDecisionTree(session.currentItem, {
    onComplete: handleComplete,
  });

  const writeOutput = useCallback(() => {
    if (!outputFile || session.processed.length === 0) return;

    const summary = session.processed.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<Category, number>
    );

    const result: ProcessingResult = {
      processed_at: new Date().toISOString(),
      items: session.processed,
      summary,
    };

    const fs = require("fs");
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    clearSession();
  }, [outputFile, session.processed]);

  // Global keyboard handling
  useInput((input, key) => {
    if (session.isComplete) {
      if (input === "q" || key.escape) {
        exit();
      }
      return;
    }

    // Don't handle keys when in input or annotate mode
    if (isInputState(decision.state) || isAnnotateState(decision.state)) {
      return;
    }

    if (input === "q") {
      writeOutput();
      exit();
    } else if (input === "e") {
      decision.enterAnnotateMode();
    } else if (input === "b" && session.canGoBack) {
      // Go back to previous item
      session.goBackToPrevious();
      decision.reset();
      setFlash({ message: "Back to previous item" });
      setTimeout(() => setFlash(null), 1000);
    }
  });

  // Write output on completion
  useEffect(() => {
    if (session.isComplete && session.processed.length > 0) {
      writeOutput();
    }
  }, [session.isComplete, session.processed.length, writeOutput]);

  // Handle annotate save
  const handleAnnotateSave = useCallback(
    (text: string, notes: string) => {
      if (text !== session.currentItem?.text) {
        session.updateCurrentItem(text);
      }
      if (notes !== session.currentItem?.notes) {
        session.updateCurrentNotes(notes);
      }
      decision.exitAnnotateMode();
    },
    [decision, session]
  );

  // Show summary when complete
  if (session.isComplete) {
    return (
      <Box flexDirection="column">
        <Summary items={session.processed} />
        <Box paddingX={2} marginTop={1}>
          <Text color={colors.muted}>Press q or Esc to exit</Text>
        </Box>
      </Box>
    );
  }

  // Show annotate mode
  if (isAnnotateState(decision.state)) {
    return (
      <Box flexDirection="column">
        <Header current={session.currentIndex + 1} total={session.items.length} />
        <AnnotateMode
          itemText={session.currentItem?.text || ""}
          notes={session.currentItem?.notes || ""}
          onSave={handleAnnotateSave}
          onCancel={decision.exitAnnotateMode}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header current={session.currentIndex + 1} total={session.items.length} />

      <ItemDisplay
        item={session.currentItem}
        nextAction={decision.context.next_action}
      />

      {flash && <FlashMessage message={flash.message} category={flash.category} />}

      <Box marginY={1}>
        <Text color={colors.border}>
          {"━".repeat(60)}
        </Text>
      </Box>

      <DecisionTree
        state={decision.state}
        onChoice={decision.handleChoice}
        onTextInput={decision.handleTextInput}
        onBack={decision.goBack}
        suggestions={session.contexts}
      />

      <KeyHints
        showBackHint={decision.state !== "actionable"}
        canGoBack={session.canGoBack}
      />
    </Box>
  );
}
