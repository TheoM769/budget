import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Window from "../components/Window.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { getLabelTree, createLabel, removeLabels, modifyLabel } from "../utils/api.js";
import { colors } from "../utils/theme.js";

const MODES = { BROWSE: "browse", CREATE: "create", RENAME: "rename" };

export default function LabelWindow({ onClose }) {
  const [tree, setTree] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState(new Set());
  const [mode, setMode] = useState(MODES.BROWSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getLabelTree();
      setTree(data);
      // Expand all tier-1 by default
      setExpanded(new Set(data.map((t1) => t1.id)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Flatten tree for navigation
  useEffect(() => {
    const items = [];
    for (const t1 of tree) {
      items.push({ type: "tier1", ...t1, depth: 0 });
      if (expanded.has(t1.id)) {
        for (const t2 of t1.categories || []) {
          items.push({ type: "tier2", ...t2, parentId: t1.id, depth: 1 });
          if (expanded.has(t2.id)) {
            for (const t3 of t2.labels || []) {
              items.push({ type: "tier3", ...t3, parentId: t2.id, depth: 2 });
            }
          }
        }
      }
    }
    setFlatList(items);
  }, [tree, expanded]);

  const current = flatList[cursor];

  useInput((ch, key) => {
    if (confirmDelete || mode !== MODES.BROWSE) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(flatList.length - 1, c + 1));

    // Expand/collapse
    if (key.rightArrow && current && (current.type === "tier1" || current.type === "tier2")) {
      setExpanded((prev) => new Set([...prev, current.id]));
    }
    if (key.leftArrow && current) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(current.id);
        return next;
      });
    }

    if (ch === "n" && current) {
      // Create: only under tier2
      if (current.type === "tier2") {
        setMode(MODES.CREATE);
        setInputValue("");
      } else {
        setStatus({ message: "Select a category (tier 2) to add a label", type: "error" });
      }
    }

    if (ch === "e" && current && current.type === "tier3") {
      setMode(MODES.RENAME);
      setInputValue(current.name);
    }

    if (ch === "d" && current && current.type === "tier3") {
      setConfirmDelete(true);
    }

    if (ch === "r") fetchData();
  });

  const handleCreate = async () => {
    try {
      await createLabel(inputValue, current.id);
      setStatus({ message: `Label "${inputValue}" created`, type: "success" });
      await fetchData();
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODES.BROWSE);
  };

  const handleRename = async () => {
    try {
      await modifyLabel(current.name, inputValue);
      setStatus({ message: `Renamed to "${inputValue}"`, type: "success" });
      await fetchData();
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setMode(MODES.BROWSE);
  };

  const handleDelete = async () => {
    try {
      await removeLabels(current.id);
      setStatus({ message: `Deleted "${current.name}"`, type: "success" });
      setCursor((c) => Math.max(0, c - 1));
      await fetchData();
    } catch (e) {
      setStatus({ message: e.message, type: "error" });
    }
    setConfirmDelete(false);
  };

  const footer = "↑↓:nav │ →←:expand/collapse │ n:new │ e:rename │ d:delete │ r:refresh │ Esc:back";

  const indent = (depth) => "  ".repeat(depth);
  const icon = (item) => {
    if (item.type === "tier1") return expanded.has(item.id) ? "▾" : "▸";
    if (item.type === "tier2") return expanded.has(item.id) ? "▾" : "▸";
    return "·";
  };

  return (
    <Window title="LABEL MANAGER" footer={footer}>
      {loading && <Text color={colors.warning}>Loading labels...</Text>}
      {error && <Text color={colors.danger}>Error: {error}</Text>}

      {confirmDelete && current && (
        <ConfirmationModal
          message={`Delete label "${current.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {mode === MODES.CREATE && (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.primary} bold>
            New label under "{current?.name}":
          </Text>
          <TextInput value={inputValue} onChange={setInputValue} onSubmit={handleCreate} />
        </Box>
      )}

      {mode === MODES.RENAME && (
        <Box marginBottom={1} flexDirection="column">
          <Text color={colors.primary} bold>
            Rename "{current?.name}":
          </Text>
          <TextInput value={inputValue} onChange={setInputValue} onSubmit={handleRename} />
        </Box>
      )}

      {!loading && mode === MODES.BROWSE && !confirmDelete && (
        <Box flexDirection="column">
          {flatList.map((item, i) => {
            const isCursor = i === cursor;
            const colorForItem =
              item.type === "tier1"
                ? colors.primary
                : item.type === "tier2"
                  ? item.color || colors.text
                  : colors.text;

            return (
              <Box key={`${item.type}-${item.id}`}>
                <Text color={isCursor ? colors.primary : colorForItem} bold={isCursor || item.type !== "tier3"}>
                  {isCursor ? "▸" : " "}
                  {indent(item.depth)}
                  {icon(item)} {item.name}
                </Text>
              </Box>
            );
          })}

          {flatList.length === 0 && (
            <Text color={colors.textMuted}>No labels found. The label hierarchy is empty.</Text>
          )}
        </Box>
      )}

      {status && <StatusBar message={status.message} type={status.type} />}
    </Window>
  );
}
