import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../utils/theme.js';

export default function BottomBar() {
  return (
    <Box width="100%">
      <Text color={theme.textMuted}>budget</Text>
      <Box flexGrow={1} />
      <Text color={theme.textMuted}>v1.0</Text>
    </Box>
  );
}
