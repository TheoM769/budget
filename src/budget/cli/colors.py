PALETTE: list[tuple[str, str]] = [
    ("red", "#e74c3c"),
    ("orange", "#e67e22"),
    ("yellow", "#f1c40f"),
    ("green", "#2ecc71"),
    ("blue", "#3498db"),
    ("purple", "#9b59b6"),
    ("pink", "#e91e8a"),
    ("teal", "#1abc9c"),
    ("brown", "#8b4513"),
    ("grey", "#95a5a6"),
    ("coral", "#ff7f50"),
    ("slate", "#607d8b"),
]


def palette_display_lines() -> list[tuple[int, str, str]]:
    """Returns (number, name, hex) tuples for display."""
    return [(i + 1, name, hex_code) for i, (name, hex_code) in enumerate(PALETTE)]


def resolve_color(choice: str) -> str | None:
    """Resolve a user choice (number, name, or raw hex) to a hex color code."""
    choice = choice.strip()

    # Direct hex input
    if choice.startswith("#") and len(choice) == 7:
        return choice

    # By number
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(PALETTE):
            return PALETTE[idx][1]
        return None
    except ValueError:
        pass

    # By name
    for name, hex_code in PALETTE:
        if name == choice.lower():
            return hex_code

    return None
