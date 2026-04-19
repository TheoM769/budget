import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { theme } from '../utils/theme.js';

export default function Window({ title, footer, children }) {
  const { stdout } = useStdout();
  const height = (stdout?.rows || 24) - 1;

  return (
    <Box
      flexDirection="column"
      height={height}
      borderStyle="round"
      borderColor={theme.primary}
      paddingX={1}
    >
      {/* Title bar */}
      <Box>
        <Text bold color={theme.primary}>
          {title}
        </Text>
        <Box flexGrow={1} />
        <Text color={theme.textMuted}>Esc: Back</Text>
      </Box>

      {/* Top rule */}
      <Text color={theme.textMuted}>{'─'.repeat(stdout?.columns ? stdout.columns - 6 : 70)}</Text>

      {/* Content area */}
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>

      {/* Footer */}
      {footer && (
        <>
          <Text color={theme.textMuted}>
            {'─'.repeat(stdout?.columns ? stdout.columns - 6 : 70)}
          </Text>
          <Text color={theme.textMuted}>{footer}</Text>
        </>
      )}
    </Box>
  );
}
