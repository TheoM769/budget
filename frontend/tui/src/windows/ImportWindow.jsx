import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Window from '../components/Window.jsx';
import { theme, amountColor } from '../utils/theme.js';
import { api } from '../utils/api.js';
import { formatAmount } from '../utils/formatting.js';

function expandPath(p) {
  if (p.startsWith('~/')) {
    return p.replace('~', process.env.HOME || '');
  }
  return p;
}

export default function ImportWindow({ onClose }) {
  const [stage, setStage] = useState('INPUT'); // INPUT | UPLOADING | RESULT
  const [inputValue, setInputValue] = useState('@data/');
  const [completions, setCompletions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);

  // Update completions when input changes
  useEffect(() => {
    if (stage !== 'INPUT') return;
    const raw = inputValue.startsWith('@') ? inputValue.slice(1) : inputValue;
    if (!raw) { setCompletions([]); return; }

    const expanded = expandPath(raw);
    const doComplete = async () => {
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');

        let dir = expanded;
        let prefix = '';
        if (!expanded.endsWith('/')) {
          dir = path.dirname(expanded);
          prefix = path.basename(expanded).toLowerCase();
        }

        if (!fs.existsSync(dir)) { setCompletions([]); return; }

        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter((e) => !prefix || e.name.toLowerCase().startsWith(prefix))
          .slice(0, 10)
          .map((e) => ({
            name: e.name,
            isDir: e.isDirectory(),
            fullPath: path.join(dir, e.name),
          }));
        setCompletions(entries);
        setSelectedIdx(0);
      } catch {
        setCompletions([]);
      }
    };
    doComplete();
  }, [inputValue, stage]);

  useInput((input, key) => {
    if (stage === 'RESULT') {
      if (key.return || key.escape) onClose();
      return;
    }

    if (stage !== 'INPUT') return;

    if (key.escape) { onClose(); return; }

    if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIdx((i) => Math.min(completions.length - 1, i + 1));

    if (key.tab && completions.length > 0) {
      const sel = completions[Math.min(selectedIdx, completions.length - 1)];
      const raw = inputValue.startsWith('@') ? inputValue.slice(1) : inputValue;
      const lastSlash = raw.lastIndexOf('/');
      const dir = lastSlash >= 0 ? raw.slice(0, lastSlash + 1) : '';
      const newVal = '@' + dir + sel.name + (sel.isDir ? '/' : '');
      setInputValue(newVal);
    }

    if (key.return) {
      const raw = inputValue.startsWith('@') ? inputValue.slice(1) : inputValue;
      const filePath = expandPath(raw);
      setStage('UPLOADING');
      api.uploadTransactions(filePath)
        .then((data) => {
          setResult(data);
          setStage('RESULT');
        })
        .catch((e) => {
          setError(e.message);
          setStage('RESULT');
        });
    }
  });

  if (stage === 'UPLOADING') {
    return (
      <Window title="IMPORT TRANSACTIONS">
        <Box>
          <Text color={theme.warning}>
            <Spinner type="dots" /> Uploading...
          </Text>
        </Box>
      </Window>
    );
  }

  if (stage === 'RESULT') {
    const preview = result.slice(0, 15);
    const remaining = result.length - 15;
    return (
      <Window title="IMPORT TRANSACTIONS" footer="Enter/Esc:close">
        {error ? (
          <Text color={theme.danger}>{error}</Text>
        ) : (
          <Box flexDirection="column">
            <Text color={theme.success}>
              Imported {result.length} new transaction(s)
            </Text>
            <Box marginTop={1} flexDirection="column">
              <Box gap={2}>
                <Box width={12}><Text bold color={theme.textMuted}>Date</Text></Box>
                <Box width={40}><Text bold color={theme.textMuted}>Description</Text></Box>
                <Box width={14}><Text bold color={theme.textMuted}>Amount</Text></Box>
              </Box>
              {preview.map((tx) => (
                <Box key={tx.id} gap={2}>
                  <Box width={12}><Text color={theme.textMuted}>{tx.date}</Text></Box>
                  <Box width={40}><Text>{tx.description}</Text></Box>
                  <Box width={14}>
                    <Text color={amountColor(tx.amount)}>{formatAmount(tx.amount)}</Text>
                  </Box>
                </Box>
              ))}
              {remaining > 0 && (
                <Text color={theme.textMuted}>... and {remaining} more</Text>
              )}
            </Box>
          </Box>
        )}
      </Window>
    );
  }

  // INPUT stage
  return (
    <Window
      title="IMPORT TRANSACTIONS"
      footer="Tab:complete │ ↑↓:navigate │ Enter:import │ Esc:back"
    >
      <Text color={theme.textMuted}>
        Type @ followed by a file path. Use Tab to autocomplete.
      </Text>
      <Box marginTop={1}>
        <Text color={theme.primary}>{'> '}</Text>
        <TextInput value={inputValue} onChange={setInputValue} />
      </Box>

      {completions.length > 0 && (
        <Box
          flexDirection="column"
          marginTop={1}
          borderStyle="single"
          borderColor={theme.textMuted}
          paddingX={1}
        >
          {completions.map((entry, i) => (
            <Box key={entry.name} gap={1}>
              <Text color={i === selectedIdx ? theme.primary : theme.textMuted}>
                {i === selectedIdx ? '▸' : ' '}
              </Text>
              <Text color={entry.isDir ? theme.warning : theme.text}>
                {entry.isDir ? '📁 ' : '📄 '}
                {entry.name}{entry.isDir ? '/' : ''}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Window>
  );
}
