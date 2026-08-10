import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiEye, FiSave } from "react-icons/fi";
import { Card, Button, Input, RichTextEditor } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import { DEFAULT_BLOCKS, genId } from "../../services/frameworkMethodService";
import type { BlockId, StepType, TaskSuggestion, Template, TemplateSection, TemplateSectionGroup, TemplateSectionItem } from "../../types";

const BUILT_IN_STEPS = new Set(["recognize", "apply", "track"]);

const GROUP_LABELS: Record<TemplateSectionGroup, { vi: string; en: string }> = {
  nguyen_ly: { vi: "Nguyên lý", en: "Principles" },
  dao: { vi: "Đạo", en: "Ways" },
  phap: { vi: "Pháp", en: "Methods" },
  dua_khuon: { vi: "Đưa khuôn", en: "Apply" },
  bam: { vi: "Bám", en: "Track" },
};

const Builder = () => {
  const { t, language } = useI18n();
  const { templates, taskSuggestions, updateTaskSuggestions, knowledgeEntries, updateTemplate: updateTemplateContext, saveTemplates, addStep, removeStep, moveStep } = useSession();
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId>("self");
  const [selectedStep, setSelectedStep] = useState<StepType>("recognize");
  const [preview, setPreview] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const blockSuggestions = taskSuggestions[selectedBlockId] || [];
  const suggestionsRef = useRef<TaskSuggestion[]>(blockSuggestions);
  suggestionsRef.current = blockSuggestions;

  const updateSuggestions = (updater: (prev: TaskSuggestion[]) => TaskSuggestion[]) => {
    const next = updater(suggestionsRef.current).map((s, i) => ({ ...s, order_index: i }));
    void updateTaskSuggestions(selectedBlockId, next);
  };

  const addSuggestion = () => {
    updateSuggestions((prev) => [
      ...prev,
      {
        id: genId(),
        block_id: selectedBlockId,
        title_vi: "Gợi ý mới",
        title_en: "New suggestion",
        is_default: false,
        order_index: prev.length,
      },
    ]);
  };

  const updateSuggestion = (id: string, updates: Partial<TaskSuggestion>) => {
    updateSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSuggestion = (id: string) => {
    updateSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSuggestion = (index: number, direction: -1 | 1) => {
    updateSuggestions((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  };

  const orderedSteps = useMemo(() => {
    const byStep = templates[selectedBlockId] || {};
    return Object.values(byStep)
      .filter((t): t is Template => Boolean(t))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [templates, selectedBlockId]);

  useEffect(() => {
    const exists = orderedSteps.some((s) => s.step_type === selectedStep);
    if (!exists && orderedSteps[0]) {
      setSelectedStep(orderedSteps[0].step_type);
    }
  }, [orderedSteps, selectedStep]);

  const currentTemplate = templates[selectedBlockId]?.[selectedStep];

  const updateTemplate = (updater: (template: Template) => Template) => {
    updateTemplateContext(selectedBlockId, selectedStep, updater);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    updateTemplate((template) => {
      const sections = [...template.sections!];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= sections.length) return template;
      const [moved] = sections.splice(index, 1);
      sections.splice(newIndex, 0, moved);
      return { ...template, sections: sections.map((s, i) => ({ ...s, order_index: i })) };
    });
  };

  const updateSection = (sectionId: string, updater: (section: TemplateSection) => TemplateSection) => {
    updateTemplate((template) => ({
      ...template,
      sections: template.sections!.map((s) => (s.id === sectionId ? updater(s) : s)),
    }));
  };

  const addSection = (group: TemplateSectionGroup) => {
    updateTemplate((template) => {
      const order = template.sections!.length;
      const sectionId = genId();
      return {
        ...template,
        sections: [
          ...template.sections!,
          {
            id: sectionId,
            template_id: template.id,
            group,
            title_vi: GROUP_LABELS[group].vi,
            title_en: GROUP_LABELS[group].en,
            is_toggle: true,
            is_enabled: true,
            order_index: order,
            items: [
              {
                id: genId(),
                title_vi: "Mục mới",
                title_en: "New item",
                default_enabled: true,
                order_index: 0,
              },
            ],
          },
        ],
      };
    });
  };

  const removeSection = (sectionId: string) => {
    updateTemplate((template) => ({
      ...template,
      sections: template.sections!.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order_index: i })),
    }));
  };

  const moveItem = (sectionId: string, itemIndex: number, direction: -1 | 1) => {
    updateSection(sectionId, (section) => {
      const items = [...section.items];
      const newIndex = itemIndex + direction;
      if (newIndex < 0 || newIndex >= items.length) return section;
      const [moved] = items.splice(itemIndex, 1);
      items.splice(newIndex, 0, moved);
      return { ...section, items: items.map((it, i) => ({ ...it, order_index: i })) };
    });
  };

  const updateItem = (sectionId: string, itemId: string, updater: (item: TemplateSectionItem) => TemplateSectionItem) => {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.map((it) => (it.id === itemId ? updater(it) : it)),
    }));
  };

  const addItem = (sectionId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      items: [
        ...section.items,
        {
          id: genId(),
          title_vi: "Mục mới",
          title_en: "New item",
          default_enabled: true,
          order_index: section.items.length,
        },
      ],
    }));
  };

  const removeItem = (sectionId: string, itemId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.filter((it) => it.id !== itemId).map((it, i) => ({ ...it, order_index: i })),
    }));
  };

  const [newSectionGroup, setNewSectionGroup] = useState<TemplateSectionGroup>("nguyen_ly");

  const stepLabel = (stepType: StepType) => {
    const template = templates[selectedBlockId]?.[stepType];
    const vi = template?.name_vi || template?.name || stepType;
    const en = template?.name_en || template?.name_vi || template?.name || stepType;
    return language === "en" ? en : vi;
  };
  const sectionTitle = (section: TemplateSection) => (language === "en" ? section.title_en : section.title_vi);
  const itemTitle = (item: TemplateSectionItem) => (language === "en" ? item.title_en : item.title_vi);

  const availableGroups = useMemo<TemplateSectionGroup[]>(() => {
    if (selectedStep === "recognize") return ["nguyen_ly", "dao", "phap"];
    if (selectedStep === "apply") return ["dua_khuon"];
    if (selectedStep === "track") return ["bam"];
    return ["nguyen_ly", "dao", "phap", "dua_khuon", "bam"];
  }, [selectedStep]);

  if (!currentTemplate) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("builder.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("builder.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreview((p) => !p)}>
            <FiEye className="w-4 h-4 mr-1" /> {preview ? t("builder.edit") : t("builder.preview")}
          </Button>
          <Button size="sm" onClick={() => saveTemplates()}>
            <FiSave className="w-4 h-4 mr-1" /> {t("builder.publish")}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("builder.block")}</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_BLOCKS.map((block) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedBlockId === block.id
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {language === "en" ? block.name_en : block.name_vi}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("builder.suggestions")}</p>
        <div className="space-y-3">
          {blockSuggestions.map((suggestion, idx) => (
            <div key={suggestion.id} className="flex items-start gap-2">
              <Input
                value={suggestion.title_vi}
                onChange={(e) => updateSuggestion(suggestion.id, { title_vi: e.target.value, title_en: e.target.value })}
                placeholder={t("builder.suggestionTitle")}
                className="flex-1"
              />
              <div className="flex flex-col gap-1">
                <button onClick={() => moveSuggestion(idx, -1)} className="p-1 text-gray-400 hover:text-primary-600">
                  <FiArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveSuggestion(idx, 1)} className="p-1 text-gray-400 hover:text-primary-600">
                  <FiArrowDown className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => removeSuggestion(suggestion.id)} className="p-2 text-gray-400 hover:text-red-500">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addSuggestion}>
            <FiPlus className="w-4 h-4 mr-1" /> {t("builder.addItem")}
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("builder.step")}</p>
        <div className="space-y-2">
          {orderedSteps.map((template) => (
            <div key={template.step_type} className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStep(template.step_type)}
                className={`flex-1 text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedStep === template.step_type
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {stepLabel(template.step_type)}
              </button>
              <button onClick={() => moveStep(selectedBlockId, template.step_type, -1)} className="p-2 text-gray-400 hover:text-primary-600" aria-label="Move up">
                <FiArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveStep(selectedBlockId, template.step_type, 1)} className="p-2 text-gray-400 hover:text-primary-600" aria-label="Move down">
                <FiArrowDown className="w-4 h-4" />
              </button>
              {!BUILT_IN_STEPS.has(template.step_type) && (
                <button onClick={() => removeStep(selectedBlockId, template.step_type)} className="p-2 text-gray-400 hover:text-red-500" aria-label="Delete step">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newStepName.trim()) {
                const name = newStepName.trim();
                addStep(selectedBlockId, selectedStep, name, name);
                setNewStepName("");
              }
            }}
            placeholder={t("builder.newStepPlaceholder")}
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!newStepName.trim()) return;
              const name = newStepName.trim();
              addStep(selectedBlockId, selectedStep, name, name);
              setNewStepName("");
            }}
          >
            <FiPlus className="w-4 h-4 mr-1" /> {t("builder.addStep")}
          </Button>
        </div>
        <p className="text-xs text-gray-400">{t("builder.addStepHint")}</p>
      </Card>

      <div className="space-y-4">
        {currentTemplate.sections!.map((section, sectionIndex) => (
          <Card key={section.id} className={`p-4 ${!section.is_enabled ? "opacity-60" : ""}`}>
            {preview ? (
              <div className="space-y-2">
                <p className="font-semibold">{sectionTitle(section)}</p>
                {section.is_enabled && (
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 text-sm">
                        <input type="checkbox" checked={item.default_enabled} readOnly className="mt-1" />
                        <span>{itemTitle(item)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Input
                    label={t("builder.sectionTitle")}
                    value={section.title_vi}
                    onChange={(e) => updateSection(section.id, (s) => ({ ...s, title_vi: e.target.value, title_en: e.target.value }))}
                    className="flex-1"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveSection(sectionIndex, -1)} className="p-1 text-gray-400 hover:text-primary-600" aria-label="Move up">
                      <FiArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveSection(sectionIndex, 1)} className="p-1 text-gray-400 hover:text-primary-600" aria-label="Move down">
                      <FiArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={section.is_enabled}
                    onChange={(e) => updateSection(section.id, (s) => ({ ...s, is_enabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  {t("builder.enabled")}
                </label>

                {selectedStep === "recognize" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500">{t("builder.conceptKnowledge")}</label>
                      <select
                        value={section.concept_knowledge_entry_id || ""}
                        onChange={(e) => updateSection(section.id, (s) => ({ ...s, concept_knowledge_entry_id: e.target.value || undefined }))}
                        className="input text-sm"
                      >
                        <option value="">{t("builder.noKnowledgeLink")}</option>
                        {knowledgeEntries.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {language === "en" ? entry.title_en : entry.title_vi}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500">{t("builder.referenceKnowledge")}</label>
                      <select
                        value={section.reference_knowledge_entry_id || ""}
                        onChange={(e) => updateSection(section.id, (s) => ({ ...s, reference_knowledge_entry_id: e.target.value || undefined }))}
                        className="input text-sm"
                      >
                        <option value="">{t("builder.noKnowledgeLink")}</option>
                        {knowledgeEntries.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {language === "en" ? entry.title_en : entry.title_vi}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500">{t("builder.exampleKnowledge")}</label>
                      <RichTextEditor
                        value={section.example_content_vi || ""}
                        onChange={(html) => updateSection(section.id, (s) => ({ ...s, example_content_vi: html, example_content_en: html }))}
                        placeholder={t("builder.itemContentPlaceholder")}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={item.default_enabled}
                            onChange={(e) => updateItem(section.id, item.id, (it) => ({ ...it, default_enabled: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                        </label>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.title_vi}
                            onChange={(e) =>
                              updateItem(section.id, item.id, (it) => ({
                                ...it,
                                title_vi: e.target.value,
                                title_en: e.target.value,
                              }))
                            }
                            placeholder={t("builder.itemTitle")}
                          />
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500">{t("builder.itemContent")}</label>
                            <RichTextEditor
                              value={item.content_vi || ""}
                              onChange={(html) =>
                                updateItem(section.id, item.id, (it) => ({
                                  ...it,
                                  content_vi: html,
                                  content_en: html,
                                }))
                              }
                              placeholder={t("builder.itemContentPlaceholder")}
                            />
                          </div>
                          <select
                            value={item.knowledge_entry_id || ""}
                            onChange={(e) => updateItem(section.id, item.id, (it) => ({ ...it, knowledge_entry_id: e.target.value || undefined }))}
                            className="input text-sm"
                          >
                            <option value="">{t("builder.noKnowledgeLink")}</option>
                            {knowledgeEntries.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {language === "en" ? entry.title_en : entry.title_vi}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveItem(section.id, itemIndex, -1)} className="p-1 text-gray-400 hover:text-primary-600">
                            <FiArrowUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveItem(section.id, itemIndex, 1)} className="p-1 text-gray-400 hover:text-primary-600">
                            <FiArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(section.id, item.id)} className="p-2 text-gray-400 hover:text-red-500">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => addItem(section.id)}>
                    <FiPlus className="w-4 h-4 mr-1" /> {t("builder.addItem")}
                  </Button>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => removeSection(section.id)} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                    <FiTrash2 className="w-4 h-4" /> {t("builder.removeSection")}
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {!preview && (
          <div className="flex items-center gap-3">
            <select
              value={newSectionGroup}
              onChange={(e) => setNewSectionGroup(e.target.value as TemplateSectionGroup)}
              className="input"
            >
              {availableGroups.map((g) => (
                <option key={g} value={g}>
                  {language === "en" ? GROUP_LABELS[g].en : GROUP_LABELS[g].vi}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={() => addSection(newSectionGroup)}>
              <FiPlus className="w-4 h-4 mr-1" /> {t("builder.addSection")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;
