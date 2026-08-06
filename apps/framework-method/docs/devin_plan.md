# devin_plan — framework-method: task-driven daily dashboard

## Goal
Shift `apps/framework-method` from a "run one framework per day" view to a **daily task list**: each task belongs to a framework/template group, is created from framework blocks or added manually, and is tracked across the day. Overview answers: *bao nhiêu việc? thuộc nhóm gì? trạng thái nào?* while still letting users run/mix templates in Builder and step through them.

## Concept
- **Framework** = collection of steps & blocks (created in Builder).
- **Daily Mix** = one or more frameworks selected to run today.
- **Task** = concrete action derived from a framework block, a reflection answer, or a manual todo.
- **Group** = framework/template name (e.g. "Morning Check-in", "Deep Work", "Personal").
- Users can have many tasks per day; completing a task can be done independently or by completing the matching step.

## What is already done
- Template → Step → Block model persisted to `localStorage`.
- Builder: create/edit templates, add blocks, set reflection fields, reference answers, show-if dependencies, sample mix.
- Step page: block cards, reflection inputs, finalize step.
- Overview/Steps/Actions/Evening/History/Review/Calendar pages exist.
- Trial mode via `?trial_preview=true`, default Vietnamese, mobile bottom nav.

## Remaining work

### 1. Data model: Task
Add to `FrameworkProgress`:
```ts
interface Task {
  id: string;
  title: string;
  group: string;           // framework/template name or custom group
  templateId?: string;
  stepId?: string;
  blockId?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  notes?: string;
  date: string;            // ISO date
  createdAt: string;
  updatedAt: string;
}
```
Functions: `addTask`, `updateTask`, `toggleTask`, `deleteTask`, `tasksForDate`, `tasksByGroup`.

### 2. Overview becomes daily task dashboard
- Header: date, total tasks, done count, open count, grouped by framework.
- List tasks grouped by `group` (collapsible sections).
- Each task: checkbox/status, title, priority badge, swipe/fade when done.
- Quick-add task input with group + priority.
- Tap a task: open detail/edit (notes, group, status, link to framework step).
- Pull from `progress.tasks` filtered by `currentDate`.

### 3. Step page generates tasks
- When a user finalizes a step, derive tasks from blocks:
  - `short_text`/`reflection` with required input → task title = reflection answer or block label.
  - `multiple_choice`/`rating` → optional task based on block config.
  - `routing` block → task with group = target template.
- Allow marking block outputs as "create a task" in Builder (new block flag `createsTask: boolean` and `taskTitle` override).
- After step finalize, show generated tasks and let user edit before saving.

### 4. Builder: task-aware blocks
- Add block option "Tạo việc từ câu trả lời này" (`createsTask`).
- Optional task title template, default priority, group.
- Daily Mix still selects frameworks; tasks come from running them.

### 5. Calendar / History / Dashboard
- Calendar day cell shows task count + status dots grouped by framework.
- Week/Month/Quarter views show aggregated task completion per group (Framework / Actions / Reflections or by template).
- Dashboard metrics: open/done tasks today, tasks per framework, 7-day trend, streak from sessions/tasks.
- Evening / History: list completed tasks and reflections for the day.

### 6. Mobile UX
- Bottom nav keeps Overview, Steps, Actions, History, Builder.
- Overview list swipeable actions (edit/delete).
- Step page auto-creates tasks; small viewport stacks cards.

### 7. Repo hygiene
- Update `.devinignore` and blueprint if needed.
- Update `AI-CONTEXT` / `OVERVIEW` docs to reflect task-driven model.

### 8. Verification
- `npm run type-check -w framework-method`
- `npm run test -w framework-method`
- `npm run build -w framework-method`
- Local preview: create tasks, run framework, mark done, check Overview/Calendar.
- Manual Vercel preview → single PR to `main`.

## Non-goals
- No backend/Supabase persistence yet (localStorage only for trial).
- No new runtime dependencies.
- No PR until local preview is approved.

## Execution order
1. Add Task model + CRUD in `ProgressContext`.
2. Refactor Overview into task dashboard.
3. Step finalize → task generation.
4. Builder task-aware block options.
5. Calendar/History/Dashboard task-based aggregation.
6. Mobile polish.
7. Docs + build/test + local preview + Vercel preview + PR.

## Branch / commit rule
- Single branch `devin/current-feature`.
- Each file refactor committed with `[skip ci]`.
- One final PR to `main` after Vercel preview approval.
