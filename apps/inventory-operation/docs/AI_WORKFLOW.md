# AI-Native Development Workflow — Inventory Operation System

> **Pattern copied from cashflow app (`apps/cashflow/docs/AI_WORKFLOW.md`)**

## Multi-Agent System Architecture

10 specialized AI agents collaborate on development:

| # | Agent | Role |
|---|-------|------|
| 1 | Product Manager | Requirements, specs, user stories |
| 2 | Architect | System design, tech decisions |
| 3 | UI/UX Designer | Interface design, user experience |
| 4 | Frontend Developer | React components, hooks, pages |
| 5 | Backend Developer | Supabase schema, RLS, Edge Functions |
| 6 | Database Engineer | Migrations, optimization, constraints |
| 7 | DevOps Engineer | Deployment, CI/CD, infrastructure |
| 8 | QA Engineer | Testing, bug reports, validation |
| 9 | Technical Writer | Documentation, guides |
| 10 | Project Manager | Coordination, timelines, tracking |

## Workflow

1. **Product Manager** defines feature requirements
2. **Architect** designs system architecture
3. **UI/UX Designer** creates mockups and interaction flows
4. **Backend + Database** implement schema and APIs
5. **Frontend** implements UI with real data
6. **QA** tests and reports issues
7. **DevOps** deploys to production
8. **Technical Writer** updates documentation

## Memory-Driven Development

- Each agent maintains context in memory system
- Cross-references between agent memories
- Shared knowledge graph for project state
- Automated testing validates each phase

## Inventory-Specific Rules (from `PROJECT_RULES.md`)

- All UI text in Vietnamese
- TypeScript strict mode, no `any`
- Max 200 rows per bulk import
- Server-side validation required
- Quantities must never go negative
- `businessCode` unique per company
- RLS policies on all tables