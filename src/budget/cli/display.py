from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from .colors import palette_display_lines

console = Console()


def print_transactions_table(transactions: list[dict], title: str = "Transactions") -> None:
    if not transactions:
        console.print("[dim]No transactions found.[/dim]")
        return

    table = Table(title=title, show_lines=False)
    table.add_column("ID", style="dim", max_width=12)
    table.add_column("Date", style="cyan")
    table.add_column("Description")
    table.add_column("Amount", justify="right")
    table.add_column("Label")

    for tx in transactions:
        label_text = tx.get("label", "")
        table.add_row(
            tx["id"][:12],
            tx["date"],
            tx["description"],
            f"{tx['amount']:.2f}",
            label_text if label_text and label_text != "None" else "",
        )

    console.print(table)


def print_labels_table(labels: list[dict], title: str = "Labels") -> None:
    if not labels:
        console.print("[dim]No labels defined.[/dim]")
        return

    table = Table(title=title, show_lines=False)
    table.add_column("Name")
    table.add_column("Color")
    table.add_column("Preview")

    for lb in labels:
        swatch = Text("\u2588\u2588\u2588", style=lb["color"])
        table.add_row(lb["name"], lb["color"], swatch)

    console.print(table)


def print_color_palette() -> None:
    """Display the color palette as a numbered grid."""
    entries = palette_display_lines()
    cols = 3
    rows_data = [entries[i : i + cols] for i in range(0, len(entries), cols)]

    lines: list[Text] = []
    for row in rows_data:
        line = Text()
        for num, name, hex_code in row:
            line.append(f"{num:>2}. ")
            line.append("\u2588\u2588 ", style=hex_code)
            line.append(f"{name:<12}")
        lines.append(line)

    panel = Panel(
        "\n".join(str(line) for line in lines),
        title="Color palette",
        border_style="dim",
    )
    console.print(panel)


def print_transaction_panel(tx: dict, index: int, total: int) -> None:
    """Display a single transaction in a panel for labelize."""
    label = tx.get("label", "")
    label_display = label if label and label != "None" else "[dim]unlabeled[/dim]"

    content = Text()
    content.append(tx["date"], style="cyan")
    content.append("  ")
    amount = tx["amount"]
    style = "red" if amount < 0 else "green"
    content.append(f"{amount:.2f}", style=style)
    content.append(f"\n{tx['description']}")

    panel = Panel(
        content,
        title=f"Transaction {index}/{total}",
        subtitle=f"Label: {label_display}",
        border_style="blue",
    )
    console.print(panel)


def print_label_choices(labels: list[dict]) -> None:
    """Display labels as numbered choices for labelize."""
    line = Text()
    for i, lb in enumerate(labels, 1):
        line.append(f"[{i}] ")
        line.append("\u2588\u2588 ", style=lb["color"])
        line.append(f"{lb['name']}  ")

    console.print(line)
    console.print("[dim][n] new label  [s] skip  [q] quit[/dim]")
