import { useMemo, useState } from "react";
import { FiTrash2, FiEdit2, FiBookOpen, FiSearch, FiChevronRight, FiZap, FiX } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
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
  cot_y_vi: "",
  cot_y_en: "",
  cot_cua_cot_vi: "",
  cot_cua_cot_en: "",
  loi_vi: "",
  loi_en: "",
  image_url: "",
  category: "concept",
};

const Knowledge = () => {
  const { t, language } = useI18n();
  const { knowledgeEntries, addKnowledgeEntry, updateKnowledgeEntry, removeKnowledgeEntry } = useSession();
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyEntry);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [viewing, setViewing] = useState<KnowledgeEntry | null>(null);

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
        language === "en" ? entry.cot_cua_cot_en : entry.cot_cua_cot_vi,
        language === "en" ? entry.loi_en : entry.loi_vi,
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

      <Card className="p-5 space-y-4 rounded-2xl">
        <h2 className="text-lg font-semibold">{editing ? t("knowledge.edit") : t("knowledge.add")}</h2>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.fieldTitle")}</label>
          <input
            type="text"
            value={form.title_vi}
            onChange={(e) => setForm({ ...form, title_vi: e.target.value, title_en: e.target.value })}
            className="input"
            placeholder={t("knowledge.titlePlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.fieldSummary")}</label>
          <textarea
            value={form.summary_vi}
            onChange={(e) => setForm({ ...form, summary_vi: e.target.value, summary_en: e.target.value })}
            className="input h-20 resize-none"
            placeholder={t("knowledge.summaryPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.cotCuaCot")}</label>
          <textarea
            value={form.cot_cua_cot_vi || ""}
            onChange={(e) => setForm({ ...form, cot_cua_cot_vi: e.target.value, cot_cua_cot_en: e.target.value })}
            className="input h-20 resize-none"
            placeholder={t("knowledge.cotCuaCotPlaceholder")}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.imageUrl")}</label>
            <input
              type="text"
              value={form.image_url || ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.fieldCategory")}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as "concept" | "framework" })}
              className="input"
            >
              <option value="concept">{t("knowledge.concept")}</option>
              <option value="framework">{t("knowledge.framework")}</option>
            </select>
          </div>
        </div>
        {form.image_url && (
          <div className="flex items-center gap-3">
            <img src={form.image_url} alt="" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("knowledge.loi")}</label>
          <textarea
            value={form.loi_vi || form.content_vi || ""}
            onChange={(e) => setForm({ ...form, loi_vi: e.target.value, loi_en: e.target.value, content_vi: e.target.value, content_en: e.target.value })}
            className="input h-40 resize-none"
            placeholder={t("knowledge.loiPlaceholder")}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button onClick={handleSave}>{editing ? t("common.save") : t("knowledge.add")}</Button>
          {editing && (
            <Button variant="secondary" onClick={reset}>
              {t("common.cancel")}
            </Button>
          )}
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
          <div key={entry.id} onClick={() => setViewing(entry)} className="cursor-pointer">
            <Card className="p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  {entry.category === "framework" ? (
                    <FiZap className="w-6 h-6 text-primary-600" />
                  ) : (
                    <FiBookOpen className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-snug line-clamp-2">
                    {language === "en" ? entry.title_en : entry.title_vi}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mt-1">
                    {language === "en" ? (entry.summary_en || entry.cot_y_en || entry.cot_cua_cot_en || entry.content_en) : (entry.summary_vi || entry.cot_y_vi || entry.cot_cua_cot_vi || entry.content_vi)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors" />
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(entry); }} className="p-1.5 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeKnowledgeEntry(entry.id); }} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-black/[0.04] dark:border-white/[0.08] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">
                {language === "en" ? viewing.title_en : viewing.title_vi}
              </h2>
              <button
                onClick={() => setViewing(null)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {viewing.image_url && (
              <img
                src={viewing.image_url}
                alt=""
                className="w-full h-48 object-cover rounded-2xl border border-gray-200 dark:border-gray-700"
              />
            )}
            {(language === "en" ? viewing.summary_en || viewing.cot_y_en : viewing.summary_vi || viewing.cot_y_vi) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("knowledge.fieldSummary")}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-1">
                  {language === "en" ? (viewing.summary_en || viewing.cot_y_en) : (viewing.summary_vi || viewing.cot_y_vi)}
                </p>
              </div>
            )}
            {(language === "en" ? viewing.cot_cua_cot_en : viewing.cot_cua_cot_vi) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("knowledge.cotCuaCot")}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-1">
                  {language === "en" ? viewing.cot_cua_cot_en : viewing.cot_cua_cot_vi}
                </p>
              </div>
            )}
            {(language === "en" ? viewing.loi_en || viewing.content_en : viewing.loi_vi || viewing.content_vi) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("knowledge.loi")}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-1">
                  {language === "en" ? (viewing.loi_en || viewing.content_en) : (viewing.loi_vi || viewing.content_vi)}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => { startEdit(viewing); setViewing(null); }}>
                {t("knowledge.edit")}
              </Button>
              <Button variant="secondary" onClick={() => setViewing(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Knowledge;
