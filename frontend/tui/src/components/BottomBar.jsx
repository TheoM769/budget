import React from "react";
import { Box, Text, useStdout } from "ink";
import { colors } from "../utils/theme.js";

export default function BottomBar() {
  const { stdout } = useStdout();
  const cols = stdout?.columns || 80;

  return (
    <Box width={cols} paddingX={2} justifyContent="space-between">
      <Text color={colors.textMuted}>budget</Text>
      <Text color={colors.textMuted}>v1.0</Text>
    </Box>
  );
}
