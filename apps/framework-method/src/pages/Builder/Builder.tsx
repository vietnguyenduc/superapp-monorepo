import { useEffect, useState } from "react";
import { FiEye, FiUpload, FiTrash2, FiPlus, FiBook, FiInfo, FiSun, FiEdit3, FiStar, FiList, FiType, FiHash, FiGitBranch, FiHome, FiUser } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import type { Block, BlockType } from "../../types";

const defaultBlocks: Block[] = [
  { id: "1", type: "knowledge", label: "Deconstruct the Problem", prompt: "Define the current assumption or problem clearly before breaking it down into fundamental truths.", placeholder: "", required: false, order_index: 0 },
  { id: "2", type: "example", label: "Example", prompt: "Instead of saying 'batteries are expensive,' identify the cost of the raw materials making up the battery.", placeholder: "", required: false, order_index: 1 },
  { id: "3", type: "reflection", label: "Reflection Area", prompt: "What is the problem you are trying to solve?", placeholder: "Type your answer here...", required: true, order_index: 2 },
];

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
  const { progress, saveTemplate, setActiveTemplate } = useFrameworkProgress();

  const activeTemplate = progress.templates.find((t) => t.id === progress.activeTemplateId);
  const initialBlocks = activeTemplate ? activeTemplate.blocks : defaultBlocks;

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const next = activeTemplate ? activeTemplate.blocks : defaultBlocks;
    setBlocks(next);
  }, [activeTemplate?.id]);

  // Auto-save draft back to active template (debounced)
  useEffect(() => {
    if (!activeTemplate) return;
    const timer = setTimeout(() => {
      saveTemplate(activeTemplate.name, blocks, activeTemplate.id);
    }, 800);
    return () => clearTimeout(timer);
  }, [blocks, activeTemplate]);

  const addBlock = (type: BlockType) => {
    const catalog = blockCatalog.find((b) => b.type === type);
    setBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        label: catalog?.label || type,
        prompt: "",
        placeholder: "",
        required: false,
        order_index: prev.length,
      },
    ]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handlePublish = () => {
    const name = window.prompt("Template name", activeTemplate?.name || "New Framework");
    if (!name) return;
    saveTemplate(name, blocks, activeTemplate?.id);
    alert(t("builder.published"));
  };

  const renderPreview = (block: Block) => {
    switch (block.type) {
      case "knowledge":
      case "example":
      case "hint":
        return <p className="text-sm text-gray-600 dark:text-gray-300">{block.prompt || "Content preview"}</p>;
      case "reflection":
      case "short_text":
        return <input className="input" readOnly placeholder={block.placeholder} />;
      case "number_input":
        return <input type="number" className="input" readOnly placeholder={block.placeholder} />;
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
        <h3 className="text-sm font-semibold mb-1">Insert Blocks</h3>
        <p className="text-xs text-gray-500">Drag elements onto the canvas to build your framework.</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Content Blocks</p>
        <div className="grid grid-cols-2 gap-2">
          {blockCatalog.filter((b) => b.category === "content").map((b) => (
            <button
              key={b.type}
              onClick={() => addBlock(b.type)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
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
          {blockCatalog.filter((b) => b.category === "interaction").map((b) => (
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
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            >
              <FiHome className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">The First Principles Method</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {activeTemplate ? t("builder.published") : t("builder.draft")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPreview((p) => !p)}>
              <FiEye className="w-4 h-4 mr-1" /> {t("builder.preview")}
            </Button>
            <Button variant="dark" size="sm" onClick={handlePublish}>
              <FiUpload className="w-4 h-4 mr-1" /> {t("builder.publish")}
            </Button>
            <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ml-2">
              <FiUser className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="mb-2">
              <p className="text-xs text-gray-500">Break down complex problems into fundamental truths and build up from there.</p>
            </div>
            {blocks.map((block) => (
              <Card key={block.id} className="relative">
                {!preview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        {block.type.replace("_", " ")}
                      </span>
                      <button onClick={() => removeBlock(block.id)} className="text-gray-400 hover:text-red-500">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      label={t("builder.fieldLabel")}
                      value={block.label}
                      onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                    />
                    <Input
                      label={t("builder.userPrompt")}
                      value={block.prompt || ""}
                      onChange={(e) => updateBlock(block.id, { prompt: e.target.value })}
                    />
                    <Input
                      label={t("builder.placeholder")}
                      value={block.placeholder || ""}
                      onChange={(e) => updateBlock(block.id, { placeholder: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={block.required}
                        onChange={(e) => updateBlock(block.id, { required: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                      />
                      {t("builder.required")}
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{block.label}</p>
                    {block.prompt && <p className="text-xs text-gray-500 dark:text-gray-400">{block.prompt}</p>}
                    {renderPreview(block)}
                  </div>
                )}
              </Card>
            ))}
            {!preview && (
              <button
                onClick={() => addBlock("reflection")}
                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" /> Add block
              </button>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
