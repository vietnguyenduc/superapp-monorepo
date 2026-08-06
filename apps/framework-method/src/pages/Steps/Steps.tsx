import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps } from "../../hooks/useFrameworkProgress";

const Steps = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress } = useFrameworkProgress();
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t("nav.steps")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("steps.frameworkSteps") || "Các bước trong framework hôm nay"}</p>
        </div>
      </div>

      {dailySteps.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500">{t("overview.noFramework")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dailySteps.map((step, idx) => {
            const stepNumber = idx + 1;
            return (
              <Card key={step.id} className="p-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-blue-50 dark:bg-primary-900/20 text-primary-700">
                  {stepNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {step.description || step.phaseName}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {step.blocks?.length || 0} {t("steps.sections") || "phần"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Steps;
