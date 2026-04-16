# Labels

Build a personal spending taxonomy that matches your life, not the bank's generic categories.

## What the user wants to do

Define a hierarchy of labels to classify spending. Group → Category → Label. For example: `Living > Housing > Rent`, or `Fun > Going Out > Restaurants`.

## How it works

- Launch with `labels` from the home screen
- Displays full 3-tier hierarchy as a collapsible tree
- Expand / collapse nodes with space key
- Label ID never appears anywhere (only for backend). Only the label name appears to the user.
- When displaying a label, do not color the fond, only use a colored circle as suffix.

## Structure

```
Group (tier 1)
  └─ Category (tier 2)
       └─ Label (tier 3)
```

Tier 3 labels are what get assigned to transactions. Tier 1 and 2 are for organisation only.

## Outcome

A label hierarchy that maps to real spending habits, making analytics meaningful.

---

## Current label hierarchy

### Expense
| Category | Color | Labels |
|----------|-------|--------|
| Food | `#e67e22` | Groceries, Restaurants, Snacks / Takeout, Dietary supplements |
| Housing | `#3498db` | Rent, Utilities, Home insurance, Furniture / Equipment |
| Transport | `#AD97D3` | Public transport, Taxi / Rideshare, Fuel, Travel |
| Shopping | `#8b4513` | Electronics, Pleasure purchases, Gifts |
| Subscriptions & Telecom | `#95a5a6` | Phone, Internet, Streaming, Software, Gym |
| Going out & Leisure | `#e74c3c` | Outings, Parties, Sports, Culture |
| Health | `#1abc9c` | Doctor / Pharmacy, Health insurance |
| Personal care | `#e91e8a` | Haircut, Clothes, Shoes, Cosmetics |

### Earnings
| Category | Color | Labels |
|----------|-------|--------|
| Salary | `#2ecc71` | Net salary, Bonuses |
| Other income | `#f1c40f` | Reimbursements, Benefits, Side income, Family donation |

### Investment
| Category | Color | Labels |
|----------|-------|--------|
| Savings | `#08C952` | Livret A |
| Investment | `#ff7f50` | Skills, ETF, Real estate, Work tools / equipment |
