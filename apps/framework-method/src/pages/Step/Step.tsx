import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiStar, FiBook, FiSun, FiInfo, FiEdit3, FiList, FiType, FiHash, FiGitBranch, FiCheck, FiArrowRight } from "react-icons/fi";
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

const contentTypes: BlockType[] = ["knowledge", "example", "hint"];
const inputTypes: BlockType[] = ["reflection", "short_text", "number_input", "rating", "multiple_choice"];

const hasInput = (block: Block) => {
  if (block.type === "routing") return false;
  if (inputTypes.includes(block.type)) return true;
  if (contentTypes.includes(block.type) && (block.reflectionQuestion?.trim() || block.required)) return true;
  return false;
};

const StepPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { progress, frameworkName, getTaskRun, saveTaskReflection, completeTaskStep } = useFrameworkProgress();

  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);
  const totalSteps = dailySteps.length;
  const task = useMemo(() => progress.tasks.find((t) => t.id === taskId), [progress.tasks, taskId]);
  const run = useMemo(() => getTaskRun(taskId || ""), [getTaskRun, taskId]);
  const stepNumber = Math.max(run.currentStep, 1);
  const step: Step | undefined = dailySteps[stepNumber - 1];
  const taskCompleted = task?.status === "done" || stepNumber > totalSteps;

  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const timers = useRef<Record<string, number | null>>({});

  useEffect(() => {
    if (!step) return;
    const initial: Record<string, Record<string, string>> = {};
    step.blocks?.forEach((block) => {
      const saved = run.reflections[block.id] || {};
      initial[block.id] = { ...saved };
    });
    setAnswers(initial);
  }, [step, run.reflections]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      Object.values(currentTimers).forEach((id) => {
        if (id) window.clearTimeout(id);
      });
    };
  }, []);

  if (!task) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-10">
        <p className="text-gray-500">{t("overview.noTasks")}</p>
        <Button variant="dark" onClick={() => navigate("/dashboard")}>
          {t("nav.dashboard")}
        </Button>
      </div>
    );
  }

  if (!step || taskCompleted) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-10 max-w-3xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold">{t("step.taskCompleted") || "Đã hoàn thành"}</h1>
        <p className="text-gray-500 mt-1">{task.title}</p>
        <Button variant="dark" onClick={() => navigate("/dashboard")}>
          {t("nav.dashboard")}
        </Button>
      </div>
    );
  }

  const flushReflection = (blockId: string, field: string, value: string) => {
    const key = `${blockId}-${field}`;
    if (timers.current[key]) {
      window.clearTimeout(timers.current[key]!);
      timers.current[key] = null;
    }
    if (taskId) saveTaskReflection(taskId, blockId, field, value);
  };

  const setField = (blockId: string, field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], [field]: value },
    }));
    const key = `${blockId}-${field}`;
    if (timers.current[key]) {
      window.clearTimeout(timers.current[key]!);
    }
    timers.current[key] = window.setTimeout(() => {
      if (taskId) saveTaskReflection(taskId, blockId, field, value);
    }, 500);
  };

  const getField = (block: Block, field: string): string => {
    return answers[block.id]?.[field] ?? run.reflections[block.id]?.[field] ?? "";
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

  const resolveAnswer = (id?: string): string => {
    if (!id) return "";
    const saved = run.reflections[id];
    if (!saved) return t("step.referenceMissing");
    return (
      saved.reflection?.trim() ||
      saved.rating?.trim() ||
      (saved.options ? JSON.parse(saved.options).join(", ") : "") ||
      t("step.referenceMissing")
    );
  };

  const resolveRefs = (text?: string): string => {
    if (!text) return "";
    return text.replace(/\{\{answer:([^}]+)\}\}/g, (_, id) => resolveAnswer(id));
  };

  const getSavedAnswer = (blockId?: string): string => {
    if (!blockId) return "";
    const saved = run.reflections[blockId];
    if (!saved) return "";
    return (
      saved.reflection?.trim() ||
      saved.rating?.trim() ||
      (saved.options ? JSON.parse(saved.options).join(", ") : "")
    );
  };

  const isBlockVisible = (block: Block) => {
    if (!block.showIfBlockId) return true;
    const answer = getSavedAnswer(block.showIfBlockId);
    if (!block.showIfValue?.trim()) return answer.length > 0;
    const expected = block.showIfValue.trim().toLowerCase();
    return answer.toLowerCase().includes(expected);
  };

  const isCompleted = (block: Block) => {
    if (!hasInput(block)) return true;
    switch (block.type) {
      case "knowledge":
      case "example":
      case "hint":
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
  const visibleBlocks = allBlocks.filter(isBlockVisible);
  const inputBlocks = visibleBlocks.filter(hasInput);
  const completedCount = inputBlocks.filter(isCompleted).length;
  const totalInputs = inputBlocks.length;
  const allRequiredDone = visibleBlocks.every((b) => (b.required ? isCompleted(b) : true));

  const handleFinalize = () => {
    if (!taskId) return;
    visibleBlocks.forEach((b) => {
      if (!hasInput(b)) return;
      if (b.type === "multiple_choice") {
        flushReflection(b.id, "options", JSON.stringify(getArrayField(b, "options")));
      } else if (b.type === "rating") {
        flushReflection(b.id, "rating", getField(b, "rating"));
      } else {
        flushReflection(b.id, "reflection", getField(b, "reflection"));
      }
    });
    completeTaskStep(taskId, stepNumber);
    window.setTimeout(() => {
      if (stepNumber < totalSteps) {
        navigate(`/task/${taskId}`);
      } else {
        navigate("/dashboard");
      }
    }, 100);
  };

  const renderContent = (block: Block) => {
    const content = resolveRefs(block.prompt);
    if (!content) return null;
    const lines = content.split("\n");
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
    return <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>;
  };

  const getQuestion = (block: Block) => {
    if (contentTypes.includes(block.type)) {
      return t("step.yourReflection");
    }
    return resolveRefs(block.prompt).trim() || t("step.yourReflection");
  };

  const getInputPlaceholder = (block: Block) => {
    if (contentTypes.includes(block.type)) {
      return resolveRefs(block.reflectionPlaceholder).trim() || block.placeholder?.trim() || t("step.answerPlaceholder");
    }
    return resolveRefs(block.placeholder).trim() || t("step.answerPlaceholder");
  };

  const renderInput = (block: Block) => {
    switch (block.type) {
      case "knowledge":
      case "example":
      case "hint":
      case "reflection":
        return (
          <textarea
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={getInputPlaceholder(block)}
            className="input h-28 resize-none w-full bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
          />
        );
      case "short_text":
        return (
          <input
            type="text"
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={getInputPlaceholder(block)}
            className="input w-full bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
          />
        );
      case "number_input":
        return (
          <input
            type="number"
            value={getField(block, "reflection")}
            onChange={(e) => setField(block.id, "reflection", e.target.value)}
            placeholder={getInputPlaceholder(block)}
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
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600"
          aria-label={t("common.back")}
        >
          <FiArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{frameworkName}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
        </div>
      </div>

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
          {step.templateName && (
            <span className="ml-2 text-xs text-gray-400 font-normal">· {step.templateName}</span>
          )}
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

      <div className="space-y-4">
        {visibleBlocks.map((block) => {
          const Icon = iconByType[block.type] || FiBook;
          const filled = isCompleted(block);
          const showInput = hasInput(block);
          const question = getQuestion(block);
          const hint = block.reflectionHint?.trim();
          return (
            <Card key={block.id} className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    filled ? "bg-primary-600 text-white" : "bg-blue-50 dark:bg-primary-900/20 text-primary-600"
                  }`}
                >
                  {filled ? <FiCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{block.label}</p>
                </div>
              </div>

              {contentTypes.includes(block.type) && block.prompt?.trim() && (
                <div className="pl-13">{renderContent(block)}</div>
              )}

              {block.referenceBlockId && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                    {t("step.referencedAnswer")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{resolveAnswer(block.referenceBlockId)}</p>
                </div>
              )}

              {showInput && (
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{question}</p>
                  {renderInput(block)}
                  {hint && <p className="text-xs text-gray-400 italic">{resolveRefs(hint)}</p>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              allRequiredDone ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}
          >
            <FiCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">
              {completedCount === totalInputs && totalInputs > 0
                ? t("step.allReflectionsCaptured")
                : t("step.reflectionsInProgressTitle")}
            </p>
            <p className="text-xs text-gray-500">
              {t("step.reflectionsInProgress", { completed: completedCount, total: totalInputs })}
            </p>
          </div>
        </div>
      </Card>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 px-2">
        {stepNumber === totalSteps ? t("step.finalNote") : t("step.analysisNote")}
      </p>

      <Button variant="dark" size="lg" className="w-full" disabled={!allRequiredDone} onClick={handleFinalize}>
        {stepNumber === totalSteps ? t("step.finalizeFramework") : t("step.finalizeStep")}
        <FiArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
};

export default StepPage;
