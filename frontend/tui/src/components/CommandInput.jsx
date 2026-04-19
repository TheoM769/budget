import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from '../utils/theme.js';

const COMMANDS = [
  { name: '/transactions', desc: 'Browse transactions' },
  { name: '/labels', desc: 'Manage labels' },
  { name: '/labelize', desc: 'Label transactions' },
  { name: '/analyze', desc: 'Spending analytics' },
  { name: '/import', desc: 'Import CSV file' },
  { name: '/quit', desc: 'Exit' },
];

export default function CommandInput({ onCommand }) {
  const [value, setValue] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const suggestions = value.startsWith('/')
    ? COMMANDS.filter((c) => c.name.startsWith(value))
    : [];

  useInput((input, key) => {
    if (key.upArrow && suggestions.length > 0) {
      setSelectedIdx((i) => Math.max(0, i - 1));
    }
    if (key.downArrow && suggestions.length > 0) {
      setSelectedIdx((i) => Math.min(suggestions.length - 1, i + 1));
    }
    if (key.tab && suggestions.length > 0) {
      const cmd = suggestions[Math.min(selectedIdx, suggestions.length - 1)];
      setValue(cmd.name);
      setSelectedIdx(0);
    }
    if (key.return) {
      const match = COMMANDS.find((c) => c.name === value);
      if (match) {
        const cmd = match.name.slice(1); // strip /
        setValue('');
        setSelectedIdx(0);
        onCommand(cmd);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.primary}>{'> '}</Text>
        <TextInput value={value} onChange={(v) => { setValue(v); setSelectedIdx(0); }} />
      </Box>
      {suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {suggestions.map((cmd, i) => (
            <Box key={cmd.name} gap={1}>
              <Text color={i === selectedIdx ? theme.primary : theme.text}>
                {i === selectedIdx ? '▸' : ' '} {cmd.name}
              </Text>
              <Text color={theme.textMuted}>{cmd.desc}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
