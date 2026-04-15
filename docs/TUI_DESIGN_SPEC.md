# TUI Design Specification - Budget App

## Overview

Hybrid TUI design combining:
- **Mistral Vibe-style CLI**: Slash command autocompletion at entry point
- **Bagels-style Analytics**: Rich dashboard windows for each feature

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN CLI INTERFACE                    │
│  (Slash command mode - Mistral Vibe style)              │
│                                                           │
│  > /transactions                                         │
│  > /labels                                               │
│  > /labelize                                             │
│  > /analyze                                              │
│                                                           │
│  [Autocompletion dropdown appears on "/"]                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    FEATURE WINDOWS                        │
│  (Bagels-style dashboards - fullscreen modal)            │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Window Title]                                   │    │
│  │  ┌─────────────┐  ┌───────────────────────────┐  │    │
│  │  │  SIDEBAR     │  │         CONTENT           │  │    │
│  │  │  Navigation  │  │   - Data visualization     │  │    │
│  │  │  Filters     │  │   - Interactive elements   │  │    │
│  │  │              │  │   - Charts/tables          │  │    │
│  │  └─────────────┘  └───────────────────────────┘  │    │
│  │                                                     │    │
│  │  ┌───────────────────────────────────────────┐  │    │
│  │  │  FOOTER: [Shortcuts] | [Status] | [Controls]  │  │    │
│  │  └───────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Main CLI Interface (Slash Command Mode)

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  Budget TUI    [v1.0]    [Ctrl+D: Exit | /?: Help]        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                 farmers          │    │
│  │ retrieving your latest dashboard...           │    │
│  │                                                 │    │
│  │ > /                                             │    │
│  │   ┌──────────────────────────┐                 │    │
│  │   │ /transactions    Open transaction manager │    │
│  │   │ /labels           Open label manager       │    │
│  │   │ /labelize         Open labelizer tool      │    │
│  │   │ /analyze          Open analytics dashboard │    │
│  │   │ /help             Show all commands        │    │
│  │   │ /quit             Exit application         │    │
│  │   └──────────────────────────┘                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  [Tips: Tab to autocomplete, ↑↓ to navigate history]     │
└─────────────────────────────────────────────────────────┘
```

### Features

| Feature | Implementation | Behavior |
|---------|---------------|----------|
| Slash command input | `<TextInput>` with `/` prefix | Auto-focus on load |
| Autocompletion | Popover with arrow key navigation | Triggers on `/` |
| History | Up/Down arrows | Navigate previous commands |
| Help overlay | `/help` or `Ctrl+?` | Show all commands |
| Exit | `/quit`, `Ctrl+D`, or `Ctrl+C` | Confirmation for unsaved changes |

### Command Reference

| Command | Description | Window Opens |
|---------|-------------|--------------|
| `/transactions` | Manage transactions (CRUD) | Transaction Manager |
| `/labels` | Manage labels/categories | Label Manager |
| `/labelize` | Bulk label transactions | Labelizer Tool |
| `/analyze` | Analytics & insights | Analytics Dashboard |
| `/help` | Show all commands | Help Overlay |
| `/quit` | Exit application | - |

---

## 2. Feature Windows (Bagels-Style)

### Common Window Structure

All windows follow this pattern:

```
┌─────────────────────────────────────────────────────────┐
│ isiones┌───────────────┐  [X: Close | ? : Help]     │
│        │ TITLE          │                                   │
│        ├───────────────┘                                   │
│        │                                                 │
│  S     │  ┌─────────────────────────────────────────┐    │
│  I     │  │                                             │    │
│  D ┌───┴──┤  CONTENT AREA                               │    │
│  E B  │    │  - Primary data display                   │    │
│  B A  │    │  - Scrollable if needed                   │    │
│  A R  │    │  - Charts, tables, forms                   │    │
│      ┌┴──┐│                                             │    │
│      │ F │  └─────────────────────────────────────────┘    │
│      │ I │                                                 │
│      │ L │  ┌─────────────────────────────────────────┐    │
│      │ T │  │  FILTERS / CONTROLS                        │    │
│      │ E │  │  [Period: ▼] [Category: ▼] [Search: __]  │    │
│      │ R │  └─────────────────────────────────────────┘    │
│      │ S │                                                 │
│      └───┘─────────────────────────────────────────────────┘
│                                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FOOTER                                               │    │
│  │  [ Shortcuts: s=Save | d=Delete | q=Back | /=Command ] │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Window Interaction Patterns

| Key | Action |
|-----|--------|
| `Esc` | Close window / return to CLI |
| `Ctrl+K` | Clear input/filters |
| `Ctrl+S` | Save changes |
| `Ctrl+F` | Focus search input |
| `/` | Open command palette (global) |
| `?` | Open window-specific help |
| `Tab` | Cycle through focusable elements |
| `Enter` | Confirm/activate |

---

## 3. Window Specifications

### 3.1 Transaction Manager (`/transactions`)

**Purpose**: Create, read, update, delete transactions

```
┌─────────────────────────────────────────────────────────┐
│  TRANSACTIONS                    [Period: Last 30d ▼]      │
├────────────────────┬───────────────────────────────────┤
│  SIDEBAR            │ CONTENT                              │
│ ─────────           │ ─────────                            │
│ [A] All (124)       │ ┌─────────────────────────────┐    │
│ [I] Income (24)     │ │ Date       │ Description    │    │
│ [E] Expense (100)   │ │ 2024-01-15 │ Groceries      │$45 │    │
│                     │ │ 2024-01-14 │ Salary         │+2000│   │
│ FILTERS             │ │ 2024-01-14 │ Coffee         │-$5 │    │
│ [ ] Unlabeled       │ │ 2024-01-13 │ Rent          │-800 │   │
│ [✓] Food            │ │─────────────────────────────│    │
│ [✓] Transportation  │ │ Balance: $1,150              │    │
│ [ ] Utilities       │ │                                 │    │
│                     │ │ [Load More...]                 │    │
│ [Min: $___]         │ ┌─────────────────────────────┐    │
│ [Max: $___]         │ │ Selected: 1 item              │    │
│                     │ │ [Edit | Delete | Label]       │    │
│                     │ └─────────────────────────────┘    │
└─────────────────────┴───────────────────────────────────┘
│  [a=Add | e=Edit | d=Delete | l=Label | /=Command | q=Back]│
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `<TransactionTable>`: Sortable columns (Date, Description, Amount, Label)
- `<BalanceSummary>`: Running balance, period totals
- `<CategoryFilterSidebar>`: Checkbox list with counts
- `<AmountRangeFilter>`: Min/max input fields
- `<ActionBar>`: Batch actions for selected items
- `<AddTransactionForm>`: Modal overlay for new entries

**Key Bindings:**
| Key | Action |
|-----|--------|
| `a` | Add new transaction |
| `e` | Edit selected transaction |
| `d` | Delete selected (with confirmation) |
| `l` | Open labelizer for selected |
| `s` | Toggle select mode |
| `Space` | Select/deselect item |

---

### 3.2 Label Manager (`/labels`)

**Purpose**: Manage categories, labels, and classification rules

```
┌─────────────────────────────────────────────────────────┐
│  LABEL MANAGER                                            │
├────────────────────┬───────────────────────────────────┤
│  LABEL TREE          │ LABEL DETAILS                      │
│ ──────────           │ ──────────────                     │
│ Categories           │ Name: Food                        │
│ ├─ Food               │ Description: Groceries, dining    │
│ │  ├─ Groceries       │ Color: 🟢                         │
│ │  ├─ Dining Out      │ Icon: 🍽️                          │
│ │  └─ Coffee          │ Parent: Food                      │
│ ├─ Transportation     │                                 │
│ │  ├─ Gas             │ RULES:                            │
│ │  └─ Public Transit  │ - Pattern: *starbucks* → Coffee    │
│ ├─ Utilities          │ - Pattern: *uber* → Transportation│
│ └─ Income             │                                 │
│   ├─ Salary           │ [+ Add Rule]                      │
│   └─ Bonus            │                                 │
├────────────────────┴───────────────────────────────────┘
│  [n=New Label | r=New Rule | e=Edit | d=Delete | q=Back]  │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `<LabelTree>`: Hierarchical tree view with expand/collapse
- `<LabelDetailPane>`: Selected label properties
- `<RuleList>`: Auto-labeling rules (pattern → label)
- `<RuleEditor>`: Modal for creating/editing rules

**Key Bindings:**
| Key | Action |
|-----|--------|
| `n` | Create new label |
| `r` | Create new rule |
| `e` | Edit selected label/rule |
| `d` | Delete selected |
| `→/←` | Expand/collapse tree nodes |
| `Enter` | Select label |

---

### 3.3 Labelizer Tool (`/labelize`)

**Purpose**: Label all unlabeld transactions one by one. Create rules on the fly.

```
┌─────────────────────────────────────────────────────────┐
│  LABELIZER                    [Unlabeled: 12 | Selected: 0]  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  APPLY RULES                                         │    │
│  │  [ ] Rule: *starbucks* → Coffee                  │    │
│  │  [✓] Rule: *uber* → Transportation               │    │
│  │  [✓] Rule: *amazon* → Shopping                   │    │
│  │  [Apply to All] [Apply to Selected]            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Date       │ Description    │ Predicted │ Action │    │
│  │ 2024-01-15 │ STARBUCKS COFF  │ Coffee    │ [✓]    │    │
│  │ 2024-01-15 │ UBER TRIP       │ Transport │ [✓]    │    │
│  │ 2024-01-15 │ AMAZON ORDERS   │ Shopping  │ [✓]    │    │
│  │ 2024-01-14 │ UNKNOWN STORE   │ -         │ [▼]    │    │
│  │ 2024-01-14 │ GAS STATION     │ -         │ [▼]    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  [ Quick Label: __ ] [Label Selected | Clear Labels]       │
│                                                           │
└─────────────────────────────────────────────────────────┘
│  [a=Apply Rules | s=Select All | l=Label Selected | q=Back] │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `<RuleToggleList>`: Checkbox list of auto-label rules
- `<UnlabeledTransactionTable>`: Filtered to unlabeled items
- `<PredictedLabelColumn>`: Shows rule-based predictions
- `<BulkActionBar>`: Apply labels to multiple items
- `<QuickLabelInput>`: Type to label selected items
- `<LabelDropdown>`: Per-item label selector

**Key Bindings:**
| Key | Action |
|-----|--------|
| `a` | Apply selected rules |
| `s` | Select/deselect all |
| `l` | Open label picker for selected |
| `c` | Clear labels from selected |
| `Space` | Toggle item selection |
| `Enter` | Open label dropdown for item |

---

### 3.4 Analytics Dashboard (`/analyze`)

**Purpose**: Visualize spending patterns, trends, and insights (Bagels-inspired)

```
┌─────────────────────────────────────────────────────────┐
│  ANALYTICS                     [Period: Last 30d ▼]        │
├────────────────────────────────────────┬────────────────┤
│  METRICS                                │ SPENDING BY CATEGORY │
│ ───────────                             │ ───────────────────│
│ ┌─────────────────┐                     │                  │
│ │ Total Income:   │ $3,200           بالدولار  │ │                  │
│ │ Total Expense:  │ -$2,450          ██████░░ │ │  ████ Food         │  │
│ │ Net Savings:    │ +$750            ████░░░░ │ │  ██ Transport     │  │
│ │ Remaining:      │ $1,800           ████████ │ │  █  Utilities      │  │
│ └─────────────────┘                     │                  │
│                                         │  █  Shopping      │  │
│  [Compare to Previous Period]           │  ░  Other          │  │
│                                         └──────────────────┘
├────────────────────────────────────────┴────────────────┘
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  SPENDING TREND (Last 6 Months)                  │    │
│  │                                                  │    │
│  │  $3000 ┤                                         │    │
│  │        │    ╭──╮                                │    │
│  │  $2500 ┤   ╭╯  ╰─╮    ╭───╮                     │    │
│  │        │   │    ╰────╯   ╰────╮                   │    │
│  │  $2000 ┤───╯          ╰────────╯                   │    │
│  │        │                                          │    │
│  │  $1500 ┤                                          │    │
│  │        │                                          │    │
│  │  Jan   Feb   Mar   Apr   May   Jun               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
│  [Period: ▼ | Category: ▼ | Export CSV | /=Command | q=Back] │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `<MetricCards>`: Key financial metrics (income, expense, savings)
- `<CategoryChart>`: Bar chart of spending by category
- `<ProgressBar>`: Budget utilization visualization
- `<TrendChart>`: ASCII line chart for historical data
- `<PeriodSelector>`: Date range picker
- `< ExportButton>`: Export data as CSV

**Visualizations:**
- ASCII charts using libraries like `ink-chart` or custom
- Color-coded categories
- Percentage-based progress bars

**Key Bindings:**
| Key | Action |
|-----|--------|
| `←/→` | Switch period (day/week/month/quarter/year) |
| `e` | Export current view as CSV |
| `c` | Toggle chart type (bar/line/pie) |
| `f` | Focus on specific category |

---

## 4. Component Library

### Core Components (from Ink & Ink-UI)

| Component | Source | Purpose |
|-----------|--------|---------|
| `<Box>` | Ink | Layout container with flexbox |
| `<Text>` | Ink | Styled text output |
| `<TextInput>` | Ink | Single-line text input |
| `<SelectInput>` | Ink-UI | Dropdown selector |
| `<Checkbox>` | Ink-UI | Boolean toggle |
| `<Table>` | Ink | Data grid display |
| `<Static>` | Ink | Static content (no rerender) |
| `<Spacer>` | Ink | Empty space filler |
| `<Newline>` | Ink | Line break |
| `<Divider>` | Ink | Horizontal rule |

### Custom Components to Build

| Component | File | Description |
|-----------|------|-------------|
| `<CommandInput>` | `src/components/CommandInput.js` | Slash command with autocompletion |
| `<Window>` | `src/components/Window.js` | Modal window container |
| `<WindowHeader>` | `src/components/WindowHeader.js` | Title bar with close button |
| `<WindowFooter>` | `src/components/WindowFooter.js` | Shortcut hints |
| `<Sidebar>` | `src/components/Sidebar.js` | Navigation/filter panel |
| `<TransactionTable>` | `src/components/TransactionTable.js` | Sortable, selectable transaction list |
| `<LabelTree>` | `src/components/LabelTree.js` | Hierarchical label browser |
| `<CategoryChart>` | `src/components/CategoryChart.js` | ASCII bar chart |
| `<TrendChart>` | `src/components/TrendChart.js` | ASCII line chart |
| `<MetricCard>` | `src/components/MetricCard.js` | Financial metric display |
| `<Autocomplete>` | `src/components/Autocomplete.js` | Command suggestion popup |
| `<ConfirmationModal>` | `src/components/ConfirmationModal.js` | Yes/No dialog |

---

## 5. Navigation & State

### window Stack
```
CLI Mode (default)
    │
    ├── TransactionManager Window
    │       │
    │       ├── AddTransaction Modal
    │       │
    │       ├── EditTransaction Modal
    │       │
    │       └── ConfirmationModal
    │
    ├── LabelManager Window
    │       │
    │       ├── AddLabel Modal
    │       │
    │       └── AddRule Modal
    │
    ├── Labelizer Window
    │
    └── Analytics Window
            
            └── ExportModal
```

### State Management
- **Global State**: Current window, command history, theme
- **Window State**: Filters, selections, scroll position
- **Form State**: Temporary input values

### Route Map

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `<CLIMode>` | Main command interface |
| `/transactions` | `<TransactionWindow>` | Transaction manager |
| `/labels` | `<LabelWindow>` | Label manager |
| `/labelize` | `<LabelizerWindow>` | Bulk labeling tool |
| `/analyze` | `<AnalyticsWindow>` | Analytics dashboard |

---

## 6. Styling & Theme

### Color Palette

| Name | Code | Usage |
|------|------|-------|
| Primary | `#5865F2` (Discord blue) | Accents, selection |
| Success | `#3BA55C` | Positive amounts, confirmations |
| Danger | `#ED4245` | Negative amounts, errors |
| Warning | `#FAA61A` | Warnings, attention |
| Text | `#DCDDDE` | Primary text |
| Text Muted | `#72767D` | Secondary text |
| Background | `#0E0E0E` / `#1E1E1E` | Dark theme base |
| Surface | `#252627` | Card/window backgrounds |

### Typography
- **Font**: System default (terminal font)
- **Bold**: For headers and emphasis
- **Italic**: For placeholders and hints
- **Underline**: For interactive elements

### Spacing
- `1 unit` = 1 character width
- `padding: 1` = 1 space around
- `margin: 1` = 1 space outside

---

## 7. Technical Implementation Notes

### Ink Version
```bash
npm install ink @inkjs/ui
```

### Project Structure
```
src/
├── components/          # Reusable components
│   ├── CommandInput.js
│   ├── Window.js
│   ├── TransactionTable.js
│   └── ...
├── windows/             # Feature windows
│   ├── TransactionWindow.js
│   ├── LabelWindow.js
│   ├── LabelizerWindow.js
│   └── AnalyticsWindow.js
├── cli/                 # CLI mode
│   └── CLIMode.js
├── utils/               # Helpers
│   ├── api.js           # API client for Python backend
│   └── formatting.js    # Currency, date formatting
└── App.js               # Main app with window stack
```

### API Integration
The Ink TUI will communicate with your Python backend via API:

```javascript
// src/utils/api.js
const API_BASE = 'http://localhost:8000/api';

export async function getTransactions(filters = {}) {
  const res = await fetch(`${API_BASE}/transactions?${new URLSearchParams(filters)}`);
  return res.json();
}

export async function createTransaction(data) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}
```

### Window Management
```javascript
// src/App.js
import { useState } from 'react';
import { Box } from 'ink';
import CLIMode from './cli/CLIMode';
import TransactionWindow from './windows/TransactionWindow';
import LabelWindow from './windows/LabelWindow';

function App() {
  const [window, setWindow] = useState(null);

  const openWindow = (name) => setWindow(name);
  const closeWindow = () => setWindow(null);

  return (
    <Box flexDirection="column" height="100%">
      {window === null && <CLIMode onOpenWindow={openWindow} />}
      {window === 'transactions' && (
        <TransactionWindow onClose={closeWindow} />
      )}
      {window === 'labels' && (
        <LabelWindow onClose={closeWindow} />
      )}
      {/* ... other windows */}
    </Box>
  );
}
```

---

## 8. Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard only | All actions via keyboard shortcuts |
| Screen reader | Terminal emulators with ARIA support |
| Color blindness | High contrast, symbols + colors |
| Focus indicators | Underline or highlight focused elements |

---

## 9. Future Enhancements

- [ ] Existingshortcuts cheatsheet overlay
- [ ] Theme customization (light/dark/custom)
- [ ] Persistent layout preferences
- [ ] Undo/redo support
- [ ] Keyboard shortcut customization
- [ ] Multi-window support (split view)
- [ ] Search across all data
- [ ] Bookmark frequently used filters

---

## Appendix A: ASCII Layout Templates

### Full Window with Sidebar
```
┌─────────────────────────────────────────────────────────┐
│  TITLE                                              [X]   │
├────────────────────┬───────────────────────────────────┤
│  SIDEBAR            │ CONTENT                              │
│  width: ~25%        │ width: ~75%                          │
│  - Navigation      │ - Main data display                  │
│  - Filters          │ - Scrollable area                    │
│  - Quick actions    │ - Charts/tables                      │
├────────────────────┴───────────────────────────────────┤
│  FOOTER: Shortcuts and status                        │
└─────────────────────────────────────────────────────────┘
```

### Modal Dialog
```
┌─────────────────────────────┐
│  Modal Title           [X]   │
├─────────────────────────────┤
│  Content area                │
│  Form or message             │
├─────────────────────────────┤
│  [Primary Action] [Cancel]   │
└─────────────────────────────┘
```

### List with Selection
```
┌─────────────────────────────────────────┐
│  Title                                  │
├─────────────────────────────────────────┤
│  > Item 1 (selected)                    │
│    Item 2                               │
│    Item 3                               │
│    Item 4                               │
├─────────────────────────────────────────┤
│  [Select All] [Action] [Cancel]          │
└─────────────────────────────────────────┘
```
