import React from "react";
import { Box, Text } from "ink";
import CommandInput from "../components/CommandInput.jsx";
import { colors } from "../utils/theme.js";

export default function CLIMode({ onOpenWindow }) {
  const handleCommand = (command) => {
    switch (command) {
      case "transactions":
      case "labels":
      case "labelize":
      case "analyze":
      case "import":
        onOpenWindow(command);
        break;
      case "help":
        // help is shown inline
        break;
      case "quit":
        process.exit(0);
        break;
      default:
        break;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          Budget TUI
        </Text>
        <Text color={colors.textMuted}> v1.0 </Text>
        <Text color={colors.textMuted}>│ Ctrl+C: Exit │ /: Commands</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.textMuted}
        paddingX={2}
        paddingY={1}
      >
        <Text color={colors.text}>
          Welcome to Budget TUI. Type <Text bold color={colors.primary}>/</Text>{" "}
          to see available commands.
        </Text>

        <Box marginTop={1} flexDirection="column" gap={0}>
          <Text color={colors.textMuted}>
            /transactions  Manage your transactions
          </Text>
          <Text color={colors.textMuted}>
            /labels         Manage labels & categories
          </Text>
          <Text color={colors.textMuted}>
            /labelize       Bulk-label transactions
          </Text>
          <Text color={colors.textMuted}>
            /analyze        Analytics dashboard
          </Text>
          <Text color={colors.textMuted}>
            /import         Import transactions from CSV
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <CommandInput onCommand={handleCommand} />
      </Box>

      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          Tab: autocomplete │ ↑↓: navigate suggestions │ Enter: confirm
        </Text>
      </Box>
    </Box>
  );
}
