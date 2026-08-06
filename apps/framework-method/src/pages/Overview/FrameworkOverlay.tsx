import { FiX } from "react-icons/fi";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import type { FrameworkTemplate } from "../../hooks/useFrameworkProgress";

interface Phase {
  id: string;
  name: string;
  completed: boolean;
  current: boolean;
}

interface FrameworkOverlayProps {
  onClose: () => void;
  phases: Phase[];
}

const defaultTemplates: FrameworkTemplate[] = [
  { id: "deep-work", name: "Deep Work", blocks: [] },
  { id: "time-blocking", name: "Time Blocking", blocks: [] },
];

const FrameworkOverlay = ({ onClose, phases }: FrameworkOverlayProps) => {
  const { progress, setActiveTemplate } = useFrameworkProgress();
  const templates = progress.templates.length > 0 ? progress.templates : defaultTemplates;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-full md:w-80 bg-white dark:bg-gray-900 h-full shadow-2xl p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-lg">The First Principles Method</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Phases</p>
          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      phase.completed || phase.current
                        ? "border-primary-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {(phase.completed || phase.current) && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{phase.name}</p>
                    {phase.current && <p className="text-[10px] text-primary-600 font-semibold">Current: Step 1</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{phase.completed ? "100%" : "0%"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Switch Template</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setActiveTemplate(template.id);
                  onClose();
                }}
                className="w-full p-3 text-left text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setActiveTemplate(null);
            onClose();
          }}
          className="w-full flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300 text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Framework Overview
        </button>
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
};

export default FrameworkOverlay;
