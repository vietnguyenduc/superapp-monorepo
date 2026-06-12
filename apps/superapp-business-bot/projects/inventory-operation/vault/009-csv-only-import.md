# ADR 009 — CSV-Only Import / Export

## Status

**Accepted**

## Context

Users need to import bulk data (products, inventory records). Multiple format options: CSV, Excel (.xlsx), JSON. Excel parsing requires heavy library (xlsx ~500KB).

## Decision

**Support CSV as primary format; Excel import via conversion to CSV; export CSV only.**

Rationale:
- CSV is universally supported by spreadsheet tools
- Smaller bundle size (no xlsx library in production)
- Faster parsing
- Users can prepare data in Excel and "Save As CSV"

Implementation:
- Upload: accept `.csv` and `.xlsx` (convert xlsx client-side if needed)
- Export: `.csv` only
- Templates: provide `.csv` download templates

## Consequences

### Positive
- Smaller bundle size
- Faster import processing
- Universal compatibility
- Simpler validation logic

### Negative
- Users must convert Excel to CSV manually (if no xlsx library)
- No rich formatting in exports
- Unicode handling (UTF-8 BOM) needed for Excel to recognize Vietnamese characters

## Related

- `apps/inventory-operation/docs/PROJECT_RULES.md` — Import / Export Rules