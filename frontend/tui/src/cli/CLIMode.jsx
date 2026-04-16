import React from "react";
import { Box, Text } from "ink";
import Logo from "../components/Logo.jsx";
import CommandInput from "../components/CommandInput.jsx";
import { colors } from "../utils/theme.js";

export default function CLIMode({ onOpenWindow, cols }) {
  const inputWidth = Math.min(58, Math.max(40, cols - 8));

  const handleCommand = (command) => {
    switch (command) {
      case "transactions":
      case "labels":
      case "labelize":
      case "analyze":
      case "import":
        onOpenWindow(command);
        break;
      case "quit":
        process.exit(0);
        break;
      default:
        break;
    }
  };

  return (
    <Box flexDirection="column" alignItems="center" gap={1}>
      <Logo />

      {/* Input area — opencode style: left accent border */}
      <Box flexDirection="row" width={inputWidth}>
        <Text color={colors.primary}>│ </Text>
        <Box flexGrow={1} flexDirection="column">
          <CommandInput onCommand={handleCommand} />
        </Box>
      </Box>

      {/* Keyboard hints */}
      <Box gap={2}>
        <Box gap={1}>
          <Text color={colors.textMuted} bold>tab</Text>
          <Text color="#3a3a3a">autocomplete</Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.textMuted} bold>↑↓</Text>
          <Text color="#3a3a3a">navigate</Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.textMuted} bold>enter</Text>
          <Text color="#3a3a3a">run</Text>
        </Box>
      </Box>
    </Box>
  );
}
