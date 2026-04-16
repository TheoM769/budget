# Python Backend — Implementation Guidelines

Hexagonal architecture. Dependencies point inward only.

```
models/      — data shapes (Pydantic)
ports/       — abstract interfaces (ABC)
adapters/    — concrete implementations
services/    — business logic coordinating ports
```

## Conventions

### Models (`src/budget/models/`)
- One file per domain entity. Use `pydantic.BaseModel`.
- Optional fields default to `None` or `""` — never omitted.
- No I/O, no business logic.

### Ports (`src/budget/ports/`)
- One class per feature. Technology-agnostic — defines what, not how.
- Extend `abc.ABC`. Every method decorated with `@abstractmethod`.
- Signatures are the contract between services and adapters — keep stable.
- Raise `ValueError` for domain violations (not found, invalid reference, duplicate). Never raise HTTP exceptions.
- Docstrings state invariants and return semantics.

### Services (`src/budget/services/`)
- One class per feature.
- Instantiated with port instances via `__init__`.
- Owns logic that spans multiple ports.
- No I/O — delegates all persistence to injected ports.

### Adapters (`src/budget/adapters/`)
- One file per concrete implementation of one port.
- Column names as module-level constants (`COL_ID`, `COL_NAME`, …). `FIELDNAMES` list controls column order.
- Two private methods: `_read_all() -> list[Model]` and `_write_all(items)`.
- All public methods: read all → mutate in memory → write all.
- External dependencies injected via `__init__`, stored as `self._dep`.
- If storage file absent on init, create it (empty or with seed data via `_build_seed_data()`).

### Cross-cutting
- Batch operations accept `str | list[str]` — normalise to list at top of method.
- `remove` and `modify` return a count.