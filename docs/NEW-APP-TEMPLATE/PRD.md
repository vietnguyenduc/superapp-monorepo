---
app: <APP_NAME>
doc_type: PRD
---

# <APP_NAME> — Product Requirements

## Problem

<!-- What user problem does this app solve? -->

## Goals

- Mobile-first, Vietnamese UI.
- Consistent with Superapp design/auth/RBAC.

## In scope

- Dashboard
- CRUD flows
- Reports / exports

## Out of scope

- Schema-per-tenant
- New backend framework (use Supabase + `packages/api` Fastify)

## User stories

- As an admin, I can manage company users and settings.
- As a staff user, I can perform operations within my permissions.

## Non-functional requirements

- Vietnamese-first labels
- Responsive design
- Friendly error messages
