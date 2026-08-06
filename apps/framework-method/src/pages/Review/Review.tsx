import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps } from "../../hooks/useFrameworkProgress";

const Review = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress } = useFrameworkProgress();
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);

  const session = progress.sessions[progress.sessions.length - 1];

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center">
          <FiCheckCircle className="w-8 h-8" />
        </div>
      </div>
      <h1 className="text-3xl font-bold">{t("review.title") || "Framework completed"}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("review.subtitle") || "Review your reflections below or go to History."}
      </p>

      {dailySteps.map((step, idx) => (
        <Card key={step.id} className="text-left">
          <h3 className="font-semibold text-lg mb-3">
            {t("step.stepOf", { current: idx + 1, total: dailySteps.length })} — {step.title}
          </h3>
          <div className="space-y-3">
            {step.blocks?.map((block) => {
              const reflection = progress.reflections[block.id]?.reflection || "";
              const options = progress.reflections[block.id]?.options;
              const rating = progress.reflections[block.id]?.rating;
              let display = reflection;
              if (block.type === "multiple_choice" && options) {
                try {
                  display = JSON.parse(options).join(", ");
                } catch {
                  display = options;
                }
              }
              if (block.type === "rating") {
                display = rating ? `${rating}/5` : "";
              }
              if (!display && block.type !== "knowledge" && block.type !== "example" && block.type !== "hint") {
                display = t("review.noReflection") || "—";
              }
              return (
                <div key={block.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{block.label}</p>
                  {display && (
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-line">{display}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="dark" className="flex-1" onClick={() => navigate("/history")}>
          {t("review.goToHistory") || "Go to History"} <FiArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate("/overview")}>
          {t("common.back") || "Back"}
        </Button>
      </div>
    </div>
  );
};

export default Review;
