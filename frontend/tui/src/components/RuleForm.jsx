import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../utils/theme.js";

/**
 * Shared rule creation form.
 *
 * Props:
 *   flat          – flat list of tier-3 labels [{ id, name, category }]
 *   defaultPattern – pre-filled regex pattern (e.g. keyword from current tx)
 *   onSubmit(pattern, labelId) – called when the user confirms the rule
 *   onCancel()    – called on Esc
 */

const STEP = { PATTERN: "pattern", LABEL: "label" };

export default function RuleForm({ flat, defaultPattern, onSubmit, onCancel }) {
  const [step, setStep] = useState(STEP.PATTERN);
  const [pattern, setPattern] = useState(defaultPattern);
  const [labelValue, setLabelValue] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const suggestions = labelValue.trim()
    ? flat.filter((lb) => lb.name.toLowerCase().includes(labelValue.toLowerCase()))
    : flat.slice(0, 6);

  useInput((_ch, key) => {
    if (key.escape) { onCancel(); return; }
    if (step === STEP.LABEL) {
      if (key.upArrow) { setSelIdx((i) => Math.max(0, i - 1)); return; }
      if (key.downArrow) { setSelIdx((i) => Math.min(suggestions.length - 1, i + 1)); return; }
      if (key.tab && suggestions[selIdx]) {
        setLabelValue(suggestions[selIdx].name);
        setResetKey((k) => k + 1);
      }
    }
  });

  const handlePatternSubmit = () => {
    if (!pattern.trim()) return;
    setStep(STEP.LABEL);
  };

  const handleLabelSubmit = () => {
    const chosen = suggestions[selIdx] ?? flat.find((lb) => lb.name === labelValue.trim());
    if (chosen) onSubmit(pattern.trim(), chosen.id);
  };

  return (
    <Box flexDirection="column" gap={0}>
      <Text color={colors.warning} bold>Create rule</Text>

      {/* Pattern step */}
      <Box gap={1} marginTop={1}>
        <Text color={step === STEP.PATTERN ? colors.warning : colors.textMuted}>│</Text>
        <Text color={colors.textMuted}>Pattern (regex):</Text>
        {step === STEP.PATTERN ? (
          <TextInput
            value={pattern}
            onChange={setPattern}
            onSubmit={handlePatternSubmit}
            placeholder="e.g. AMAZON|AMZN"
          />
        ) : (
          <Text color={colors.text}>{pattern}</Text>
        )}
      </Box>

      {/* Label step */}
      {step === STEP.LABEL && (
        <>
          <Box gap={1}>
            <Text color={colors.warning}>│</Text>
            <Text color={colors.textMuted}>Label:</Text>
            <TextInput
              key={resetKey}
              value={labelValue}
              onChange={(v) => { setLabelValue(v); setSelIdx(0); }}
              onSubmit={handleLabelSubmit}
              placeholder="search labels..."
            />
          </Box>
          {suggestions.slice(0, 5).map((lb, i) => (
            <Box key={lb.id} paddingLeft={4} gap={2}>
              <Text color={i === selIdx ? colors.primary : colors.textMuted} bold={i === selIdx}>
                {i === selIdx ? "▸" : " "} {lb.name}
              </Text>
              <Text color="#3a3a3a">{lb.category}</Text>
            </Box>
          ))}
        </>
      )}

      <Box marginTop={1} paddingLeft={2}>
        <Text color="#3a3a3a">
          {step === STEP.PATTERN ? "enter: next   esc: cancel" : "↑↓: navigate  tab: complete  enter: create   esc: cancel"}
        </Text>
      </Box>
    </Box>
  );
}
