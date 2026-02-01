import React from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";
import type { Category, ProcessedItem } from "../types";

interface SummaryProps {
  items: ProcessedItem[];
}

const categoryLabels: Record<Category, string> = {
  trash: "Trash",
  reference: "Reference",
  someday: "Someday/Maybe",
  do_now: "Do Now",
  delegate: "Delegate",
  context: "Context",
  project: "Project",
};

const categoryColors: Record<Category, string> = {
  trash: colors.trash,
  reference: colors.reference,
  someday: colors.someday,
  do_now: colors.do_now,
  delegate: colors.delegate,
  context: colors.context,
  project: colors.project,
};

export function Summary({ items }: SummaryProps) {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<Category, number>
  );

  const categories: Category[] = [
    "trash",
    "reference",
    "someday",
    "do_now",
    "delegate",
    "context",
    "project",
  ];

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={colors.accent} bold>
        Processing Complete!
      </Text>
      <Box marginTop={1} flexDirection="column">
        {categories.map((cat) => {
          const count = counts[cat] || 0;
          if (count === 0) return null;
          return (
            <Box key={cat}>
              <Text color={categoryColors[cat]}>{categoryLabels[cat]}: </Text>
              <Text color={colors.foreground}>{count}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={colors.muted}>Total: {items.length} items processed</Text>
      </Box>
    </Box>
  );
}
