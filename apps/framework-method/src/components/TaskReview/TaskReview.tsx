import { useState } from "react";
import { FiCheck, FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps, type ActionItem } from "../../hooks/useFrameworkProgress";

const TaskReview = ({ taskId }: { taskId: string }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress, frameworkName, getTaskRun, updateTaskRun } = useFrameworkProgress();
  const task = progress.tasks.find((t) => t.id === taskId);
  const run = getTaskRun(taskId);
  const dailySteps = getDailySteps(progress);

  const [newAction, setNewAction] = useState("");

  if (!task) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-10">
        <p className="text-gray-500">{t("overview.noTasks")}</p>
        <Button variant="dark" onClick={() => navigate("/dashboard")}>
          {t("nav.dashboard")}
        </Button>
      </div>
    );
  }

  const isDone = task.status === "done";

  const updateActions = (actions: ActionItem[]) => {
    updateTaskRun(taskId, { actions });
  };

  const addAction = () => {
    const title = newAction.trim();
    if (!title) return;
    const action: ActionItem = {
      id: `action-${Date.now()}`,
      title,
      note: "",
      completed: false,
      createdAt: new Date().toISOString(),
    };
    updateActions([...run.actions, action]);
    setNewAction("");
  };

  const toggleAction = (id: string) => {
    updateActions(
      run.actions.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  const removeAction = (id: string) => {
    updateActions(run.actions.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    updateActions(run.actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const setReflection = (value: string) => updateTaskRun(taskId, { reflection: value });
  const setNote = (value: string) => updateTaskRun(taskId, { note: value });

  const allBlockReflections = () => {
    const list: { stepTitle: string; label: string; text: string }[] = [];
    dailySteps.forEach((step) => {
      step.blocks?.forEach((block) => {
        const saved = run.reflections[block.id];
        const text =
          saved?.reflection?.trim() ||
          saved?.rating?.trim() ||
          (saved?.options ? JSON.parse(saved.options).join(", ") : "") ||
          "";
        if (text) {
          list.push({ stepTitle: step.title, label: block.label, text });
        }
      });
    });
    return list;
  };

  const reflections = allBlockReflections();

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{frameworkName}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
        </div>
      </div>

      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mx-auto mb-3">
          <FiCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">
          {isDone ? t("step.taskCompleted") : t("review.title")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isDone ? t("review.subtitle") : "Bạn đã chạy xong framework. Xem lại, cập nhật và ghi lại suy ngẫm bên dưới."}
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("actions.committedActions")}</h2>
        <div className="space-y-3">
          {run.actions.length === 0 && (
            <p className="text-sm text-gray-400 italic">{t("actions.addAction")}</p>
          )}
          {run.actions.map((action) => (
            <div key={action.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <input
                type="checkbox"
                checked={action.completed}
                onChange={() => toggleAction(action.id)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={action.title}
                  onChange={(e) => updateAction(action.id, { title: e.target.value })}
                  className={`w-full bg-transparent border-0 p-0 text-sm font-medium focus:ring-0 ${action.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
                />
                <input
                  type="text"
                  value={action.note}
                  onChange={(e) => updateAction(action.id, { note: e.target.value })}
                  placeholder={t("actions.addAction")}
                  className="w-full bg-transparent border-0 p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0"
                />
              </div>
              <button onClick={() => removeAction(action.id)} className="text-gray-400 hover:text-red-500">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAction()}
            placeholder={t("actions.addAction")}
            className="flex-1 input"
          />
          <Button variant="secondary" onClick={addAction}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-1">{t("actions.middayReflection")}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ghi lại suy ngẫm, cập nhật tiến độ hoặc bất kỳ insight nào cho việc này.</p>
        <textarea
          value={run.reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="input h-28 resize-none w-full mb-3"
          placeholder="Viết suy ngẫm của bạn..."
        />
        <h3 className="font-semibold text-sm mb-1">{t("actions.quickNotes")}</h3>
        <textarea
          value={run.note}
          onChange={(e) => setNote(e.target.value)}
          className="input h-24 resize-none w-full"
          placeholder="Ghi chú nhanh..."
        />
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">Các suy ngẫm đã ghi</h2>
        {reflections.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Chưa có suy ngẫm nào được ghi trong wizard.</p>
        ) : (
          <div className="space-y-3">
            {reflections.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">{item.stepTitle} · {item.label}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Button variant="dark" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
        {t("nav.dashboard")}
      </Button>
    </div>
  );
};

export default TaskReview;
