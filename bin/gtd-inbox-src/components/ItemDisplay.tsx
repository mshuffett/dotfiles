import React from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";
import type { InboxItem } from "../types";

interface ItemDisplayProps {
  item: InboxItem | null;
  nextAction?: string;
}

export function ItemDisplay({ item, nextAction }: ItemDisplayProps) {
  if (!item) {
    return (
      <Box paddingY={1} paddingX={2}>
        <Text color={colors.muted} italic>
          No items to process
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1} paddingX={2}>
      <Text color={colors.foreground}>"{item.text}"</Text>
      <Box marginTop={1}>
        <Text color={colors.muted}>
          Notes: {item.notes || "(none)"}
        </Text>
      </Box>
      {nextAction && (
        <Box marginTop={1}>
          <Text color={colors.success}>
            Next action: {nextAction}
          </Text>
        </Box>
      )}
    </Box>
  );
}
