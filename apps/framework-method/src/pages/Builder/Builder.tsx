import { useMemo, useRef, useState } from "react";
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiEye, FiSave } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import { DEFAULT_BLOCKS, DEFAULT_TEMPLATES, genId } from "../../services/frameworkMethodService";
import type { BlockId, StepType, TaskSuggestion, Template, TemplateSection, TemplateSectionGroup, TemplateSectionItem } from "../../types";

const STEP_TYPES: StepType[] = ["recognize", "apply", "track"];

const STEP_LABELS: Record<StepType, { vi: string; en: string }> = {
  recognize: { vi: "Bước 2: Nhận ra", en: "Step 2: Recognize" },
  apply: { vi: "Bước 3: Đưa khuôn", en: "Step 3: Apply" },
  track: { vi: "Bước 4: Bám", en: "Step 4: Track" },
};

const GROUP_LABELS: Record<TemplateSectionGroup, { vi: string; en: string }> = {
  nguyen_ly: { vi: "Nguyên lý", en: "Principles" },
  dao: { vi: "Đạo", en: "Ways" },
  phap: { vi: "Pháp", en: "Methods" },
  dua_khuon: { vi: "Đưa khuôn", en: "Apply" },
  bam: { vi: "Bám", en: "Track" },
};

const buildDefaultTemplates = (): Record<BlockId, Record<StepType, Template>> => {
  const result: Partial<Record<BlockId, Record<StepType, Template>>> = {};
  DEFAULT_BLOCKS.forEach((block) => {
    const byStep: Partial<Record<StepType, Template>> = {};
    STEP_TYPES.forEach((step) => {
      const templateId = genId();
      byStep[step] = {
        id: templateId,
        block_id: block.id,
        step_type: step,
        name: `${STEP_LABELS[step].vi} — ${block.name_vi}`,
        status: "published",
        sections: DEFAULT_TEMPLATES[step].map((section) => ({ ...section, template_id: templateId })),
      };
    });
    result[block.id] = byStep as Record<StepType, Template>;
  });
  return result as Record<BlockId, Record<StepType, Template>>;
};

const Builder = () => {
  const { t, language } = useI18n();
  const [templates, setTemplates] = useState<Record<BlockId, Record<StepType, Template>>>(buildDefaultTemplates);
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId>("self");
  const [selectedStep, setSelectedStep] = useState<StepType>("recognize");
  const [preview, setPreview] = useState(false);

  const { taskSuggestions, updateTaskSuggestions } = useSession();
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

  const currentTemplate = templates[selectedBlockId]?.[selectedStep];

  const updateTemplate = (updater: (template: Template) => Template) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedBlockId]: {
        ...prev[selectedBlockId],
        [selectedStep]: updater(prev[selectedBlockId][selectedStep]),
      },
    }));
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

  const stepLabel = (step: StepType) => (language === "en" ? STEP_LABELS[step].en : STEP_LABELS[step].vi);
  const sectionTitle = (section: TemplateSection) => (language === "en" ? section.title_en : section.title_vi);
  const itemTitle = (item: TemplateSectionItem) => (language === "en" ? item.title_en : item.title_vi);

  const availableGroups = useMemo<TemplateSectionGroup[]>(() => {
    if (selectedStep === "recognize") return ["nguyen_ly", "dao", "phap"];
    if (selectedStep === "apply") return ["dua_khuon"];
    return ["bam"];
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
          <Button size="sm" onClick={() => {}}>
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
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={suggestion.title_vi}
                  onChange={(e) => updateSuggestion(suggestion.id, { title_vi: e.target.value })}
                  placeholder={t("builder.titleVi")}
                />
                <Input
                  value={suggestion.title_en}
                  onChange={(e) => updateSuggestion(suggestion.id, { title_en: e.target.value })}
                  placeholder={t("builder.titleEn")}
                />
              </div>
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

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t("builder.step")}</p>
        <div className="flex flex-wrap gap-2">
          {STEP_TYPES.map((step) => (
            <button
              key={step}
              onClick={() => setSelectedStep(step)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedStep === step
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {stepLabel(step)}
            </button>
          ))}
        </div>
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label={t("builder.titleVi")}
                      value={section.title_vi}
                      onChange={(e) => updateSection(section.id, (s) => ({ ...s, title_vi: e.target.value }))}
                    />
                    <Input
                      label={t("builder.titleEn")}
                      value={section.title_en}
                      onChange={(e) => updateSection(section.id, (s) => ({ ...s, title_en: e.target.value }))}
                    />
                  </div>
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
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            value={item.title_vi}
                            onChange={(e) => updateItem(section.id, item.id, (it) => ({ ...it, title_vi: e.target.value }))}
                            placeholder={t("builder.titleVi")}
                          />
                          <Input
                            value={item.title_en}
                            onChange={(e) => updateItem(section.id, item.id, (it) => ({ ...it, title_en: e.target.value }))}
                            placeholder={t("builder.titleEn")}
                          />
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
