import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailyBlocks } from "../../hooks/useFrameworkProgress";

const Step = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { progress, saveReflection, completeStep } = useFrameworkProgress();

  const dailyBlocks = getDailyBlocks(progress);
  const totalSteps = dailyBlocks.length;
  const stepNumber = Math.min(Math.max(parseInt(stepId || "1", 10), 1), totalSteps || 1);
  const block = dailyBlocks[stepNumber - 1];

  const [reflection, setReflection] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const reflectionTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!block) return;
    const saved = progress.reflections[block.id] || {};
    setReflection(saved.reflection || "");
    setRating(saved.rating ? Number(saved.rating) : 0);
    setSelectedOptions(saved.options || []);
    return () => {
      if (reflectionTimer.current) window.clearTimeout(reflectionTimer.current);
    };
  }, [block, progress.reflections]);

  const persistReflection = (value: string, immediate = false) => {
    if (!block) return;
    if (reflectionTimer.current) {
      window.clearTimeout(reflectionTimer.current);
      reflectionTimer.current = null;
    }
    if (immediate) {
      saveReflection(block.id, "reflection", value);
    } else {
      reflectionTimer.current = window.setTimeout(() => {
        saveReflection(block.id, "reflection", value);
      }, 600);
    }
  };

  if (!block) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-center text-gray-500">{t("overview.noFramework")}</p>
        <Button variant="dark" className="w-full" onClick={() => navigate("/builder")}>
          {t("builder.title")}
        </Button>
      </div>
    );
  }

  const handleChange = (value: string | string[] | number, field: string) => {
    if (!block) return;
    if (field === "reflection") {
      setReflection(value as string);
      persistReflection(value as string);
    } else if (field === "rating") {
      setRating(value as number);
      saveReflection(block.id, "rating", String(value));
    } else if (field === "options") {
      setSelectedOptions(value as string[]);
      saveReflection(block.id, "options", JSON.stringify(value));
    }
  };

  const toggleOption = (option: string) => {
    const next = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    handleChange(next, "options");
  };

  const allCompleted = () => {
    switch (block.type) {
      case "knowledge":
      case "example":
      case "hint":
        return true;
      case "reflection":
      case "short_text":
      case "number_input":
        return !block.required || reflection.trim().length > 0;
      case "rating":
        return !block.required || rating > 0;
      case "multiple_choice":
        return !block.required || selectedOptions.length > 0;
      default:
        return true;
    }
  };

  const handleComplete = () => {
    persistReflection(reflection, true);
    completeStep(stepNumber);
    window.setTimeout(() => {
      if (stepNumber < totalSteps) {
        navigate(`/step/${stepNumber + 1}`);
      } else {
        navigate("/overview");
      }
    }, 100);
  };

  const isCompleted = progress.completedSteps.includes(stepNumber);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wide">
          {block.type}
        </span>
      </div>

      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{block.label}</h1>
        {block.prompt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-xl mx-auto">
            {block.prompt}
          </p>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
            {t("step.yourReflection")}
          </p>

          {(block.type === "reflection" || block.type === "knowledge" || block.type === "example" || block.type === "hint" || block.type === "short_text") && (
            <textarea
              value={reflection}
              onChange={(e) => handleChange(e.target.value, "reflection")}
              className="input h-32 resize-none bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
              placeholder={block.placeholder || t("step.answerPlaceholder")}
            />
          )}

          {block.type === "number_input" && (
            <input
              type="number"
              value={reflection}
              onChange={(e) => handleChange(e.target.value, "reflection")}
              className="input bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
              placeholder={block.placeholder || t("step.answerPlaceholder")}
            />
          )}

          {block.type === "rating" && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleChange(star, "rating")}>
                  <FiStar
                    className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
          )}

          {block.type === "multiple_choice" && (
            <div className="space-y-2">
              {(block.options || ["Option 1", "Option 2"]).map((option) => (
                <label key={option} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          )}

          {block.required && !allCompleted() && (
            <p className="text-xs text-red-500">{t("step.required")}</p>
          )}
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allCompleted() ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{allCompleted() ? t("step.allReflectionsCaptured") : "Reflection in progress"}</p>
          <p className="text-xs text-gray-500">{allCompleted() ? t("common.ready") : t("step.answerPlaceholder")}</p>
        </div>
      </Card>

      <Button
        variant="dark"
        size="lg"
        className="w-full"
        disabled={!allCompleted()}
        onClick={handleComplete}
      >
        {isCompleted
          ? t("common.done")
          : stepNumber === totalSteps
          ? t("step.completeFramework")
          : t("step.completeStep")}
      </Button>
    </div>
  );
};

export default Step;
