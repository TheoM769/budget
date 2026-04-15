import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import Window from "../components/Window.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { uploadTransactions } from "../utils/api.js";
import { colors } from "../utils/theme.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function expandHome(p) {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function listCompletions(partial) {
  const expanded = expandHome(partial);
  const dir = partial.endsWith("/") ? expanded : path.dirname(expanded);
  const prefix = partial.endsWith("/") ? "" : path.basename(expanded);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.name.startsWith(prefix) && !e.name.startsWith("."))
      .slice(0, 10)
      .map((e) => ({
        name: e.name + (e.isDirectory() ? "/" : ""),
        isDir: e.isDirectory(),
        full: path.join(dir, e.name),
      }));
  } catch {
    return [];
  }
}

function displayPath(filePath) {
  const home = os.homedir();
  if (filePath.startsWith(home)) return "~" + filePath.slice(home.length);
  return filePath;
}

const STAGES = { INPUT: "input", UPLOADING: "uploading", RESULT: "result" };

export default function ImportWindow({ onClose }) {
  const [input, setInput] = useState("@");
  const [completions, setCompletions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const [stage, setStage] = useState(STAGES.INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Update completions whenever input changes
  useEffect(() => {
    const atIdx = input.lastIndexOf("@");
    if (atIdx === -1) {
      setCompletions([]);
      return;
    }
    const filePart = input.slice(atIdx + 1);
    if (filePart.length === 0) {
      // Show current directory contents
      setCompletions(listCompletions("./"));
    } else {
      setCompletions(listCompletions(filePart));
    }
    setSelectedIndex(0);
  }, [input]);

  useInput((ch, key) => {
    if (stage === STAGES.RESULT) {
      if (key.escape || key.return) onClose();
      return;
    }
    if (stage === STAGES.UPLOADING) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow && completions.length > 0) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow && completions.length > 0) {
      setSelectedIndex((i) => Math.min(completions.length - 1, i + 1));
    }
    if (key.tab && completions.length > 0) {
      const chosen = completions[selectedIndex];
      const atIdx = input.lastIndexOf("@");
      const before = input.slice(0, atIdx + 1);
      setInput(before + displayPath(chosen.full) + (chosen.isDir ? "/" : ""));
      setInputKey((k) => k + 1);
    }
  });

  const handleSubmit = async () => {
    const atIdx = input.lastIndexOf("@");
    if (atIdx === -1) return;

    const filePath = expandHome(input.slice(atIdx + 1).trim());
    if (!filePath || !fs.existsSync(filePath)) {
      setError("File not found: " + filePath);
      return;
    }
    if (fs.statSync(filePath).isDirectory()) {
      setError("Path is a directory, not a file");
      return;
    }

    setStage(STAGES.UPLOADING);
    setError(null);
    try {
      const data = await uploadTransactions(filePath);
      setResult(data);
      setStage(STAGES.RESULT);
    } catch (e) {
      setError(e.message);
      setStage(STAGES.INPUT);
    }
  };

  const footer =
    stage === STAGES.INPUT
      ? "Tab:complete │ ↑↓:navigate │ Enter:import │ Esc:back"
      : stage === STAGES.RESULT
        ? "Enter/Esc:close"
        : "";

  return (
    <Window title="IMPORT TRANSACTIONS" footer={footer}>
      {stage === STAGES.INPUT && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={colors.text}>
              Type <Text bold color={colors.primary}>@</Text> followed by a file
              path. Use <Text bold>Tab</Text> to autocomplete.
            </Text>
          </Box>

          <Box>
            <Text color={colors.primary} bold>
              {">"}{" "}
            </Text>
            <TextInput
              key={inputKey}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="@path/to/file.csv"
            />
          </Box>

          {completions.length > 0 && (
            <Box
              flexDirection="column"
              borderStyle="single"
              borderColor={colors.textMuted}
              paddingX={1}
              marginTop={1}
            >
              {completions.map((c, i) => (
                <Box key={c.name} gap={2}>
                  <Text
                    color={
                      i === selectedIndex
                        ? colors.primary
                        : c.isDir
                          ? colors.warning
                          : colors.text
                    }
                    bold={i === selectedIndex}
                  >
                    {i === selectedIndex ? "▸" : " "}{" "}
                    {c.isDir ? "📁" : "📄"} {c.name}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {stage === STAGES.UPLOADING && (
        <Box>
          <Text color={colors.warning}>
            <Spinner type="dots" />{" "}
          </Text>
          <Text color={colors.text}>Importing transactions...</Text>
        </Box>
      )}

      {stage === STAGES.RESULT && result && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={colors.success} bold>
              Imported {result.length} new transaction(s)
            </Text>
          </Box>

          {result.length > 0 && (
            <Box flexDirection="column">
              <Box gap={1}>
                <Text bold color={colors.textMuted}>
                  {"Date".padEnd(12)}
                  {"Description".padEnd(35)}
                  {"Amount".padStart(12)}
                </Text>
              </Box>
              {result.slice(0, 15).map((tx) => (
                <Box key={tx.id} gap={1}>
                  <Text color={colors.text}>
                    {tx.date.padEnd(12)}
                    {(tx.description || "").slice(0, 33).padEnd(35)}
                  </Text>
                  <Text
                    color={tx.amount >= 0 ? colors.success : colors.danger}
                  >
                    {(tx.amount >= 0 ? "+" : "") +
                      tx.amount.toFixed(2).padStart(11) +
                      "€"}
                  </Text>
                </Box>
              ))}
              {result.length > 15 && (
                <Text color={colors.textMuted}>
                  ... and {result.length - 15} more
                </Text>
              )}
            </Box>
          )}
        </Box>
      )}

      {error && <StatusBar message={error} type="error" />}
    </Window>
  );
}
