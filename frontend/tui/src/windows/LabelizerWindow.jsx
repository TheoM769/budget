import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Window from '../components/Window.jsx';
import RuleForm from '../components/RuleForm.jsx';
import StatusBar from '../components/StatusBar.jsx';
import { theme, amountColor } from '../utils/theme.js';
import { api } from '../utils/api.js';
import { formatAmount } from '../utils/formatting.js';

export default function LabelizerWindow({ onClose, cols }) {
  const [transactions, setTransactions] = useState([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('NAV'); // NAV | LABEL | RULE
  const [labelQuery, setLabelQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [allLabels, setAllLabels] = useState([]);
  const [tree, setTree] = useState([]);
  const [status, setStatus] = useState(null);

  const fetchData = async () => {
    try {
      const [txs, labels, treeData] = await Promise.all([
        api.listTransactions(),
        api.listLabels(3),
        api.labelTree(),
      ]);
      const unlabeled = txs.filter((tx) => !tx.label_id);
      setTransactions(unlabeled);
      setAllLabels(labels);
      setTree(treeData);
      setIndex(0);
    } catch (e) {
      setStatus({ message: e.message, type: 'error' });
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (mode === 'LABEL' && labelQuery.length > 0) {
      const q = labelQuery.toLowerCase();
      const matches = allLabels
        .filter((lb) => lb.name.toLowerCase().includes(q))
        .slice(0, 5);
      setSuggestions(matches);
      setSelectedIdx(0);
    } else {
      setSuggestions([]);
    }
  }, [labelQuery, mode, allLabels]);

  const tx = transactions[index];
  const innerWidth = (cols || 80) - 6;
  const catWidth = Math.min(34, Math.floor(innerWidth * 0.36));
  const leftWidth = innerWidth - catWidth - 3;

  useInput((input, key) => {
    if (mode === 'RULE') return;

    if (mode === 'LABEL') {
      if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIdx((i) => Math.min(suggestions.length - 1, i + 1));
      if (key.tab && suggestions.length > 0) {
        const sel = suggestions[Math.min(selectedIdx, suggestions.length - 1)];
        setLabelQuery(sel.name);
      }
      if (key.return && suggestions.length > 0) {
        const sel = suggestions[Math.min(selectedIdx, suggestions.length - 1)];
        api.modifyTransactions(tx.id, { label: sel.id })
          .then(() => {
            setStatus({ message: `Labeled as "${sel.name}"`, type: 'success' });
            setTransactions((prev) => prev.filter((_, i) => i !== index));
            if (index >= transactions.length - 1) setIndex(Math.max(0, index - 1));
          })
          .catch((e) => setStatus({ message: e.message, type: 'error' }));
        setMode('NAV');
        setLabelQuery('');
      }
      if (key.escape) {
        setMode('NAV');
        setLabelQuery('');
      }
      return;
    }

    // NAV mode
    if (key.escape) { onClose(); return; }
    if ((key.leftArrow || key.upArrow) && index > 0) setIndex((i) => i - 1);
    if ((key.rightArrow || key.downArrow) && index < transactions.length - 1) setIndex((i) => i + 1);
    if (key.return && tx) {
      setLabelQuery('');
      setMode('LABEL');
    }
    if (input === 's' && index < transactions.length - 1) setIndex((i) => i + 1);
    if (input === 'c' && tx) setMode('RULE');
    if (input === 'r') fetchData();
  });

  const handleRuleSubmit = (pattern, labelId) => {
    api.createRule(pattern, labelId)
      .then((res) => {
        setStatus({ message: `Rule created, applied to ${res.applied} transaction(s)`, type: 'success' });
        fetchData();
      })
      .catch((e) => setStatus({ message: e.message, type: 'error' }));
    setMode('NAV');
  };

  const footer = '↑↓:suggestions │ tab:complete │ enter:confirm │ esc:cancel';

  return (
    <Window title={`LABELIZER — ${transactions.length} unlabeled`} footer={footer}>
      {!tx ? (
        <Text color={theme.success}>All transactions labeled!</Text>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {/* Transaction card */}
          <Box
            borderStyle="double"
            borderColor={theme.text}
            paddingX={1}
            marginBottom={1}
          >
            <Text color={theme.textMuted}>{tx.date}</Text>
            <Text>{'   '}</Text>
            <Text>{tx.description}</Text>
            <Box flexGrow={1} />
            <Text color={amountColor(tx.amount)}>{formatAmount(tx.amount)}</Text>
          </Box>

          <Text color={theme.textMuted}>
            {index + 1} / {transactions.length}
          </Text>

          {/* Two-column layout */}
          <Box marginTop={1} flexGrow={1}>
            {/* Left: label input */}
            <Box flexDirection="column" width={leftWidth}>
              {mode === 'LABEL' && (
                <Box flexDirection="column">
                  <Box>
                    <Text color={theme.primary}>Label: </Text>
                    <TextInput value={labelQuery} onChange={setLabelQuery} />
                  </Box>
                  {suggestions.map((lb, i) => (
                    <Box key={lb.id} gap={1} marginLeft={2}>
                      <Text color={i === selectedIdx ? theme.primary : theme.text}>
                        {i === selectedIdx ? '▸' : ' '} {lb.name}
                      </Text>
                      <Text color={theme.textMuted}>{lb.parent_id || ''}</Text>
                    </Box>
                  ))}
                </Box>
              )}
              {mode === 'NAV' && (
                <Text color={theme.textMuted}>Press Enter to label, s to skip</Text>
              )}
            </Box>

            {/* Separator */}
            <Box marginX={1}>
              <Text color={theme.textMuted}>│</Text>
            </Box>

            {/* Right: categories tree */}
            <Box flexDirection="column" width={catWidth}>
              <Text bold color={theme.textMuted}>─ Categories ─</Text>
              {tree.map((group) => (
                <Box key={group.id} flexDirection="column">
                  {group.categories.map((cat) => (
                    <Box key={cat.id} flexDirection="column">
                      <Text color={cat.color || theme.text}>● {cat.name}</Text>
                      {cat.labels.map((lb) => (
                        <Text key={lb.id} color={theme.textMuted}>
                          {'  '}├ {lb.name}
                        </Text>
                      ))}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {mode === 'RULE' && tx && (
        <RuleForm
          transaction={tx}
          onSubmit={handleRuleSubmit}
          onCancel={() => setMode('NAV')}
        />
      )}

      <StatusBar message={status?.message} type={status?.type} />
    </Window>
  );
}
