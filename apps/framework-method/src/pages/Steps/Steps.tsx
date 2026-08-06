import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps } from "../../hooks/useFrameworkProgress";

const Steps = () => {
  const { t } = useI18n();
  const { progress } = useFrameworkProgress();
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("nav.steps")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("overview.stepOf", { current: progress.completedSteps.length, total: dailySteps.length })}
        </p>
      </div>

      {dailySteps.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500">{t("overview.noFramework")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dailySteps.map((step, idx) => {
            const stepNumber = idx + 1;
            const isCompleted = progress.completedSteps.includes(stepNumber);
            const isCurrent = stepNumber === progress.currentStep;
            return (
              <Link key={step.id} to={`/step/${stepNumber}`}>
                <Card className={`p-4 flex items-start gap-4 hover:border-primary-500 transition-colors ${isCurrent ? "ring-1 ring-primary-500" : ""}`}>
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
                      stepNumber
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {step.description || step.phaseName}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {step.blocks?.length || 0} section{step.blocks?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <FiArrowRight className="w-5 h-5 text-gray-400 mt-1" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Steps;
