import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import type { ActionItem } from "../../hooks/useFrameworkProgress";

const Actions = () => {
  const { t } = useI18n();
  const { progress, update } = useFrameworkProgress();
  const [newTitle, setNewTitle] = useState("");

  const actions = progress.actions;

  const updateActions = (next: ActionItem[]) => update({ actions: next });

  const toggle = (id: string) => {
    updateActions(actions.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const addAction = () => {
    if (!newTitle.trim()) return;
    const newAction: ActionItem = { id: Date.now().toString(), title: newTitle, note: "", completed: false, createdAt: new Date().toISOString() };
    updateActions([...actions, newAction]);
    setNewTitle("");
  };

  const remove = (id: string) => {
    updateActions(actions.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<ActionItem>) => {
    updateActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">{t("actions.committedActions")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Check off tasks as you complete them</p>
        </div>
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <input
                type="checkbox"
                checked={action.completed}
                onChange={() => toggle(action.id)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                  placeholder="Add a note..."
                  className="w-full bg-transparent border-0 p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0"
                />
              </div>
              <button onClick={() => remove(action.id)} className="text-gray-400 hover:text-red-500">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder={t("actions.addAction")}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAction()}
            className="flex-1"
          />
          <Button variant="secondary" onClick={addAction}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-1">{t("actions.middayReflection")}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">How is the current approach working?</p>
        <textarea
          value={progress.middayReflection}
          onChange={(e) => update({ middayReflection: e.target.value })}
          className="input h-24 resize-none mb-3"
          placeholder="Jot down your thoughts on current progress..."
        />
        <Button variant="secondary" size="sm" className="w-full" onClick={() => update({ middayReflection: progress.middayReflection })}>
          {t("actions.saveReflection")}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-1">{t("actions.quickNotes")}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Capture fleeting thoughts here...</p>
        <textarea
          value={progress.quickNote}
          onChange={(e) => update({ quickNote: e.target.value })}
          className="input h-24 resize-none"
          placeholder="Write a quick note..."
        />
      </Card>
    </div>
  );
};

export default Actions;
