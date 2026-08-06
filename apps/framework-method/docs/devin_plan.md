# Plan: Task-first framework-method

## Decisions from review

1. **Mọi task đều có framework** — không có task "plain" không có framework.
2. **Tổng quan = Dashboard** — gộp thành một màn duy nhất là danh sách việc hôm nay.
3. **Framework không giới hạn template** — Builder/Daily Mix cho phép mix nhiều template thành một framework chung; mọi việc trong ngày đều chạy theo framework chung này.
4. **Tạo task mới → luôn mở wizard** để áp dụng framework. Mở task có sẵn → hiển thị đầy đủ luôn (progress, reflection, kết quả).
5. **Mỗi việc dùng chung framework** nhưng có **state riêng** (bước đang làm, câu trả lời, session). Framework chỉnh tại Builder, áp dụng toàn bộ.

## Goal
Transform the app into a **task-first daily dashboard**:
- First screen = today's tasks.
- Creating a new task immediately starts a wizard that runs the shared daily framework for that task.
- Tapping an existing task shows its full progress and lets the user continue/finish it.
- Builder edits the shared framework (Daily Mix) used by every task.
- Calendar / History aggregate tasks and their per-task framework runs.

## Data model changes

### `Task` type
```ts
export interface Task {
  id: string;
  title: string;
  group: string;
  category?: string;
  subCategory?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  date: string;                   // ISO date (today)
  createdAt: string;
  updatedAt: string;
}
```

### `TaskRun` (new)
Stored in `FrameworkProgress` under `taskRuns: Record<string, TaskRun>`.
```ts
export interface TaskRun {
  taskId: string;
  currentStep: number;             // 1-based
  completedSteps: number[];
  reflections: Record<string, ReflectionEntry>;
  sessions: FrameworkSession[];
  startedAt: string;
  lastUpdated: string;
}
```

### `FrameworkProgress`
- Remove global `currentStep`, `completedSteps`, `reflections` as main state; keep them only for backward-compat/legacy (or remove if safe).
- Add `taskRuns: Record<string, TaskRun>`.
- Keep `templates`, `activeTemplateId`, `dailyTemplateIds` (set in Builder) as the shared daily framework source.

## New / updated pages

### 1. `Dashboard` (replaces Overview)
- Header: date + summary.
- Summary cards: total tasks, done, in progress, todo, grouped by `group`.
- Main list: today's tasks grouped by `group` or status.
- Each task card shows:
  - Title, group, priority badge, status.
  - Framework progress: `x/y bước`.
  - Action:
    - `todo` → "Bắt đầu".
    - `in_progress` → "Tiếp tục".
    - `done` → "Xem lại".
- Floating/primary button "+ Tạo việc" → open create-task flow.

### 2. Create task → TaskWizard
- **Step A (quick task info):** title, group, category, subcategory, priority.
- **Step B (wizard start):** immediately after creation, navigate to `/tasks/:taskId` and render the shared framework wizard for that task.
- The first visible block of the framework can ask for task context; the task title is shown in the wizard header.

### 3. `TaskWizard` (`/tasks/:taskId`)
- Header: task title, shared framework name, progress bar, back to Dashboard.
- Renders the same step cards as current `Step`, but uses `taskRuns[taskId]`.
- Reflections, block answers, and step completion are stored per task.
- "Hoàn tất bước & Tiếp tục" advances within the task.
- Last step: "Hoàn tất việc" marks task `done` and logs a session for the task.

### 4. `Overview` → redirect/merge
- `/overview` redirects to `/dashboard`.
- Remove `Overview.tsx` or simplify it to a redirect.

### 5. `Steps` page
- Change `/steps` to a list of today's tasks with framework/run status, or remove if redundant.
- If kept, each row expands to show phases/steps of the shared framework and per-task progress.

### 6. `Builder`
- Keep editing the shared daily framework (via `dailyTemplateIds`).
- "Daily Mix" stays as the way to compose the shared framework from multiple templates.
- Active framework / template list still set here.

### 7. `Calendar` / `History`
- Aggregate `tasks` and `taskRuns[].sessions`.
- Show task completion and framework runs per day.

## API / context changes

In `ProgressContext`:
- `createTask(taskInfo)` → creates `Task` + `TaskRun` (empty, `currentStep: 1`).
- `startTask(taskId)` → sets `status: in_progress`.
- `saveTaskReflection(taskId, blockId, section, text)`.
- `completeTaskStep(taskId, stepIndex)` → mark step completed, create task-level tasks? (no; this version does not generate child tasks; only the wizard stores answers).
- `finishTask(taskId)` → mark `done`, log session, set `currentStep` to last.
- `setTaskStatus(taskId, status)`.
- `deleteTask(taskId)`.
- `getDailySteps(progress)` remains and returns the shared framework steps from `dailyTemplateIds`.

## UI/UX notes
- Mobile-first: task cards, bottom nav active tab = Dashboard.
- Full-screen wizard when running a task.
- Use existing block cards, hints, reflection inputs, cross-template refs, show-if dependencies unchanged.

## Verification
- `npm run type-check -w framework-method`
- `npm run test -w framework-method`
- `npm run build -w framework-method`
- Local preview: create task → run wizard through shared framework → complete → check Dashboard/Calendar.
