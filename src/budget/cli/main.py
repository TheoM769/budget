from datetime import date
from typing import Optional

import typer

from .client import BudgetClient
from .colors import resolve_color
from .display import (
    console,
    print_color_palette,
    print_label_choices,
    print_labels_table,
    print_transaction_panel,
    print_transactions_table,
)

app = typer.Typer(help="Budget CLI")
tx_app = typer.Typer(help="Manage transactions")
label_app = typer.Typer(help="Manage labels")
app.add_typer(tx_app, name="tx")
app.add_typer(label_app, name="label")

API_URL_OPTION = typer.Option("http://localhost:8000", envvar="BUDGET_API_URL")


def _client(api_url: str) -> BudgetClient:
    return BudgetClient(api_url)


# ── Transaction commands ──────────────────────────────────────────


@tx_app.command("upload")
def tx_upload(
    file: str = typer.Argument(..., help="Path to CSV file"),
    api_url: str = API_URL_OPTION,
) -> None:
    """Upload a CSV file of transactions."""
    client = _client(api_url)
    new = client.upload(file)
    print_transactions_table(new, title="New transactions added")


@tx_app.command("list")
def tx_list(
    date_from: Optional[str] = typer.Option(None, "--from", help="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = typer.Option(None, "--to", help="End date (YYYY-MM-DD)"),
    description: Optional[str] = typer.Option(None, "--desc", help="Regex filter on description"),
    amount_op: Optional[str] = typer.Option(None, "--amount-op", help="Amount operator: gt, ge, lt, le, eq"),
    amount_value: Optional[float] = typer.Option(None, "--amount-value", help="Amount value to compare"),
    api_url: str = API_URL_OPTION,
) -> None:
    """List transactions with optional filters."""
    client = _client(api_url)
    txs = client.list_transactions(
        date_from=date.fromisoformat(date_from) if date_from else None,
        date_to=date.fromisoformat(date_to) if date_to else None,
        description=description,
        amount_op=amount_op,
        amount_value=amount_value,
    )
    print_transactions_table(txs)


@tx_app.command("remove")
def tx_remove(
    ids: list[str] = typer.Argument(..., help="Transaction ID(s) to remove"),
    api_url: str = API_URL_OPTION,
) -> None:
    """Remove transactions by ID."""
    client = _client(api_url)
    removed = client.remove_transactions(ids)
    print_transactions_table(removed, title="Removed transactions")


@tx_app.command("modify")
def tx_modify(
    ids: list[str] = typer.Argument(..., help="Transaction ID(s) to modify"),
    description: Optional[str] = typer.Option(None, "--desc", help="New description"),
    label: Optional[str] = typer.Option(None, "--label", help="Label name to assign"),
    api_url: str = API_URL_OPTION,
) -> None:
    """Modify description and/or label of transactions."""
    client = _client(api_url)
    modified = client.modify_transaction(ids, description=description, label=label)
    print_transactions_table(modified, title="Modified transactions")


# ── Label commands ────────────────────────────────────────────────


@label_app.command("list")
def label_list(api_url: str = API_URL_OPTION) -> None:
    """List all labels."""
    client = _client(api_url)
    labels = client.list_labels()
    print_labels_table(labels)


@label_app.command("create")
def label_create(
    name: str = typer.Argument(..., help="Label name"),
    color: Optional[str] = typer.Option(None, "--color", help="Hex color (e.g. #ff5733). Omit to pick from palette."),
    api_url: str = API_URL_OPTION,
) -> None:
    """Create a new label."""
    if color is None:
        color = _prompt_color()
        if color is None:
            console.print("[red]Invalid color choice.[/red]")
            raise typer.Exit(1)

    client = _client(api_url)
    label = client.create_label(name, color)
    console.print(f"[green]Label '{label['name']}' created with color {label['color']}[/green]")


@label_app.command("modify")
def label_modify(
    name: str = typer.Argument(..., help="Label name to modify"),
    new_name: Optional[str] = typer.Option(None, "--name", help="New label name"),
    color: Optional[str] = typer.Option(None, "--color", help="New hex color. Use 'pick' to show palette."),
    api_url: str = API_URL_OPTION,
) -> None:
    """Modify a label's name and/or color."""
    if color == "pick":
        color = _prompt_color()
        if color is None:
            console.print("[red]Invalid color choice.[/red]")
            raise typer.Exit(1)

    client = _client(api_url)
    label = client.modify_label(name, new_name=new_name, color=color)
    console.print(f"[green]Label updated: '{label['name']}' ({label['color']})[/green]")


@label_app.command("remove")
def label_remove(
    names: list[str] = typer.Argument(..., help="Label name(s) to remove"),
    api_url: str = API_URL_OPTION,
) -> None:
    """Remove labels by name."""
    client = _client(api_url)
    removed = client.remove_labels(names)
    print_labels_table(removed, title="Removed labels")


# ── Labelize command ──────────────────────────────────────────────


@app.command("labelize")
def labelize(api_url: str = API_URL_OPTION) -> None:
    """Interactively assign labels to unlabeled transactions."""
    client = _client(api_url)
    all_txs = client.list_transactions()
    unlabeled = [tx for tx in all_txs if not tx.get("label") or tx["label"] == "None"]

    if not unlabeled:
        console.print("[green]All transactions are labeled![/green]")
        return

    total = len(unlabeled)
    console.print(f"[bold]{total} unlabeled transaction(s) to review.[/bold]\n")

    for i, tx in enumerate(unlabeled, 1):
        labels = client.list_labels()
        print_transaction_panel(tx, i, total)
        print_label_choices(labels)

        while True:
            choice = console.input("\n> ").strip().lower()

            if choice == "q":
                console.print("[yellow]Quitting. Progress has been saved.[/yellow]")
                return

            if choice == "s":
                console.print("[dim]Skipped.[/dim]\n")
                break

            if choice == "n":
                label = _prompt_new_label(client)
                if label is not None:
                    client.modify_transaction([tx["id"]], label=label["name"])
                    console.print(f"[green]Labeled as '{label['name']}'[/green]\n")
                break

            # Try to pick by number
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(labels):
                    selected = labels[idx]
                    client.modify_transaction([tx["id"]], label=selected["name"])
                    console.print(f"[green]Labeled as '{selected['name']}'[/green]\n")
                    break
                else:
                    console.print("[red]Invalid number. Try again.[/red]")
            except ValueError:
                console.print("[red]Invalid input. Enter a number, 'n', 's', or 'q'.[/red]")

    console.print("[bold green]Done! All unlabeled transactions reviewed.[/bold green]")


# ── Helpers ───────────────────────────────────────────────────────


def _prompt_color() -> str | None:
    """Show color palette and prompt user to pick."""
    print_color_palette()
    choice = console.input("Pick a color (number, name, or #hex): ").strip()
    return resolve_color(choice)


def _prompt_new_label(client: BudgetClient) -> dict | None:
    """Prompt the user to create a new label inline."""
    name = console.input("Label name: ").strip()
    if not name:
        console.print("[red]Name cannot be empty.[/red]")
        return None

    color = _prompt_color()
    if color is None:
        console.print("[red]Invalid color choice.[/red]")
        return None

    try:
        return client.create_label(name, color)
    except Exception as e:
        console.print(f"[red]Error creating label: {e}[/red]")
        return None


if __name__ == "__main__":
    app()
