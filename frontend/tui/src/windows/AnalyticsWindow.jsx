import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import Window from "../components/Window.jsx";
import DateRangePicker from "../components/DateRangePicker.jsx";
import { getTransactions, getLabelTree } from "../utils/api.js";
import { formatCurrency } from "../utils/formatting.js";
import { colors, amountColor } from "../utils/theme.js";

const BAR_WIDTH = 28;

function buildBar(value, max) {
  if (max === 0) return "";
  const filled = Math.round((Math.abs(value) / max) * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

const SANKEY_HEIGHT = 16;
const MAX_LEFT_BAR = 6;
const FLOW_W = 8;
const MAX_RIGHT_BAR = 12;
const LEFT_LABEL_W = 13;
const RIGHT_LABEL_W = 14;

const PALETTE = [
  "#5865F2", "#FAA61A", "#9B59B6", "#1ABC9C",
  "#E67E22", "#E91E63", "#00BCD4", "#FF6B6B",
  "#43AA8B", "#F72585",
];

function allocateRows(items, total) {
  if (!items.length) return [];
  const totalVal = items.reduce((s, i) => s + i.value, 0);
  if (totalVal === 0) return items.map((i) => ({ ...i, height: 1 }));
  const result = items.map((i) => ({
    ...i,
    raw: (i.value / totalVal) * total,
    height: 0,
  }));
  result.forEach((i) => {
    i.height = Math.max(1, Math.floor(i.raw));
  });
  let rem = total - result.reduce((s, i) => s + i.height, 0);
  if (rem < 0) {
    const sorted = [...result].sort((a, b) => a.raw - b.raw);
    for (let i = 0; i < -rem && sorted[i]?.height > 1; i++)
      sorted[i].height -= 1;
  } else {
    const sorted = [...result].sort(
      (a, b) => b.raw - b.height - (a.raw - a.height)
    );
    for (let i = 0; i < rem; i++) sorted[i % sorted.length].height += 1;
  }
  return result;
}

function expandBands(bands, maxBarW, totalVal) {
  return bands.flatMap((band) => {
    const barW = Math.max(1, Math.round((band.value / totalVal) * maxBarW));
    return Array.from({ length: band.height }, (_, i) => ({
      showLabel: i === Math.floor(band.height / 2),
      label: band.label,
      color: band.color,
      barW,
    }));
  });
}

function buildLabelMap(tree) {
  const map = {};
  for (const t1 of tree) {
    map[t1.id] = t1.name;
    for (const t2 of t1.categories ?? []) {
      map[t2.id] = t2.name;
      for (const t3 of t2.labels ?? []) {
        map[t3.id] = t3.name;
      }
    }
  }
  return map;
}

function buildLabelColorMap(tree) {
  const map = {};
  for (const t1 of tree) {
    for (const t2 of t1.categories ?? []) {
      for (const t3 of t2.labels ?? []) {
        if (t2.color) map[t3.id] = t2.color;
      }
    }
  }
  return map;
}

function SankeyDiagram({ transactions, tree }) {
  if (!transactions.length) {
    return (
      <Text color={colors.textMuted}>No transaction data for diagram.</Text>
    );
  }

  const idToName = buildLabelMap(tree);
  const idToColor = buildLabelColorMap(tree);

  // Group income by source label
  const incomeGroups = {};
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const key = tx.label_id ? String(tx.label_id) : "Other";
    incomeGroups[key] = (incomeGroups[key] || 0) + tx.amount;
  }

  // Group expenses by label
  const expenseGroups = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = tx.label_id ? String(tx.label_id) : "Unlabeled";
    expenseGroups[key] = (expenseGroups[key] || 0) + Math.abs(tx.amount);
  }

  const totalIncome = Object.values(incomeGroups).reduce((s, v) => s + v, 0);
  const totalExpense = Object.values(expenseGroups).reduce((s, v) => s + v, 0);
  const savings = totalIncome - totalExpense;
  if (savings > 0) expenseGroups["Savings"] = savings;

  const leftItems = Object.entries(incomeGroups)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], idx) => ({
      key,
      value,
      label: idToName[key] || key,
      color: idToColor[key] || PALETTE[idx % PALETTE.length],
    }));

  const rightItems = Object.entries(expenseGroups)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], idx) => ({
      key,
      value,
      label: idToName[key] || key,
      isSavings: key === "Savings",
      color:
        key === "Savings"
          ? colors.success
          : idToColor[key] || PALETTE[(idx + leftItems.length) % PALETTE.length],
    }));

  if (!leftItems.length && !rightItems.length) {
    return <Text color={colors.textMuted}>No flow data.</Text>;
  }

  const leftTotal = Math.max(totalIncome, 0.01);
  const rightTotal = Math.max(totalIncome, totalExpense, 0.01);

  const leftBands = allocateRows(leftItems, SANKEY_HEIGHT);
  const rightBands = allocateRows(rightItems, SANKEY_HEIGHT);

  const leftRows = expandBands(leftBands, MAX_LEFT_BAR, leftTotal);
  const rightRows = expandBands(rightBands, MAX_RIGHT_BAR, rightTotal);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={colors.primary}>
        SANKEY FLOW
      </Text>
      <Box marginBottom={0}>
        <Text color={colors.textMuted}>
          {"INCOME SOURCES".padEnd(LEFT_LABEL_W + MAX_LEFT_BAR + FLOW_W + 2)}
        </Text>
        <Text color={colors.textMuted}>EXPENSES / SAVINGS</Text>
      </Box>
      {Array.from({ length: SANKEY_HEIGHT }, (_, i) => {
        const left = leftRows[i];
        const right = rightRows[i];
        return (
          <Box key={i}>
            {/* Left label */}
            {left?.showLabel ? (
              <Text color={left.color}>
                {left.label.slice(0, LEFT_LABEL_W).padEnd(LEFT_LABEL_W)}
              </Text>
            ) : (
              <Text>{" ".repeat(LEFT_LABEL_W)}</Text>
            )}
            {/* Income source bar */}
            {left ? (
              <Text color={left.color}>
                {"█".repeat(left.barW)}{"░".repeat(MAX_LEFT_BAR - left.barW)}
              </Text>
            ) : (
              <Text>{" ".repeat(MAX_LEFT_BAR)}</Text>
            )}
            {/* Flow line colored by destination */}
            <Text color={right?.color ?? colors.textMuted}>
              {"─".repeat(FLOW_W)}
            </Text>
            {/* Expense bar */}
            {right ? (
              <Text color={right.color}>
                {"█".repeat(right.barW)}{"░".repeat(MAX_RIGHT_BAR - right.barW)}
              </Text>
            ) : (
              <Text>{" ".repeat(MAX_RIGHT_BAR)}</Text>
            )}
            {/* Right label */}
            {right?.showLabel ? (
              <Text color={right.color}>
                {" "}{right.label.slice(0, RIGHT_LABEL_W)}
              </Text>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export default function AnalyticsWindow({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ from: null, to: null });
  const [pickerFocused, setPickerFocused] = useState(false);
  const [txBounds, setTxBounds] = useState({ min: null, max: null });
  const boundsLoaded = useRef(false);

  // Load analytics data whenever the date filter changes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [txs, labelTree] = await Promise.all([
          getTransactions({ dateFrom: dateFilter.from, dateTo: dateFilter.to }),
          getLabelTree(),
        ]);
        setTransactions(txs);
        setTree(labelTree);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [dateFilter]);

  // One-time fetch to determine the full transaction date range for the calendar
  useEffect(() => {
    if (boundsLoaded.current) return;
    boundsLoaded.current = true;
    getTransactions({}).then((txs) => {
      if (!txs.length) return;
      const dates = txs.map((t) => t.date).sort();
      setTxBounds({ min: dates[0], max: dates[dates.length - 1] });
    }).catch(() => {});
  }, []);

  useInput(
    (ch, key) => {
      if (key.escape) onClose();
      if (ch === "d") setPickerFocused(true);
      if (ch === "r") setDateFilter({ from: null, to: null });
    },
    { isActive: !pickerFocused }
  );

  // Compute metrics
  const income = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((s, tx) => s + tx.amount, 0);
  const expense = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const net = income - expense;

  // Spending by label (resolved to names)
  const idToName = buildLabelMap(tree);
  const byLabel = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = tx.label_id ? String(tx.label_id) : "Unlabeled";
    byLabel[key] = (byLabel[key] || 0) + Math.abs(tx.amount);
  }
  const sortedLabels = Object.entries(byLabel)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => [idToName[id] || id, amount]);
  const maxAmount = sortedLabels.length > 0 ? sortedLabels[0][1] : 0;

  // Monthly trend
  const byMonth = {};
  for (const tx of transactions) {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
    if (tx.amount > 0) byMonth[month].income += tx.amount;
    else byMonth[month].expense += Math.abs(tx.amount);
  }
  const months = Object.keys(byMonth).sort();

  const filterLabel =
    dateFilter.from
      ? `${dateFilter.from}  →  ${dateFilter.to}`
      : null;

  const footer = filterLabel
    ? `d: date picker   r: clear filter  │  ${filterLabel}`
    : "d: date picker";

  return (
    <Window title="ANALYTICS" footer={footer}>
      {loading && <Text color={colors.warning}>Loading analytics...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {!loading && (
        <Box flexDirection="column" flexGrow={1}>
          {/* Top section: main content left, date picker right */}
          <Box flexDirection="row" alignItems="flex-start" gap={2}>
            {/* Left column: summary + spending + trend */}
            <Box flexDirection="column" flexGrow={1}>
              {/* Summary */}
              <Box
                flexDirection="column"
                borderStyle="round"
                borderColor={colors.textMuted}
                paddingX={2}
                paddingY={1}
                marginBottom={1}
              >
                <Text bold color={colors.primary}>
                  SUMMARY
                </Text>
                <Box gap={2} marginTop={1}>
                  <Box flexDirection="column" width={22}>
                    <Text color={colors.textMuted}>Income</Text>
                    <Text bold color={colors.success}>
                      {formatCurrency(income)}
                    </Text>
                  </Box>
                  <Box flexDirection="column" width={22}>
                    <Text color={colors.textMuted}>Expense</Text>
                    <Text bold color={colors.danger}>
                      {formatCurrency(-expense)}
                    </Text>
                  </Box>
                  <Box flexDirection="column" width={22}>
                    <Text color={colors.textMuted}>Net</Text>
                    <Text bold color={amountColor(net)}>
                      {formatCurrency(net)}
                    </Text>
                  </Box>
                </Box>
                <Box marginTop={1}>
                  <Text color={colors.textMuted}>
                    {transactions.length} transactions
                  </Text>
                </Box>
              </Box>

              {/* Spending by Label */}
              <Box flexDirection="column" marginBottom={1}>
                <Text bold color={colors.primary}>
                  SPENDING BY LABEL
                </Text>
                {sortedLabels.slice(0, 8).map(([label, amount]) => (
                  <Box key={label} gap={1}>
                    <Text color={colors.text}>
                      {label.slice(0, 16).padEnd(16)}
                    </Text>
                    <Text color={colors.danger}>{buildBar(amount, maxAmount)}</Text>
                    <Text color={colors.textMuted}>
                      {"  "}{formatCurrency(-amount)}
                    </Text>
                  </Box>
                ))}
                {sortedLabels.length === 0 && (
                  <Text color={colors.textMuted}>No expense data.</Text>
                )}
              </Box>

              {/* Monthly Trend */}
              {months.length > 0 && (
                <Box flexDirection="column">
                  <Text bold color={colors.primary}>
                    MONTHLY TREND
                  </Text>
                  {months.slice(-6).map((month) => {
                    const data = byMonth[month];
                    return (
                      <Box key={month} gap={1}>
                        <Text color={colors.textMuted}>{month}</Text>
                        <Text color={colors.success}>
                          {" ↑"}
                          {formatCurrency(data.income).padStart(10)}
                        </Text>
                        <Text color={colors.danger}>
                          {" ↓"}
                          {formatCurrency(-data.expense).padStart(10)}
                        </Text>
                        <Text color={amountColor(data.income - data.expense)}>
                          {" = "}
                          {formatCurrency(data.income - data.expense)}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Right column: always-visible date picker */}
            <DateRangePicker
              minDate={txBounds.min}
              maxDate={txBounds.max}
              initialFrom={dateFilter.from}
              initialTo={dateFilter.to}
              focused={pickerFocused}
              onConfirm={(from, to) => {
                setDateFilter({ from, to });
                setPickerFocused(false);
              }}
              onClose={() => setPickerFocused(false)}
            />
          </Box>

          {/* Sankey diagram — full width */}
          <SankeyDiagram transactions={transactions} tree={tree} />
        </Box>
      )}
    </Window>
  );
}
