import React from "react";
import { Box, Text } from "ink";
import { colors } from "../utils/theme.js";

export default function StatusBar({ message, type = "info" }) {
  const color =
    type === "error"
      ? colors.danger
      : type === "success"
        ? colors.success
        : colors.textMuted;

  return (
    <Box paddingX={1}>
      <Text color={color}>{message}</Text>
    </Box>
  );
}
