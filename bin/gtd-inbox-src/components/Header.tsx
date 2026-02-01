import React from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";

interface HeaderProps {
  current: number;
  total: number;
}

export function Header({ current, total }: HeaderProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={colors.border}
      paddingX={2}
      justifyContent="space-between"
    >
      <Text color={colors.accent} bold>
        INBOX
      </Text>
      <Text color={colors.muted}>
        {current} of {total}
      </Text>
    </Box>
  );
}
