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

const MAX_LEFT_BAR = 10;
const FLOW_W = 12;
const MAX_RIGHT_BAR = 16;
const LEFT_LABEL_W = 20;
const LEFT_AMOUNT_W = 8;
const RIGHT_LABEL_W = 20;
const RIGHT_AMOUNT_W = 9;

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
      key: band.key,
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

  // Build label → category map
  const labelToCatId = {};
  const catInfo = {};
  for (const t1 of tree) {
    for (const t2 of t1.categories ?? []) {
      catInfo[String(t2.id)] = { name: t2.name, color: t2.color };
      for (const t3 of t2.labels ?? []) {
        labelToCatId[String(t3.id)] = String(t2.id);
      }
    }
  }

  const getCatKey = (tx) => {
    const lid = tx.label_id ? String(tx.label_id) : null;
    return lid ? (labelToCatId[lid] ?? "Other") : "Other";
  };

  // Group income by tier-2 category
  const incomeGroups = {};
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const key = getCatKey(tx);
    incomeGroups[key] = (incomeGroups[key] || 0) + tx.amount;
  }

  // Group expenses by tier-2 category
  const expenseGroups = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = getCatKey(tx);
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
      label: key === "Other" ? "Other" : (catInfo[key]?.name ?? key),
      color: catInfo[key]?.color || PALETTE[idx % PALETTE.length],
    }));

  const rightItems = Object.entries(expenseGroups)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], idx) => ({
      key,
      value,
      label: key === "Savings" ? "Savings" : key === "Other" ? "Other" : (catInfo[key]?.name ?? key),
      isSavings: key === "Savings",
      color:
        key === "Savings"
          ? colors.success
          : catInfo[key]?.color || PALETTE[(idx + leftItems.length) % PALETTE.length],
    }));

  if (!leftItems.length && !rightItems.length) {
    return <Text color={colors.textMuted}>No flow data.</Text>;
  }

  const sankeyHeight = Math.max(leftItems.length, rightItems.length);
  const leftTotal = Math.max(totalIncome, 0.01);
  const rightTotal = Math.max(totalIncome, totalExpense, 0.01);

  const leftBands = allocateRows(leftItems, sankeyHeight);
  const rightBands = allocateRows(rightItems, sankeyHeight);

  const leftRows = expandBands(leftBands, MAX_LEFT_BAR, leftTotal);
  const rightRows = expandBands(rightBands, MAX_RIGHT_BAR, rightTotal);

  // Get unique amounts for each label
  const leftLabelAmounts = leftItems.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
  const rightLabelAmounts = rightItems.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  const formatAmount = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1000) return `€${(val / 1000).toFixed(1)}k`;
    return `€${val.toFixed(0)}`;
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={colors.primary}>
        SANKEY FLOW
      </Text>
      <Box marginBottom={0}>
        <Text color={colors.textMuted}>
          {"INCOME SOURCES".padEnd(LEFT_AMOUNT_W + LEFT_LABEL_W + MAX_LEFT_BAR + FLOW_W + 2)}
        </Text>
        <Text color={colors.textMuted}>EXPENSES / SAVINGS</Text>
      </Box>
      {Array.from({ length: sankeyHeight }, (_, i) => {
        const left = leftRows[i];
        const right = rightRows[i];
        const showRightAmount = right?.showLabel && rightLabelAmounts[right.key];
        return (
          <Box key={i}>
            {/* Left amount */}
            {left?.showLabel && leftLabelAmounts[left.key] ? (
              <Text color={left.color}>
                {formatAmount(leftLabelAmounts[left.key]).padStart(LEFT_AMOUNT_W)}
              </Text>
            ) : (
              <Text>{" ".repeat(LEFT_AMOUNT_W)}</Text>
            )}
            {/* Left label */}
            {left?.showLabel ? (
              <Text color={left.color}>
                {" "}{left.label.slice(0, LEFT_LABEL_W - 1).padEnd(LEFT_LABEL_W - 1)}
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
                {" "}{right.label.slice(0, RIGHT_LABEL_W - 1).padEnd(RIGHT_LABEL_W - 1)}
              </Text>
            ) : (
              <Text>{" ".repeat(RIGHT_LABEL_W)}</Text>
            )}
            {/* Right amount */}
            {showRightAmount ? (
              <Text color={right.color}>
                {formatAmount(rightLabelAmounts[right.key]).padStart(RIGHT_AMOUNT_W)}
              </Text>
            ) : (
              <Text>{" ".repeat(RIGHT_AMOUNT_W)}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// --- Discretionary Pie Chart ---


function DiscretionaryBarChart({ transactions, tree, monthSpan }) {
  if (!transactions.length) return null;

  // Build tier-3 label info with mandatory flag
  const labelInfo = {};
  for (const t1 of tree) {
    for (const t2 of t1.categories ?? []) {
      for (const t3 of t2.labels ?? []) {
        labelInfo[String(t3.id)] = {
          name: t3.name,
          mandatory: t3.mandatory ?? false,
          color: t2.color,
        };
      }
    }
  }

  // Aggregate total expenses by tier-3 label, non-mandatory only
  const labelTotals = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const lid = tx.label_id ? String(tx.label_id) : null;
    if (!lid) continue;
    const info = labelInfo[lid];
    if (!info || info.mandatory) continue;
    labelTotals[lid] = (labelTotals[lid] || 0) + Math.abs(tx.amount);
  }

  const entries = Object.entries(labelTotals)
    .map(([lid, total]) => ({
      lid,
      mean: total / monthSpan,
      ...labelInfo[lid],
    }))
    .filter((e) => e.mean > 0)
    .sort((a, b) => b.mean - a.mean);

  if (!entries.length) return null;

  entries.forEach((e, i) => {
    if (!e.color) e.color = PALETTE[i % PALETTE.length];
  });

  const maxMean = entries[0].mean;
  const NAME_W = 30;

  const formatAmount = (val) => {
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
    return `€${val.toFixed(0)}`;
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={colors.primary}>DISCRETIONARY SPEND (avg/mo)</Text>
      {entries.map((e) => {
        const filled = Math.max(1, Math.round((e.mean / maxMean) * CAT_BAR_W));
        return (
          <Box key={e.lid}>
            <Text color={e.color}>{e.name.slice(0, NAME_W).padEnd(NAME_W)}</Text>
            <Text color={e.color}>{"█".repeat(filled)}{"░".repeat(CAT_BAR_W - filled)}</Text>
            <Text color={e.color}>{" "}{formatAmount(e.mean).padEnd(8)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

function MandatoryBarChart({ transactions, tree, monthSpan }) {
  if (!transactions.length) return null;

  // Build tier-3 label info with mandatory flag
  const labelInfo = {};
  for (const t1 of tree) {
    for (const t2 of t1.categories ?? []) {
      for (const t3 of t2.labels ?? []) {
        labelInfo[String(t3.id)] = {
          name: t3.name,
          mandatory: t3.mandatory ?? false,
          color: t2.color,
        };
      }
    }
  }

  // Aggregate total expenses by tier-3 label, mandatory only
  const labelTotals = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const lid = tx.label_id ? String(tx.label_id) : null;
    if (!lid) continue;
    const info = labelInfo[lid];
    if (!info || !info.mandatory) continue;
    labelTotals[lid] = (labelTotals[lid] || 0) + Math.abs(tx.amount);
  }

  const entries = Object.entries(labelTotals)
    .map(([lid, total]) => ({
      lid,
      mean: total / monthSpan,
      ...labelInfo[lid],
    }))
    .filter((e) => e.mean > 0)
    .sort((a, b) => b.mean - a.mean);

  if (!entries.length) return null;

  entries.forEach((e, i) => {
    if (!e.color) e.color = PALETTE[i % PALETTE.length];
  });

  const maxMean = entries[0].mean;
  const NAME_W = 30;

  const formatAmount = (val) => {
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
    return `€${val.toFixed(0)}`;
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={colors.primary}>MANDATORY EXPENSES (avg/mo)</Text>
      {entries.map((e) => {
        const filled = Math.max(1, Math.round((e.mean / maxMean) * CAT_BAR_W));
        return (
          <Box key={e.lid}>
            <Text color={e.color}>{e.name.slice(0, NAME_W).padEnd(NAME_W)}</Text>
            <Text color={e.color}>{"█".repeat(filled)}{"░".repeat(CAT_BAR_W - filled)}</Text>
            <Text color={e.color}>{" "}{formatAmount(e.mean).padEnd(8)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

const CAT_BAR_W = 30;

function CategoryBarChart({ transactions, tree, monthSpan }) {
  if (!transactions.length) return null;

  // Build label → category map
  const labelToCat = {};
  const catColors = {};
  for (const t1 of tree) {
    for (const t2 of t1.categories ?? []) {
      const color = t2.color || PALETTE[Object.keys(catColors).length % PALETTE.length];
      catColors[String(t2.id)] = color;
      for (const t3 of t2.labels ?? []) {
        labelToCat[String(t3.id)] = { id: String(t2.id), name: t2.name };
      }
    }
  }

  // Aggregate total expenses by category
  const catTotals = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const labelKey = tx.label_id ? String(tx.label_id) : null;
    const cat = labelKey ? labelToCat[labelKey] : null;
    const key = cat ? cat.id : "__unlabeled__";
    catTotals[key] = (catTotals[key] || 0) + Math.abs(tx.amount);
  }

  const entries = Object.entries(catTotals)
    .map(([key, total]) => ({
      key,
      name: key === "__unlabeled__" ? "Unlabeled" : (tree.flatMap(t1 => t1.categories ?? []).find(c => String(c.id) === key)?.name ?? key),
      mean: total / monthSpan,
      color: catColors[key] || colors.textMuted,
    }))
    .sort((a, b) => b.mean - a.mean);

  if (!entries.length) return null;

  const maxMean = entries[0].mean;
  const NAME_W = 30;

  const formatAmount = (val) => {
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
    return `€${val.toFixed(0)}`;
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={colors.primary}>AVG SPEND BY CATEGORY ({monthSpan}mo)</Text>
      {entries.map((e) => {
        const filled = Math.max(1, Math.round((e.mean / maxMean) * CAT_BAR_W));
        return (
          <Box key={e.key}>
            <Text color={e.color}>{e.name.slice(0, NAME_W).padEnd(NAME_W)}</Text>
            <Text color={e.color}>{"█".repeat(filled)}{"░".repeat(CAT_BAR_W - filled)}</Text>
            <Text color={e.color}>{" "}{formatAmount(e.mean).padEnd(8)}</Text>
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

  // Compute month span for average base (rounded up)
  const monthSpan = (() => {
    if (dateFilter.from && dateFilter.to) {
      const from = new Date(dateFilter.from);
      const to = new Date(dateFilter.to);
      const diff = (to - from) / (1000 * 60 * 60 * 24 * 30.44);
      return Math.ceil(diff) || 1;
    }
    // No filter: use distinct months in data
    return months.length || 1;
  })();

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

          {/* Category + Discretionary + Mandatory bar charts side by side */}
          <Box flexDirection="row" gap={4}>
            <CategoryBarChart transactions={transactions} tree={tree} monthSpan={monthSpan} />
            <DiscretionaryBarChart transactions={transactions} tree={tree} monthSpan={monthSpan} />
            <MandatoryBarChart transactions={transactions} tree={tree} monthSpan={monthSpan} />
          </Box>
        </Box>
      )}
    </Window>
  );
}
