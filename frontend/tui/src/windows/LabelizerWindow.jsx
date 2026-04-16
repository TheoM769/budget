import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import Window from "../components/Window.jsx";
import RuleForm from "../components/RuleForm.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { getTransactions, modifyTransactions, getLabelTree, createRule } from "../utils/api.js";
import { formatCurrency, truncate } from "../utils/formatting.js";
import { colors, amountColor } from "../utils/theme.js";

const MODE = { NAV: "nav", LABEL: "label", RULE: "rule" };

// ─── Transaction card ─────────────────────────────────────────────────────────

function TxCard({ tx, index, total, width }) {
  const amt = formatCurrency(tx.amount);

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="double"
        borderColor={colors.primary}
        paddingX={2}
        paddingY={1}
        width={width}
        flexDirection="column"
      >
        <Text wrap="truncate">
          {/* Date: gray + italic */}
          <Text color={colors.textMuted} italic>
            {tx.date}
          </Text>

          {"  "}

          {/* Description */}
          <Text color={colors.text}>
            {tx.description}
          </Text>

          {" "}

          {/* Amount directly after description */}
          <Text color={amountColor(tx.amount)}>
            {amt}
          </Text>
        </Text>
      </Box>

      <Box justifyContent="center" width={width}>
        <Text color={colors.textMuted}>
          {index + 1} / {total}
        </Text>
      </Box>
    </Box>
  );
}

// ─── Label autocomplete ───────────────────────────────────────────────────────

function LabelInput({ flat, onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const suggestions = value.trim()
    ? flat.filter((lb) => lb.name.toLowerCase().includes(value.toLowerCase()))
    : flat.slice(0, 6);

  useInput((_ch, key) => {
    if (key.escape) { onCancel(); return; }
    if (key.upArrow) { setSelIdx((i) => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setSelIdx((i) => Math.min(suggestions.length - 1, i + 1)); return; }
    if (key.tab && suggestions[selIdx]) {
      setValue(suggestions[selIdx].name);
      setResetKey((k) => k + 1);
    }
  });

  const handleSubmit = () => {
    const chosen = suggestions[selIdx]?.name ?? value.trim();
    if (chosen) onSubmit(chosen);
  };

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={colors.primary}>│</Text>
        <Text color={colors.textMuted}>Label:</Text>
        <TextInput
          key={resetKey}
          value={value}
          onChange={(v) => { setValue(v); setSelIdx(0); }}
          onSubmit={handleSubmit}
          placeholder="search labels..."
        />
      </Box>
      {suggestions.slice(0, 5).map((lb, i) => (
        <Box key={lb.id ?? lb.name} paddingLeft={2} gap={2}>
          <Text color={i === selIdx ? colors.primary : colors.textMuted} bold={i === selIdx}>
            {i === selIdx ? "▸" : " "} {lb.name}
          </Text>
          <Text color="#3a3a3a">{lb.category}</Text>
        </Box>
      ))}
    </Box>
  );
}

// ─── Categories panel ─────────────────────────────────────────────────────────

function CategoriesPanel({ tree, height, width }) {
  const lines = [];
  for (const t1 of tree) {
    for (const t2 of t1.categories || []) {
      lines.push({ kind: "cat", name: t2.name, color: t2.color || colors.primary });
      const tier3 = t2.labels || [];
      for (let i = 0; i < tier3.length; i++) {
        lines.push({ kind: "lbl", name: tier3[i].name, last: i === tier3.length - 1 });
      }
    }
  }
  const visible = lines.slice(0, height);

  return (
    <Box flexDirection="column" width={width}>
      <Box>
        <Text color={colors.textMuted}>{"─ Categories "}</Text>
        <Text color={colors.textMuted}>{"─".repeat(Math.max(0, width - 14))}</Text>
      </Box>
      {visible.map((line, i) =>
        line.kind === "cat" ? (
          <Box key={i} gap={1}>
            <Text color={line.color}>●</Text>
            <Text color={colors.text}>{truncate(line.name, width - 4)}</Text>
          </Box>
        ) : (
          <Box key={i}>
            <Text color={colors.textMuted}>{"  "}{line.last ? "└" : "├"}{" "}</Text>
            <Text color={colors.textMuted}>{truncate(line.name, width - 6)}</Text>
          </Box>
        )
      )}
      {lines.length > height && (
        <Text color="#3a3a3a">  … {lines.length - height} more</Text>
      )}
    </Box>
  );
}

// ─── Main window ──────────────────────────────────────────────────────────────

export default function LabelizerWindow({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState(MODE.NAV);

  const { stdout } = useStdout();
  const rows = stdout?.rows || 24;
  const cols = stdout?.columns || 80;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, t] = await Promise.all([getTransactions(), getLabelTree()]);
      setTransactions(txs.filter((tx) => !tx.label_id));
      setTree(t);
      const f = [];
      for (const t1 of t)
        for (const t2 of t1.categories || [])
          for (const t3 of t2.labels || [])
            f.push({ ...t3, category: t2.name, group: t1.name });
      setFlat(f);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const current = transactions[cursor];

  useInput((ch, key) => {
    if (mode !== MODE.NAV) return;
    if (key.escape) { onClose(); return; }
    if (key.leftArrow || key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.rightArrow || key.downArrow) setCursor((c) => Math.min(transactions.length - 1, c + 1));
    if (key.return && current) setMode(MODE.LABEL);
    if (ch === "s") setCursor((c) => Math.min(transactions.length - 1, c + 1));
    if (ch === "c") setMode(MODE.RULE);
    if (ch === "r") fetchData();
  });

  const handleLabelSubmit = async (labelName) => {
    if (!current) { setMode(MODE.NAV); return; }
    try {
      await modifyTransactions([current.id], { label: labelName });
      setStatus({ message: `Labeled "${truncate(current.description, 24)}" → ${labelName}`, type: "success" });
      setTransactions((prev) => prev.filter((t) => t.id !== current.id));
      setCursor((c) => Math.min(c, transactions.length - 2));
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODE.NAV);
  };

  const handleRuleSubmit = async (pattern, labelId) => {
    try {
      const result = await createRule(pattern, labelId);
      const applied = result.applied ?? 0;
      setStatus({
        message: `Rule created — ${applied} transaction${applied !== 1 ? "s" : ""} labeled`,
        type: "success",
      });
      await fetchData();
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODE.NAV);
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  const bodyRows = rows - 7;
  const CARD_ROWS = 7;
  const panelRows = Math.max(3, bodyRows - CARD_ROWS - 2);
  const innerWidth = cols - 6;
  const rightWidth = Math.min(34, Math.floor(innerWidth * 0.36));
  const leftWidth = innerWidth - rightWidth - 3;
  const cardWidth = innerWidth;

  const defaultPattern = current
    ? (current.description.toUpperCase().split(/\s+/).find((w) => w.length >= 3) ?? "")
    : "";

  const footerMap = {
    [MODE.NAV]: "enter:label  c:create rule  s:skip  ←→:navigate  r:refresh  esc:back",
    [MODE.LABEL]: "↑↓:navigate  tab:complete  enter:confirm  esc:cancel",
    [MODE.RULE]: "enter:next/confirm  tab:complete  esc:cancel",
  };

  return (
    <Window title={`LABELIZER — ${transactions.length} unlabeled`} footer={footerMap[mode]}>
      {loading && <Text color={colors.warning}>Loading...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {!loading && transactions.length === 0 && (
        <Text color={colors.success}>All transactions are labeled!</Text>
      )}

      {!loading && transactions.length > 0 && current && (
        <Box flexDirection="column" gap={1}>
          <TxCard tx={current} index={cursor} total={transactions.length} width={cardWidth} />

          <Box flexDirection="row">
            {/* Left: action area */}
            <Box flexDirection="column" width={leftWidth} paddingLeft={1}>
              {mode === MODE.NAV && (
                <Text color="#3a3a3a">enter to label  ·  c to create a rule</Text>
              )}
              {mode === MODE.LABEL && (
                <LabelInput
                  flat={flat}
                  onSubmit={handleLabelSubmit}
                  onCancel={() => setMode(MODE.NAV)}
                />
              )}
              {mode === MODE.RULE && (
                <RuleForm
                  flat={flat}
                  defaultPattern={defaultPattern}
                  onSubmit={handleRuleSubmit}
                  onCancel={() => setMode(MODE.NAV)}
                />
              )}
            </Box>

            {/* Divider */}
            <Box flexDirection="column" width={3}>
              {Array.from({ length: panelRows }).map((_, i) => (
                <Text key={i} color={colors.textMuted}>{" │"}</Text>
              ))}
            </Box>

            {/* Right: categories */}
            <CategoriesPanel tree={tree} height={panelRows} width={rightWidth} />
          </Box>
        </Box>
      )}

      {status && <StatusBar message={status.message} type={status.type} />}
    </Window>
  );
}
