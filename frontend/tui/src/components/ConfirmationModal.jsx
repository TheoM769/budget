import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../utils/theme.js";

export default function ConfirmationModal({ message, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(false); // false = No, true = Yes

  useInput((ch, key) => {
    if (key.leftArrow || key.rightArrow) setSelected((s) => !s);
    if (key.return) {
      if (selected) onConfirm();
      else onCancel();
    }
    if (key.escape) onCancel();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.warning}
      paddingX={2}
      paddingY={1}
    >
      <Text bold color={colors.warning}>
        {message}
      </Text>
      <Box gap={2} marginTop={1}>
        <Text
          color={selected ? colors.success : colors.textMuted}
          bold={selected}
        >
          {selected ? "[Yes]" : " Yes "}
        </Text>
        <Text
          color={!selected ? colors.danger : colors.textMuted}
          bold={!selected}
        >
          {!selected ? "[No]" : " No "}
        </Text>
      </Box>
    </Box>
  );
}
