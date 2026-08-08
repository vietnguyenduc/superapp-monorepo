import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronRight, FiArrowRight } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import FrameworkOverlay from "./FrameworkOverlay";

const phases = [
  { id: "discovery", name: "Discovery", completed: true, current: true },
  { id: "deconstruction", name: "Deconstruction", completed: false },
  { id: "synthesis", name: "Synthesis", completed: false },
  { id: "strategy", name: "Strategy", completed: false },
  { id: "execution", name: "Execution", completed: false },
];

const upcomingSteps = [
  { id: "3", title: "Identify Fundamental Truths", phase: "Synthesis", desc: "Separate facts from assumptions to establish a solid foundation." },
  { id: "4", title: "Synthesize New Solutions", phase: "Strategy", desc: "Reassemble the truths to form innovative approaches." },
];

const Overview = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [currentStep] = useState(2);
  const [showOverlay, setShowOverlay] = useState(false);
  const totalSteps = 5;
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("overview.activeFramework")}
          </p>
          <h1 className="text-3xl font-bold mt-1 leading-tight">The First Principles Method</h1>
        </div>
        <button
          onClick={() => setShowOverlay(true)}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Step 2 of 5 completed</p>
        <div className="flex items-end gap-2 mt-4 mb-3">
          <span className="text-4xl font-bold text-primary-600">40</span>
          <span className="text-xl text-gray-400 mb-1">%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-3 bg-primary-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-primary-900/10">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("overview.focusForToday")}
          </p>
          <h3 className="text-2xl font-bold mt-1">Deconstruct the Problem</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            Break down the core challenge into its most fundamental truths. Ignore previous assumptions and established conventions.
          </p>
          <Button variant="dark" size="md" className="mt-5" onClick={() => navigate("/session")}>
            {t("overview.startSession")} <FiArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{t("overview.upcomingSteps")}</h2>
          <Link to="/overview" className="text-sm text-primary-600 flex items-center font-medium">
            {t("overview.viewAll")} <FiChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {upcomingSteps.map((step) => (
            <Link
              key={step.id}
              to="/session"
              className="flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-primary-900/30 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                {step.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {step.desc}
                </p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
                  {step.phase}
                </span>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-300 mt-2" />
            </Link>
          ))}
        </div>
      </Card>

      {showOverlay && <FrameworkOverlay onClose={() => setShowOverlay(false)} phases={phases} />}
    </div>
  );
};

export default Overview;
