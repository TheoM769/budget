import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Window from '../components/Window.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import RuleForm from '../components/RuleForm.jsx';
import StatusBar from '../components/StatusBar.jsx';
import { theme, amountColor } from '../utils/theme.js';
import { api } from '../utils/api.js';
import { formatAmount, truncate } from '../utils/formatting.js';

const PAGE_SIZE = 15;

export default function TransactionWindow({ onClose, cols }) {
  const [transactions, setTransactions] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState('LIST'); // LIST | EDIT | LABEL | RULE | FILTER | DELETE
  const [editValue, setEditValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterActive ? { description: filterActive } : {};
      const data = await api.listTransactions(params);
      setTransactions(data);
    } catch (e) {
      setStatus({ message: e.message, type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterActive]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const pageItems = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const currentTx = pageItems[cursor];

  // Column widths
  const innerWidth = (cols || 80) - 6; // border + padding
  const fixedWidth = 2 + 12 + 14; // marker + date + amount
  const remaining = Math.max(30, innerWidth - fixedWidth);
  const descWidth = Math.max(15, Math.floor(remaining * 0.6));
  const labelWidth = Math.max(10, remaining - descWidth);

  useInput((input, key) => {
    if (mode === 'DELETE' || mode === 'RULE') return;

    if (mode === 'EDIT') {
      if (key.return) {
        if (currentTx && editValue.trim()) {
          api.modifyTransactions(currentTx.id, { description: editValue.trim() })
            .then(() => { setStatus({ message: 'Updated', type: 'success' }); fetchData(); })
            .catch((e) => setStatus({ message: e.message, type: 'error' }));
        }
        setMode('LIST');
      }
      if (key.escape) setMode('LIST');
      return;
    }

    if (mode === 'LABEL') {
      if (key.return) {
        const ids = selected.size > 0 ? [...selected] : currentTx ? [currentTx.id] : [];
        if (ids.length && editValue.trim()) {
          api.modifyTransactions(ids, { label: editValue.trim() })
            .then(() => {
              setStatus({ message: `Labeled ${ids.length} transaction(s)`, type: 'success' });
              setSelected(new Set());
              fetchData();
            })
            .catch((e) => setStatus({ message: e.message, type: 'error' }));
        }
        setMode('LIST');
      }
      if (key.escape) setMode('LIST');
      return;
    }

    if (mode === 'FILTER') {
      if (key.return) {
        setFilterActive(filterValue);
        setPage(0);
        setCursor(0);
        setMode('LIST');
      }
      if (key.escape) {
        setFilterValue('');
        setFilterActive('');
        setMode('LIST');
      }
      return;
    }

    // LIST mode
    if (key.escape) { onClose(); return; }
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(pageItems.length - 1, c + 1));

    if (input === 'n') {
      if (page < totalPages - 1) { setPage((p) => p + 1); setCursor(0); }
    }
    if (input === 'p') {
      if (page > 0) { setPage((p) => p - 1); setCursor(0); }
    }
    if (input === ' ' && currentTx) {
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(currentTx.id)) next.delete(currentTx.id);
        else next.add(currentTx.id);
        return next;
      });
    }
    if (input === 'e' && currentTx) {
      setEditValue(currentTx.description);
      setMode('EDIT');
    }
    if (input === 'l') {
      setEditValue('');
      setMode('LABEL');
    }
    if (input === 'd') {
      if (currentTx || selected.size > 0) setMode('DELETE');
    }
    if (input === 'c' && currentTx) setMode('RULE');
    if (input === 'f') {
      setFilterValue(filterActive);
      setMode('FILTER');
    }
    if (input === 'r') fetchData();
  });

  const handleDelete = () => {
    const ids = selected.size > 0 ? [...selected] : currentTx ? [currentTx.id] : [];
    api.removeTransactions(ids)
      .then(() => {
        setStatus({ message: `Deleted ${ids.length} transaction(s)`, type: 'success' });
        setSelected(new Set());
        fetchData();
      })
      .catch((e) => setStatus({ message: e.message, type: 'error' }));
    setMode('LIST');
  };

  const handleRuleSubmit = (pattern, labelId) => {
    api.createRule(pattern, labelId)
      .then((res) => {
        setStatus({ message: `Rule created, applied to ${res.applied} transaction(s)`, type: 'success' });
        fetchData();
      })
      .catch((e) => setStatus({ message: e.message, type: 'error' }));
    setMode('LIST');
  };

  const footer = '↑↓:nav │ Space:select │ d:delete │ e:edit │ l:label │ f:filter';

  return (
    <Window title={`TRANSACTIONS (${transactions.length})`} footer={footer}>
      {/* Filter bar */}
      {mode === 'FILTER' && (
        <Box marginBottom={1}>
          <Text color={theme.primary}>Filter: </Text>
          <TextInput value={filterValue} onChange={setFilterValue} />
        </Box>
      )}

      {/* Column headers */}
      <Box>
        <Box width={2}><Text> </Text></Box>
        <Box width={12}><Text bold color={theme.textMuted}>Date</Text></Box>
        <Box width={descWidth}><Text bold color={theme.textMuted}>Description</Text></Box>
        <Box width={14}><Text bold color={theme.textMuted}>Amount</Text></Box>
        <Box width={labelWidth}><Text bold color={theme.textMuted}>Label</Text></Box>
      </Box>

      {loading ? (
        <Text color={theme.warning}>Loading...</Text>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {pageItems.map((tx, i) => {
            const isCursor = i === cursor;
            const isSel = selected.has(tx.id);
            return (
              <Box key={tx.id}>
                <Box width={2}>
                  <Text color={theme.primary}>
                    {isCursor ? '▸' : ' '}{isSel ? '●' : ' '}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text color={isCursor ? theme.primary : theme.textMuted}>{tx.date}</Text>
                </Box>
                <Box width={descWidth}>
                  {mode === 'EDIT' && isCursor ? (
                    <TextInput value={editValue} onChange={setEditValue} />
                  ) : (
                    <Text color={isCursor ? theme.primary : theme.text}>
                      {truncate(tx.description, descWidth)}
                    </Text>
                  )}
                </Box>
                <Box width={14}>
                  <Text color={amountColor(tx.amount)}>{formatAmount(tx.amount)}</Text>
                </Box>
                <Box width={labelWidth}>
                  {mode === 'LABEL' && isCursor ? (
                    <TextInput value={editValue} onChange={setEditValue} />
                  ) : (
                    <Text color={theme.textMuted}>
                      {truncate(tx.label_id, labelWidth)}
                    </Text>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* Page info */}
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Page {page + 1}/{totalPages}
              {selected.size > 0 ? ` │ ${selected.size} selected` : ''}
            </Text>
          </Box>
        </Box>
      )}

      {/* Overlays */}
      {mode === 'DELETE' && (
        <ConfirmationModal
          message={`Delete ${selected.size || 1} transaction(s)?`}
          onConfirm={handleDelete}
          onCancel={() => setMode('LIST')}
        />
      )}

      {mode === 'RULE' && currentTx && (
        <RuleForm
          transaction={currentTx}
          onSubmit={handleRuleSubmit}
          onCancel={() => setMode('LIST')}
        />
      )}

      <StatusBar message={status?.message} type={status?.type} />
    </Window>
  );
}
