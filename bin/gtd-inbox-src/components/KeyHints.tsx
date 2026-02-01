import React from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";

interface KeyHintsProps {
  showBackHint?: boolean;
  canGoBack?: boolean;
}

export function KeyHints({ showBackHint = false, canGoBack = false }: KeyHintsProps) {
  return (
    <Box paddingX={2} gap={2} marginTop={1}>
      <Box>
        <Text color={colors.muted}>[e]</Text>
        <Text color={colors.foreground}> Edit</Text>
      </Box>
      {canGoBack && (
        <Box>
          <Text color={colors.muted}>[b]</Text>
          <Text color={colors.foreground}> Back</Text>
        </Box>
      )}
      <Box>
        <Text color={colors.muted}>[q]</Text>
        <Text color={colors.foreground}> Quit</Text>
      </Box>
      {showBackHint && (
        <Box>
          <Text color={colors.muted}>[Esc]</Text>
          <Text color={colors.foreground}> Undo</Text>
        </Box>
      )}
    </Box>
  );
}
