import { useState, useMemo, KeyboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEdit3, FiCheck, FiPlus, FiTrash2, FiPlay } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps, type Task, type TaskPriority } from "../../hooks/useFrameworkProgress";

const priorityClass: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  high: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const priorityOptions: TaskPriority[] = ["low", "normal", "high"];

const PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#d946ef",
];

const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress, frameworkName, addTask, toggleTask, updateTask, deleteTask, renameTaskGroup, update } = useFrameworkProgress();

  const today = new Date().toISOString().split("T")[0];
  const tasks = useMemo(() => (progress.tasks || []).filter((task) => task.date === today), [progress.tasks, today]);
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);

  const [newTitle, setNewTitle] = useState("");
  const [newGroup, setNewGroup] = useState(frameworkName);
  const [newGroupInput, setNewGroupInput] = useState("");
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");

  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const group = task.group || frameworkName;
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(task);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks, frameworkName]);

  const existingGroups = useMemo(() => {
    const set = new Set<string>([frameworkName]);
    groupedTasks.forEach(([group]) => set.add(group));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [groupedTasks, frameworkName]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const categories = new Set(tasks.map((t) => t.category).filter(Boolean));
    const subCategories = new Set(tasks.map((t) => t.subCategory).filter(Boolean));
    return { total, done, inProgress, groups: groupedTasks.length, categories: categories.size, subCategories: subCategories.size };
  }, [tasks, groupedTasks.length]);

  const taskProgress = (task: Task) => {
    const run = progress.taskRuns[task.id];
    if (!run) return 0;
    const total = dailySteps.length || 1;
    const done = run.completedSteps.length;
    return Math.round((done / total) * 100);
  };

  const effectiveNewGroup = () => {
    if (isNewGroup) return newGroupInput.trim() || frameworkName;
    return newGroup.trim() || frameworkName;
  };

  const handleCreateTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    const task = addTask({
      title,
      group: effectiveNewGroup(),
      category: newCategory.trim() || undefined,
      subCategory: newSubCategory.trim() || undefined,
      status: "in_progress",
      priority: newPriority,
      date: today,
    });
    setNewTitle("");
    setNewGroup(frameworkName);
    setNewGroupInput("");
    setIsNewGroup(false);
    setNewCategory("");
    setNewSubCategory("");
    setNewPriority("normal");
    navigate(`/task/${task.id}`);
  };

  const startRenameGroup = (group: string) => {
    setEditingGroup(group);
    setGroupName(group);
    setGroupColor(progress.groupColors?.[group] || PALETTE[0]);
  };

  const saveRenameGroup = (oldGroup: string) => {
    const next = groupName.trim();
    if (next && next !== oldGroup) {
      renameTaskGroup(oldGroup, next, today);
      const colors = { ...progress.groupColors };
      if (colors[oldGroup]) {
        delete colors[oldGroup];
      }
      colors[next] = groupColor;
      update({ groupColors: colors });
    } else if (groupColor) {
      update({ groupColors: { ...progress.groupColors, [oldGroup]: groupColor } });
    }
    setEditingGroup(null);
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskTitle(task.title);
  };

  const saveEditTask = (taskId: string) => {
    const title = editTaskTitle.trim();
    if (title) {
      updateTask(taskId, { title });
    }
    setEditingTask(null);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === "Enter") action();
    if (e.key === "Escape") {
      setEditingGroup(null);
      setEditingTask(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("dashboard.today")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1 leading-tight">{frameworkName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("overview.taskSummary", { total: stats.total, done: stats.done, inProgress: stats.inProgress })}
            {stats.total > 0 && (
              <span className="ml-2 text-xs text-gray-400">
                {" · "}
                {[
                  `${stats.groups} ${t("overview.taskGroup")}`,
                  `${stats.categories} ${t("overview.taskCategory")}`,
                  `${stats.subCategories} ${t("overview.taskSubCategory")}`,
                ].join(" · ")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/builder?edit=active"
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600"
            aria-label={t("builder.editThisFramework")}
            title={t("builder.editThisFramework")}
          >
            <FiEdit3 className="w-5 h-5" />
          </Link>
          <button
            onClick={() => navigate("/steps")}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
            aria-label={t("nav.steps")}
            title={t("nav.steps")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("overview.addTask") || "Tạo việc mới"}</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => handleKey(e, handleCreateTask)}
            placeholder={t("overview.taskTitle")}
            className="flex-1 input"
          />
          <div className="flex items-center gap-2">
            {isNewGroup ? (
              <input
                type="text"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                onKeyDown={(e) => handleKey(e, handleCreateTask)}
                placeholder={t("overview.newGroup") || "Nhóm mới"}
                className="sm:w-40 input"
                autoFocus
              />
            ) : (
              <select
                value={newGroup}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__new__") {
                    setIsNewGroup(true);
                    setNewGroupInput("");
                  } else {
                    setNewGroup(value);
                  }
                }}
                className="sm:w-40 input"
              >
                {existingGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
                <option value="__new__">{t("overview.newGroupOption") || "+ Tạo nhóm mới"}</option>
              </select>
            )}
            {!isNewGroup && (
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: progress.groupColors?.[newGroup] || PALETTE[0] }}
                aria-hidden="true"
              />
            )}
          </div>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t("overview.taskCategory")}
            className="sm:w-36 input"
          />
          <input
            type="text"
            value={newSubCategory}
            onChange={(e) => setNewSubCategory(e.target.value)}
            placeholder={t("overview.taskSubCategory")}
            className="sm:w-36 input"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="sm:w-32 input"
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === "low" ? "Thấp" : p === "normal" ? "Bình thường" : "Cao"}
              </option>
            ))}
          </select>
        </div>
        <Button variant="dark" size="md" onClick={handleCreateTask} disabled={!newTitle.trim()} className="w-full sm:w-auto">
          <FiPlus className="w-4 h-4 mr-2" /> {t("overview.createAndRun") || "Tạo và chạy framework"}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("overview.todayTasks")}</h2>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">{t("overview.noTasks")}</p>
        ) : (
          <div className="space-y-6">
            {groupedTasks.map(([group, groupTasks]) => (
              <div key={group}>
                <div className="flex items-center justify-between mb-2">
                  {editingGroup === group ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        onKeyDown={(e) => handleKey(e, () => saveRenameGroup(group))}
                        onBlur={() => saveRenameGroup(group)}
                        autoFocus
                        className="font-semibold text-sm bg-transparent border-b border-primary-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1">
                        {PALETTE.map((c) => (
                          <button
                            key={c}
                            onClick={() => setGroupColor(c)}
                            onMouseDown={(e) => e.preventDefault()}
                            className={`w-5 h-5 rounded-full border-2 ${groupColor === c ? "border-gray-900 dark:border-white" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                            aria-label={c}
                          />
                        ))}
                      </div>
                      <button onClick={() => saveRenameGroup(group)} className="text-xs text-primary-600">
                        {t("common.save")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: progress.groupColors?.[group] || PALETTE[0] }}
                        />
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{group}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{t("overview.groupSummary", { count: groupTasks.length })}</span>
                        <button
                          onClick={() => startRenameGroup(group)}
                          className="text-gray-400 hover:text-primary-600"
                          aria-label={t("overview.editGroup")}
                          title={t("overview.editGroup")}
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/task/${task.id}`)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors cursor-pointer"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          task.status === "done"
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-primary-500"
                        }`}
                        aria-label={task.status === "done" ? t("common.done") : t("common.pending")}
                      >
                        {task.status === "done" && <FiCheck className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingTask === task.id ? (
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            onKeyDown={(e) => handleKey(e, () => saveEditTask(task.id))}
                            onBlur={() => saveEditTask(task.id)}
                            autoFocus
                            className="w-full text-sm bg-transparent border-b border-primary-500 focus:outline-none"
                          />
                        ) : (
                          <p
                            className={`text-left text-sm font-medium ${
                              task.status === "done" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {task.title}
                          </p>
                        )}
                        {(task.category || task.subCategory) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {[task.category, task.subCategory].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-2">
                          <div
                            className="h-1 bg-primary-500 rounded-full transition-all"
                            style={{ width: `${taskProgress(task)}%` }}
                          />
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shrink-0 ${
                          priorityClass[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditTask(task);
                        }}
                        className="text-gray-400 hover:text-primary-600 shrink-0"
                        aria-label={t("common.edit")}
                        title={t("common.edit")}
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        aria-label={t("common.delete")}
                        title={t("common.delete")}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>

                      <FiPlay
                        className={`w-4 h-4 shrink-0 mt-1 ${
                          task.status === "done" ? "text-gray-300" : "text-primary-600"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
