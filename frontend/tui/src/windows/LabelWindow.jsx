import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Window from '../components/Window.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import StatusBar from '../components/StatusBar.jsx';
import { theme } from '../utils/theme.js';
import { api } from '../utils/api.js';

export default function LabelWindow({ onClose }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState('BROWSE'); // BROWSE | CREATE | RENAME | DELETE
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState(null);

  const fetchData = async () => {
    try {
      const data = await api.labelTree();
      setTree(data);
      // Expand all tier-1 by default
      setExpanded(new Set(data.map((g) => g.id)));
    } catch (e) {
      setStatus({ message: e.message, type: 'error' });
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Flatten tree into visible rows
  const rows = useMemo(() => {
    const result = [];
    for (const group of tree) {
      result.push({ type: 'group', id: group.id, name: group.name, tier: 1 });
      if (expanded.has(group.id)) {
        for (const cat of group.categories) {
          result.push({ type: 'category', id: cat.id, name: cat.name, color: cat.color, tier: 2 });
          if (expanded.has(cat.id)) {
            for (const lb of cat.labels) {
              result.push({ type: 'label', id: lb.id, name: lb.name, tier: 3, parentId: cat.id });
            }
          }
        }
      }
    }
    return result;
  }, [tree, expanded]);

  const currentRow = rows[cursor];

  useInput((input, key) => {
    if (mode === 'DELETE') return;

    if (mode === 'CREATE') {
      if (key.return && inputValue.trim()) {
        api.createLabel(inputValue.trim(), currentRow.id)
          .then(() => {
            setStatus({ message: `Created "${inputValue.trim()}"`, type: 'success' });
            fetchData();
          })
          .catch((e) => setStatus({ message: e.message, type: 'error' }));
        setMode('BROWSE');
      }
      if (key.escape) setMode('BROWSE');
      return;
    }

    if (mode === 'RENAME') {
      if (key.return && inputValue.trim()) {
        api.modifyLabel(currentRow.name, inputValue.trim())
          .then(() => {
            setStatus({ message: 'Renamed', type: 'success' });
            fetchData();
          })
          .catch((e) => setStatus({ message: e.message, type: 'error' }));
        setMode('BROWSE');
      }
      if (key.escape) setMode('BROWSE');
      return;
    }

    // BROWSE
    if (key.escape) { onClose(); return; }
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(rows.length - 1, c + 1));

    if (input === ' ' && currentRow && (currentRow.tier === 1 || currentRow.tier === 2)) {
      setExpanded((s) => {
        const next = new Set(s);
        if (next.has(currentRow.id)) next.delete(currentRow.id);
        else next.add(currentRow.id);
        return next;
      });
    }

    if (input === 'n' && currentRow?.tier === 2) {
      setInputValue('');
      setMode('CREATE');
    }

    if (input === 'e' && currentRow?.tier === 3) {
      setInputValue(currentRow.name);
      setMode('RENAME');
    }

    if (input === 'd' && currentRow?.tier === 3) {
      setMode('DELETE');
    }

    if (input === 'r') fetchData();
  });

  const handleDelete = () => {
    if (currentRow) {
      api.removeLabels([currentRow.id])
        .then(() => {
          setStatus({ message: `Deleted "${currentRow.name}"`, type: 'success' });
          fetchData();
        })
        .catch((e) => setStatus({ message: e.message, type: 'error' }));
    }
    setMode('BROWSE');
  };

  const footer = '↑↓:nav │ Space:expand │ n:new │ e:rename │ d:delete │ r:refresh';

  return (
    <Window title="LABEL MANAGER" footer={footer}>
      <Box flexDirection="column" flexGrow={1}>
        {rows.map((row, i) => {
          const isCursor = i === cursor;
          const indent = '  '.repeat(row.tier - 1);
          const isExpanded = expanded.has(row.id);

          let prefix = '';
          if (row.tier === 1 || row.tier === 2) {
            prefix = isExpanded ? '▾ ' : '▸ ';
          } else {
            prefix = '· ';
          }

          return (
            <Box key={row.id}>
              <Text color={isCursor ? theme.primary : theme.text}>
                {isCursor ? '▸' : ' '}
                {indent}{prefix}
              </Text>
              {mode === 'RENAME' && isCursor && row.tier === 3 ? (
                <TextInput value={inputValue} onChange={setInputValue} />
              ) : mode === 'CREATE' && isCursor && row.tier === 2 ? (
                <Box>
                  <Text bold={row.tier === 1} color={isCursor ? theme.primary : theme.text}>
                    {row.name}
                  </Text>
                  <Text color={theme.textMuted}> → new: </Text>
                  <TextInput value={inputValue} onChange={setInputValue} />
                </Box>
              ) : (
                <Box>
                  <Text bold={row.tier === 1} color={isCursor ? theme.primary : theme.text}>
                    {row.name}
                  </Text>
                  {row.color && (
                    <Text color={row.color}>{' ●'}</Text>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {mode === 'DELETE' && currentRow && (
        <ConfirmationModal
          message={`Delete "${currentRow.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setMode('BROWSE')}
        />
      )}

      <StatusBar message={status?.message} type={status?.type} />
    </Window>
  );
}
