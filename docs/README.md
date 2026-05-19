# SuperApp Monorepo Documentation

> **Single entry point for all project documentation.**
> This monorepo contains multiple applications. Documentation is split into:
> - **Root `docs/`** — cross-app shared docs (architecture, design, dev setup, testing, deployment)
> - **`apps/cashflow/docs/`** — Cashflow app-specific docs (product spec, flows, database, UI/UX, user manuals)

---

## Quick Navigation

### Getting Started
| Doc | What it covers |
|-----|---------------|
| [QUICK-START.md](./QUICK-START.md) | First-time setup and running the project |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute, branch strategy, PR checklist |

### Architecture & Design
| Doc | What it covers |
|-----|---------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Monorepo structure, workspace management, Cashflow app stack |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | Apple-style UI theme, Tailwind patterns, component classes, layout, responsive design |

### Development
| Doc | What it covers |
|-----|---------------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Dev environment setup, ESLint/Prettier/TypeScript config, coding standards, project structure, i18n setup |
| [DATABASE.md](./DATABASE.md) | Supabase setup, schema overview, RLS policies, Edge Functions, seed data, data migration rules & tasks |
| [API.md](./API.md) | API endpoints, TypeScript interfaces, service layer patterns |

### Testing & QA
| Doc | What it covers |
|-----|---------------|
| [TESTING.md](./TESTING.md) | Testing strategy, unit/component/integration/E2E guides, UI QA checklist, data journey test plan |

### Deployment & Operations
| Doc | What it covers |
|-----|---------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment, environment variables, CI/CD, rollback procedures |
| [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) | Project tracking, milestone planning |

### End-User Docs
| Doc | Audience |
|-----|----------|
| [USER-GUIDE.md](./USER-GUIDE.md) | End users of the Cashflow app |

---

## Cashflow App Docs (`apps/cashflow/docs/`)

| Doc | What it covers |
|-----|---------------|
| [CASHFLOW-README.md](../apps/cashflow/docs/CASHFLOW-README.md) | **Master index** for Cashflow app docs |
| [current_state.md](../apps/cashflow/docs/current_state.md) | **Merged** — operational status, system constraints, database map |
| [MULTI-LEVEL-ADMIN.md](../apps/cashflow/docs/MULTI-LEVEL-ADMIN.md) | **Merged** — RBAC architecture, spec, flows, UI/UX, database design |
| [AI_WORKFLOW.md](../apps/cashflow/docs/AI_WORKFLOW.md) | **Merged** — AI-native development, 10-agent system, project rules |
| [architecture.md](../apps/cashflow/docs/architecture.md) | App architecture, tech stack, data flow |
| [product_spec.md](../apps/cashflow/docs/product_spec.md) | Product requirements, branch assignment spec |
| [DATA_FLOW_MAP.md](../apps/cashflow/docs/DATA_FLOW_MAP.md) | Transaction types data flow, legacy vs new records |
| [system_flows.md](../apps/cashflow/docs/system_flows.md) | System business flows |
| [transaction-type-architecture.md](../apps/cashflow/docs/transaction-type-architecture.md) | Transaction type design, lessons learned, anti-patterns |
| [user_manual_admin_company.md](../apps/cashflow/docs/user_manual_admin_company.md) | User manual — Admin Company role |
| [user_manual_staff.md](../apps/cashflow/docs/user_manual_staff.md) | User manual — Staff role |
| [trial-mode-feature-parity-analysis.md](../apps/cashflow/docs/trial-mode-feature-parity-analysis.md) | Trial mode analysis |
| [AI_CONTEXT.md](../apps/cashflow/docs/AI_CONTEXT.md) | AI agent context and system knowledge |
| [handover_checklist.md](../apps/cashflow/docs/handover_checklist.md) | Project handover checklist |

---

## Inventory App Docs (`apps/inventory-operation/docs/`)

| Doc | What it covers |
|-----|---------------|
| [README.md](../apps/inventory-operation/docs/README.md) | **Master index** for Inventory app docs |
| [CURRENT_STATE.md](../apps/inventory-operation/docs/CURRENT_STATE.md) | **Source of truth** — implementation status, phases, known issues |
| [ARCHITECTURE.md](../apps/inventory-operation/docs/ARCHITECTURE.md) | System architecture, tech stack, data flow |
| [AI_CONTEXT.md](../apps/inventory-operation/docs/AI_CONTEXT.md) | AI agent context, coding rules, anti-patterns |
| [AI_WORKFLOW.md](../apps/inventory-operation/docs/AI_WORKFLOW.md) | Multi-agent development workflow (10-agent system) |
| [PROJECT_RULES.md](../apps/inventory-operation/docs/PROJECT_RULES.md) | Coding rules specific to inventory app |
| [DATA_FLOW_MAP.md](../apps/inventory-operation/docs/DATA_FLOW_MAP.md) | Product / inventory / sales data flow & anti-patterns |
| [HANDOVER_CHECKLIST.md](../apps/inventory-operation/docs/HANDOVER_CHECKLIST.md) | Complete handover checklist |
| [USER_GUIDE.md](../apps/inventory-operation/docs/USER_GUIDE.md) | End-user guide for inventory operations |

---

## For AI Agents / Automated Review

**Start here** → read this `README.md`, then dive into the doc relevant to your task:
- **Reviewing code** → [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Database changes** → [DATABASE.md](./DATABASE.md)
- **UI/UX work** → [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
- **Testing/QA** → [TESTING.md](./TESTING.md)
- **Architecture questions** → [ARCHITECTURE.md](./ARCHITECTURE.md) + `apps/cashflow/docs/architecture.md` + `apps/inventory-operation/docs/ARCHITECTURE.md`
- **Product requirements (Cashflow)** → `apps/cashflow/docs/product_spec.md` + `apps/cashflow/docs/current_state.md`
- **Product requirements (Inventory)** → `apps/inventory-operation/docs/CURRENT_STATE.md`
- **Multi-level admin** → `apps/cashflow/docs/MULTI-LEVEL-ADMIN.md`
- **AI workflow** → `apps/cashflow/docs/AI_WORKFLOW.md` + `apps/inventory-operation/docs/AI_WORKFLOW.md`
- **Data flow patterns** → `apps/cashflow/docs/DATA_FLOW_MAP.md` + `apps/inventory-operation/docs/DATA_FLOW_MAP.md`
- **Inventory ADRs** → `apps/inventory-operation/docs/adr/*.md`
- **Inventory user manuals** → `apps/inventory-operation/docs/user_manual_*.md`
