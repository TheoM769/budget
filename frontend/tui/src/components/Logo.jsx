import React from 'react';
import { Text } from 'ink';
import { theme } from '../utils/theme.js';

const LOGO = `
 ██████  ██    ██ ██████   ██████  ███████ ████████
 ██   ██ ██    ██ ██   ██ ██       ██         ██
 ██████  ██    ██ ██   ██ ██   ███ █████      ██
 ██   ██ ██    ██ ██   ██ ██    ██ ██         ██
 ██████   ██████  ██████   ██████  ███████    ██
`.trimStart();

export default function Logo() {
  return (
    <Text color={theme.primary} bold>
      {LOGO}
    </Text>
  );
}
