# TUI Frontend — Overview

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| UI framework | [Ink](https://github.com/vadimdemedes/ink) — React for the terminal |
| Components | React (JSX) |
| Text input | `ink-text-input` |
| Spinner | `ink-spinner` |
| HTTP client | `utils/api.js` — thin fetch wrapper over the FastAPI backend |

## Entry point

`src/cli.jsx` bootstraps Ink and mounts `<App />` into the terminal.

## App shell

`src/App.jsx` is the root component. It owns:

- **Terminal size** — listens to `stdout` resize events, passes `rows`/`cols` down
- **Active window** — single `activeWindow` state (`null` | `"transactions"` | `"labels"` | `"labelize"` | `"analyze"` | `"import"`)
- **BottomBar** — always rendered at the bottom (app name + version)

When `activeWindow === null`, the home screen (`CLIMode`) is shown centred in the terminal.

```
┌─────────────────────────────────────────┐
│                                         │
│           Logo + CommandInput           │  ← CLIMode (home)
│                                         │
├─────────────────────────────────────────┤
│ budget                            v1.0  │  ← BottomBar (always visible)
└─────────────────────────────────────────┘
```

## Window layout

Every window is wrapped in `<Window>` which renders a full-terminal rounded border, a title bar, a horizontal rule, scrollable content, and an optional footer hint bar.

```
╭─ WINDOW TITLE ──────────────────── Esc: Back ─╮
│ ──────────────────────────────────────────── │
│                                               │
│  (content area — flexGrow 1)                  │
│                                               │
│ ──────────────────────────────────────────── │
│ ↑↓:nav │ Space:select │ d:delete │ ...        │
╰───────────────────────────────────────────────╯
```

Window height = terminal rows − 1 (reserves the bottom row for BottomBar).

## Home screen (`CLIMode`)

Slash-command input. Type `/` to trigger autocomplete over the command list:

| Command | Opens |
|---------|-------|
| `/transactions` | Transaction list |
| `/labels` | Label manager |
| `/labelize` | Labelizer |
| `/analyze` | Analytics |
| `/import` | CSV importer |
| `/quit` | Exit |

Tab autocompletes. Enter confirms.

## Theme

Defined in `src/utils/theme.js`:

| Token | Color | Used for |
|-------|-------|---------|
| `primary` | `#5865F2` | Borders, cursor, selected items |
| `success` | `#3BA55C` | Positive amounts, income |
| `danger` | `#ED4245` | Negative amounts, expenses, errors |
| `warning` | `#FAA61A` | Loading states, rule form, modals |
| `text` | `#DCDDDE` | Regular text |
| `textMuted` | `#72767D` | Dates, labels, footer hints |

Amount color is driven by `amountColor(amount)` — green if ≥ 0, red otherwise.
