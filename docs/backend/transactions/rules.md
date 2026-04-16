# Rules

## Overview

Rules automate labelling by matching transaction descriptions against a pattern and assigning a tier-3 label on match. They reduce manual work when transactions follow predictable naming conventions.

**Pattern** — A regular expression matched against a transaction description.
**Label** — The tier-3 label applied on match.
**Immutability** — Rules cannot be edited. To change a rule, delete and recreate it.

# Implementation

## Port 1 : Rule Store

Browse : List all defined rules.

Create : Define a new rule with a regex pattern and a target tier-3 label id.
- Validate the regex compiles.
- Validate the label_id references an existing tier-3 label.

Delete : Remove one or more rules by id. Already-applied labels are not reverted.

Apply : Run all rules against a provided list of transactions.
- Only unlabelled transactions are affected.
- First matching rule wins — evaluation stops after first match per transaction.
- Persists label changes back to transaction storage.

## Service : Rule Engine

Service instantiated with a `Rule Store` and a `Transaction Storage`. Coordinates rule application across import and manual triggers.
