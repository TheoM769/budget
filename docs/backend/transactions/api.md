## Transaction Endpoints

### `POST /transactions/upload`
Upload a bank CSV export. Decode, parse, dedup, persist, then apply all existing rules to new records.

**Request**: `multipart/form-data`, field `file`.

**Response** `200`: array of newly created `Transaction` objects (duplicates excluded).

---

### `GET /transactions`
List transactions with optional filters. All parameters are optional and combinable.

**Query parameters**:

| Parameter      | Type  | Description                               |
|----------------|-------|-------------------------------------------|
| `date_from`    | date  | Inclusive lower bound (YYYY-MM-DD)        |
| `date_to`      | date  | Inclusive upper bound (YYYY-MM-DD)        |
| `description`  | str   | Regex matched against description         |
| `amount_op`    | enum  | `gt` / `ge` / `lt` / `le` / `eq`         |
| `amount_value` | float | Paired with `amount_op` — both or neither |

**Response** `200`: array of `Transaction` objects.

---

### `POST /transactions/modify`
Update description and/or label on one or more transactions.

**Request body**:
```json
{
  "ids":         "string | string[]",
  "description": "string (optional)",
  "label":       "string (optional) — tier-3 label name"
}
```

**Response** `200`: array of updated `Transaction` objects.
**Response** `400`: label name not found.

---

### `POST /transactions/remove`
Permanently delete one or more transactions.

**Request body**:
```json
{ "ids": "string | string[]" }
```

**Response** `200`: array of deleted `Transaction` objects.

---

## Label Endpoints

### `GET /labels`
List labels, optionally filtered by tier.

**Query parameters**: `tier` (int, optional) — `1`, `2`, or `3`.

**Response** `200`: flat array of `Label` objects.

---

### `GET /labels/tree`
Full label hierarchy as nested structure.

**Response** `200`:
```json
[{
  "id": "...", "name": "Group",
  "categories": [{
    "id": "...", "name": "Category", "color": "#hex",
    "labels": [{ "id": "...", "name": "Label" }]
  }]
}]
```

---

### `POST /labels`
Create a tier-3 label under an existing tier-2 category.

**Request body**:
```json
{ "name": "string", "parent_id": "string — tier-2 label id" }
```

**Response** `200`: created `Label` object.
**Response** `400`: parent not found or not tier-2, or name already exists.

---

### `POST /labels/{name}/modify`
Rename a label by current name.

**Request body**:
```json
{ "new_name": "string (optional)" }
```

**Response** `200`: updated `Label` object.
**Response** `400`: label not found or new name already taken.

---

### `POST /labels/remove`
Delete one or more labels by id.

**Request body**:
```json
{ "ids": "string | string[]" }
```

**Response** `200`: array of deleted `Label` objects.

---

## Rule Endpoints

### `GET /rules`

**Response** `200`: array of `Rule` objects.

---

### `POST /rules`
Create a rule, then immediately apply it to all existing transactions.

**Request body**:
```json
{ "pattern": "string — regex", "label_id": "string — tier-3 label id" }
```

**Response** `200`:
```json
{ "rule": { Rule }, "applied": 42 }
```
`applied` = number of transactions labelled by this rule.

**Response** `400`: invalid regex, or `label_id` not a valid tier-3 label.

---

### `POST /rules/remove`
Delete one or more rules. Already-applied labels are not reverted.

**Request body**:
```json
{ "ids": "string | string[]" }
```

**Response** `200`: array of deleted `Rule` objects.

---

### `POST /rules/apply`
Re-apply all rules to all transactions.

**Response** `200`:
```json
{ "applied": 42, "transactions": [ Transaction, ... ] }
```
`applied` = number of transactions whose label was updated.
