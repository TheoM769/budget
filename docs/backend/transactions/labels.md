# Labels

## Overview

Labels organise transactions into a strict 3-tier hierarchy: Group → Category → Label. Only tier-3 labels are assigned to transactions. The upper tiers exist solely for grouping and display.

## Hierarchy

```
Tier 1 — Group       broad domain        (e.g. "Living")
  Tier 2 — Category  named bucket        (e.g. "Food")
    Tier 3 — Label   assignable unit     (e.g. "Groceries")
```

Tier-2 categories carry a color used for visual grouping in analytics.

## Port 1 : Label manager

Browse : Retrieve all labels, optionally filtered by tier. Also available as a fully nested tree for rendering the complete hierarchy at once.
Create : Add a new tier-3 label under an existing tier-2 category.
Rename : Change the name of any label.
Delete : Remove one or more labels. Transactions that reference a deleted label become unlabelled.
