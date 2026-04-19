import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../utils/theme.js';

export default function ConfirmationModal({ message, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(1); // 0=Yes, 1=No (default No)

  useInput((input, key) => {
    if (key.leftArrow) setSelected(0);
    if (key.rightArrow) setSelected(1);
    if (key.return) {
      if (selected === 0) onConfirm();
      else onCancel();
    }
    if (key.escape) onCancel();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.warning}
      paddingX={1}
    >
      <Text color={theme.warning}>{message}</Text>
      <Box gap={2} marginTop={1}>
        <Text
          color={selected === 0 ? theme.warning : theme.textMuted}
          bold={selected === 0}
        >
          {selected === 0 ? '▸ ' : '  '}Yes
        </Text>
        <Text
          color={selected === 1 ? theme.warning : theme.textMuted}
          bold={selected === 1}
        >
          {selected === 1 ? '▸ ' : '  '}No
        </Text>
      </Box>
    </Box>
  );
}
