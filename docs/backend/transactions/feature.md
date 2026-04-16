## Features

- Ingest transaction data from the user and make it persistent. Default label is None.
- Interact (Create, Read, Update, Delete) with stored transactions.

## Data model

Data models (Pydantic schemas) live in `src/budget/models`.

## Specs

| File | Describes |
|------|-----------|
| [transaction_manager.md](./transaction_manager.md) | Ports and service for transaction ingestion and storage |
| [labels.md](./labels.md) | Port for the label hierarchy used to categorise transactions |
| [rules.md](./rules.md) | Port and service for auto-labelling rules |
| [python_backend.md](./python_backend.md) | Implementation guidelines for ports, adapters, and services |
| [api.md](./api.md) | Implementation guidelines and full endpoint specs |
