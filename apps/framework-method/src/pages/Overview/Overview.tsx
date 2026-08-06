import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import FrameworkOverlay from "./FrameworkOverlay";

const allSteps = [
  { id: 1, title: "Analyzing Situations", phase: "Discovery", desc: "Thoroughly understand the current context before proposing solutions." },
  { id: 2, title: "Deconstruct the Problem", phase: "Deconstruction", desc: "Break down the core challenge into its most fundamental truths." },
  { id: 3, title: "Identify Fundamental Truths", phase: "Synthesis", desc: "Separate facts from assumptions to establish a solid foundation." },
  { id: 4, title: "Synthesize New Solutions", phase: "Strategy", desc: "Reassemble the truths to form innovative approaches." },
  { id: 5, title: "Execute with Confidence", phase: "Execution", desc: "Turn strategy into concrete actions and measure results." },
];

const phases = [
  { id: "discovery", name: "Discovery", completed: true, current: true },
  { id: "deconstruction", name: "Deconstruction", completed: false },
  { id: "synthesis", name: "Synthesis", completed: false },
  { id: "strategy", name: "Strategy", completed: false },
  { id: "execution", name: "Execution", completed: false },
];

const Overview = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress } = useFrameworkProgress();
  const [showOverlay, setShowOverlay] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const totalSteps = allSteps.length;
  const currentStep = progress.currentStep;
  const currentStepData = allSteps.find((s) => s.id === currentStep) || allSteps[0];
  const completedCount = progress.completedSteps.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);
  const upcomingSteps = allSteps.filter((s) => s.id >= currentStep).slice(0, showAllSteps ? undefined : 2);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("overview.activeFramework")}
          </p>
          <h1 className="text-4xl font-bold mt-1 leading-tight">The First Principles Method</h1>
        </div>
        <button
          onClick={() => setShowOverlay(true)}
          className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
          aria-label="Frameworks"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </button>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg">{t("overview.progress")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("overview.stepOf", { current: completedCount, total: totalSteps })}
        </p>
        <div className="flex items-end gap-1 mt-4 mb-3">
          <span className="text-5xl font-bold text-primary-600 tracking-tight">{progressPct}</span>
          <span className="text-xl text-gray-400 mb-1.5">%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-3 bg-primary-600 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("overview.focusForToday")}
          </p>
          <h3 className="text-2xl font-bold mt-2">{currentStepData.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            {currentStepData.desc}
          </p>
          <Button variant="dark" size="md" className="mt-5" onClick={() => navigate(`/step/${currentStep}`)}>
            {t("overview.startSession")} <FiArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">{t("overview.upcomingSteps")}</h2>
          <button
            onClick={() => setShowAllSteps((prev) => !prev)}
            className="text-sm text-primary-600 flex items-center font-medium"
          >
            {showAllSteps ? t("common.close") : t("overview.viewAll")}
            <FiArrowRight className={`w-4 h-4 ml-1 transition-transform ${showAllSteps ? "rotate-90" : ""}`} />
          </button>
        </div>
        <div className="space-y-5">
          {upcomingSteps.map((step) => {
            const isCompleted = progress.completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            return (
              <Link
                key={step.id}
                to={`/step/${step.id}`}
                className="flex items-start gap-4 group"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCompleted
                      ? "bg-primary-600 text-white"
                      : isCurrent
                      ? "bg-blue-100 dark:bg-primary-900/30 text-primary-700"
                      : "bg-blue-50 dark:bg-primary-900/20 text-primary-700"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {showOverlay && <FrameworkOverlay onClose={() => setShowOverlay(false)} phases={phases} />}
    </div>
  );
};

export default Overview;
