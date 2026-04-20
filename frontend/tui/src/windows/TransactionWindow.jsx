import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import Window from "../components/Window.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import StatusBar from "../components/StatusBar.jsx";
import RuleForm from "../components/RuleForm.jsx";
import LabelTreePanel from "../components/LabelTreePanel.jsx";
import { getTransactions, removeTransactions, modifyTransactions, getLabelTree, createRule } from "../utils/api.js";
import { formatCurrency, truncate } from "../utils/formatting.js";
import { colors, amountColor } from "../utils/theme.js";

const MODES = { LIST: "list", ADD: "add", EDIT: "edit", LABEL: "label", RULE: "rule" };
const PAGE_SIZE = 15;

export default function TransactionWindow({ onClose, labels }) {
  const [transactions, setTransactions] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState(MODES.LIST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editField, setEditField] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [filterDesc, setFilterDesc] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [offset, setOffset] = useState(0);
  const [flat, setFlat] = useState([]);
  const [tree, setTree] = useState([]);
  const [focusPanel, setFocusPanel] = useState("list"); // "list" | "labels"
  const [labelFilter, setLabelFilter] = useState(null); // { name, labelIds, tier, id }

  const fetchData = async (descFilter) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (descFilter) filters.description = descFilter;
      const [data, labelTree] = await Promise.all([getTransactions(filters), getLabelTree()]);
      setTransactions(data);
      setTree(labelTree);
      const f = [];
      for (const t1 of labelTree)
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

  useEffect(() => {
    fetchData();
  }, []);

  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;
  // Available width: terminal - border(2) - paddingX(2) - row gaps/markers(4)
  const contentWidth = Math.max(40, termWidth - 8);
  // Right panel for label tree
  const rightPanelW = Math.min(30, Math.floor(contentWidth * 0.25));
  const dividerW = 3;
  const leftWidth = contentWidth - rightPanelW - dividerW;
  // Fixed columns: marker(2) + date(12) + amount(14) + gap(2) + label min(10)
  const fixedWidth = 2 + 12 + 14 + 2;
  // Description gets the remaining space, with a minimum of 15
  const descWidth = Math.max(15, Math.floor((leftWidth - fixedWidth) * 0.6));
  const labelWidth = Math.max(10, leftWidth - fixedWidth - descWidth);
  // Label tree panel height
  const panelHeight = Math.max(8, termHeight - 8);

  // Build label ID → name map
  const idToName = {};
  for (const t1 of tree)
    for (const t2 of t1.categories || [])
      for (const t3 of t2.labels || [])
        idToName[String(t3.id)] = t3.name;

  // Apply label filter client-side
  const filtered = labelFilter
    ? transactions.filter((tx) => {
        if (!tx.label_id) return false;
        const labelIdSet = new Set(labelFilter.labelIds.map(String));
        return labelIdSet.has(String(tx.label_id));
      })
    : transactions;

  const visible = filtered.slice(offset, offset + PAGE_SIZE);

  useInput((ch, key) => {
    if (confirmDelete || mode !== MODES.LIST) return;
    if (showFilter) {
      if (key.escape) {
        setShowFilter(false);
        setFilterDesc("");
      }
      return;
    }

    // Tab swaps focus between list and labels panel
    if (key.tab) {
      setFocusPanel((p) => (p === "list" ? "labels" : "list"));
      return;
    }

    // When labels panel focused, let it handle input
    if (focusPanel === "labels") return;

    if (key.escape) {
      onClose();
      return;
    }

    // Navigation
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(visible.length - 1, c + 1));

    // Pagination
    if (ch === "n" && offset + PAGE_SIZE < filtered.length) {
      setOffset((o) => o + PAGE_SIZE);
      setCursor(0);
    }
    if (ch === "p" && offset > 0) {
      setOffset((o) => Math.max(0, o - PAGE_SIZE));
      setCursor(0);
    }

    // Selection
    if (ch === " ") {
      const tx = visible[cursor];
      if (tx) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(tx.id)) next.delete(tx.id);
          else next.add(tx.id);
          return next;
        });
      }
    }

    // Actions
    if (ch === "d") {
      const targets = selected.size > 0 ? selected : visible[cursor] ? new Set([visible[cursor].id]) : new Set();
      if (targets.size > 0) {
        setSelected(targets);
        setConfirmDelete(true);
      }
    }

    if (ch === "e" && visible[cursor]) {
      setMode(MODES.EDIT);
      setEditField(visible[cursor].description);
    }

    if (ch === "l" && visible[cursor]) {
      setMode(MODES.LABEL);
      setLabelInput(visible[cursor].label_id || "");
    }

    if (ch === "c") {
      setMode(MODES.RULE);
    }

    if (ch === "f") {
      setShowFilter(true);
    }

    if (ch === "r") {
      fetchData(filterDesc || undefined);
    }
  });

  const handleRuleSubmit = async (pattern, labelId) => {
    try {
      const result = await createRule(pattern, labelId);
      const applied = result.applied ?? 0;
      setStatus({
        message: `Rule created — ${applied} transaction${applied !== 1 ? "s" : ""} labeled`,
        type: "success",
      });
      await fetchData(filterDesc || undefined);
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODES.LIST);
  };

  const handleDelete = async () => {
    try {
      await removeTransactions([...selected]);
      setStatus({ message: `Deleted ${selected.size} transaction(s)`, type: "success" });
      setSelected(new Set());
      setCursor(0);
      await fetchData(filterDesc || undefined);
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setConfirmDelete(false);
  };

  const handleEditSubmit = async () => {
    const tx = visible[cursor];
    if (!tx) return;
    try {
      await modifyTransactions(tx.id, { description: editField });
      setStatus({ message: "Transaction updated", type: "success" });
      await fetchData(filterDesc || undefined);
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODES.LIST);
  };

  const handleLabelSubmit = async () => {
    const ids = selected.size > 0 ? [...selected] : [visible[cursor]?.id].filter(Boolean);
    if (ids.length === 0) return;
    try {
      await modifyTransactions(ids, { label: labelInput });
      setStatus({ message: `Labeled ${ids.length} transaction(s)`, type: "success" });
      setSelected(new Set());
      await fetchData(filterDesc || undefined);
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODES.LIST);
  };

  const handleFilterSubmit = () => {
    setShowFilter(false);
    setOffset(0);
    setCursor(0);
    fetchData(filterDesc || undefined);
  };

  const handleLabelSelect = (node) => {
    if (!node) {
      setLabelFilter(null);
      setOffset(0);
      setCursor(0);
      return;
    }
    setLabelFilter(node);
    setOffset(0);
    setCursor(0);
  };

  const filterInfo = labelFilter ? ` [${labelFilter.name}]` : "";
  const footer = focusPanel === "labels"
    ? "↑↓:nav │ /:search │ Enter:filter │ x:clear │ Tab:back │ Esc:exit"
    : "↑↓:nav │ Space:select │ d:delete │ e:edit │ l:label │ c:rule │ f:filter │ Tab:labels │ n/p:page │ Esc:back";

  return (
    <Window title={`TRANSACTIONS (${filtered.length})${filterInfo}`} footer={footer}>
      {loading && <Text color={colors.warning}>Loading transactions...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {showFilter && (
        <Box marginBottom={1}>
          <Text color={colors.primary}>Filter by description: </Text>
          <TextInput
            value={filterDesc}
            onChange={setFilterDesc}
            onSubmit={handleFilterSubmit}
            placeholder="regex pattern..."
          />
        </Box>
      )}

      {confirmDelete && (
        <ConfirmationModal
          message={`Delete ${selected.size} transaction(s)?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {mode === MODES.EDIT && (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.primary} bold>Edit description:</Text>
          <TextInput
            value={editField}
            onChange={setEditField}
            onSubmit={handleEditSubmit}
          />
        </Box>
      )}

      {mode === MODES.LABEL && (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.primary} bold>Set label (ID or name):</Text>
          <TextInput
            value={labelInput}
            onChange={setLabelInput}
            onSubmit={handleLabelSubmit}
          />
        </Box>
      )}

      {mode === MODES.RULE && (
        <Box marginBottom={1}>
          <RuleForm
            flat={flat}
            defaultPattern={visible[cursor]?.description.toUpperCase().split(/\s+/).find((w) => w.length >= 3) ?? ""}
            onSubmit={handleRuleSubmit}
            onCancel={() => setMode(MODES.LIST)}
          />
        </Box>
      )}

      {!loading && mode === MODES.LIST && !confirmDelete && (
        <Box flexDirection="row">
          {/* Left: transaction list */}
          <Box flexDirection="column" width={leftWidth}>
            {/* Header row */}
            <Box>
              <Text bold color={colors.textMuted}>
                {"  "}
                {"Date".padEnd(12)}
                {truncate("Description", descWidth - 2).padEnd(descWidth)}
                {"Amount".padStart(14)}
                {"  "}
                {"Label".padEnd(labelWidth)}
              </Text>
            </Box>

            {visible.map((tx, i) => {
              const isSelected = selected.has(tx.id);
              const isCursor = i === cursor && focusPanel === "list";
              const labelName = tx.label_id ? (idToName[String(tx.label_id)] || tx.label_id) : "—";
              return (
                <Box key={tx.id}>
                  <Text color={isCursor ? colors.primary : colors.text}>
                    {isCursor ? "▸" : " "}
                    {isSelected ? "●" : " "}
                    {tx.date.padEnd(12)}
                    {truncate(tx.description, descWidth - 2).padEnd(descWidth)}
                  </Text>
                  <Text color={amountColor(tx.amount)}>
                    {formatCurrency(tx.amount).padStart(14)}
                  </Text>
                  <Text color={colors.textMuted}>
                    {"  "}
                    {truncate(labelName, labelWidth).padEnd(labelWidth)}
                  </Text>
                </Box>
              );
            })}

            {filtered.length > PAGE_SIZE && (
              <Box marginTop={1}>
                <Text color={colors.textMuted}>
                  Page {Math.floor(offset / PAGE_SIZE) + 1}/
                  {Math.ceil(filtered.length / PAGE_SIZE)} │{" "}
                  {selected.size > 0 && `${selected.size} selected`}
                </Text>
              </Box>
            )}
          </Box>

          {/* Divider */}
          <Box flexDirection="column" width={dividerW}>
            {Array.from({ length: Math.min(PAGE_SIZE + 2, panelHeight) }, (_, i) => (
              <Text key={i} color={colors.textMuted}>{" │"}</Text>
            ))}
          </Box>

          {/* Right: label tree panel */}
          <LabelTreePanel
            tree={tree}
            height={panelHeight}
            width={rightPanelW}
            focused={focusPanel === "labels"}
            onSelect={handleLabelSelect}
            selectedId={labelFilter?.id}
            onExit={() => setFocusPanel("list")}
          />
        </Box>
      )}

      {status && <StatusBar message={status.message} type={status.type} />}
    </Window>
  );
}
