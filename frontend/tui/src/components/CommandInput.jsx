import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../utils/theme.js";

const COMMANDS = [
  { name: "/transactions", description: "Open transaction manager" },
  { name: "/labels", description: "Open label manager" },
  { name: "/labelize", description: "Open labelizer tool" },
  { name: "/analyze", description: "Open analytics dashboard" },
  { name: "/import", description: "Import transactions from CSV" },
  { name: "/help", description: "Show all commands" },
  { name: "/quit", description: "Exit application" },
];

export default function CommandInput({ onCommand }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputKey, setInputKey] = useState(0);

  const showSuggestions = input.startsWith("/");
  const filtered = showSuggestions
    ? COMMANDS.filter((c) =>
        c.name.toLowerCase().startsWith(input.toLowerCase())
      )
    : [];

  useInput((ch, key) => {
    if (key.upArrow && filtered.length > 0) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow && filtered.length > 0) {
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
    }
    if (key.tab && filtered.length > 0) {
      setInput(filtered[selectedIndex].name);
      setInputKey((k) => k + 1);
    }
  });

  const handleSubmit = () => {
    const cmd = input.trim();
    if (!cmd) return;

    // If suggestions visible and one selected, use it
    if (filtered.length > 0 && filtered[selectedIndex]) {
      onCommand(filtered[selectedIndex].name.slice(1)); // remove "/"
    } else if (cmd.startsWith("/")) {
      onCommand(cmd.slice(1));
    }
    setInput("");
    setSelectedIndex(0);
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.primary} bold>
          {">"}{" "}
        </Text>
        <TextInput
          key={inputKey}
          value={input}
          onChange={(val) => {
            setInput(val);
            setSelectedIndex(0);
          }}
          onSubmit={handleSubmit}
          placeholder="Type / for commands..."
        />
      </Box>

      {showSuggestions && filtered.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor={colors.textMuted}
          paddingX={1}
          marginTop={1}
        >
          {filtered.map((cmd, i) => (
            <Box key={cmd.name} gap={2}>
              <Text
                color={i === selectedIndex ? colors.primary : colors.text}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? "▸" : " "} {cmd.name}
              </Text>
              <Text color={colors.textMuted}>{cmd.description}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
