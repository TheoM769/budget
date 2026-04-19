import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from '../utils/theme.js';
import { api } from '../utils/api.js';
import { extractKeyword } from '../utils/formatting.js';

export default function RuleForm({ transaction, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const keyword = extractKeyword(transaction?.description || '');
  const [pattern, setPattern] = useState(keyword);
  const [labelQuery, setLabelQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [allLabels, setAllLabels] = useState([]);

  useEffect(() => {
    api.listLabels(3).then(setAllLabels).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 2 && labelQuery.length > 0) {
      const q = labelQuery.toLowerCase();
      const matches = allLabels
        .filter((lb) => lb.name.toLowerCase().includes(q))
        .slice(0, 5);
      setSuggestions(matches);
      setSelectedIdx(0);
    } else {
      setSuggestions([]);
    }
  }, [labelQuery, step, allLabels]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (step === 1 && key.return) {
      if (pattern.trim()) setStep(2);
      return;
    }

    if (step === 2) {
      if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIdx((i) => Math.min(suggestions.length - 1, i + 1));
      if (key.tab && suggestions.length > 0) {
        const sel = suggestions[Math.min(selectedIdx, suggestions.length - 1)];
        setLabelQuery(sel.name);
      }
      if (key.return && suggestions.length > 0) {
        const sel = suggestions[Math.min(selectedIdx, suggestions.length - 1)];
        onSubmit(pattern, sel.id);
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.warning} paddingX={1}>
      <Text bold color={theme.warning}>
        Create Rule — Step {step}/2
      </Text>
      {step === 1 && (
        <Box marginTop={1}>
          <Text>Pattern: </Text>
          <TextInput value={pattern} onChange={setPattern} />
        </Box>
      )}
      {step === 2 && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text>Label: </Text>
            <TextInput value={labelQuery} onChange={setLabelQuery} />
          </Box>
          {suggestions.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {suggestions.map((lb, i) => (
                <Box key={lb.id} gap={1}>
                  <Text color={i === selectedIdx ? theme.primary : theme.text}>
                    {i === selectedIdx ? '▸' : ' '} {lb.name}
                  </Text>
                  <Text color={theme.textMuted}>{lb.parent_id || ''}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      <Text color={theme.textMuted} marginTop={1}>
        Enter: {step === 1 ? 'next' : 'create'} │ Esc: cancel
      </Text>
    </Box>
  );
}
