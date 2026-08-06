import { FiX, FiLayout } from "react-icons/fi";

interface Phase {
  id: string;
  name: string;
  completed?: boolean;
  current?: boolean;
}

interface FrameworkOverlayProps {
  onClose: () => void;
  phases: Phase[];
}

const templates = [
  { id: "deep-work", name: "Deep Work" },
  { id: "time-blocking", name: "Time Blocking" },
];

const FrameworkOverlay = ({ onClose, phases }: FrameworkOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <aside className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-gray-900 shadow-xl p-6 flex flex-col animate-slide-in-right">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Current Framework</p>
            <h2 className="text-xl font-bold mt-1 leading-tight">The First Principles Method</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Phases</p>
          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      phase.completed || phase.current
                        ? "border-primary-600 bg-primary-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {phase.completed && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                    {phase.current && !phase.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${phase.current ? "text-primary-600" : "text-gray-700 dark:text-gray-300"}`}>
                    {phase.name}
                  </span>
                </div>
                <div className="text-right">
                  {phase.current ? (
                    <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">20%</span>
                  ) : (
                    <span className="text-xs text-gray-400">0%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {phases.find(p => p.current) && (
            <p className="text-xs text-primary-600 mt-2">Current: Step 1</p>
          )}
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Switch Template</p>
          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <button className="mt-6 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium">
          <FiLayout className="w-4 h-4" /> Framework Overview
        </button>
      </aside>
    </div>
  );
};

export default FrameworkOverlay;
