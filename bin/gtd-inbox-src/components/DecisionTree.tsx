import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../colors";
import type { DecisionState } from "../types";
import { getFlowNode, isInputState, getInputPrompt } from "../gtd-flow";

interface DecisionTreeProps {
  state: DecisionState;
  onChoice: (key: string) => void;
  onTextInput: (value: string) => void;
  onBack: () => void;
  suggestions?: string[];
}

export function DecisionTree({
  state,
  onChoice,
  onTextInput,
  onBack,
  suggestions = [],
}: DecisionTreeProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);

  const node = getFlowNode(state);
  const isInput = isInputState(state);

  // Find matching suggestion
  const matchingSuggestion = suggestions.find(
    (s) => s.toLowerCase().startsWith(inputValue.toLowerCase()) && inputValue.length > 0
  );

  // Handle Escape in input mode
  useInput(
    (input, key) => {
      if (key.escape) {
        setInputValue("");
        onBack();
      }
    },
    { isActive: isInput }
  );

  // Handle choices in decision mode
  useInput(
    (input, key) => {
      if (key.escape) {
        onBack();
        return;
      }

      if (node) {
        const option = node.options.find((o) => o.key === input.toLowerCase());
        if (option) {
          onChoice(input.toLowerCase());
        }
      }
    },
    { isActive: !isInput }
  );

  if (isInput) {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Text color={colors.accent} bold>
          {getInputPrompt(state)}
        </Text>
        <Box marginTop={1}>
          <Text color={colors.muted}>{">"} </Text>
          <TextInput
            value={inputValue}
            onChange={(value) => {
              setInputValue(value);
              setShowSuggestion(true);
            }}
            onSubmit={(value) => {
              if (value.trim()) {
                onTextInput(value.trim());
                setInputValue("");
              }
            }}
          />
          {matchingSuggestion && showSuggestion && inputValue !== matchingSuggestion && (
            <Text color={colors.muted}>
              {matchingSuggestion.slice(inputValue.length)} (Tab)
            </Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text color={colors.muted} dimColor>
            Enter to submit, Esc to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (!node) {
    return null;
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text color={colors.foreground} bold>
        {node.question}
      </Text>
      <Box marginTop={1} gap={2}>
        {node.options.map((option) => (
          <Box key={option.key}>
            <Text color={colors.accent}>[{option.key}]</Text>
            <Text color={colors.foreground}> {option.label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
