## Transactions

### Port — `TransactionReader` (`src/budget/ports/transaction_reader.py`)

```python
def read_transactions(self, content: str) -> list[Transaction]
```
Parse raw file content into transactions. Encoding is handled by the caller before this is invoked.

### Port — `TransactionStore` (`src/budget/ports/transaction_store.py`)

```python
def read(self) -> list[Transaction]
```
Return all persisted transactions. No filtering — filtering is the caller's responsibility.

```python
def write(self, transactions: list[Transaction]) -> list[Transaction]
```
Persist transactions. Skip duplicates (same id). Return only the newly written records.

```python
def remove(self, ids: str | list[str]) -> list[Transaction]
```
Delete by id. Return removed records.

```python
def modify(
    self,
    ids: str | list[str],
    description: Optional[str] = None,
    label: Optional[str] = None,
) -> list[Transaction]
```
Update `description` and/or `label` on matching transactions. `label` is a label **name** resolved to id internally. Raise `ValueError` if label name does not exist. Return modified records.

### Service — `TransactionManager` (`src/budget/services/transaction_manager.py`)

Instantiated with a `TransactionReader` and a `TransactionStore`.

- **Import**: decode file content → parse via reader → write via store (dedup) → delegate to `RuleEngine` to apply all rules on new records.
- **List**: read all from store → apply `TransactionFilter` in memory.
- **Modify / Remove**: delegate directly to store.

---

## Labels

### Port — `LabelStore` (`src/budget/ports/label_store.py`)

```python
def list(self, tier: Optional[Tier] = None) -> list[Label]
```
Return all labels, optionally filtered by tier.

```python
def get(self, label_id: str) -> Label | None
```
Return label by id.

```python
def get_by_name(self, name: str) -> Label | None
```
Return tier-3 label by name. Returns `None` if not found.

```python
def get_color(self, label_id: str) -> str | None
```
Return color for a label. Tier-3 labels inherit color from their tier-2 parent.

```python
def create(self, name: str, parent_id: str) -> Label
```
Create tier-3 label under a tier-2 parent. Raise `ValueError` if parent is not tier-2 or name already exists.

```python
def modify(self, name: str, new_name: Optional[str] = None) -> Label
```
Rename a tier-3 label by current name. Raise `ValueError` if not found or new name already taken.

```python
def remove(self, names: str | list[str]) -> list[Label]
```
Delete tier-3 labels by name. Return removed records.

**Seed data**: on first init (no file), populate the full default hierarchy (groups → categories → labels).

---

## Rules

### Port — `RuleStore` (`src/budget/ports/rule_store.py`)

```python
def list(self) -> list[Rule]
```

```python
def create(self, pattern: str, label_id: str) -> Rule
```
Validate regex compiles. Validate `label_id` references a tier-3 label. Raise `ValueError` otherwise.

```python
def remove(self, ids: str | list[str]) -> list[Rule]
```
Delete by id. Return removed records. Does not revert already-applied labels.

```python
def apply(self, transactions: list[Transaction]) -> list[Transaction]
```
Apply all rules to the given transactions. Only unlabelled transactions are affected. First matching rule wins. Persist label changes to `TransactionStore`. Return modified transactions.

### Service — `RuleEngine` (`src/budget/services/rule_engine.py`)

Instantiated with a `RuleStore` and a `TransactionStore`.

- **On rule creation**: create rule → apply it to all existing transactions.
- **On transaction import**: apply all rules to newly imported transactions.
- **On manual re-apply**: apply all rules to all transactions.
