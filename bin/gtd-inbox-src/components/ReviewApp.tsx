// ReviewApp - TUI for reviewing AI-classified items
import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { writeFileSync, appendFileSync } from "fs";
import { Header } from "./Header";
import { FlashMessage } from "./FlashMessage";
import { KeyHints } from "./KeyHints";
import { colors } from "../colors";
import type {
  ClassifiedItem,
  ReviewedItem,
  Category,
  DecisionLogEntry,
} from "../types";
import { loadConfig, ensureCacheDir } from "../lib/config";

interface ReviewAppProps {
  items: ClassifiedItem[];
  outputFile?: string;
  resume?: boolean;
  copilotMode?: boolean;
}

// Category display info
const categoryInfo: Record<
  Category,
  { label: string; color: string; emoji: string }
> = {
  trash: { label: "Trash", color: colors.categories.trash, emoji: "🗑️" },
  reference: {
    label: "Reference",
    color: colors.categories.reference,
    emoji: "📚",
  },
  someday: { label: "Someday", color: colors.categories.someday, emoji: "💭" },
  do_now: { label: "Do Now", color: colors.categories.do_now, emoji: "⚡" },
  delegate: {
    label: "Delegate",
    color: colors.categories.delegate,
    emoji: "👥",
  },
  context: { label: "Context", color: colors.categories.context, emoji: "📍" },
  project: { label: "Project", color: colors.categories.project, emoji: "📋" },
};

export function ReviewApp({
  items,
  outputFile,
  copilotMode,
}: ReviewAppProps) {
  const { exit } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState<ReviewedItem[]>([]);
  const [flash, setFlash] = useState<{
    message: string;
    category?: Category;
  } | null>(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const config = loadConfig();
  const currentItem = items[currentIndex];
  const isComplete = currentIndex >= items.length;

  // Get current suggestion (from AI or alternatives)
  const getSuggestions = useCallback(() => {
    if (!currentItem) return [];
    const suggestions = [
      {
        category: currentItem.classification.category,
        confidence: currentItem.classification.confidence,
        reasoning: currentItem.classification.reasoning,
      },
    ];
    if (currentItem.alternatives) {
      suggestions.push(...currentItem.alternatives);
    }
    return suggestions;
  }, [currentItem]);

  const currentSuggestion = getSuggestions()[suggestionIndex];

  // Write decision log for copilot mode
  const logDecision = useCallback(
    (item: ClassifiedItem, accepted: boolean, finalCategory: Category) => {
      if (!copilotMode) return;

      ensureCacheDir();
      const entry: DecisionLogEntry = {
        timestamp: new Date().toISOString(),
        item_id: item.id,
        item_text: item.text,
        source: item.source,
        ai_suggestion: {
          category: item.classification.category,
          confidence: item.classification.confidence,
        },
        user_decision: {
          category: finalCategory,
          accepted_suggestion: accepted,
        },
        labels: item.labels,
      };

      appendFileSync(
        config.copilot.decision_log,
        JSON.stringify(entry) + "\n"
      );
    },
    [copilotMode, config]
  );

  // Accept current suggestion
  const acceptSuggestion = useCallback(() => {
    if (!currentItem || !currentSuggestion) return;

    const reviewedItem: ReviewedItem = {
      ...currentItem,
      decision: {
        accepted_suggestion: suggestionIndex === 0,
        category: currentSuggestion.category,
        next_action: currentItem.classification.next_action,
        context: currentItem.classification.context,
        delegate_to: currentItem.classification.delegate_to,
        project_name: currentItem.classification.project_name,
        reference_location: currentItem.classification.reference_location,
        destination: currentItem.classification.destination || {
          type: "discard",
          target: "unknown",
        },
        reviewed_at: new Date().toISOString(),
      },
    };

    logDecision(currentItem, suggestionIndex === 0, currentSuggestion.category);
    setReviewed((prev) => [...prev, reviewedItem]);
    setCurrentIndex((prev) => prev + 1);
    setSuggestionIndex(0);

    const info = categoryInfo[currentSuggestion.category];
    setFlash({ message: `${info.emoji} ${info.label}`, category: currentSuggestion.category });
    setTimeout(() => setFlash(null), 800);
  }, [currentItem, currentSuggestion, suggestionIndex, logDecision]);

  // Cycle through suggestions
  const cycleSuggestion = useCallback(() => {
    const suggestions = getSuggestions();
    setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
  }, [getSuggestions]);

  // Skip item
  const skipItem = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setSuggestionIndex(0);
    setFlash({ message: "Skipped" });
    setTimeout(() => setFlash(null), 800);
  }, []);

  // Go back
  const goBack = useCallback(() => {
    if (currentIndex === 0) return;
    setReviewed((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
    setSuggestionIndex(0);
  }, [currentIndex]);

  // Write output
  const writeOutput = useCallback(() => {
    if (reviewed.length === 0) return;

    if (outputFile) {
      const content = reviewed.map((r) => JSON.stringify(r)).join("\n");
      writeFileSync(outputFile, content + "\n");
    } else {
      // Output to stdout
      for (const item of reviewed) {
        console.log(JSON.stringify(item));
      }
    }
  }, [outputFile, reviewed]);

  // Handle keyboard input
  useInput((input, key) => {
    if (isComplete) {
      if (input === "q" || key.escape) {
        exit();
      }
      return;
    }

    switch (input) {
      case "q":
        writeOutput();
        exit();
        break;
      case "\r": // Enter
      case "y":
        acceptSuggestion();
        break;
      case "\t": // Tab
        cycleSuggestion();
        break;
      case "s":
        skipItem();
        break;
      case "b":
        goBack();
        break;
    }

    // Handle escape
    if (key.escape) {
      goBack();
    }
  });

  // Write output on completion
  useEffect(() => {
    if (isComplete && reviewed.length > 0) {
      writeOutput();
    }
  }, [isComplete, reviewed.length, writeOutput]);

  // Show summary when complete
  if (isComplete) {
    const summary = reviewed.reduce(
      (acc, item) => {
        acc[item.decision.category] = (acc[item.decision.category] || 0) + 1;
        return acc;
      },
      {} as Record<Category, number>
    );

    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="round"
          borderColor={colors.accent}
          paddingX={2}
          paddingY={1}
        >
          <Text color={colors.accent} bold>
            Review Complete
          </Text>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {Object.entries(summary).map(([cat, count]) => {
            const info = categoryInfo[cat as Category];
            return (
              <Box key={cat}>
                <Text color={info.color}>
                  {info.emoji} {info.label}: {count}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text color={colors.muted}>Total: {reviewed.length}</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color={colors.muted}>Press q or Esc to exit</Text>
        </Box>
      </Box>
    );
  }

  // Confidence bar
  const confidencePercent = Math.round(
    (currentSuggestion?.confidence || 0) * 100
  );
  const confidenceColor =
    confidencePercent >= 80
      ? colors.categories.do_now
      : confidencePercent >= 50
        ? colors.categories.someday
        : colors.categories.trash;

  return (
    <Box flexDirection="column">
      <Header current={currentIndex + 1} total={items.length} />

      {/* Item display */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text color={colors.foreground} bold>
          {currentItem.text}
        </Text>
        {currentItem.description && (
          <Text color={colors.muted} dimColor>
            {currentItem.description}
          </Text>
        )}
        {currentItem.labels && currentItem.labels.length > 0 && (
          <Box marginTop={1}>
            {currentItem.labels.map((label) => (
              <Box
                key={label}
                marginRight={1}
                borderStyle="round"
                paddingX={1}
              >
                <Text color={colors.accent}>{label}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {flash && <FlashMessage message={flash.message} category={flash.category} />}

      {/* AI Suggestion Panel */}
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={categoryInfo[currentSuggestion.category].color}
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Box justifyContent="space-between">
          <Text color={categoryInfo[currentSuggestion.category].color} bold>
            {categoryInfo[currentSuggestion.category].emoji}{" "}
            {categoryInfo[currentSuggestion.category].label}
          </Text>
          <Box>
            <Text color={confidenceColor}>
              {confidencePercent}% confident
            </Text>
            {getSuggestions().length > 1 && (
              <Text color={colors.muted}>
                {" "}
                ({suggestionIndex + 1}/{getSuggestions().length})
              </Text>
            )}
          </Box>
        </Box>

        {currentSuggestion.reasoning && (
          <Text color={colors.muted} dimColor wrap="wrap">
            {currentSuggestion.reasoning}
          </Text>
        )}

        {currentItem.classification.next_action && (
          <Box marginTop={1}>
            <Text color={colors.accent}>
              Next action: {currentItem.classification.next_action}
            </Text>
          </Box>
        )}

        {currentItem.classification.context && (
          <Box>
            <Text color={colors.accent}>
              Context: {currentItem.classification.context}
            </Text>
          </Box>
        )}

        {currentItem.classification.reference_location && (
          <Box>
            <Text color={colors.accent}>
              File to: {currentItem.classification.reference_location}
            </Text>
          </Box>
        )}
      </Box>

      {/* Key hints */}
      <Box>
        <Text color={colors.muted}>
          <Text color={colors.accent}>[Enter/y]</Text> Accept{" "}
          {getSuggestions().length > 1 && (
            <>
              <Text color={colors.accent}>[Tab]</Text> Cycle{" "}
            </>
          )}
          <Text color={colors.accent}>[s]</Text> Skip{" "}
          <Text color={colors.accent}>[b/Esc]</Text> Back{" "}
          <Text color={colors.accent}>[q]</Text> Quit
        </Text>
      </Box>

      {copilotMode && (
        <Box marginTop={1}>
          <Text color={colors.muted} dimColor>
            🤖 Copilot mode active
          </Text>
        </Box>
      )}
    </Box>
  );
}
