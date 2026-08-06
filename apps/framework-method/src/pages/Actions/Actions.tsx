import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

interface ActionItem {
  id: string;
  title: string;
  note: string;
  completed: boolean;
}

const Actions = () => {
  const { t } = useI18n();
  const [actions, setActions] = useState<ActionItem[]>([
    { id: "1", title: "Draft Product Strategy Brief", note: "Outline key objectives for the upcoming sprint.", completed: false },
    { id: "2", title: "Review Q3 Performance Metrics", note: "Analyze user engagement data from the last quarter.", completed: false },
    { id: "3", title: "Sync with Engineering Team", note: "Discuss API integration timelines.", completed: false },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [midday, setMidday] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const toggle = (id: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const addAction = () => {
    if (!newTitle.trim()) return;
    setActions((prev) => [...prev, { id: Date.now().toString(), title: newTitle, note: "", completed: false }]);
    setNewTitle("");
  };

  const remove = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
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
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.completed ? "line-through text-gray-400" : ""}`}>
                  {action.title}
                </p>
                {action.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.note}</p>}
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
          value={midday}
          onChange={(e) => setMidday(e.target.value)}
          className="input h-24 resize-none mb-3"
          placeholder="Jot down your thoughts on current progress..."
        />
        <Button variant="secondary" size="sm" className="w-full">
          {t("actions.saveReflection")}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-1">{t("actions.quickNotes")}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Capture fleeting thoughts here...</p>
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          className="input h-24 resize-none"
          placeholder="Write a quick note..."
        />
      </Card>
    </div>
  );
};

export default Actions;
