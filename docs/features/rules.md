# Rules

Automate labeling. Define a pattern once — every matching transaction gets labeled, past and future.

## What the user wants to do

Stop manually labeling the same recurring transactions. "Every transaction whose description contains NETFLIX should be labeled Streaming." Set it once, never touch it again. The user should also be able to list and delete defined rules, from the transaction view.

## How it works

Rules are created from within the Transaction window or the Labelizer (key `c`). A form appears with two fields:

1. **Pattern** — text pattern to match against transaction descriptions (case-insensitive)
2. **Label** — the label to assign when the pattern matches

On save, the rule is stored and applied immediately to all existing transactions.

## Pattern matching

- Matched against the transaction description.
- Case-insensitive.
- The form pre-fills a suggested pattern extracted from the current transaction's description.

## Outcome

Labeling work decreases over time as rules accumulate. Only truly new or ambiguous transactions require manual attention.
