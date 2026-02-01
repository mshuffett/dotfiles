import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../colors";

interface AnnotateModeProps {
  itemText: string;
  notes: string;
  onSave: (text: string, notes: string) => void;
  onCancel: () => void;
}

type Field = "text" | "notes";

export function AnnotateMode({
  itemText,
  notes,
  onSave,
  onCancel,
}: AnnotateModeProps) {
  const [text, setText] = useState(itemText);
  const [notesValue, setNotesValue] = useState(notes);
  const [activeField, setActiveField] = useState<Field>("text");

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.tab) {
      setActiveField((f) => (f === "text" ? "notes" : "text"));
      return;
    }
  });

  const handleSubmit = () => {
    onSave(text, notesValue);
  };

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text color={colors.accent} bold>
        Edit Item
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === "text" ? colors.accent : colors.muted}>
          Text:
        </Text>
        <Box>
          <Text color={colors.muted}>{"> "}</Text>
          {activeField === "text" ? (
            <TextInput
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text color={colors.foreground}>{text}</Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === "notes" ? colors.accent : colors.muted}>
          Notes:
        </Text>
        <Box>
          <Text color={colors.muted}>{"> "}</Text>
          {activeField === "notes" ? (
            <TextInput
              value={notesValue}
              onChange={setNotesValue}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text color={colors.foreground}>{notesValue || "(none)"}</Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={colors.muted} dimColor>
          Tab to switch fields, Enter to save, Esc to cancel
        </Text>
      </Box>
    </Box>
  );
}
