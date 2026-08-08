import { useMemo, useState } from "react";
import { FiTrash2, FiEdit2, FiBookOpen, FiSearch } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import type { KnowledgeEntry } from "../../types";

type Category = "all" | "concept" | "framework";

type EntryForm = Omit<KnowledgeEntry, "id" | "order_index" | "created_at" | "updated_at">;

const emptyEntry: EntryForm = {
  title_vi: "",
  title_en: "",
  summary_vi: "",
  summary_en: "",
  content_vi: "",
  content_en: "",
  category: "concept",
};

const Knowledge = () => {
  const { t, language } = useI18n();
  const { knowledgeEntries, addKnowledgeEntry, updateKnowledgeEntry, removeKnowledgeEntry } = useSession();
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyEntry);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const startEdit = (entry: KnowledgeEntry) => {
    setEditing(entry);
    setForm(entry);
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyEntry);
  };

  const handleSave = async () => {
    if (!form.title_vi.trim() && !form.title_en.trim()) return;
    if (editing) {
      await updateKnowledgeEntry(editing.id, form);
    } else {
      await addKnowledgeEntry(form);
    }
    reset();
  };

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgeEntries.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (!q) return true;
      const hay = [
        language === "en" ? entry.title_en : entry.title_vi,
        language === "en" ? entry.summary_en : entry.summary_vi,
        language === "en" ? entry.content_en : entry.content_vi,
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [knowledgeEntries, query, category, language]);

  const categoryChips: { key: Category; label: string }[] = [
    { key: "all", label: t("knowledge.all") },
    { key: "concept", label: t("knowledge.concept") },
    { key: "framework", label: t("knowledge.framework") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("knowledge.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("knowledge.subtitle")}</p>
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">{editing ? t("knowledge.edit") : t("knowledge.add")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label={t("knowledge.titleVi")}
            value={form.title_vi}
            onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
          />
          <Input
            label={t("knowledge.titleEn")}
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label={t("knowledge.summaryVi")}
            value={form.summary_vi}
            onChange={(e) => setForm({ ...form, summary_vi: e.target.value })}
          />
          <Input
            label={t("knowledge.summaryEn")}
            value={form.summary_en}
            onChange={(e) => setForm({ ...form, summary_en: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.contentVi")}</label>
            <textarea
              value={form.content_vi}
              onChange={(e) => setForm({ ...form, content_vi: e.target.value })}
              className="input h-24 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.contentEn")}</label>
            <textarea
              value={form.content_en}
              onChange={(e) => setForm({ ...form, content_en: e.target.value })}
              className="input h-24 resize-none"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as "concept" | "framework" })}
            className="input"
          >
            <option value="concept">{t("knowledge.concept")}</option>
            <option value="framework">{t("knowledge.framework")}</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={handleSave}>{editing ? t("common.save") : t("knowledge.add")}</Button>
            {editing && (
              <Button variant="secondary" onClick={reset}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("knowledge.searchPlaceholder")}
            className="input pl-9 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setCategory(chip.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === chip.key
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {filteredEntries.length === 0 && <p className="text-sm text-gray-500">{t("knowledge.empty")}</p>}
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FiBookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{language === "en" ? entry.title_en : entry.title_vi}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {language === "en" ? (entry.summary_en || entry.content_en) : (entry.summary_vi || entry.content_vi)}
                  </p>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {entry.category === "concept" ? t("knowledge.concept") : t("knowledge.framework")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => startEdit(entry)} className="p-2 text-gray-400 hover:text-primary-600">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => removeKnowledgeEntry(entry.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Knowledge;
