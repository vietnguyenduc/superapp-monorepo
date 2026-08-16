import { useMemo, useState } from "react";
import { FiTrash2, FiEdit2, FiBookOpen, FiSearch, FiChevronRight, FiChevronDown, FiZap } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import type { KnowledgeEntry } from "../../types";

type Category = "all" | "concept" | "framework" | "example";

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

const categoryOptions: { key: Category; label: string }[] = [
  { key: "concept", label: "knowledge.concept" },
  { key: "framework", label: "knowledge.framework" },
  { key: "example", label: "knowledge.example" },
];

const groupLabel = (entry: KnowledgeEntry, language: string) => {
  return (language === "en" ? entry.group_en : entry.group_vi) || "";
};

const Knowledge = () => {
  const { t, language } = useI18n();
  const { knowledgeEntries, addKnowledgeEntry, updateKnowledgeEntry, removeKnowledgeEntry, isLoading } = useSession();
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyEntry);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const reset = () => {
    setEditing(null);
    setForm(emptyEntry);
    setShowForm(false);
  };

  const startAdd = () => {
    setEditing(null);
    setForm(emptyEntry);
    setShowForm(true);
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setEditing(entry);
    setForm(entry);
    setShowForm(true);
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
        language === "en" ? entry.group_en : entry.group_vi,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [knowledgeEntries, query, category, language]);

  const grouped = useMemo(() => {
    const map = new Map<string, KnowledgeEntry[]>();
    filteredEntries.forEach((entry) => {
      const g = groupLabel(entry, language) || t("knowledge.ungrouped");
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(entry);
    });
    return Array.from(map.entries()).sort((a, b) => {
      const minA = Math.min(...a[1].map((e) => e.order_index));
      const minB = Math.min(...b[1].map((e) => e.order_index));
      return minA - minB;
    });
  }, [filteredEntries, language, t]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleEntry = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryChips: { key: Category; label: string }[] = [
    { key: "all", label: t("knowledge.all") },
    ...categoryOptions.map((c) => ({ key: c.key, label: t(c.label) })),
  ];

  const renderDetail = (entry: KnowledgeEntry) => {
    const summaryVal = language === "en" ? entry.summary_en : entry.summary_vi;
    const cotYVal = language === "en" ? entry.cot_y_en : entry.cot_y_vi;
    const parts = [
      { key: "summary", label: t("knowledge.fieldSummary"), value: summaryVal },
      { key: "cot_y", label: t("knowledge.cotY"), value: cotYVal?.trim() && cotYVal.trim() !== summaryVal?.trim() ? cotYVal : "" },
      { key: "cot_cua_cot", label: t("knowledge.cotCuaCot"), value: language === "en" ? entry.cot_cua_cot_en : entry.cot_cua_cot_vi },
      { key: "loi", label: t("knowledge.loi"), value: language === "en" ? entry.loi_en || entry.content_en : entry.loi_vi || entry.content_vi },
    ];
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {parts.map((p) =>
          p.value?.trim() ? (
            <div key={p.key}>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{p.label}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-1">{p.value}</p>
            </div>
          ) : null
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("knowledge.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("knowledge.subtitle")}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("knowledge.searchPlaceholder")}
            className="input pl-9 w-full"
          />
        </div>
        <Button onClick={startAdd} className="ml-3 shrink-0">
          {t("knowledge.add")}
        </Button>
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

      {showForm && (
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
                onChange={(e) => setForm({ ...form, category: e.target.value as "concept" | "framework" | "example" })}
                className="input"
              >
                {categoryOptions.map((c) => (
                  <option key={c.key} value={c.key}>{t(c.label)}</option>
                ))}
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
            <Button variant="secondary" onClick={reset}>
              {t("common.cancel")}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-gray-500">{t("common.loading")}</p>}
        {!isLoading && grouped.length === 0 && <p className="text-sm text-gray-500">{t("knowledge.empty")}</p>}
        {grouped.map(([group, entries]) => {
          const isGroupOpen = expandedGroups.has(group);
          return (
            <Card key={group} className="overflow-hidden rounded-2xl">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-600">
                    <FiBookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base leading-snug">{group}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entries.length}{"\u00A0"}{t("knowledge.entries")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {isGroupOpen && (
                <div className="px-2 pb-2 space-y-2">
                  {entries.map((entry) => {
                    const isEntryOpen = expandedEntries.has(entry.id);
                    const title = language === "en" ? entry.title_en : entry.title_vi;
                    const summary = language === "en" ? (entry.summary_en || entry.cot_y_en || entry.cot_cua_cot_en || entry.content_en) : (entry.summary_vi || entry.cot_y_vi || entry.cot_cua_cot_vi || entry.content_vi);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <button
                          onClick={() => toggleEntry(entry.id)}
                          className="w-full text-left px-3 py-3 flex items-start gap-3"
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            entry.category === "framework"
                              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                              : entry.category === "example"
                              ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                              : "bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                          }`}>
                            {entry.category === "framework" ? (
                              <FiZap className="w-5 h-5" />
                            ) : entry.category === "example" ? (
                              <FiBookOpen className="w-5 h-5" />
                            ) : (
                              <FiBookOpen className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm leading-snug line-clamp-2 pr-6">{title}</h3>
                            {summary && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mt-1">{summary}</p>
                            )}
                          </div>
                          <div className="shrink-0 pt-1">
                            <FiChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isEntryOpen ? "rotate-90" : ""}`}
                            />
                          </div>
                        </button>
                        {isEntryOpen && (
                          <div className="px-3 pb-3">
                            {renderDetail(entry)}
                            <div className="flex items-center gap-2 mt-4">
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeKnowledgeEntry(entry.id)}
                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Knowledge;
