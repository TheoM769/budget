---
name: backend-feature
description: >
  Design and write backend specs for a feature in docs/backend/. Each subfolder
  corresponds to one endpoint group. Creates or updates spec files and keeps
  endpoint.md as the entry point. Trigger when user says "write specs", "design feature",
  "spec endpoint", or /backend_feature.
---

Write specs for a backend feature. Output is markdown files in `docs/backend/<endpoint>/`.
Do not write implementation code — specs only.

## Step 1 — Select or create an endpoint group

List existing folders in `docs/backend/`. Ask the user:
- Use an existing endpoint group, or create a new one?
- If new: what is the name? (lowercase, hyphen-separated, matches the URL resource — e.g. `transactions`, `budgets`)

## Step 2 — Understand the feature

Ask the user to describe the feature. Capture:
- What problem it solves
- What operations it exposes (browse / create / modify / delete / other)
- Key domain concepts and constraints
- Any dependencies on other endpoint groups

If the endpoint group already has specs, read them first to understand existing scope before asking.

## Step 3 — Identify which spec files are needed

Each spec file covers one concern. Use only what applies:

| File | Covers |
|------|--------|
| `feature.md` | Overview, domain concepts, data model references |
| `<concept>.md` | One port + optional service per domain concept (e.g. `labels.md`, `rules.md`) |
| `python_backend.md` | Backend implementation guidelines: ports, adapters, services |
| `api.md` | API implementation guidelines + endpoint specs |

Reuse and extend existing files rather than creating new ones when the scope overlaps.

## Step 4 — Write the spec files

For each file being created or updated:

**`feature.md`** — high-level entry point:
- What the feature does (2–5 bullets)
- Reference to data models in `src/budget/models/`
- Table referencing all other spec files in this folder

**`<concept>.md`** — one file per domain concept that has its own port:
- Overview: what this concept is, key invariants
- Port N sections: list of operations with behaviour description (no signatures, no code)
- Service section (if a service coordinates multiple ports): what it orchestrates

**`python_backend.md`** — implementation rules for this endpoint group:
- Reference or extend `docs/backend/transactions/python_backend.md` conventions
- List all ports with their method signatures
- List all services with their responsibilities
- Adapter notes specific to this group (seed data, dependencies)

**`api.md`** — API spec for this endpoint group:
- Reference or extend `docs/backend/transactions/api.md` conventions
- One section per endpoint: method, path, request shape, response shape, error cases

## Step 5 — Create or update `endpoint.md`

`endpoint.md` is the single entry point for anyone implementing this feature. It must contain:
- One-paragraph description of the endpoint group
- Table of all spec files in the folder with a one-line description of each
- Nothing else — all detail lives in the referenced files
