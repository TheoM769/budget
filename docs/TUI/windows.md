# Window Keybindings & UX

Per-window keyboard interactions and layout details.

---

## Transaction Window

**File:** `src/windows/TransactionWindow.jsx`

### Layout

Paginated table. 15 transactions per page. Column widths adapt to terminal width:
- Fixed: marker (2) + date (12) + amount (14)
- Description: 60% of remaining space (min 15)
- Label: remainder (min 10)

Cursor row highlighted in primary color. Selected rows marked with `●`.

```
╭─ TRANSACTIONS (142) ──────────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│   Date        Description                    Amount   Label      │
│                                                                   │
│  ▸● 2024-03-12  AMAZON MARKETPLACE          -€42.99   Shopping   │  ← cursor + selected
│    2024-03-11  LIDL SUPERMARCHE             -€31.20   Groceries  │
│    2024-03-10  VIREMENT SALAIRE           +€2400.00   Net salary │
│    2024-03-09  NETFLIX                      -€13.99   Streaming  │
│    2024-03-08  RATP                          -€1.90   Public tr… │
│    ...                                                            │
│                                                                   │
│  Page 1/10 │ 1 selected                                          │
│ ──────────────────────────────────────────────────────────────── │
│ ↑↓:nav │ Space:select │ d:delete │ e:edit │ l:label │ f:filter  │
╰───────────────────────────────────────────────────────────────────╯
```

### Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| `LIST` | default | Browse and navigate |
| `EDIT` | `e` | Inline text input to edit current transaction's description |
| `LABEL` | `l` | Text input to assign label by name or ID |
| `RULE` | `c` | Opens `RuleForm` to create a labeling rule |

Filter input (`f`) appears inline above the list while active.

### Keybindings

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate rows |
| `n` / `p` | Next / previous page |
| `Space` | Toggle selection on current row |
| `e` | Edit description of current transaction |
| `l` | Assign label to current or selected transactions |
| `d` | Delete current or selected transactions (confirmation modal) |
| `c` | Create labeling rule from current transaction |
| `f` | Toggle description filter input |
| `r` | Refresh (re-fetches with active filter) |
| `Esc` | Close window |

---

## Label Manager

**File:** `src/windows/LabelWindow.jsx`

### Layout

Collapsible tree. Tier 1 and tier 2 nodes show expand/collapse arrows (`▾` / `▸`). Tier 3 nodes shown as `·`. Indentation increases by 2 spaces per tier. All tier 1 nodes expanded by default.

Label ID never shown to the user — only name and color circle.

```
╭─ LABEL MANAGER ───────────────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│  ▸ Expense                                                        │  ← tier 1 (bold)
│    ▾ Food                                                    ●   │  ← tier 2 (colored circle)
│        · Groceries                                               │  ← tier 3
│        · Restaurants                                             │
│        · Snacks / Takeout                                        │
│        · Dietary supplements                                     │
│    ▸ Housing                                                 ●   │  ← collapsed
│    ▸ Transport                                               ●   │
│    ...                                                            │
│ ──────────────────────────────────────────────────────────────── │
│ ↑↓:nav │ Space:expand │ n:new │ e:rename │ d:delete │ r:refresh  │
╰───────────────────────────────────────────────────────────────────╯
```

### Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| `BROWSE` | default | Navigate tree |
| `CREATE` | `n` | Text input to name a new tier-3 label under selected category |
| `RENAME` | `e` | Text input pre-filled with current label name |

### Keybindings

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate nodes |
| `Space` | Expand / collapse tier-1 or tier-2 node |
| `n` | Create new label under selected category (tier 2 only) |
| `e` | Rename selected label (tier 3 only) |
| `d` | Delete selected label (tier 3 only, confirmation modal) |
| `r` | Refresh |
| `Esc` | Close window |

---

## Labelizer

**File:** `src/windows/LabelizerWindow.jsx`

### Layout

Two-column layout below a transaction card.
Right panel width: min(34, 36% of inner width). Left panel gets the remainder.
Categories panel shows the full label hierarchy for reference while labeling.

```
╭─ LABELIZER — 24 unlabeled ────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│  ╔═══════════════════════════════════════════════════════════╗   │
│  ║  2024-03-08   AMAZON MARKETPLACE FR          -€127.50    ║   │  ← transaction card
│  ╚═══════════════════════════════════════════════════════════╝   │
│  5 / 24                                                           │
│                                                                   │
│  │ Label: electronic█              │  ─ Categories ──────────── │
│    ▸ Electronics     Shopping      │  ● Food                     │  ← autocomplete
│      Pleasure purc…  Shopping      │    ├ Groceries              │
│      Software        Subs…         │    └ Restaurants            │
│                                    │  ● Housing                  │
│                                    │    ├ Rent                   │
│                                    │    └ Utilities              │
│ ──────────────────────────────────────────────────────────────── │
│ ↑↓:suggestions │ tab:complete │ enter:confirm │ esc:cancel        │
╰───────────────────────────────────────────────────────────────────╯
```

### Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| `NAV` | default | Navigate transactions |
| `LABEL` | `Enter` | `LabelInput` with autocomplete |
| `RULE` | `c` | `RuleForm` |

### Keybindings

| Key | Action |
|-----|--------|
| `←` / `↑` | Previous transaction |
| `→` / `↓` | Next transaction |
| `Enter` | Open label input for current transaction |
| `s` | Skip (move to next without labeling) |
| `c` | Create labeling rule from current transaction |
| `r` | Refresh (re-fetches unlabeled transactions) |
| `Esc` | Close window |

**Label input keys:** `↑` / `↓` navigate suggestions, `Tab` completes, `Enter` confirms, `Esc` cancels.

---

## Analytics Window

**File:** `src/windows/AnalyticsWindow.jsx`

### Layout

Top section: two columns — metrics + monthly trend on the left, date picker fixed in the top-right corner.
Bottom section: Sankey diagram full width.

```
╭─ ANALYTICS ────────────────────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│                                        │ ╭─ Period ─────────────╮│
│  SUMMARY                               │ │ <<<  Mar 2024     >>>││
│  Income    Expense     Net             │ │  S  M  T  W  T  F  S ││
│  +€7 200   -€5 820    +€1 380          │ │              1   2  3 ││
│  142 transactions                      │ │  4  5  6  7  8  9 10 ││
│                                        │ │ 11 12 13 14 15 16 17 ││
│  MONTHLY TREND                         │ │[18 19 20 21 22 23 24]││  ← active range
│  2024-01  ↑ +€3 600  ↓ -€2 910  =+€690│ │ 25 26 27 28 29 30 31 ││
│  2024-02  ↑ +€3 600  ↓ -€2 910  =+€690│ │                      ││
│  2024-03  ↑ +€3 600  ↓ -€3 241  =+€359│ │ ← ↵:pick  r:reset  → ││
│                                        │ │   []:month  esc:done  ││
│                                        │ ╰──────────────────────╯│
│ ──────────────────────────────────────────────────────────────── │
│                         SANKEY FLOW                               │
│              INCOME SOURCES        EXPENSES / SAVINGS             │
│              Net salary  ████───────████░░  Food      -€580       │
│              €3 600                                    €320       │
│                                         ██░░  Housing   -€250     │
│              Bonuses    ██─────────    ██░░  Transport -€140       │
│              €800                                   █░░  Savings   │
│                                        ████░░             +€690   │
│ ──────────────────────────────────────────────────────────────── │
│ d:focus date picker │ r:clear filter                              │
╰────────────────────────────────────────────────────────────────────╯
```

Date picker always rendered in the top-right corner. `d` shifts keyboard focus to it — border turns primary color when active. Calendar navigation keys only capture input when focused. `Esc` or `d` returns focus to the main panel.

### Sankey diagram

Full-width diagram spanning the entire window width. Left side split by income source (one band per label under Earnings). Right side split by expense category. Flow lines connect income bands to expense bands proportionally.

- Left band height proportional to income source amount
- Right band height proportional to expense category amount
- Each band distinct color from label tree or 10-color palette
- Amount displayed at the base of each income band and to the right of each expense/savings band
- Savings rendered as separate right band when total income > total expense

### Keybindings

| Key | Action |
|-----|--------|
| `d` | Toggle focus between analytics and date picker |
| `r` | Clear active date filter |
| `Esc` | Close window |

**Date picker keys (when focused):** `←/→` day, `↑/↓` week, `[/]` month, `m` select whole month, `Enter` pick date, `r` reset selection.

---

## Import Window

**File:** `src/windows/ImportWindow.jsx`

### Layout

Single input line. Completions shown below in a bordered list (up to 10 entries). Directories shown in warning color with a trailing `/`. Files in default text color.

```
╭─ IMPORT TRANSACTIONS ─────────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│  Type @ followed by a file path. Use Tab to autocomplete.        │
│                                                                   │
│  > @data/█                                                        │  ← input
│                                                                   │
│ ┌─────────────────────────────┐                                  │
│ │▸ 📁 exports/                │                                  │  ← completions
│ │  📄 bnp_march_2024.csv      │                                  │
│ │  📄 bnp_feb_2024.csv        │                                  │
│ └─────────────────────────────┘                                  │
│                                                                   │
│ ──────────────────────────────────────────────────────────────── │
│ Tab:complete │ ↑↓:navigate │ Enter:import │ Esc:back             │
╰───────────────────────────────────────────────────────────────────╯
```

After import (`RESULT` stage):

```
╭─ IMPORT TRANSACTIONS ─────────────────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────────────────────────── │
│  Imported 34 new transaction(s)                                   │
│                                                                   │
│  Date         Description                           Amount        │
│  2024-03-12   AMAZON MARKETPLACE                  -€42.99        │
│  2024-03-11   LIDL SUPERMARCHE                    -€31.20        │
│  2024-03-10   VIREMENT SALAIRE                  +€2400.00        │
│  ...                                                              │
│  ... and 19 more                                                  │
│ ──────────────────────────────────────────────────────────────── │
│ Enter/Esc:close                                                    │
╰───────────────────────────────────────────────────────────────────╯
```

### Stages

| Stage | Description |
|-------|-------------|
| `INPUT` | File path entry with autocomplete |
| `UPLOADING` | Spinner while backend processes the CSV |
| `RESULT` | Preview of imported transactions (up to 15 rows) |

### Path input

- Must start with `@` — the `@` prefix triggers file path mode
- Default starting path: `data/` folder
- `~/` expanded to home directory
- Tab autocomplete navigates the filesystem

### Keybindings (INPUT stage)

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate completions |
| `Tab` | Accept selected completion |
| `Enter` | Submit and import |
| `Esc` | Close window |
