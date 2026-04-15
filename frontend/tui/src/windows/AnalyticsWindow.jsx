import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import Window from "../components/Window.jsx";
import { getTransactions, getLabelTree } from "../utils/api.js";
import { formatCurrency } from "../utils/formatting.js";
import { colors, amountColor } from "../utils/theme.js";

const BAR_WIDTH = 30;

function buildBar(value, max) {
  if (max === 0) return "";
  const filled = Math.round((Math.abs(value) / max) * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

export default function AnalyticsWindow({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [txs, labelTree] = await Promise.all([
          getTransactions(),
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
  }, []);

  useInput((ch, key) => {
    if (key.escape) onClose();
  });

  // Compute metrics
  const income = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((s, tx) => s + tx.amount, 0);
  const expense = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const net = income - expense;

  // Spending by label
  const byLabel = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = tx.label_id || "Unlabeled";
    byLabel[key] = (byLabel[key] || 0) + Math.abs(tx.amount);
  }
  const sortedLabels = Object.entries(byLabel).sort((a, b) => b[1] - a[1]);
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

  const footer = "Esc: back";

  return (
    <Window title="ANALYTICS" footer={footer}>
      {loading && <Text color={colors.warning}>Loading analytics...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {!loading && (
        <Box flexDirection="column">
          {/* Key Metrics */}
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
              <Box flexDirection="column" width={25}>
                <Text color={colors.textMuted}>Total Income</Text>
                <Text bold color={colors.success}>
                  {formatCurrency(income)}
                </Text>
              </Box>
              <Box flexDirection="column" width={25}>
                <Text color={colors.textMuted}>Total Expense</Text>
                <Text bold color={colors.danger}>
                  {formatCurrency(-expense)}
                </Text>
              </Box>
              <Box flexDirection="column" width={25}>
                <Text color={colors.textMuted}>Net</Text>
                <Text bold color={amountColor(net)}>
                  {formatCurrency(net)}
                </Text>
              </Box>
            </Box>
            <Box marginTop={1}>
              <Text color={colors.textMuted}>
                Transactions: {transactions.length}
              </Text>
            </Box>
          </Box>

          {/* Spending by Label */}
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={colors.primary}>
              SPENDING BY LABEL
            </Text>
            {sortedLabels.slice(0, 10).map(([label, amount]) => (
              <Box key={label} gap={1}>
                <Text color={colors.text}>
                  {label.padEnd(18)}
                </Text>
                <Text color={colors.danger}>{buildBar(amount, maxAmount)}</Text>
                <Text color={colors.textMuted}>
                  {" "}
                  {formatCurrency(-amount)}
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
      )}
    </Window>
  );
}
