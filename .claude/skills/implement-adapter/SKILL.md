---
name: implement-adapter
description: >
  Implement a new concrete adapter for an existing port in this project.
  Guides through creating the adapter file and implementing all abstract methods.
  Trigger when user says "implement adapter", "new adapter", "new storage backend", or /implement-adapter.
---

Implement a new adapter for an existing port. Follow adapter conventions in:
- `docs/backend/transactions/python_backend.md` — adapter structure, `_read_all`/`_write_all` pattern, dependency injection, seed data

## Steps

**1. Clarify the target**

If not already specified, ask:
- Which port is being implemented? (read `src/budget/ports/` to list options if unsure)
- What is the storage or integration mechanism? (e.g. SQLite, PostgreSQL, REST API, in-memory)
- Any dependencies on other ports? (e.g. TransactionStore depends on LabelStore)

**2. Read the port contract**

Read the target port file in `src/budget/ports/`. List every `@abstractmethod` — the adapter must implement all of them. Note any `ValueError` requirements stated in docstrings.

**3. Create the adapter file**

Location: `src/budget/adapters/<technology>_<resource>_<role>.py`
Examples: `sqlite_transaction_store.py`, `postgres_label_store.py`

Structure:
- Module-level column/field constants if the storage is tabular
- Class extending the port ABC
- `__init__` accepting storage config + any dependent port instances
- `_read_all` / `_write_all` private helpers (for stores with full-reload semantics)
- One method per abstract method from the port
- If storage file/table absent on init: create empty or seed with `_build_seed_data()`

**4. Implement each method**

For each abstract method:
- Match the exact signature from the port
- Raise `ValueError` in the same cases documented in the port docstring
- Batch operations: normalise `str | list[str]` to list at the top of the method
- `remove` and `modify` return affected records, not counts

**5. Wire it up (optional)**

If the user wants to switch the running app to use the new adapter, update the instantiation block at the top of `src/budget/api/app.py`.

**6. Check LSP diagnostics** after all edits. Fix any type errors or unimplemented abstracts before finishing.
