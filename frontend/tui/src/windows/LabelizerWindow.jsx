import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Window from "../components/Window.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { getTransactions, modifyTransactions, getLabelTree } from "../utils/api.js";
import { formatCurrency, truncate } from "../utils/formatting.js";
import { colors, amountColor } from "../utils/theme.js";

export default function LabelizerWindow({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [labels, setLabels] = useState([]); // flat list of tier-3
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [labelInput, setLabelInput] = useState("");
  const [labeling, setLabeling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txs, tree] = await Promise.all([getTransactions(), getLabelTree()]);
      const unlabeled = txs.filter((tx) => !tx.label_id);
      setTransactions(unlabeled);

      // Flatten tier-3 labels for quick reference
      const flat = [];
      for (const t1 of tree) {
        for (const t2 of t1.categories || []) {
          for (const t3 of t2.labels || []) {
            flat.push({ ...t3, category: t2.name, group: t1.name });
          }
        }
      }
      setLabels(flat);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const current = transactions[cursor];

  useInput((ch, key) => {
    if (labeling) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(transactions.length - 1, c + 1));

    if (key.return && current) {
      setLabeling(true);
      setLabelInput("");
    }

    if (ch === "s") {
      // Skip current
      setCursor((c) => Math.min(transactions.length - 1, c + 1));
    }

    if (ch === "r") fetchData();
  });

  const handleLabelSubmit = async () => {
    if (!current || !labelInput.trim()) {
      setLabeling(false);
      return;
    }
    try {
      await modifyTransactions(current.id, { label: labelInput.trim() });
      setStatus({ message: `Labeled "${truncate(current.description, 20)}" → ${labelInput}`, type: "success" });
      // Remove from list and stay at same cursor
      setTransactions((prev) => prev.filter((tx) => tx.id !== current.id));
      setCursor((c) => Math.min(c, transactions.length - 2));
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setLabeling(false);
  };

  const footer = "↑↓:nav │ Enter:label │ s:skip │ r:refresh │ Esc:back";

  return (
    <Window title={`LABELIZER — ${transactions.length} unlabeled`} footer={footer}>
      {loading && <Text color={colors.warning}>Loading unlabeled transactions...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {!loading && transactions.length === 0 && (
        <Text color={colors.success}>All transactions are labeled!</Text>
      )}

      {!loading && transactions.length > 0 && (
        <Box flexDirection="column">
          {/* Current transaction highlight */}
          {current && (
            <Box
              flexDirection="column"
              borderStyle="round"
              borderColor={colors.primary}
              paddingX={2}
              paddingY={1}
              marginBottom={1}
            >
              <Text bold color={colors.primary}>
                Current Transaction
              </Text>
              <Box gap={2} marginTop={1}>
                <Text color={colors.textMuted}>Date:</Text>
                <Text color={colors.text}>{current.date}</Text>
              </Box>
              <Box gap={2}>
                <Text color={colors.textMuted}>Desc:</Text>
                <Text color={colors.text}>{current.description}</Text>
              </Box>
              <Box gap={2}>
                <Text color={colors.textMuted}>Amount:</Text>
                <Text color={amountColor(current.amount)}>
                  {formatCurrency(current.amount)}
                </Text>
              </Box>
            </Box>
          )}

          {labeling && (
            <Box marginBottom={1}>
              <Text color={colors.primary}>Label: </Text>
              <TextInput
                value={labelInput}
                onChange={setLabelInput}
                onSubmit={handleLabelSubmit}
                placeholder="Enter label name or ID..."
              />
            </Box>
          )}

          {/* Available labels */}
          {labeling && labels.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text color={colors.textMuted} bold>Available labels:</Text>
              {labels.slice(0, 10).map((lb) => (
                <Text key={lb.id} color={colors.textMuted}>
                  {"  "}{lb.name} ({lb.category})
                </Text>
              ))}
              {labels.length > 10 && (
                <Text color={colors.textMuted}>  ...and {labels.length - 10} more</Text>
              )}
            </Box>
          )}

          {/* Queue preview */}
          <Box flexDirection="column">
            <Text color={colors.textMuted} bold>Queue ({transactions.length} remaining):</Text>
            {transactions.slice(cursor, cursor + 5).map((tx, i) => (
              <Box key={tx.id} gap={1}>
                <Text color={i === 0 ? colors.primary : colors.textMuted}>
                  {i === 0 ? "▸" : " "}
                  {tx.date}
                  {"  "}
                  {truncate(tx.description, 30).padEnd(32)}
                </Text>
                <Text color={amountColor(tx.amount)}>
                  {formatCurrency(tx.amount)}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {status && <StatusBar message={status.message} type={status.type} />}
    </Window>
  );
}
