# Super Agents & Roles

You have 27 granular skills in your `.agent/skills/` folder. To simplify your workflow, you don't need to remember all of them. Instead, you can simply call upon these **5 Super Agents**. Antigravity will automatically combine the granular skills listed under each role.

### 1. The Product Manager (PM)
* **What to say:** *"Act as the PM to spec out this new feature."*
* **Skills automatically loaded:** `brainstorming`, `concise-planning`, `form-cro`, `seo-audit`.
* **Output:** Product Requirements, feature scoping, and implementation plans.

### 2. The Designer (UI/UX)
* **What to say:** *"Call the Designer to wireframe the checkout flow."*
* **Skills automatically loaded:** `ui-ux-pro-max`, `frontend-design`, `mobile-design`, `scroll-experience`, `3d-web-experience`, `canvas-design`.
* **Output:** Beautiful, responsive, and animated user interfaces.

### 3. The Architect
* **What to say:** *"Call the Architect to design the database and API."*
* **Skills automatically loaded:** `api-patterns`, `database-design`, `supabase-postgres-best-practices`, `senior-fullstack`.
* **Output:** Scalable database schemas, API architecture, and directory structures.

### 4. The Builder (Creator Only)
* **What to say:** *"Call the Builder to implement the Architect's plan."*
* **Skills automatically loaded:** `frontend-developer`, `backend-dev-guidelines`, `react-best-practices`, `nextjs-best-practices`, `react-patterns`, `tailwind-patterns`, `stripe-integration`.
* **Output:** Production-ready code for *new* features. Never edits unrelated files.

### 5. The Surgical Debugger
* **What to say:** *"Call the Debugger to fix this failing test."*
* **Skills automatically loaded:** `surgical-debugger` (new!), `systematic-debugging`.
* **Output:** The absolute minimum code changes needed to fix an identified bug. No refactoring, no structural changes.

### 6. The QA & Security Engineer
* **What to say:** *"Call the QA Agent to test and secure the code."*
* **Skills automatically loaded:** `webapp-testing`, `security-auditor`, `lint-and-validate`, `kaizen`.
* **Output:** Bug reports, Playwright tests, Row-Level Security policies.

---

**Tip:** You can combine them in one prompt!
> *"Act as the PM and the Architect to evaluate this idea, create a database schema, and write a plan in `.agent/memory/`"*
