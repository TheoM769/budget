import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../utils/theme.js";

const COMMANDS = [
  { name: "/transactions", description: "Manage transactions" },
  { name: "/labels",       description: "Manage labels & categories" },
  { name: "/labelize",     description: "Bulk-label transactions" },
  { name: "/analyze",      description: "Analytics dashboard" },
  { name: "/import",       description: "Import transactions from CSV" },
  { name: "/quit",         description: "Exit application" },
];

export default function CommandInput({ onCommand }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputKey, setInputKey] = useState(0);

  const showSuggestions = input.startsWith("/");
  const filtered = showSuggestions
    ? COMMANDS.filter((c) => c.name.toLowerCase().startsWith(input.toLowerCase()))
    : [];

  useInput((ch, key) => {
    if (key.upArrow && filtered.length > 0)
      setSelectedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow && filtered.length > 0)
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
    if (key.tab && filtered.length > 0) {
      setInput(filtered[selectedIndex].name);
      setInputKey((k) => k + 1);
    }
  });

  const handleSubmit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    if (filtered.length > 0 && filtered[selectedIndex]) {
      onCommand(filtered[selectedIndex].name.slice(1));
    } else if (cmd.startsWith("/")) {
      onCommand(cmd.slice(1));
    }
    setInput("");
    setSelectedIndex(0);
  };

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={colors.textMuted}>{">"}</Text>
        <TextInput
          key={inputKey}
          value={input}
          onChange={(val) => { setInput(val); setSelectedIndex(0); }}
          onSubmit={handleSubmit}
          placeholder="Type / for commands..."
        />
      </Box>

      {showSuggestions && filtered.length > 0 && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          {filtered.map((cmd, i) => (
            <Box key={cmd.name} gap={2}>
              <Text
                color={i === selectedIndex ? colors.primary : colors.textMuted}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? "▸" : " "} {cmd.name}
              </Text>
              <Text color="#3a3a3a">{cmd.description}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
