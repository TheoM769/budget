# Transactions

## Overview

A transaction represents a single financial event imported from a bank export. Transactions are immutable records — the source data is never altered. Only metadata (description, label) can be modified after import.

# Implementation

## Port 1 : Transaction ingestor

Load transactions from a bank export file provided by the user. The system detects duplicates and only persists new records. After import, auto-labelling rules are applied to the new transactions.

## Port 2 : Transaction Storage

Interact with persistent storage for transactions. CRUD (Create, Read, Update, Delete) operations.

Create : Write one or more transaction into the storage.

Read : Query can take optional filters as input, for each field present in `src/budget/models/transaction.py`.

Update : 
- Update the description of one or more transactions at once.
- Update the label of one or more transactions at once. See `docs/backend/features/labels.md` for label implementation.

Delete : Permanently remove one or more transactions.
- By ID
- Matching other filter conditions.

## Service : Transaction manager

Service that you instanciate with a specific implementation of `Transaction Reader` along with a specific implementation of `Transaction Storage`. Coordinates both services together.