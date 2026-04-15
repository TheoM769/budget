import React from "react";
import { Box, Text, useStdout } from "ink";
import { colors } from "../utils/theme.js";

export default function Window({ title, footer, children }) {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  // Account for border (2) + paddingX (2)
  const innerWidth = Math.max(20, termWidth - 4);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.primary}
      width="100%"
      minHeight={20}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={colors.primary}>
          {title}
        </Text>
        <Text color={colors.textMuted}>Esc: Back</Text>
      </Box>

      <Box paddingX={1}>
        <Text color={colors.textMuted}>
          {"─".repeat(innerWidth)}
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        {children}
      </Box>

      {/* Footer */}
      {footer && (
        <>
          <Box paddingX={1}>
            <Text color={colors.textMuted}>
              {"─".repeat(innerWidth)}
            </Text>
          </Box>
          <Box paddingX={1}>
            <Text color={colors.textMuted}>{footer}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
