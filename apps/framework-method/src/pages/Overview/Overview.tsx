import { useState, useMemo, KeyboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiEdit3, FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps, type Task, type TaskPriority } from "../../hooks/useFrameworkProgress";

const priorityClass: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  high: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const priorityOptions: TaskPriority[] = ["low", "normal", "high"];

const Overview = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress, addTask, toggleTask, updateTask, deleteTask, renameTaskGroup } = useFrameworkProgress();

  const today = new Date().toISOString().split("T")[0];
  const tasks = useMemo(() => (progress.tasks || []).filter((task) => task.date === today), [progress.tasks, today]);
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);

  const totalSteps = dailySteps.length;
  const currentStep = Math.min(progress.currentStep, totalSteps || 1);
  const completedStepsCount = progress.completedSteps.length;
  const progressPct = totalSteps ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  const activeTemplate = progress.templates.find((tmpl) => tmpl.id === progress.activeTemplateId);
  const frameworkName =
    progress.dailyTemplateIds.length > 1
      ? t("overview.dailyMix")
      : activeTemplate?.name || t("overview.yourFramework");

  const currentStepObj = dailySteps[currentStep - 1];

  const [newTitle, setNewTitle] = useState("");
  const [newGroup, setNewGroup] = useState(frameworkName);
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");

  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const group = task.group || t("overview.yourFramework");
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(task);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks, t]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const categories = new Set(tasks.map((t) => t.category).filter(Boolean));
    const subCategories = new Set(tasks.map((t) => t.subCategory).filter(Boolean));
    return { total, done, inProgress, groups: groupedTasks.length, categories: categories.size, subCategories: subCategories.size };
  }, [tasks, groupedTasks.length]);

  const handleAddTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    addTask({
      title,
      group: newGroup.trim() || frameworkName,
      category: newCategory.trim() || undefined,
      status: "todo",
      priority: newPriority,
      date: today,
    });
    setNewTitle("");
    setNewCategory("");
    setNewPriority("normal");
  };

  const startRenameGroup = (group: string) => {
    setEditingGroup(group);
    setGroupName(group);
  };

  const saveRenameGroup = (oldGroup: string) => {
    const next = groupName.trim();
    if (next && next !== oldGroup) {
      renameTaskGroup(oldGroup, next, today);
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
            {t("overview.activeFramework")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1 leading-tight">{frameworkName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("overview.taskSummary", { total: stats.total, done: stats.done, inProgress: stats.inProgress })}
            {stats.total > 0 && (
              <span className="ml-2 text-xs text-gray-400">
                · {stats.groups} {t("overview.taskGroup")} · {stats.categories} {t("overview.taskCategory")} · {stats.subCategories} {t("overview.taskSubCategory")}
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

      <Card className="p-0 overflow-hidden">
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("overview.focusForToday")}
          </p>
          {currentStepObj ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-primary-600">
                  {t("overview.stepOf", { current: completedStepsCount, total: totalSteps })}
                </span>
                <span className="text-sm text-gray-400">· {progressPct}%</span>
              </div>
              <h3 className="text-2xl font-bold mt-1">{currentStepObj.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                {currentStepObj.description || currentStepObj.title}
              </p>
              <Button variant="dark" size="md" className="mt-5" onClick={() => navigate(`/step/${currentStep}`)}>
                {t("overview.startSession")} <FiArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">{t("overview.noFramework")}</p>
          )}
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800">
          <div className="h-3 bg-primary-600 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("overview.todayTasks")}</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => handleKey(e, handleAddTask)}
            placeholder={t("overview.taskTitle")}
            className="flex-1 input"
          />
          <input
            type="text"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder={t("overview.taskGroup")}
            className="sm:w-40 input"
          />
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t("overview.taskCategory")}
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
          <Button variant="dark" size="md" onClick={handleAddTask} disabled={!newTitle.trim()}>
            <FiPlus className="w-4 h-4 mr-1" /> {t("overview.addTask")}
          </Button>
        </div>

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
                      <button onClick={() => saveRenameGroup(group)} className="text-xs text-primary-600">
                        {t("common.save")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{group}</h3>
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
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
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
                          <button
                            onClick={() => startEditTask(task)}
                            className={`text-left text-sm font-medium w-full ${
                              task.status === "done" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {task.title}
                          </button>
                        )}
                        {(task.category || task.subCategory) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {[task.category, task.subCategory].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shrink-0 ${
                          priorityClass[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        aria-label={t("common.delete")}
                        title={t("common.delete")}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
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

export default Overview;
