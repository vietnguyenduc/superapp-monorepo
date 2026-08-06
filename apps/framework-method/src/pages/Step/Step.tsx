import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiStar, FiChevronDown, FiChevronUp, FiBook, FiSun, FiInfo, FiEdit3, FiList, FiType, FiHash, FiGitBranch, FiCheck } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps } from "../../hooks/useFrameworkProgress";
import type { Block, BlockType, Step } from "../../types";

const iconByType: Record<BlockType, typeof FiBook> = {
  knowledge: FiBook,
  example: FiSun,
  hint: FiInfo,
  reflection: FiEdit3,
  rating: FiStar,
  multiple_choice: FiList,
  short_text: FiType,
  number_input: FiHash,
  routing: FiGitBranch,
};

const interactionTypes: BlockType[] = ["reflection", "short_text", "number_input", "rating", "multiple_choice"];

const isInteractionBlock = (block: Block) => interactionTypes.includes(block.type);

const StepPage = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { progress, saveReflection, completeStep } = useFrameworkProgress();

  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);
  const totalSteps = dailySteps.length;
  const stepNumber = Math.min(Math.max(parseInt(stepId || "1", 10), 1), totalSteps || 1);
  const step: Step | undefined = dailySteps[stepNumber - 1];

  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const timers = useRef<Record<string, number | null>>({});

  useEffect(() => {
    if (!step) return;
    const initial: Record<string, Record<string, string>> = {};
    const initialOpen: Record<string, boolean> = {};
    step.blocks?.forEach((block) => {
      const saved = progress.reflections[block.id] || {};
      initial[block.id] = { ...saved };
      initialOpen[block.id] = isInteractionBlock(block);
    });
    setAnswers(initial);
    setOpenBlocks(initialOpen);
  }, [step?.id]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((id) => {
        if (id) window.clearTimeout(id);
      });
    };
  }, []);

  if (!step) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-10">
        <p className="text-gray-500">{t("overview.noFramework")}</p>
        <Button variant="dark" onClick={() => navigate("/builder")}>
          {t("builder.title")}
        </Button>
      </div>
    );
  }

  const flushReflection = (blockId: string, field: string, value: string) => {
    if (timers.current[`${blockId}-${field}`]) {
      window.clearTimeout(timers.current[`${blockId}-${field}`]!);
      timers.current[`${blockId}-${field}`] = null;
    }
    saveReflection(blockId, field, value);
  };

  const setField = (blockId: string, field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], [field]: value },
    }));
    if (timers.current[`${blockId}-${field}`]) {
      window.clearTimeout(timers.current[`${blockId}-${field}`]!);
    }
    timers.current[`${blockId}-${field}`] = window.setTimeout(() => {
      saveReflection(blockId, field, value);
    }, 500);
  };

  const getField = (block: Block, field: string): string => {
    return answers[block.id]?.[field] ?? progress.reflections[block.id]?.[field] ?? "";
  };

  const getArrayField = (block: Block, field: string): string[] => {
    const raw = getField(block, field);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const isCompleted = (block: Block) => {
    if (!isInteractionBlock(block)) return true;
    switch (block.type) {
      case "reflection":
      case "short_text":
      case "number_input":
        return getField(block, "reflection").trim().length > 0;
      case "rating": {
        const val = Number(getField(block, "rating"));
        return Number.isFinite(val) && val > 0;
      }
      case "multiple_choice":
        return getArrayField(block, "options").length > 0;
      default:
        return true;
    }
  };

  const allBlocks = step.blocks || [];
  const interactionBlocks = allBlocks.filter(isInteractionBlock);
  const completedCount = interactionBlocks.filter(isCompleted).length;
  const totalInputs = interactionBlocks.length;
  const allRequiredDone = allBlocks.every((b) => (b.required ? isCompleted(b) : true));

  const toggleBlock = (id: string) => {
    setOpenBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinalize = () => {
    allBlocks.forEach((b) => {
      if (isInteractionBlock(b)) {
        if (b.type === "multiple_choice") {
          flushReflection(b.id, "options", JSON.stringify(getArrayField(b, "options")));
        } else if (b.type === "rating") {
          flushReflection(b.id, "rating", getField(b, "rating"));
        } else {
          flushReflection(b.id, "reflection", getField(b, "reflection"));
        }
      }
    });
    completeStep(stepNumber);
    window.setTimeout(() => {
      if (stepNumber < totalSteps) {
        navigate(`/step/${stepNumber + 1}`);
      } else {
        navigate("/review");
      }
    }, 100);
  };

  const renderContent = (block: Block) => {
    if (!block.prompt) return null;
    const lines = block.prompt.split("\n");
    const isList = lines.every((line) => line.startsWith("-") || line.trim() === "");
    if (isList) {
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {lines
            .filter((l) => l.trim())
            .map((line, i) => (
              <li key={i}>{line.replace(/^- /, "")}</li>
            ))}
        </ul>
      );
    }
    return <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{block.prompt}</p>;
  };

  const renderInput = (block: Block) => {
    switch (block.type) {
      case "reflection":
        return (
          <textarea
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={block.placeholder || t("step.answerPlaceholder")}
            className="input h-32 resize-none bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30 w-full"
          />
        );
      case "short_text":
        return (
          <input
            type="text"
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={block.placeholder || t("step.answerPlaceholder")}
            className="input w-full bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
          />
        );
      case "number_input":
        return (
          <input
            type="number"
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={block.placeholder || t("step.answerPlaceholder")}
            className="input w-full bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
          />
        );
      case "rating": {
        const rating = Number(getField(block, "rating")) || 0;
        return (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setField(block.id, "rating", String(star))}>
                <FiStar
                  className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              </button>
            ))}
          </div>
        );
      }
      case "multiple_choice": {
        const selected = getArrayField(block, "options");
        const options = block.options?.length ? block.options : ["Option 1", "Option 2"];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => {
                    const next = selected.includes(option)
                      ? selected.filter((o) => o !== option)
                      : [...selected, option];
                    setField(block.id, "options", JSON.stringify(next));
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center">
        {step.phaseName && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wide">
            <FiInfo className="w-3.5 h-3.5" /> {t("step.phase", { name: step.phaseName }) || step.phaseName}
          </span>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-primary-600 mb-2">
          {t("step.stepOf", { current: stepNumber, total: totalSteps })}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("step.stepTitle", { number: stepNumber, title: step.title }) || `Step ${stepNumber}: ${step.title}`}
        </h1>
        {step.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-2xl mx-auto">
            {step.description}
          </p>
        )}
      </div>

      {step.imageUrl ? (
        <img src={step.imageUrl} alt={step.title} className="w-full h-48 md:h-64 object-cover rounded-2xl" />
      ) : (
        <div className="w-full h-40 md:h-48 rounded-2xl bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-800 dark:to-primary-900/20 flex items-center justify-center">
          <FiBook className="w-12 h-12 text-primary-300 dark:text-primary-700" />
        </div>
      )}

      <div className="space-y-3">
        {allBlocks.map((block) => {
          const Icon = iconByType[block.type] || FiBook;
          const open = openBlocks[block.id] ?? isInteractionBlock(block);
          const filled = isCompleted(block);
          const showCheck = isInteractionBlock(block) && filled;
          return (
            <Card key={block.id} className="overflow-hidden p-0">
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full flex items-center gap-3 p-5 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    showCheck ? "bg-primary-600 text-white" : "bg-blue-50 dark:bg-primary-900/20 text-primary-600"
                  }`}
                >
                  {showCheck ? <FiCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{block.label}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{block.type}</p>
                </div>
                {open ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {open && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {block.prompt && renderContent(block)}
                  {isInteractionBlock(block) && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                        {t("step.yourReflection")}
                      </p>
                      {renderInput(block)}
                      {block.required && !filled && (
                        <p className="text-xs text-red-500">{t("step.required")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center gap-4 p-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            allRequiredDone ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
          }`}
        >
          <FiCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">
            {allRequiredDone
              ? t("step.allReflectionsCaptured")
              : t("step.reflectionsInProgress", { completed: completedCount, total: totalInputs })}
          </p>
          <p className="text-xs text-gray-500">
            {allRequiredDone
              ? t("common.ready")
              : t("step.answerPlaceholder")}
          </p>
        </div>
      </Card>

      <Button
        variant="dark"
        size="lg"
        className="w-full"
        disabled={!allRequiredDone}
        onClick={handleFinalize}
      >
        {stepNumber === totalSteps ? t("step.completeFramework") : t("step.completeStep")}
      </Button>
    </div>
  );
};

export default StepPage;
