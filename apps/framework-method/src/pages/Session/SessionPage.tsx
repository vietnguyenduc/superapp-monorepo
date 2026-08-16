import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2, FiCheck, FiBookOpen, FiFileText, FiZap, FiClipboard, FiX, FiMapPin, FiSave, FiChevronDown, FiActivity } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import MeritReflectionModal from "../../components/MeritReflectionModal";
import { plannedCompletionAdjustment, MERIT_SIZE_LABELS } from "../../services/frameworkMethodService";
import type { Block, BlockId, DailyTask, KnowledgeEntry, StepType, TemplateSection, TemplateSectionItem, MeritSize, MeritType } from "../../types";

const ANALYSIS_KEYS = {
  keyInsights: "__key_insights__",
  detailedNotes: "__detailed_notes__",
  confidence: "__confidence__",
};

const StepIndicator = ({ step, onChange }: { step: number; onChange?: (s: number) => void }) => {
  const { t, language } = useI18n();
  const { currentBlock, templates, stepTypes } = useSession();
  const labels = useMemo(() => {
    const stepLabels = stepTypes.map((st) => {
      const template = currentBlock?.id ? templates[currentBlock.id]?.[st] : undefined;
      const vi = template?.name_vi || template?.name || st;
      const en = template?.name_en || template?.name_vi || template?.name || st;
      return language === "en" ? en : vi;
    });
    return [t("session.step1"), ...stepLabels];
  }, [t, language, currentBlock, templates, stepTypes]);
  return (
    <div className="relative flex items-start justify-between mb-6">
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 dark:bg-[#2C2C2E] -z-10 mx-10" />
      {labels.map((label, idx) => {
        const num = idx + 1;
        const active = num === step;
        const completed = num < step;
        return (
          <button
            key={num}
            onClick={() => onChange?.(num)}
            aria-current={active ? "step" : undefined}
            className="group flex flex-col items-center gap-2 flex-1 min-w-0"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                active
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                  : completed
                  ? "bg-success-500 text-white"
                  : "bg-white dark:bg-[#2C2C2E] text-gray-400 border border-black/[0.06] dark:border-white/[0.08]"
              }`}
            >
              {completed ? <FiCheck className="w-5 h-5" /> : num}
            </div>
            <span
              className={`text-xs leading-tight text-center px-1 ${
                active ? "text-primary-600 font-semibold" : completed ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const BlockTabs = ({ blocks, current, onSelect }: { blocks: Block[]; current: Block | null; onSelect: (id: BlockId) => void }) => {
  const { language } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {blocks.map((block) => {
        const active = current?.id === block.id;
        return (
          <button
            key={block.id}
            onClick={() => onSelect(block.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all min-h-[2.75rem] ${
              active
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                : "bg-white dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] text-gray-600 dark:text-gray-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
            }`}
          >
            {language === "en" ? block.name_en : block.name_vi}
          </button>
        );
      })}
    </div>
  );
};

const PinnedTasks = ({ tasks }: { tasks: DailyTask[] }) => {
  const { t } = useI18n();
  if (tasks.length === 0) return null;
  return (
    <div className="sticky top-16 z-20 card p-4">
      <div className="flex items-center gap-2 mb-2">
        <FiMapPin className="w-4 h-4 text-primary-600" />
        <span className="section-title mb-0">{t("session.pinnedTasks")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tasks.map((task) => (
          <span
            key={task.id}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 truncate max-w-[12rem]"
            title={task.title}
          >
            {task.title}
          </span>
        ))}
      </div>
    </div>
  );
};

const InsightCard = ({ stats }: { stats: { total_done: number; total_applied: number; total_tracked: number; pending_carryover: number } | null }) => {
  const { t } = useI18n();

  const insightLabels = useMemo(() => {
    if (!stats) return null;
    const appliedCount = stats.total_applied + stats.total_tracked;
    const pick = (count: number, zero: string, one: string, other: string) => {
      if (count === 0) return t(zero, { defaultValue: "" });
      if (count === 1) return t(one, { defaultValue: "" });
      return t(other, { count });
    };
    return {
      done: pick(stats.total_done, "session.insight.doneZero", "session.insight.doneOne", "session.insight.done"),
      applied: pick(appliedCount, "session.insight.appliedZero", "session.insight.appliedOne", "session.insight.applied"),
      pending: pick(stats.pending_carryover, "session.insight.pendingZero", "session.insight.pendingOne", "session.insight.pending"),
    };
  }, [stats, t]);

  if (!insightLabels) return null;

  return (
    <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/50 to-white dark:from-primary-900/10 dark:to-gray-900 border-primary-100 dark:border-primary-900/20">
      <p className="section-title text-primary-600 mb-2">{t("session.didYouKnow")}</p>
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        {t("session.insight.text", {
          done: insightLabels.done,
          applied: insightLabels.applied,
          pending: insightLabels.pending,
        })}
      </p>
    </Card>
  );
};

const KnowledgeContent = ({ entry }: { entry: KnowledgeEntry }) => {
  const { language } = useI18n();
  return (
    <div className="space-y-3">
      {entry.image_url && (
        <img
          src={entry.image_url}
          alt={language === "en" ? entry.title_en : entry.title_vi}
          className="w-full max-h-48 object-cover rounded-xl border border-gray-100 dark:border-gray-800"
        />
      )}
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
        {language === "en" ? entry.content_en : entry.content_vi}
      </p>
    </div>
  );
};

const SubAccordion = ({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left p-4 min-h-[3.5rem] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
        <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 dark:text-white">
          {icon}
          {title}
        </span>
        {open ? <FiChevronDown className="w-4 h-4 text-gray-500" /> : <FiChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

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
  const { knowledgeEntries } = useSession();
  const [open, setOpen] = useState(true);
  const [conceptsOpen, setConceptsOpen] = useState(true);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  const sectionTitle = language === "en" ? section.title_en : section.title_vi;

  const conceptEntry = useMemo(
    () => knowledgeEntries.find((e) => e.id === section.concept_knowledge_entry_id),
    [knowledgeEntries, section.concept_knowledge_entry_id]
  );
  const referenceEntry = useMemo(
    () => knowledgeEntries.find((e) => e.id === section.reference_knowledge_entry_id),
    [knowledgeEntries, section.reference_knowledge_entry_id]
  );
  const exampleEntry = useMemo(
    () => knowledgeEntries.find((e) => e.id === section.example_knowledge_entry_id),
    [knowledgeEntries, section.example_knowledge_entry_id]
  );

  const onField = (key: string, value: string) => onChange(key, value, true);

  return (
    <Card className="p-5 space-y-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left min-h-[3rem]">
        <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{sectionTitle}</span>
        <FiChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 pt-2">
          <SubAccordion
            title={t("session.concepts")}
            icon={<FiBookOpen className="w-4 h-4 text-primary-600" />}
            open={conceptsOpen}
            onToggle={() => setConceptsOpen((o) => !o)}
          >
            {conceptEntry ? <KnowledgeContent entry={conceptEntry} /> : <p className="text-sm text-gray-500 italic">{t("session.noConceptKnowledge")}</p>}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {section.items.map((item) => (
                <SectionItemInput key={item.id} item={item} value={values[item.id] || ""} onChange={onChange} />
              ))}
            </div>
          </SubAccordion>

          <SubAccordion
            title={t("session.reference")}
            icon={<FiFileText className="w-4 h-4 text-primary-600" />}
            open={referenceOpen}
            onToggle={() => setReferenceOpen((o) => !o)}
          >
            {referenceEntry ? <KnowledgeContent entry={referenceEntry} /> : <p className="text-sm text-gray-500 italic">{t("session.noReferenceKnowledge")}</p>}
          </SubAccordion>

          <SubAccordion
            title={t("session.examples")}
            icon={<FiZap className="w-4 h-4 text-primary-600" />}
            open={examplesOpen}
            onToggle={() => setExamplesOpen((o) => !o)}
          >
            {section.example_content_vi ? (
              <div
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: language === "en" ? section.example_content_en || section.example_content_vi : section.example_content_vi }}
              />
            ) : exampleEntry ? (
              <KnowledgeContent entry={exampleEntry} />
            ) : (
              <p className="text-sm text-gray-500 italic">{t("session.noExampleKnowledge")}</p>
            )}
          </SubAccordion>

          <div className="rounded-2xl p-5 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <FiClipboard className="w-4 h-4 text-primary-600" />
              {t("session.yourAnalysis")}
            </h3>
            <div className="space-y-4">
              <Input
                label={t("session.keyInsights")}
                value={values[ANALYSIS_KEYS.keyInsights] || ""}
                onChange={(e) => onField(ANALYSIS_KEYS.keyInsights, e.target.value)}
                placeholder={t("session.keyInsightsPlaceholder")}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("session.detailedNotes")}</label>
                <textarea
                  value={values[ANALYSIS_KEYS.detailedNotes] || ""}
                  onChange={(e) => onField(ANALYSIS_KEYS.detailedNotes, e.target.value)}
                  className="input h-28 resize-none"
                  placeholder={t("session.detailedNotesPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("session.confidenceLevel")}</label>
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
          </div>
        </div>
      )}
    </Card>
  );
};

const KnowledgeModal = ({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-black/[0.04] dark:border-white/[0.08]">
        <div className="sticky top-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="font-semibold text-lg tracking-tight pr-4">{language === "en" ? entry.title_en : entry.title_vi}</h3>
          <button onClick={onClose} className="p-2 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {entry.image_url && (
            <img
              src={entry.image_url}
              alt={language === "en" ? entry.title_en : entry.title_vi}
              className="w-full rounded-2xl border border-black/[0.04] dark:border-white/[0.06]"
            />
          )}
          <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {language === "en" ? (entry.loi_en || entry.content_en) : (entry.loi_vi || entry.content_vi)}
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

  const itemContent = language === "en" ? item.content_en : item.content_vi;
  const knowledgeSnippet =
    language === "en"
      ? (knowledgeEntry?.summary_en || knowledgeEntry?.cot_y_en || knowledgeEntry?.content_en)
      : (knowledgeEntry?.summary_vi || knowledgeEntry?.cot_y_vi || knowledgeEntry?.content_vi);

  const hasKnowledge = Boolean(knowledgeEntry || itemContent || knowledgeSnippet);

  const fallbackEntry: KnowledgeEntry = {
    id: item.id,
    title_vi: item.title_vi,
    title_en: item.title_en,
    content_vi: item.content_vi || "",
    content_en: item.content_en || "",
    summary_vi: item.content_vi || "",
    summary_en: item.content_en || "",
    cot_y_vi: item.content_vi || "",
    cot_y_en: item.content_en || "",
    category: "concept",
    order_index: 0,
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white min-h-[2.75rem]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              onChange(item.id, value, e.target.checked);
            }}
            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600"
          />
          {language === "en" ? item.title_en : item.title_vi}
        </label>
        {hasKnowledge && (
          <button
            onClick={() => setShowKnowledge(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10"
            title={t("session.readKnowledge")}
          >
            <FiBookOpen className="w-4 h-4" />
            {t("session.readKnowledge")}
          </button>
        )}
      </div>
      {enabled && (
        <>
          {itemContent ? (
            <div
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: itemContent }}
            />
          ) : knowledgeSnippet ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04]">
              {knowledgeSnippet}
            </p>
          ) : null}
          <textarea
            value={value}
            onChange={(e) => onChange(item.id, e.target.value, enabled)}
            className="input h-24 resize-none"
            placeholder={t("session.reflectionPlaceholder")}
          />
        </>
      )}
      {showKnowledge && <KnowledgeModal entry={knowledgeEntry || fallbackEntry} onClose={() => setShowKnowledge(false)} />}
    </div>
  );
};

const Step1TaskList = () => {
  const { t, language } = useI18n();
  const { blocks, currentBlock, setCurrentBlockIndex, tasks, addTask, toggleTask, removeTask, blockStats, taskSuggestions, pendingCarryOver, setStep, isLoading } = useSession();

  const currentStats = currentBlock?.id ? blockStats[currentBlock.id] : null;

  const suggestions = useMemo(() => {
    if (!currentBlock) return [];
    const carry = pendingCarryOver.filter((t) => t.block_id === currentBlock.id);
    const list = taskSuggestions[currentBlock.id] || [];
    const seen = new Set<string>();
    const result: { title: string; isCarry: boolean }[] = [];
    carry.forEach((t) => {
      if (!seen.has(t.title)) {
        seen.add(t.title);
        result.push({ title: t.title, isCarry: true });
      }
    });
    list.forEach((s) => {
      if (!seen.has(s.title_vi) && !seen.has(s.title_en)) {
        seen.add(language === "en" ? s.title_en : s.title_vi);
        result.push({ title: language === "en" ? s.title_en : s.title_vi, isCarry: false });
      }
    });
    return result;
  }, [currentBlock, pendingCarryOver, taskSuggestions, language]);

  const [newTask, setNewTask] = useState("");
  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);

  const handleAddTask = () => {
    if (!newTask.trim() || !currentBlock) return;
    addTask(currentBlock.id, newTask.trim(), "freetext");
    setNewTask("");
  };

  const handleContinue = async () => {
    if (!blocks.length) return;
    const currentIndex = blocks.findIndex((b) => b.id === currentBlock?.id);
    if (currentIndex < blocks.length - 1) {
      await setCurrentBlockIndex(currentIndex + 1);
    } else {
      setStep(2);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {t("session.step1Title", { block: language === "en" ? currentBlock?.name_en : currentBlock?.name_vi })}
      </h2>

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <PinnedTasks tasks={blockTasks} />

      {currentStats && <InsightCard stats={currentStats} />}

      <Card className="p-5 rounded-2xl space-y-3">
        <p className="section-title">{t("session.suggestions")}</p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("session.noSuggestions")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.title}-${idx}`}
                onClick={() => {
                  if (currentBlock) addTask(currentBlock.id, s.title, s.isCarry ? "carry_over" : "suggestion");
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors min-h-[2.75rem]"
              >
                {s.title}
                {s.isCarry && <span className="ml-1.5 text-xs text-primary-600">({t("session.carryOver")})</span>}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <p className="section-title">{t("session.tasksDone")}</p>
        {blockTasks.length === 0 ? (
          <p className="text-sm text-gray-500">{t("session.emptyTasks")}</p>
        ) : (
          <div className="space-y-2">
            {blockTasks.map((task) => (
              <label key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 min-h-[3rem]">
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600"
                />
                <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>{task.title}</span>
                <button
                  onClick={() => removeTask(task.id)}
                  aria-label={t("common.delete")}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder={t("session.addTaskPlaceholder")}
            className="input flex-1"
          />
          <Button onClick={handleAddTask} aria-label={t("common.add")}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const Step2Recognize = () => {
  const { t, language } = useI18n();
  const { blocks, currentBlock, setCurrentBlockIndex, tasks, getTemplate, referenceInputs, saveReferenceInput, setStep, currentStepType, prevStep, nextStep } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, currentStepType || "recognize");

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);

  const handleSave = (sectionId: string, itemId: string, content: string, enabled: boolean) => {
    saveReferenceInput(sectionId, itemId, content, enabled);
  };

  const title = language === "en" ? template?.name_en || template?.name_vi || t("session.step2Title") : template?.name_vi || t("session.step2Title");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>

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
          [ANALYSIS_KEYS.keyInsights, ANALYSIS_KEYS.detailedNotes, ANALYSIS_KEYS.confidence].forEach((k) => {
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

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setStep(prevStep)} className="flex-1">
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        <Button onClick={() => setStep(nextStep)} className="flex-1">
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const GenericStep = ({ stepType }: { stepType: StepType }) => {
  const { t, language } = useI18n();
  const { blocks, currentBlock, setCurrentBlockIndex, tasks, getTemplate, referenceInputs, saveReferenceInput, setStep, prevStep, nextStep } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, stepType);

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);

  const handleSave = (sectionId: string, itemId: string, content: string, enabled: boolean) => {
    saveReferenceInput(sectionId, itemId, content, enabled);
  };

  const title = language === "en" ? template?.name_en || template?.name_vi || stepType : template?.name_vi || stepType;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      {template?.sections?.map((section) => {
        const values: Record<string, string> = {};
        section.items.forEach((item) => {
          const key = `${section.id}:${item.id}`;
          if (referenceInputs[key]) values[item.id] = referenceInputs[key].content;
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

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setStep(prevStep)} className="flex-1">
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        <Button onClick={() => setStep(nextStep)} className="flex-1">
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

  const itemContent = language === "en" ? item.content_en : item.content_vi;
  const fallbackEntry: KnowledgeEntry = {
    id: item.id,
    title_vi: item.title_vi,
    title_en: item.title_en,
    content_vi: item.content_vi || "",
    content_en: item.content_en || "",
    summary_vi: item.content_vi || "",
    summary_en: item.content_en || "",
    cot_y_vi: item.content_vi || "",
    cot_y_en: item.content_en || "",
    category: "concept",
    order_index: 0,
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <label className="text-sm font-semibold text-gray-900 dark:text-white">{language === "en" ? item.title_en : item.title_vi}</label>
        {(knowledgeEntry || itemContent) && (
          <button
            onClick={() => setShowKnowledge(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10"
            title={t("session.readKnowledge")}
          >
            <FiBookOpen className="w-4 h-4" />
            {t("session.readKnowledge")}
          </button>
        )}
      </div>
      {itemContent && (
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          {itemContent}
        </div>
      )}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t("session.planPlaceholder")} />
      {showKnowledge && <KnowledgeModal entry={knowledgeEntry || fallbackEntry} onClose={() => setShowKnowledge(false)} />}
    </div>
  );
};

const Step3Apply = () => {
  const { t, language } = useI18n();
  const { currentBlock, blocks, setCurrentBlockIndex, tasks, getTemplate, applyPlans, saveApplyPlan, setStep, setSelectedTaskId, selectedTaskId, currentStepType, prevStep, nextStep } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, currentStepType || "apply");

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);

  useEffect(() => {
    if (blockTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(blockTasks[0].id);
    }
  }, [blockTasks, selectedTaskId, setSelectedTaskId]);

  const selectedTask = blockTasks.find((t) => t.id === selectedTaskId);
  const plan = selectedTaskId ? applyPlans[selectedTaskId] : undefined;
  const initialPlan = plan?.plan_data || {};

  const [draft, setDraft] = useState<Record<string, string>>(initialPlan);

  useEffect(() => {
    setDraft(plan?.plan_data || {});
  }, [selectedTaskId, plan?.plan_data]);

  const handleSave = async () => {
    if (!selectedTask) return;
    const items = template?.sections?.[0]?.items || [];
    const data: Record<string, string> = {};
    items.forEach((item) => {
      data[item.id] = draft[item.id] || "";
    });
    await saveApplyPlan(selectedTask.id, data);
  };

  const title = language === "en" ? template?.name_en || template?.name_vi || t("session.step3Title") : template?.name_vi || t("session.step3Title");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <Card className="p-5 rounded-2xl space-y-3">
        <p className="section-title">{t("session.chooseTask")}</p>
        <div className="flex flex-wrap gap-2">
          {blockTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[2.75rem] ${
                selectedTaskId === task.id
                  ? "bg-primary-600 text-white shadow-sm shadow-primary-600/20"
                  : applyPlans[task.id]
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {task.title}
            </button>
          ))}
        </div>
      </Card>

      {selectedTask && (
        <Card className="p-5 rounded-2xl space-y-5">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{t("session.planFor", { task: selectedTask.title })}</h3>
          {template?.sections?.map((section) =>
            section.items.map((item) => (
              <PlanField
                key={item.id}
                item={item}
                value={draft[item.id] || ""}
                onChange={(value) => setDraft((prev) => ({ ...prev, [item.id]: value }))}
              />
            ))
          )}

          <Button onClick={handleSave}>
            <FiSave className="w-4 h-4 mr-1" /> {t("session.savePlan")}
          </Button>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setStep(prevStep)}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        <Button onClick={() => setStep(nextStep)} className="flex-1">
          {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const Step4Track = () => {
  const { t, language } = useI18n();
  const { currentBlock, blocks, setCurrentBlockIndex, tasks, getTemplate, tracks, saveTrack, completeSession, setStep, setSelectedTaskId, selectedTaskId, currentStepType, isLastStep, prevStep, nextStep, updateTask, setPlannedCompletionRate, session } = useSession();
  const template = getTemplate(currentBlock?.id || blocks[0]?.id, currentStepType || "track");

  const blockTasks = useMemo(() => tasks.filter((t) => t.block_id === currentBlock?.id), [tasks, currentBlock]);

  useEffect(() => {
    if (blockTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(blockTasks[0].id);
    }
  }, [blockTasks, selectedTaskId, setSelectedTaskId]);

  const selectedTask = blockTasks.find((t) => t.id === selectedTaskId);
  const track = selectedTaskId ? tracks[selectedTaskId] : undefined;

  const [dich, setDich] = useState(track?.dich || "");
  const [thucTe, setThucTe] = useState(track?.thuc_te || "");
  const [phuongPhap, setPhuongPhap] = useState(track?.phuong_phap || "");
  const [reflectingTask, setReflectingTask] = useState<DailyTask | null>(null);

  useEffect(() => {
    setDich(track?.dich || "");
    setThucTe(track?.thuc_te || "");
    setPhuongPhap(track?.phuong_phap || "");
  }, [track]);

  const allTracked = useMemo(() => blockTasks.length > 0 && blockTasks.every((t) => tracks[t.id]), [blockTasks, tracks]);

  const handleSave = async () => {
    if (!selectedTask) return;
    await saveTrack(selectedTask.id, { dich, thuc_te: thucTe, phuong_phap: phuongPhap });
  };

  const title = language === "en" ? template?.name_en || template?.name_vi || t("session.step4Title") : template?.name_vi || t("session.step4Title");
  const plannedRate = session?.planned_completion_rate ?? 100;
  const adjustment = plannedCompletionAdjustment(plannedRate);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>

      <PinnedTasks tasks={blockTasks} />

      <BlockTabs
        blocks={blocks}
        current={currentBlock}
        onSelect={async (id) => {
          const idx = blocks.findIndex((b) => b.id === id);
          if (idx >= 0) await setCurrentBlockIndex(idx);
        }}
      />

      <Card className="p-5 rounded-2xl space-y-3">
        <p className="section-title">{t("session.chooseTask")}</p>
        <div className="flex flex-wrap gap-2">
          {blockTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[2.75rem] ${
                selectedTaskId === task.id
                  ? "bg-primary-600 text-white shadow-sm shadow-primary-600/20"
                  : tracks[task.id]
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {task.title}
            </button>
          ))}
        </div>
      </Card>

      {selectedTask && (
        <Card className="p-5 rounded-2xl space-y-5">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{t("session.trackFor", { task: selectedTask.title })}</h3>
          {template?.sections?.[0]?.items.map((item) => {
            const value = item.id === "dich" ? dich : item.id === "thuc_te" ? thucTe : phuongPhap;
            const setter = item.id === "dich" ? setDich : item.id === "thuc_te" ? setThucTe : setPhuongPhap;
            const itemContent = language === "en" ? item.content_en : item.content_vi;
            return (
              <div key={item.id} className="space-y-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {language === "en" ? item.title_en : item.title_vi}
                </label>
                {itemContent && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04]">
                    {itemContent}
                  </div>
                )}
                <textarea
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="input h-28 resize-none"
                  placeholder={t("session.trackPlaceholder")}
                />
              </div>
            );
          })}
          <Button onClick={handleSave}>
            <FiSave className="w-4 h-4 mr-1" /> {t("session.saveTrack")}
          </Button>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Phúc nghiệp</p>
            <div className="flex flex-wrap gap-2">
              {(["earn", "spend"] as MeritType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => updateTask(selectedTask.id, { merit_type: type, merit_size: selectedTask.merit_size || "small" })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedTask.merit_type === type
                      ? type === "earn"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {type === "earn" ? "Tạo Phúc" : "Tiêu Phúc"}
                </button>
              ))}
            </div>
            {selectedTask.merit_type && (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MERIT_SIZE_LABELS) as MeritSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateTask(selectedTask.id, { merit_type: selectedTask.merit_type || "earn", merit_size: size })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      selectedTask.merit_size === size
                        ? "bg-primary-600 text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {MERIT_SIZE_LABELS[size][language === "en" ? "en" : "vi"]}
                  </button>
                ))}
              </div>
            )}
            {selectedTask.merit_type && selectedTask.merit_size && (
              <Button
                onClick={() => setReflectingTask(selectedTask)}
                variant="secondary"
                size="sm"
              >
                {selectedTask.merit_reflected ? "Đo lại" : "Đo tâm & Đo Phúc"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {session && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold tracking-tight">Đánh giá mức độ hoàn thành kế hoạch</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={plannedRate}
              onChange={(e) => setPlannedCompletionRate(Number(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-primary-600"
            />
            <span className="text-sm font-semibold w-12 text-right">{plannedRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Điều chỉnh Phúc:</span>
            <span className={`font-semibold ${adjustment >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {adjustment >= 0 ? `+${adjustment}` : adjustment}
            </span>
          </div>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setStep(prevStep)}>
          <FiChevronLeft className="w-4 h-4 mr-1" /> {t("common.back")}
        </Button>
        {isLastStep && allTracked ? (
          <Button onClick={completeSession} className="flex-1">
            {t("session.completeSession")} <FiCheck className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => setStep(isLastStep ? prevStep : nextStep)} className="flex-1">
            {t("common.continue")} <FiChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {reflectingTask && <MeritReflectionModal task={reflectingTask} onClose={() => setReflectingTask(null)} />}
    </div>
  );
};

const SessionPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { effectiveStep, setStep, saveDraft, currentStepType } = useSession();

  const renderStep = () => {
    if (effectiveStep === 1) return <Step1TaskList />;
    if (currentStepType === "recognize") return <Step2Recognize />;
    if (currentStepType === "apply") return <Step3Apply />;
    if (currentStepType === "track") return <Step4Track />;
    if (currentStepType) return <GenericStep stepType={currentStepType} />;
    return <Step1TaskList />;
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
      <StepIndicator step={effectiveStep} onChange={setStep} />
      {renderStep()}
    </div>
  );
};

export default SessionPage;
