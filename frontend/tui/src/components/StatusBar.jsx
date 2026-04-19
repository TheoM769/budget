import React from 'react';
import { Text } from 'ink';
import { theme } from '../utils/theme.js';

export default function StatusBar({ message, type = 'success' }) {
  if (!message) return null;
  const color = type === 'error' ? theme.danger : theme.success;
  return <Text color={color}>{message}</Text>;
}
