import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { truncate } from "../utils/formatting.js";
import { colors } from "../utils/theme.js";

/**
 * Collect all tier-3 label IDs that fall under a given node.
 */
function collectLabelIds(tree, nodeId, tier) {
  const ids = [];
  for (const t1 of tree) {
    if (tier === 1 && t1.id === nodeId) {
      for (const t2 of t1.categories || [])
        for (const t3 of t2.labels || []) ids.push(t3.id);
    }
    for (const t2 of t1.categories || []) {
      if (tier === 2 && t2.id === nodeId)
        for (const t3 of t2.labels || []) ids.push(t3.id);
      if (tier === 3)
        for (const t3 of t2.labels || [])
          if (t3.id === nodeId) ids.push(t3.id);
    }
  }
  return ids;
}

/**
 * Build a flat navigable list from the label tree.
 */
function buildLines(tree) {
  const lines = [];
  for (const t1 of tree) {
    lines.push({ kind: "group", name: t1.name, id: t1.id, tier: 1 });
    for (const t2 of t1.categories || []) {
      lines.push({ kind: "cat", name: t2.name, id: t2.id, tier: 2, color: t2.color });
      const tier3 = t2.labels || [];
      for (let i = 0; i < tier3.length; i++) {
        lines.push({
          kind: "lbl",
          name: tier3[i].name,
          id: tier3[i].id,
          tier: 3,
          last: i === tier3.length - 1,
        });
      }
    }
  }
  return lines;
}

export default function LabelTreePanel({
  tree,
  height,
  width,
  focused,
  onSelect,
  selectedId,
  onExit,
}) {
  const [cursor, setCursor] = useState(0);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const allLines = buildLines(tree);

  const filtered = search.trim()
    ? allLines.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase())
      )
    : allLines;

  // Clamp cursor when filtered list shrinks
  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [filtered.length]);

  // Keep cursor in visible viewport
  const headerRows = 1 + (searching || search ? 1 : 0);
  const viewportH = Math.max(1, height - headerRows);

  useEffect(() => {
    if (cursor < scrollOffset) setScrollOffset(cursor);
    if (cursor >= scrollOffset + viewportH)
      setScrollOffset(cursor - viewportH + 1);
  }, [cursor, viewportH]);

  useInput(
    (ch, key) => {
      if (searching) {
        if (key.escape) {
          setSearching(false);
          setSearch("");
        }
        return;
      }
      if (key.escape) {
        if (search) {
          setSearch("");
          setCursor(0);
        } else {
          onExit?.();
        }
        return;
      }
      if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
      if (key.downArrow) setCursor((c) => Math.min(filtered.length - 1, c + 1));
      if (key.return && filtered[cursor]) {
        const node = filtered[cursor];
        const labelIds = collectLabelIds(tree, node.id, node.tier);
        onSelect?.({ ...node, labelIds });
      }
      if (ch === "/") setSearching(true);
      if (ch === "x") {
        setSearch("");
        setCursor(0);
        onSelect?.(null);
      }
    },
    { isActive: focused }
  );

  const visible = filtered.slice(scrollOffset, scrollOffset + viewportH);

  return (
    <Box flexDirection="column" width={width}>
      {/* Header */}
      <Box>
        <Text color={colors.textMuted}>{"─ Labels "}</Text>
        <Text color={colors.textMuted}>
          {"─".repeat(Math.max(0, width - 10))}
        </Text>
      </Box>

      {/* Search bar */}
      {searching && (
        <Box>
          <Text color={colors.primary}>{"/ "}</Text>
          <TextInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setCursor(0);
              setScrollOffset(0);
            }}
            onSubmit={() => setSearching(false)}
            placeholder="search..."
          />
        </Box>
      )}
      {search && !searching && (
        <Text color={colors.textMuted} dimColor>
          {"  "}filter: {search}
        </Text>
      )}

      {/* Tree rows */}
      {visible.map((line, i) => {
        const globalIdx = scrollOffset + i;
        const isCursor = focused && globalIdx === cursor;
        const isSelected = selectedId != null && line.id === selectedId;
        const marker = isCursor ? "▸" : " ";

        if (line.kind === "group") {
          return (
            <Box key={`${line.id}-${i}`}>
              <Text
                color={isCursor ? colors.primary : colors.text}
                bold={isSelected}
              >
                {marker}{" "}
              </Text>
              <Text
                color={isSelected ? colors.primary : colors.text}
                bold
              >
                {truncate(line.name, width - 4)}
              </Text>
            </Box>
          );
        }

        if (line.kind === "cat") {
          return (
            <Box key={`${line.id}-${i}`} gap={1}>
              <Text color={isCursor ? colors.primary : colors.textMuted}>
                {marker}
              </Text>
              <Text color={line.color || colors.primary}>●</Text>
              <Text
                color={isSelected ? colors.primary : colors.text}
                bold={isSelected}
              >
                {truncate(line.name, width - 6)}
              </Text>
            </Box>
          );
        }

        // kind === "lbl"
        return (
          <Box key={`${line.id}-${i}`}>
            <Text color={isCursor ? colors.primary : colors.textMuted}>
              {marker}
            </Text>
            <Text color={colors.textMuted}>
              {"  "}
              {line.last ? "└" : "├"}{" "}
            </Text>
            <Text
              color={isSelected ? colors.primary : colors.textMuted}
              bold={isSelected}
            >
              {truncate(line.name, width - 8)}
            </Text>
          </Box>
        );
      })}

      {/* Scroll indicator */}
      {filtered.length > viewportH && (
        <Text color="#3a3a3a">
          {"  "}
          {scrollOffset + viewportH < filtered.length
            ? `↓ ${filtered.length - scrollOffset - viewportH} more`
            : `${filtered.length} items`}
        </Text>
      )}
    </Box>
  );
}
