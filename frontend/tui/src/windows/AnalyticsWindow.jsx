import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import Window from '../components/Window.jsx';
import DateRangePicker from '../components/DateRangePicker.jsx';
import { theme, amountColor } from '../utils/theme.js';
import { api } from '../utils/api.js';
import { formatAmount } from '../utils/formatting.js';

// 10-color palette for Sankey bands
const PALETTE = [
  '#5865F2', '#3BA55C', '#ED4245', '#FAA61A', '#EB459E',
  '#57F287', '#FEE75C', '#5DADE2', '#F39C12', '#9B59B6',
];

function buildSankey(transactions, tree, width) {
  const incomeGroups = tree.filter((g) =>
    g.name.toLowerCase().includes('earning') || g.name.toLowerCase().includes('income')
  );
  const expenseGroups = tree.filter((g) => !incomeGroups.includes(g));

  // Map label_id → category name
  const labelToCat = {};
  const labelToName = {};
  for (const g of tree) {
    for (const cat of g.categories) {
      for (const lb of cat.labels) {
        labelToCat[lb.id] = cat.name;
        labelToName[lb.id] = lb.name;
      }
    }
  }

  // Aggregate income by source label
  const incomeSources = {};
  const expenseCategories = {};

  for (const tx of transactions) {
    if (!tx.label_id) continue;
    const catName = labelToCat[tx.label_id] || 'Other';
    const lbName = labelToName[tx.label_id] || tx.label_id;

    const isIncome = incomeGroups.some((g) =>
      g.categories.some((c) => c.labels.some((lb) => lb.id === tx.label_id))
    );

    if (isIncome || tx.amount >= 0) {
      incomeSources[lbName] = (incomeSources[lbName] || 0) + Math.abs(tx.amount);
    } else {
      expenseCategories[catName] = (expenseCategories[catName] || 0) + Math.abs(tx.amount);
    }
  }

  const totalIncome = Object.values(incomeSources).reduce((a, b) => a + b, 0);
  const totalExpense = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
  const savings = totalIncome - totalExpense;

  return { incomeSources, expenseCategories, totalIncome, totalExpense, savings };
}

export default function AnalyticsWindow({ onClose, cols }) {
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState([]);
  const [datePickerFocused, setDatePickerFocused] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchData = async () => {
    try {
      const params = {};
      if (startDate) params.date_from = startDate.toISOString().slice(0, 10);
      if (endDate) params.date_to = endDate.toISOString().slice(0, 10);
      const [txs, treeData] = await Promise.all([
        api.listTransactions(params),
        api.labelTree(),
      ]);
      setTransactions(txs);
      setTree(treeData);
    } catch (_) {}
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  // Compute summary
  const income = transactions.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const net = income + expense;

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const months = {};
    for (const tx of transactions) {
      const m = tx.date.slice(0, 7);
      if (!months[m]) months[m] = { income: 0, expense: 0 };
      if (tx.amount >= 0) months[m].income += tx.amount;
      else months[m].expense += tx.amount;
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data, net: data.income + data.expense }));
  }, [transactions]);

  // Sankey data
  const sankey = useMemo(() => buildSankey(transactions, tree, cols || 80), [transactions, tree, cols]);

  // Date bounds
  const minDate = transactions.length > 0 ? new Date(transactions[transactions.length - 1]?.date) : null;
  const maxDate = transactions.length > 0 ? new Date(transactions[0]?.date) : null;

  useInput((input, key) => {
    if (datePickerFocused) return;
    if (key.escape) { onClose(); return; }
    if (input === 'd') setDatePickerFocused(true);
    if (input === 'r') {
      setStartDate(null);
      setEndDate(null);
    }
  });

  const handleDateSelect = (s, e) => {
    setStartDate(s);
    setEndDate(e);
  };

  const innerWidth = (cols || 80) - 6;
  const footer = 'd:focus date picker │ r:clear filter';

  return (
    <Window title="ANALYTICS" footer={footer}>
      <Box flexGrow={1}>
        {/* Left: summary + trend */}
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color={theme.text}>SUMMARY</Text>
          <Box gap={2}>
            <Text color={theme.success}>Income {formatAmount(income)}</Text>
            <Text color={theme.danger}>Expense {formatAmount(expense)}</Text>
            <Text color={amountColor(net)}>Net {formatAmount(net)}</Text>
          </Box>
          <Text color={theme.textMuted}>{transactions.length} transactions</Text>

          <Box marginTop={1} flexDirection="column">
            <Text bold color={theme.text}>MONTHLY TREND</Text>
            {monthlyTrend.map((m) => (
              <Box key={m.month} gap={1}>
                <Text color={theme.textMuted}>{m.month}</Text>
                <Text color={theme.success}>↑ {formatAmount(m.income)}</Text>
                <Text color={theme.danger}>↓ {formatAmount(m.expense)}</Text>
                <Text color={amountColor(m.net)}>={'  '}{formatAmount(m.net)}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: date picker */}
        <DateRangePicker
          focused={datePickerFocused}
          startDate={startDate}
          endDate={endDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelect={handleDateSelect}
          onClose={() => setDatePickerFocused(false)}
        />
      </Box>

      {/* Sankey diagram */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold color={theme.text} underline>
          {'SANKEY FLOW'}
        </Text>
        <Box>
          {/* Income side */}
          <Box flexDirection="column" width={Math.floor(innerWidth / 2)}>
            <Text bold color={theme.textMuted}>INCOME SOURCES</Text>
            {Object.entries(sankey.incomeSources).map(([name, amount], i) => {
              const barLen = sankey.totalIncome > 0
                ? Math.max(1, Math.round((amount / sankey.totalIncome) * 20))
                : 0;
              return (
                <Box key={name} gap={1}>
                  <Text color={PALETTE[i % PALETTE.length]}>
                    {name}
                  </Text>
                  <Text color={PALETTE[i % PALETTE.length]}>
                    {'█'.repeat(barLen)}{'───'}
                  </Text>
                  <Text color={theme.textMuted}>{formatAmount(amount)}</Text>
                </Box>
              );
            })}
          </Box>

          {/* Expense side */}
          <Box flexDirection="column" width={Math.floor(innerWidth / 2)}>
            <Text bold color={theme.textMuted}>EXPENSES / SAVINGS</Text>
            {Object.entries(sankey.expenseCategories).map(([name, amount], i) => {
              const barLen = sankey.totalExpense > 0
                ? Math.max(1, Math.round((amount / sankey.totalExpense) * 20))
                : 0;
              return (
                <Box key={name} gap={1}>
                  <Text color={PALETTE[i % PALETTE.length]}>
                    {'█'.repeat(barLen)}{'░░'}
                  </Text>
                  <Text color={theme.text}>{name}</Text>
                  <Text color={theme.danger}>{formatAmount(-amount)}</Text>
                </Box>
              );
            })}
            {sankey.savings > 0 && (
              <Box gap={1}>
                <Text color={theme.success}>{'█░░'}</Text>
                <Text color={theme.text}>Savings</Text>
                <Text color={theme.success}>{formatAmount(sankey.savings)}</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Window>
  );
}
