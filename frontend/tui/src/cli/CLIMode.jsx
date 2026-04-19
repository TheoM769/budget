import React from 'react';
import { Box } from 'ink';
import Logo from '../components/Logo.jsx';
import CommandInput from '../components/CommandInput.jsx';

export default function CLIMode({ onCommand, rows, cols }) {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={cols}
      height={rows - 1}
    >
      <Logo />
      <Box marginTop={1}>
        <CommandInput onCommand={onCommand} />
      </Box>
    </Box>
  );
}
