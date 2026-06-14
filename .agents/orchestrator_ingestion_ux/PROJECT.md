# Project: Telegram Business Bot Data Ingestion UX

## Architecture
- **Input Channels**: Telegram document upload (CSV/XLSX), Google Sheets link.
- **Data Engine**: Pandas core inside `superapp-business-bot` for file ingestion and initial data profiling.
- **Security & Integrations**: Google Service Account (`gspread`) for Sheets integration, Supabase for destination storage, IAM user mapping verification.
- **Interaction Model**: Telegram-native text, Markdown tables, Inline Buttons (no WebApps).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | UX Design Draft | Explore and draft the conversational UX flow, edge case fallbacks, and verification. | None | DONE |
| 2 | Consolidation & Document Generation | Write the finalized Markdown document to `docs/data_ingestion_ux.md`. | M1 | DONE |
| 3 | Review & Verification | Verify completeness and correctness of the output via Reviewer. | M2 | DONE |
| 4 | Refinement | Refine the final UX design document based on architectural challenge reports. | M3 | DONE |

## Interface Contracts
No direct code interface changes required for this UX/Design plan, but we will define standard Telegram message templates and states.
