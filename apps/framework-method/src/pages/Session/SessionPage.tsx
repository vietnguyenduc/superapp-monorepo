import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2, FiCheck, FiBookOpen, FiFileText, FiZap, FiClipboard, FiX } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import type { Block, BlockId, DailyTask, KnowledgeEntry, TaskSource, TemplateSection, TemplateSectionItem } from "../../types";

const ANALYSIS_KEYS = {
  reference: "__reference__",
  examples: "__examples__",
  keyInsights: "__key_insights__",
  detailedNotes: "__detailed_notes__",
  confidence: "__confidence__",
};

const StepIndicator = ({ step, onChange }: { step: number; onChange?: (s: number) => void }) => {
  const { t } = useI18n();
  const steps = [t("session.step1"), t("session.step2"), t("session.step3"), t("session.step4")];
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const active = num === step;
        const completed = num < step;
        return (
          <button
            key={num}
            onClick={() => onChange?.(num)}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : completed
                  ? "bg-success-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
            >
              {completed ? <FiCheck className="w-4 h-4" /> : num}
            </div>
            <span className={`text-[10px] ${active ? "text-primary-600 font-medium" : "text-gray-400"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const BlockTabs = ({ blocks, current, onSelect }: { blocks: Block[]; current: Block | null; onSelect: (id: BlockId) => void }) => {
  const { language } = useI18n();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
      {blocks.map((b) => {
        const active = current?.id === b.id;
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {language === "en" ? b.name_en : b.name_vi}
          </button>
        );
      })}
    </div>
  );
};

const Step1TaskList = () => {
  const { t, language } = useI18n();
  const {
    blocks,
    currentBlock,
    currentBlockIndex,
    setCurrentBlockIndex,
    tasks,
    pendingCarryOver,
    addTask,
    toggleTask,
    removeTask,
    blockStats,
    taskSuggestions,
    setStep,
  } = useSession();

  const [newTask, setNewTask] = useState("");

  const suggestions = useMemo(() => {
    if (!currentBlock) return [];
    return (taskSuggestions[currentBlock.id] || []).map((s) => (language === "en" ? s.title_en : s.title_vi));
  }, [taskSuggestions, currentBlock, language]);

  const blockTasks = useMemo(
    () => tasks.filter((t) => t.block_id === currentBlock?.id),
    [tasks, currentBlock]
  );

  const carryForBlock = useMemo(
    () => pendingCarryOver.filter((t) => t.block_id === currentBlock?.id),
    [pendingCarryOver, currentBlock]
  );

  const stats = currentBlock ? blockStats[currentBlock.id] : null;

  const insightLabels = useMemo(() => {
    if (!stats) return null;
    const { total_done, total_applied, total_tracked, pending_carryover } = stats;
    const appliedCount = total_applied + total_tracked;
    const pick = (count: number, zero: string, one: string, other: string) => {
      if (count === 0) return t(zero, { defaultValue: "" });
      if (count === 1) return t(one, { defaultValue: "" });
      return t(other, { count });
    };
    return {
      done: pick(total_done, "session.insight.doneZero", "session.insight.doneOne", "session.insight.done"),
      applied: pick(appliedCount, "session.insight.appliedZero", "session.insight.appliedOne", "session.insight.applied"),
      pending: pick(pending_carryover, "session.insight.pendingZero", "session.insight.pendingOne", "session.insight.pending"),
    };
  }, [stats, t]);

  const handleAdd = (title: string, source: TaskSource = "suggestion") => {
    if (!currentBlock || !title.trim()) return;
    addTask(currentBlock.id, title, source);
  };

  const handleContinue = async () => {
    if (currentBlockIndex < blocks.length - 1) {
      await setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      await setStep(2);
      await setCurrentBlockIndex(0);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        {t("session.whatToDoInBlock", { block: language === "en" ? currentBlock?.name_en : currentBlock?.name_vi })}
      </h2>

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      {carryForBlock.length > 0 && (
        <Card className="p-4 bg-warning-50 dark:bg-warning-900/10 border-warning-100 dark:border-warning-900/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning-700 dark:text-warning-300 mb-2">
            {t("session.carryOver")}
          </p>
          <div className="flex flex-wrap gap-2">
            {carryForBlock.map((task) => (
              <button
                key={task.id}
                onClick={() => handleAdd(task.title, "carry_over")}
                className="px-3 py-1.5 rounded-full text-sm bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200 hover:bg-warning-200 dark:hover:bg-warning-900/30"
              >
                {task.title}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("session.suggestions")}</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleAdd(s, "suggestion")}
              className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700"
            >
              {s}
            </button>
          ))}
          {suggestions.length === 0 && <p className="text-sm text-gray-400 italic">{t("session.noSuggestions")}</p>}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("session.addTaskPlaceholder")}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd(newTask, "freetext");
                setNewTask("");
              }
            }}
            className="flex-1"
          />
          <Button onClick={() => { handleAdd(newTask, "freetext"); setNewTask(""); }}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {stats && insightLabels && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("session.didYouKnow")}</p>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {t("session.insight.prefix")}{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{insightLabels.done}</span>,{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{insightLabels.applied}</span>, và{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{insightLabels.pending}</span>.
          </p>
        </Card>
      )}

      {blockTasks.length > 0 && (
        <Card className="p-4 space-y-2">
          {blockTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleTask} onRemove={removeTask} />
          ))}
        </Card>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
          {t("common.save")}
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const TaskRow = ({ task, onToggle, onRemove }: { task: DailyTask; onToggle: (id: string) => void; onRemove?: (id: string) => void }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
    <input
      type="checkbox"
      checked={task.status === "done"}
      onChange={() => onToggle(task.id)}
      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
    />
    <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-gray-400" : ""}`}>{task.title}</span>
    {onRemove && (
      <button onClick={() => onRemove(task.id)} className="text-gray-400 hover:text-red-500">
        <FiTrash2 className="w-4 h-4" />
      </button>
    )}
  </div>
);

const SectionAccordion = ({
  section,
  values,
  onChange,
}: {
  section: TemplateSection;
  values: Record<string, string>;
  onChange: (itemId: string, value: string, enabled: boolean) => void;
}) => {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(true);
  const [conceptsOpen, setConceptsOpen] = useState(true);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  const sectionTitle = language === "en" ? section.title_en : section.title_vi;

  const onField = (key: string, value: string) => onChange(key, value, true);

  return (
    <Card className="p-4 space-y-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <span className="font-semibold">{sectionTitle}</span>
        <FiChevronRight className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3">
          <Card className="p-3 bg-gray-50 dark:bg-gray-800/40 border-0 shadow-none">
            <button
              onClick={() => setConceptsOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FiBookOpen className="w-4 h-4 text-primary-600" />
                {t("session.concepts")}
              </span>
              <FiChevronRight className={`w-4 h-4 transition-transform ${conceptsOpen ? "rotate-90" : ""}`} />
            </button>
            {conceptsOpen && (
              <div className="mt-3 space-y-3">
                {section.items.map((item) => (
                  <SectionItemInput key={item.id} item={item} value={values[item.id] || ""} onChange={onChange} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3 bg-gray-50 dark:bg-gray-800/40 border-0 shadow-none">
            <button
              onClick={() => setReferenceOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FiFileText className="w-4 h-4 text-primary-600" />
                {t("session.reference")}
              </span>
              <FiChevronRight className={`w-4 h-4 transition-transform ${referenceOpen ? "rotate-90" : ""}`} />
            </button>
            {referenceOpen && (
              <textarea
                value={values[ANALYSIS_KEYS.reference] || ""}
                onChange={(e) => onField(ANALYSIS_KEYS.reference, e.target.value)}
                className="input h-20 resize-none mt-3"
                placeholder={t("session.referencePlaceholder")}
              />
            )}
          </Card>

          <Card className="p-3 bg-gray-50 dark:bg-gray-800/40 border-0 shadow-none">
            <button
              onClick={() => setExamplesOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FiZap className="w-4 h-4 text-primary-600" />
                {t("session.examples")}
              </span>
              <FiChevronRight className={`w-4 h-4 transition-transform ${examplesOpen ? "rotate-90" : ""}`} />
            </button>
            {examplesOpen && (
              <textarea
                value={values[ANALYSIS_KEYS.examples] || ""}
                onChange={(e) => onField(ANALYSIS_KEYS.examples, e.target.value)}
                className="input h-20 resize-none mt-3"
                placeholder={t("session.examplesPlaceholder")}
              />
            )}
          </Card>

          <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FiClipboard className="w-4 h-4 text-primary-600" />
              {t("session.yourAnalysis")}
            </h3>
            <div className="space-y-3">
              <Input
                label={t("session.keyInsights")}
                value={values[ANALYSIS_KEYS.keyInsights] || ""}
                onChange={(e) => onField(ANALYSIS_KEYS.keyInsights, e.target.value)}
                placeholder={t("session.keyInsightsPlaceholder")}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("session.detailedNotes")}
                </label>
                <textarea
                  value={values[ANALYSIS_KEYS.detailedNotes] || ""}
                  onChange={(e) => onField(ANALYSIS_KEYS.detailedNotes, e.target.value)}
                  className="input h-24 resize-none"
                  placeholder={t("session.detailedNotesPlaceholder")}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("session.confidenceLevel")}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">1</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={Number(values[ANALYSIS_KEYS.confidence] || 3)}
                    onChange={(e) => onField(ANALYSIS_KEYS.confidence, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-xs text-gray-500">5</span>
                  <span className="text-sm font-medium w-4">{values[ANALYSIS_KEYS.confidence] || 3}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

const KnowledgeModal = ({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold">{language === "en" ? entry.title_en : entry.title_vi}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {language === "en" ? entry.content_en : entry.content_vi}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate("/knowledge")}>{t("knowledge.viewFull")}</Button>
            <Button variant="secondary" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionItemInput = ({
  item,
  value,
  onChange,
}: {
  item: TemplateSectionItem;
  value: string;
  onChange: (itemId: string, value: string, enabled: boolean) => void;
}) => {
  const { t, language } = useI18n();
  const { knowledgeEntries } = useSession();
  const [enabled, setEnabled] = useState(item.default_enabled);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const knowledgeEntry = item.knowledge_entry_id ? knowledgeEntries.find((e) => e.id === item.knowledge_entry_id) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              onChange(item.id, value, e.target.checked);
            }}
            className="w-4 h-4 rounded border-gray-300 text-primary-600"
          />
          {language === "en" ? item.title_en : item.title_vi}
        </label>
        {knowledgeEntry && (
          <button
            onClick={() => setShowKnowledge(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
            title={t("session.readKnowledge")}
          >
            <FiBookOpen className="w-4 h-4" />
            {t("session.readKnowledge")}
          </button>
        )}
      </div>
      {enabled && (
        <textarea
          value={value}
          onChange={(e) => onChange(item.id, e.target.value, enabled)}
          className="input h-20 resize-none"
          placeholder={t("session.reflectionPlaceholder")}
        />
      )}
      {showKnowledge && knowledgeEntry && <KnowledgeModal entry={knowledgeEntry} onClose={() => setShowKnowledge(false)} />}
    </div>
  );
};

const PinnedTasks = ({ tasks }: { tasks: DailyTask[] }) => {
  const { t } = useI18n();
  if (tasks.length === 0) return null;
  return (
    <Card className="p-3 bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30 sticky top-16 md:top-0 z-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 mb-2">
        {t("session.pinnedTasks")}
      </p>
      <div className="flex flex-wrap gap-2">
        {tasks.map((task) => (
          <span
            key={task.id}
            className="px-2 py-1 rounded-md text-xs bg-white dark:bg-gray-800 border border-primary-100 dark:border-primary-900/30"
          >
            {task.title}
          </span>
        ))}
      </div>
    </Card>
  );
};

const Step2Recognize = () => {
  const { t, language } = useI18n();
  const { blocks, currentBlock, setCurrentBlockIndex, tasks, getTemplate, referenceInputs, saveReferenceInput, setStep } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, "recognize");

  const blockTasks = useMemo(
    () => tasks.filter((t) => t.block_id === currentBlock?.id),
    [tasks, currentBlock]
  );

  const handleSave = (sectionId: string, itemId: string, content: string, enabled: boolean) => {
    saveReferenceInput(sectionId, itemId, content, enabled);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("session.step2Title")}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("session.recognizeHint", { block: language === "en" ? currentBlock?.name_en : currentBlock?.name_vi })}
      </p>

      {template?.sections
        ?.filter((s) => ["nguyen_ly", "dao", "phap"].includes(s.group))
        .map((section) => {
          const values: Record<string, string> = {};
          section.items.forEach((item) => {
            const key = `${section.id}:${item.id}`;
            if (referenceInputs[key]) values[item.id] = referenceInputs[key].content;
          });
          [
            ANALYSIS_KEYS.reference,
            ANALYSIS_KEYS.examples,
            ANALYSIS_KEYS.keyInsights,
            ANALYSIS_KEYS.detailedNotes,
            ANALYSIS_KEYS.confidence,
          ].forEach((k) => {
            const key = `${section.id}:${k}`;
            if (referenceInputs[key]) values[k] = referenceInputs[key].content;
          });
          return (
            <SectionAccordion
              key={section.id}
              section={section}
              values={values}
              onChange={(itemId, value, enabled) => handleSave(section.id, itemId, value, enabled)}
            />
          );
        })}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setStep(1)}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1">
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const PlanField = ({
  item,
  value,
  onChange,
}: {
  item: TemplateSectionItem;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t, language } = useI18n();
  const { knowledgeEntries } = useSession();
  const [showKnowledge, setShowKnowledge] = useState(false);
  const knowledgeEntry = item.knowledge_entry_id ? knowledgeEntries.find((e) => e.id === item.knowledge_entry_id) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="block text-sm font-medium">{language === "en" ? item.title_en : item.title_vi}</label>
        {knowledgeEntry && (
          <button
            onClick={() => setShowKnowledge(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
            title={t("session.readKnowledge")}
          >
            <FiBookOpen className="w-4 h-4" />
            {t("session.readKnowledge")}
          </button>
        )}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      {showKnowledge && knowledgeEntry && <KnowledgeModal entry={knowledgeEntry} onClose={() => setShowKnowledge(false)} />}
    </div>
  );
};

const Step3Apply = () => {
  const { t, language } = useI18n();
  const { currentBlock, blocks, setCurrentBlockIndex, tasks, getTemplate, applyPlans, saveApplyPlan, setStep, setSelectedTaskId, selectedTaskId } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, "apply");

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);
  const selected = blockTasks.find((t) => t.id === selectedTaskId) || blockTasks[0] || null;

  const [values, setValues] = useState<Record<string, string>>({});

  const plan = selected ? applyPlans[selected.id] : null;

  useEffect(() => {
    if (plan) setValues(plan.plan_data);
    else setValues({});
  }, [selected, plan]);

  const handleSave = async () => {
    if (!selected) return;
    await saveApplyPlan(selected.id, values);
    // Move to next task without plan
    const currentIdx = blockTasks.findIndex((t) => t.id === selected.id);
    const next = blockTasks.slice(currentIdx + 1).find((t) => !applyPlans[t.id]);
    if (next) setSelectedTaskId(next.id);
    else setSelectedTaskId(null);
  };

  const allApplied = useMemo(() => blockTasks.length > 0 && blockTasks.every((t) => applyPlans[t.id]), [blockTasks, applyPlans]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("session.step3Title")}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <Card className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("session.chooseTask")}</p>
        <div className="flex flex-wrap gap-2">
          {blockTasks.map((task) => {
            const done = !!applyPlans[task.id];
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                  selected?.id === task.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                {done && <FiCheck className="w-3 h-3" />}
                {task.title}
              </button>
            );
          })}
        </div>
      </Card>

      {selected && template?.sections?.map((section) => (
        <Card key={section.id} className="p-4">
          <h3 className="font-semibold mb-3">{language === "en" ? section.title_en : section.title_vi}</h3>
          <div className="space-y-3">
            {section.items.map((item) => (
              <PlanField
                key={item.id}
                item={item}
                value={values[item.id] || ""}
                onChange={(value) => setValues((prev) => ({ ...prev, [item.id]: value }))}
              />
            ))}
          </div>
        </Card>
      ))}

      {selected && (
        <Button onClick={handleSave} className="w-full">
          <FiCheck className="w-4 h-4 mr-1" /> {t("session.savePlan")}
        </Button>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setStep(2)}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        <Button variant={allApplied ? "primary" : "secondary"} onClick={() => setStep(4)} className="flex-1">
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const Step4Track = () => {
  const { t, language } = useI18n();
  const { currentBlock, blocks, setCurrentBlockIndex, tasks, getTemplate, tracks, saveTrack, completeSession, setStep, setSelectedTaskId, selectedTaskId } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, "track");

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);
  const selected = blockTasks.find((t) => t.id === selectedTaskId) || blockTasks[0] || null;

  const existing = selected ? tracks[selected.id] : null;
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setFields({ dich: existing.dich, thuc_te: existing.thuc_te, phuong_phap: existing.phuong_phap });
    } else {
      setFields({ dich: "", thuc_te: "", phuong_phap: "" });
    }
  }, [selected, existing]);

  const handleSave = async () => {
    if (!selected) return;
    await saveTrack(selected.id, { dich: fields.dich || "", thuc_te: fields.thuc_te || "", phuong_phap: fields.phuong_phap || "" });
    const currentIdx = blockTasks.findIndex((t) => t.id === selected.id);
    const next = blockTasks.slice(currentIdx + 1).find((t) => !tracks[t.id]);
    if (next) setSelectedTaskId(next.id);
    else setSelectedTaskId(null);
  };

  const allTracked = useMemo(() => blockTasks.length > 0 && blockTasks.every((t) => tracks[t.id]), [blockTasks, tracks]);

  const trackItems = template?.sections?.[0]?.items || [
    { id: "dich", title_vi: "Đích", title_en: "Goal" },
    { id: "thuc_te", title_vi: "Thực tế", title_en: "Reality" },
    { id: "phuong_phap", title_vi: "Phương pháp", title_en: "Method" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("session.step4Title")}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <Card className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("session.chooseTask")}</p>
        <div className="flex flex-wrap gap-2">
          {blockTasks.map((task) => {
            const done = !!tracks[task.id];
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                  selected?.id === task.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                {done && <FiCheck className="w-3 h-3" />}
                {task.title}
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="p-4 space-y-3">
          {trackItems.map((item) => (
            <div key={item.id}>
              <label className="block text-sm font-medium mb-1">{language === "en" ? item.title_en : item.title_vi}</label>
              <textarea
                value={fields[item.id] || ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [item.id]: e.target.value }))}
                className="input h-20 resize-none"
              />
            </div>
          ))}
          <Button onClick={handleSave} className="w-full">
            <FiCheck className="w-4 h-4 mr-1" /> {t("session.saveTrack")}
          </Button>
        </Card>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setStep(3)}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        {allTracked ? (
          <Button onClick={completeSession} className="flex-1">
            {t("session.completeSession")} <FiCheck className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">
            {t("common.continue")}
          </Button>
        )}
      </div>
    </div>
  );
};

const SessionPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { step, setStep, isLoading, saveDraft } = useSession();

  const renderStep = () => {
    if (isLoading) return <p className="text-center text-gray-500 py-10">{t("common.loading")}</p>;
    switch (step) {
      case 1:
        return <Step1TaskList />;
      case 2:
        return <Step2Recognize />;
      case 3:
        return <Step3Apply />;
      case 4:
        return <Step4Track />;
      default:
        return <Step1TaskList />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("session.backToDashboard")}
        </Button>
        <Button variant="secondary" size="sm" onClick={saveDraft}>
          {t("common.save")}
        </Button>
      </div>
      <StepIndicator step={step} onChange={setStep} />
      {renderStep()}
    </div>
  );
};

export default SessionPage;
