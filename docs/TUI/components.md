# Shared Components

Reusable components in `src/components/`.

---

## `Window`

Full-terminal container used by every window.

**Props:** `title`, `footer`, `children`

Renders:
- Rounded border (`borderStyle="round"`) in `primary` color
- Title (bold, primary) + `Esc: Back` hint on the right
- Horizontal rule below header
- Flex content area (`flexGrow 1`)
- Horizontal rule + footer hint bar (if `footer` prop provided)

Height = `termRows - 1` to leave room for `BottomBar`.

---

## `BottomBar`

Persistent bottom strip. Shows `budget` on the left and `v1.0` on the right. Always rendered by `App`, never by windows.

---

## `CommandInput`

Home screen command input.

- Typing `/` activates autocomplete over the command list
- `↑` / `↓` navigate suggestions
- `Tab` fills the selected command name
- `Enter` fires the command

Suggestions show command name (primary when selected) + short description (dim).

---

## `ConfirmationModal`

Inline yes/no dialog with a warning-colored border.

- `←` / `→` toggle between Yes and No
- `Enter` confirms selection
- `Esc` cancels

Defaults to **No** selected (safe default).

---

## `RuleForm`

Two-step form for creating a labeling rule. Shared by `TransactionWindow` and `LabelizerWindow`.

**Step 1 — Pattern**
- Pre-filled with a keyword extracted from the current transaction description
- Regex pattern input, `Enter` advances to step 2

**Step 2 — Label**
- Search input with live autocomplete (up to 5 suggestions)
- `↑` / `↓` navigate, `Tab` completes, `Enter` creates the rule
- Shows label name + parent category name in suggestions

`Esc` cancels at any step.

---

## `StatusBar`

One-line feedback strip rendered below window content.

**Props:** `message`, `type` (`"success"` | `"error"`)

Colors: success → green, error → red.

---

## `DateRangePicker`

Interactive calendar overlay used by `AnalyticsWindow`.

- 6-week grid (42 cells) for the current view month
- Two-step selection: pick start date, then end date
- Live range preview while picking the end date
- Dates outside transaction bounds shown strikethrough and dimmed

**Keys:**

| Key | Action |
|-----|--------|
| `←` / `→` | Move cursor one day |
| `↑` / `↓` | Move cursor one week |
| `[` / `]` | Previous / next month |
| `Enter` | Confirm current date (step 1 = start, step 2 = end) |
| `m` | Select entire visible month |
| `r` | Reset selection |
| `Esc` | Close without change |

Visual states: cursor (primary bg), endpoint (warning bg), in-range (warning text + dark bg), blocked (strikethrough).
