import React from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";
import type { Category } from "../types";

interface FlashMessageProps {
  message: string;
  category?: Category;
}

const categoryColors: Record<Category, string> = {
  trash: colors.trash,
  reference: colors.reference,
  someday: colors.someday,
  do_now: colors.do_now,
  delegate: colors.delegate,
  context: colors.context,
  project: colors.project,
};

const categoryLabels: Record<Category, string> = {
  trash: "Trashed",
  reference: "Saved to Reference",
  someday: "Added to Someday/Maybe",
  do_now: "Do it now!",
  delegate: "Delegated",
  context: "Added to Context",
  project: "Added to Project",
};

export function FlashMessage({ message, category }: FlashMessageProps) {
  const color = category ? categoryColors[category] : colors.success;
  const label = category ? categoryLabels[category] : message;

  return (
    <Box paddingX={2} paddingY={1}>
      <Text color={color} bold>
        {label}
      </Text>
    </Box>
  );
}
