import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiUpload,
  FiTrash2,
  FiPlus,
  FiBook,
  FiInfo,
  FiSun,
  FiEdit3,
  FiStar,
  FiList,
  FiType,
  FiHash,
  FiGitBranch,
  FiArrowLeft,
  FiChevronUp,
  FiChevronDown,
  FiPlusCircle,
} from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, defaultSteps } from "../../hooks/useFrameworkProgress";
import type { Block, BlockType, Step } from "../../types";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const makeBlock = (type: BlockType, label?: string): Block => ({
  id: `block-${uid()}`,
  type,
  label: label || type,
  prompt: "",
  placeholder: "",
  reflectionQuestion: "",
  reflectionPlaceholder: "",
  reflectionHint: "",
  referenceBlockId: "",
  showIfBlockId: "",
  showIfValue: "",
  required: false,
  order_index: 0,
});

const makeStep = (title?: string): Step => ({
  id: `step-${uid()}`,
  phase_id: "custom",
  phaseName: "Custom",
  title: title || "New Step",
  description: "",
  order_index: 0,
  blocks: [makeBlock("reflection", "Your Reflection")],
});

const blockCatalog: { type: BlockType; label: string; icon: typeof FiBook; category: "content" | "interaction" | "logic" }[] = [
  { type: "knowledge", label: "Knowledge", icon: FiBook, category: "content" },
  { type: "example", label: "Example", icon: FiSun, category: "content" },
  { type: "hint", label: "Hint", icon: FiInfo, category: "content" },
  { type: "reflection", label: "Reflection Area", icon: FiEdit3, category: "interaction" },
  { type: "rating", label: "Rating Area", icon: FiStar, category: "interaction" },
  { type: "multiple_choice", label: "Multiple Choice", icon: FiList, category: "interaction" },
  { type: "short_text", label: "Short Text", icon: FiType, category: "interaction" },
  { type: "number_input", label: "Number Input", icon: FiHash, category: "interaction" },
  { type: "routing", label: "Routing & Templates", icon: FiGitBranch, category: "logic" },
];

const Builder = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress, saveTemplate, setActiveTemplate, setDailyTemplates } = useFrameworkProgress();

  const activeTemplate = progress.templates.find((t) => t.id === progress.activeTemplateId);

  const [templateName, setTemplateName] = useState(activeTemplate?.name || "New Framework");
  const [steps, setSteps] = useState<Step[]>(activeTemplate?.steps || defaultSteps);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [mixIds, setMixIds] = useState<string[]>(progress.dailyTemplateIds || []);

  useEffect(() => {
    setTemplateName(activeTemplate?.name || "New Framework");
    setSteps(activeTemplate?.steps ? activeTemplate.steps : defaultSteps);
    setSelectedStepId(null);
    setSaveStatus("");
  }, [activeTemplate?.id]);

  useEffect(() => {
    setMixIds(progress.dailyTemplateIds || []);
  }, [progress.dailyTemplateIds.join(",")]);

  // Auto-save draft back to active template (debounced)
  useEffect(() => {
    if (!activeTemplate) {
      setSaveStatus("");
      return;
    }
    const timer = setTimeout(() => {
      const name = templateName.trim() || "New Framework";
      saveTemplate(name, steps, activeTemplate.id);
      setSaveStatus("Auto-saved");
    }, 800);
    return () => clearTimeout(timer);
  }, [steps, templateName, activeTemplate, saveTemplate]);

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedStepId) || steps[steps.length - 1],
    [steps, selectedStepId]
  );

  const allBlockOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string; source: string }>();
    progress.templates.forEach((tmpl) => {
      tmpl.steps.forEach((s) =>
        s.blocks?.forEach((b) => {
          if (!map.has(b.id)) map.set(b.id, { id: b.id, label: b.label, source: tmpl.name });
        })
      );
    });
    steps.forEach((s) =>
      s.blocks?.forEach((b) => {
        if (!map.has(b.id)) map.set(b.id, { id: b.id, label: b.label, source: templateName });
      })
    );
    return Array.from(map.values());
  }, [progress.templates, steps, templateName]);

  const updateSteps = (updater: (prev: Step[]) => Step[]) => {
    setSteps((prev) =>
      updater(prev).map((s, idx) => ({
        ...s,
        order_index: idx,
        blocks: (s.blocks || []).map((b, bidx) => ({ ...b, order_index: bidx })),
      }))
    );
  };

  const addStep = () => {
    updateSteps((prev) => [...prev, makeStep(`Step ${prev.length + 1}`)]);
    setTimeout(() => {
      const list = document.getElementById("builder-steps");
      list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const removeStep = (stepId: string) => {
    updateSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const moveStep = (stepId: string, direction: -1 | 1) => {
    updateSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    updateSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const addBlock = (type: BlockType) => {
    const catalog = blockCatalog.find((b) => b.type === type);
    const step = selectedStep;
    if (!step) return;
    updateSteps((prev) =>
      prev.map((s) =>
        s.id === step.id
          ? { ...s, blocks: [...(s.blocks || []), makeBlock(type, catalog?.label)] }
          : s
      )
    );
  };

  const updateBlock = (stepId: string, blockId: string, updates: Partial<Block>) => {
    updateSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, blocks: s.blocks?.map((b) => (b.id === blockId ? { ...b, ...updates } : b)) }
          : s
      )
    );
  };

  const removeBlock = (stepId: string, blockId: string) => {
    updateSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, blocks: s.blocks?.filter((b) => b.id !== blockId) } : s
      )
    );
  };

  const moveBlock = (stepId: string, blockId: string, direction: -1 | 1) => {
    updateSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId || !s.blocks) return s;
        const idx = s.blocks.findIndex((b) => b.id === blockId);
        if (idx < 0) return s;
        const next = [...s.blocks];
        const target = idx + direction;
        if (target < 0 || target >= next.length) return s;
        [next[idx], next[target]] = [next[target], next[idx]];
        return { ...s, blocks: next };
      })
    );
  };

  const handlePublish = () => {
    const name = templateName.trim() || "New Framework";
    saveTemplate(name, steps, activeTemplate?.id);
    setSaveStatus(t("builder.published"));
  };

  const handleNewTemplate = () => {
    setActiveTemplate(null);
    setTemplateName("New Framework");
    setSteps([makeStep("Step 1")]);
    setSelectedStepId(null);
    setSaveStatus("");
  };

  const handleSelectTemplate = (id: string) => {
    if (id === "new") {
      handleNewTemplate();
    } else {
      setActiveTemplate(id);
    }
  };

  const updateOptions = (stepId: string, blockId: string, options: string[]) => {
    updateBlock(stepId, blockId, { options });
  };

  const toggleMix = (id: string) => {
    setMixIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyMix = () => {
    const ids = mixIds.length ? mixIds : progress.activeTemplateId ? [progress.activeTemplateId] : [];
    setDailyTemplates(ids);
    setSaveStatus(t("builder.dailyMixSet"));
  };

  const renderPreview = (block: Block) => {
    switch (block.type) {
      case "knowledge":
      case "example":
      case "hint":
        return <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{block.prompt || "Content preview"}</p>;
      case "reflection":
        return <textarea className="input h-24 w-full" readOnly placeholder={block.placeholder} />;
      case "short_text":
        return <input className="input w-full" readOnly placeholder={block.placeholder} />;
      case "number_input":
        return <input type="number" className="input w-full" readOnly placeholder={block.placeholder} />;
      case "multiple_choice":
      case "rating":
        return (
          <div className="flex gap-2 flex-wrap">
            {(block.options || ["Option 1", "Option 2"]).map((opt) => (
              <span key={opt} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                {opt}
              </span>
            ))}
          </div>
        );
      case "routing":
        return <p className="text-sm text-violet-600">→ {block.prompt || "Route to template"}</p>;
      default:
        return null;
    }
  };

  const SidebarBlock = ({ label, icon: Icon, onClick }: { label: string; icon: typeof FiBook; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-left"
    >
      <Icon className="w-5 h-5 text-primary-600" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const Sidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Templates</h3>
        <p className="text-xs text-gray-500 mb-2">Select an existing template to edit, or start a new one.</p>
        <div className="flex flex-col gap-2">
          <select
            value={activeTemplate?.id || "new"}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="input text-sm"
          >
            <option value="new">+ New Framework</option>
            {progress.templates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleNewTemplate}>
            <FiPlusCircle className="w-4 h-4" /> <span className="ml-1">{t("common.create")}</span>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">{t("builder.dailyMix")}</h3>
        <p className="text-xs text-gray-500 mb-2">{t("builder.dailyMixDescription")}</p>
        {progress.templates.length === 0 ? (
          <p className="text-xs text-gray-400 italic">{t("builder.noTemplates")}</p>
        ) : (
          <>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {progress.templates.map((tmpl) => (
                <label key={tmpl.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mixIds.includes(tmpl.id)}
                    onChange={() => toggleMix(tmpl.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="truncate">{tmpl.name}</span>
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={applyMix}>
              {t("builder.setDailyMix")}
            </Button>
          </>
        )}
      </div>

      <div>
        <Button variant="outline" size="sm" className="w-full" onClick={addStep}>
          <FiPlus className="w-4 h-4 mr-1" /> {t("builder.addStep") || "Add Step"}
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">Insert Blocks</h3>
        <p className="text-xs text-gray-500 mb-2">
          {selectedStep ? `Adding to: ${selectedStep.title}` : "Select a step first"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Content Blocks</p>
        <div className="grid grid-cols-2 gap-2">
          {blockCatalog
            .filter((b) => b.category === "content")
            .map((b) => (
              <button
                key={b.type}
                disabled={!selectedStep}
                onClick={() => addBlock(b.type)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <b.icon className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-center leading-tight">{b.label}</span>
              </button>
            ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Interaction Blocks</p>
        <div className="space-y-2">
          {blockCatalog
            .filter((b) => b.category === "interaction")
            .map((b) => (
              <SidebarBlock key={b.type} label={b.label} icon={b.icon} onClick={() => addBlock(b.type)} />
            ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Logic & Pathing</p>
        <SidebarBlock label="Routing & Templates" icon={FiGitBranch} onClick={() => addBlock("routing")} />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in -mx-4 md:-mx-0 -my-4 md:-my-0 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/overview")}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="font-bold text-lg bg-transparent border-0 p-0 focus:ring-0 w-full sm:w-56 md:w-80"
                placeholder="Template name"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {activeTemplate ? t("builder.published") : t("builder.draft")}
                </span>
                {saveStatus && <span className="text-[10px] text-gray-400">{saveStatus}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPreview((p) => !p)}>
              <FiEye className="w-4 h-4" /> <span className="hidden sm:inline ml-1">{t("builder.preview")}</span>
            </Button>
            <Button variant="dark" size="sm" onClick={handlePublish}>
              <FiUpload className="w-4 h-4" /> <span className="hidden sm:inline ml-1">{t("builder.publish")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 order-first lg:order-none">
            <div className="lg:sticky lg:top-24 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <Sidebar />
            </div>
          </aside>

          <div id="builder-steps" className="lg:col-span-8 space-y-6">
            {steps.map((step, stepIdx) => (
              <Card
                key={step.id}
                className={`relative ${selectedStepId === step.id ? "ring-2 ring-primary-500" : ""}`}
              >
                {!preview ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            label={`Step ${stepIdx + 1} title`}
                            value={step.title}
                            onChange={(e) => updateStep(step.id, { title: e.target.value })}
                            className="font-semibold"
                          />
                          <button
                            onClick={() => setSelectedStepId(step.id)}
                            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-md ${
                              selectedStepId === step.id
                                ? "bg-primary-100 text-primary-700"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Select
                          </button>
                        </div>
                        <Input
                          label="Description"
                          value={step.description || ""}
                          onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        />
                        <Input
                          label="Phase"
                          value={step.phaseName || ""}
                          onChange={(e) => updateStep(step.id, { phaseName: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1 ml-3">
                        <button onClick={() => moveStep(step.id, -1)} disabled={stepIdx === 0} className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveStep(step.id, 1)} disabled={stepIdx === steps.length - 1} className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeStep(step.id)} className="p-1 text-gray-400 hover:text-red-500">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pl-2 border-l-2 border-gray-100 dark:border-gray-800">
                      {step.blocks?.map((block, blockIdx) => (
                        <Card key={block.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                              {block.type.replace("_", " ")}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => moveBlock(step.id, block.id, -1)} disabled={blockIdx === 0} className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">
                                <FiChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveBlock(step.id, block.id, 1)} disabled={blockIdx === (step.blocks?.length || 0) - 1} className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30">
                                <FiChevronDown className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeBlock(step.id, block.id)} className="p-1 text-gray-400 hover:text-red-500">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Input
                              label={t("builder.fieldLabel")}
                              value={block.label}
                              onChange={(e) => updateBlock(step.id, block.id, { label: e.target.value })}
                            />
                            <Input
                              label={t("builder.userPrompt")}
                              value={block.prompt || ""}
                              onChange={(e) => updateBlock(step.id, block.id, { prompt: e.target.value })}
                            />
                            {block.type !== "multiple_choice" && block.type !== "rating" && (
                              <>
                                <Input
                                  label={t("builder.placeholder")}
                                  value={block.placeholder || ""}
                                  onChange={(e) => updateBlock(step.id, block.id, { placeholder: e.target.value })}
                                />
                                {["knowledge", "example", "hint"].includes(block.type) && (
                                  <>
                                    <Input
                                      label={t("builder.reflectionQuestion")}
                                      value={block.reflectionQuestion || ""}
                                      onChange={(e) => updateBlock(step.id, block.id, { reflectionQuestion: e.target.value })}
                                    />
                                    <Input
                                      label={t("builder.reflectionPlaceholder")}
                                      value={block.reflectionPlaceholder || ""}
                                      onChange={(e) => updateBlock(step.id, block.id, { reflectionPlaceholder: e.target.value })}
                                    />
                                    <Input
                                      label={t("builder.reflectionHint")}
                                      value={block.reflectionHint || ""}
                                      onChange={(e) => updateBlock(step.id, block.id, { reflectionHint: e.target.value })}
                                    />
                                  </>
                                )}
                              </>
                            )}
                            {block.type === "multiple_choice" && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</p>
                                {(block.options || ["Option 1", "Option 2"]).map((opt, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const next = [...(block.options || [])];
                                        next[i] = e.target.value;
                                        updateOptions(step.id, block.id, next);
                                      }}
                                      className="input flex-1"
                                    />
                                    <button
                                      onClick={() => {
                                        const next = (block.options || []).filter((_, j) => j !== i);
                                        updateOptions(step.id, block.id, next);
                                      }}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => updateOptions(step.id, block.id, [...(block.options || []), `Option ${(block.options || []).length + 1}`])}
                                  className="text-sm text-primary-600 flex items-center gap-1"
                                >
                                  <FiPlus className="w-3 h-3" /> Add option
                                </button>
                              </div>
                            )}
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={block.required}
                                onChange={(e) => updateBlock(step.id, block.id, { required: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600"
                              />
                              {t("builder.required")}
                            </label>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("builder.referenceBlock")}
                              </label>
                              <p className="text-[10px] text-gray-400 mb-1.5">{t("builder.referenceBlockDescription")}</p>
                              <select
                                value={block.referenceBlockId || ""}
                                onChange={(e) => updateBlock(step.id, block.id, { referenceBlockId: e.target.value || undefined })}
                                className="input text-sm"
                              >
                                <option value="">{t("builder.noReference")}</option>
                                {allBlockOptions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label} ({opt.source})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("builder.dependsOn")}
                              </label>
                              <p className="text-[10px] text-gray-400 mb-1.5">{t("builder.dependsOnDescription")}</p>
                              <div className="flex gap-2">
                                <select
                                  value={block.showIfBlockId || ""}
                                  onChange={(e) => updateBlock(step.id, block.id, { showIfBlockId: e.target.value || undefined })}
                                  className="input text-sm flex-1"
                                >
                                  <option value="">{t("builder.noDependency")}</option>
                                  {allBlockOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={block.showIfValue || ""}
                                  onChange={(e) => updateBlock(step.id, block.id, { showIfValue: e.target.value })}
                                  placeholder={t("builder.dependsOnValue")}
                                  className="input text-sm flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      <button
                        onClick={() => {
                          setSelectedStepId(step.id);
                          addBlock("reflection");
                        }}
                        className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
                      >
                        <FiPlus className="w-4 h-4" /> Add block to this step
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        {step.phaseName || "Phase"}
                      </p>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      {step.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>}
                    </div>
                    <div className="space-y-3">
                      {step.blocks?.map((block) => (
                        <Card key={block.id} className="p-4">
                          <p className="font-medium">{block.label}</p>
                          {block.prompt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{block.prompt}</p>}
                          {renderPreview(block)}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {!preview && (
              <button
                onClick={addStep}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" /> Add Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
