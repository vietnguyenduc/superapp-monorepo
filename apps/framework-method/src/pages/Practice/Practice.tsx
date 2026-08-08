import { useEffect, useMemo, useState } from "react";
import { FiSun, FiMoon, FiUser, FiBook, FiPlus, FiTrash2, FiUsers, FiEye } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import * as service from "../../services/frameworkMethodService";
import type { RelationshipContact, RelationshipCategory, PracticeInsight, PracticeInsightType } from "../../types";

const RELATIONSHIP_CATEGORIES: { id: RelationshipCategory; label: string }[] = [
  { id: "eternal", label: "Bất biến (bố mẹ, thầy)" },
  { id: "close", label: "Thân thiết (vợ chồng, con cái, anh chị em)" },
  { id: "social", label: "Quan hệ xã giao" },
  { id: "business", label: "Mối quan hệ làm ăn" },
  { id: "friends", label: "Bạn bè" },
  { id: "soul", label: "Tâm giao (bạn tâm đạo)" },
];

const PRACTICE_AREAS = [
  { id: "meditation", label: "Thiền định", icon: "🧘" },
  { id: "reading", label: "Đọc sư thấu triệt", icon: "📖" },
  { id: "reflection", label: "Suy ngẫm hàng ngày", icon: "🪞" },
  { id: "action", label: "Hành thực luyện tập", icon: "⚡" },
];

type InsightField = { key: string; label: string };

const INSIGHT_CONFIG: Record<
  PracticeInsightType,
  { label: string; icon: string; fields: InsightField[] }
> = {
  person: {
    label: "Thấu triệt về con người",
    icon: "👤",
    fields: [
      { key: "name", label: "Tên / Đối tượng" },
      { key: "personality", label: "Tính cách" },
      { key: "habits", label: "Thói quen, sở thích" },
      { key: "principles", label: "Nguyên tắc" },
      { key: "merit", label: "Phúc nghiệp" },
      { key: "fate_condition", label: "Căn cơ cốt mệnh (tốt hay mòn?)" },
    ],
  },
  environment: {
    label: "Thấu triệt môi trường làm việc / nơi đến",
    icon: "🌍",
    fields: [
      { key: "law", label: "Luật" },
      { key: "regulations", label: "Quy định" },
      { key: "culture", label: "Văn hóa (vùng miền, sở tại)" },
      { key: "principles", label: "Nguyên tắc" },
      { key: "strategy_spirit", label: "Chiến lược, tư tưởng, tinh thần" },
    ],
  },
  work: {
    label: "Thấu triệt về công việc",
    icon: "💼",
    fields: [
      { key: "law", label: "Luật" },
      { key: "strategy_spirit", label: "Chiến lược, tư tưởng, tinh thần" },
      { key: "process", label: "Quy trình công việc" },
      { key: "principles", label: "Nguyên tắc" },
    ],
  },
  self: {
    label: "Thấu triệt bản thân",
    icon: "🧘‍♂️",
    fields: [
      { key: "personality", label: "Tính cách bản thân" },
      { key: "habits", label: "Thói quen, sở thích" },
      { key: "principles", label: "Nguyên tắc sống" },
      { key: "goals", label: "Mục tiêu / Định hướng" },
    ],
  },
};

const Practice = () => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { userId } = useSession();

  const [relationships, setRelationships] = useState<RelationshipContact[]>([]);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [relationshipCategory, setRelationshipCategory] = useState<RelationshipCategory>("eternal");
  const [notes, setNotes] = useState("");

  const [insights, setInsights] = useState<PracticeInsight[]>([]);
  const [activeInsight, setActiveInsight] = useState<PracticeInsightType>("person");
  const [insightFormOpen, setInsightFormOpen] = useState(false);
  const [insightValues, setInsightValues] = useState<Record<string, string>>({});
  const [insightTitle, setInsightTitle] = useState("");

  useEffect(() => {
    if (!userId) return;
    service.getRelationships(userId).then(setRelationships);
    service.getPracticeInsights(userId).then(setInsights);
  }, [userId]);

  const grouped = useMemo(() => {
    const map: Record<RelationshipCategory, RelationshipContact[]> = {
      eternal: [],
      close: [],
      social: [],
      business: [],
      friends: [],
      soul: [],
    };
    relationships.forEach((r) => {
      map[r.category].push(r);
    });
    return map;
  }, [relationships]);

  const groupedInsights = useMemo(() => {
    const map: Record<PracticeInsightType, PracticeInsight[]> = {
      person: [],
      environment: [],
      work: [],
      self: [],
    };
    insights.forEach((i) => {
      map[i.type].push(i);
    });
    return map;
  }, [insights]);

  const handleAddRelationship = async () => {
    if (!userId || !name.trim()) return;
    const newContact: RelationshipContact = {
      id: service.genId(),
      user_id: userId,
      name: name.trim(),
      age: age ? Number(age) : undefined,
      address: address.trim() || undefined,
      category: relationshipCategory,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [newContact, ...relationships];
    setRelationships(next);
    await service.saveRelationships(next);
    setName("");
    setAge("");
    setAddress("");
    setNotes("");
    setShowRelationshipForm(false);
  };

  const handleDeleteRelationship = async (id: string) => {
    const next = relationships.filter((r) => r.id !== id);
    setRelationships(next);
    await service.saveRelationships(next);
  };

  const handleAddInsight = async () => {
    if (!userId) return;
    const config = INSIGHT_CONFIG[activeInsight];
    const title = insightTitle.trim() || config.label;
    const filledFields: Record<string, string> = {};
    config.fields.forEach((f) => {
      const value = (insightValues[f.key] || "").trim();
      if (value) filledFields[f.key] = value;
    });
    if (Object.keys(filledFields).length === 0) return;

    const newInsight: PracticeInsight = {
      id: service.genId(),
      user_id: userId,
      type: activeInsight,
      title,
      fields: filledFields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [newInsight, ...insights];
    setInsights(next);
    await service.savePracticeInsights(next);
    setInsightTitle("");
    setInsightValues({});
    setInsightFormOpen(false);
  };

  const handleDeleteInsight = async (id: string) => {
    const next = insights.filter((i) => i.id !== id);
    setInsights(next);
    await service.savePracticeInsights(next);
  };

  const activeConfig = INSIGHT_CONFIG[activeInsight];

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between py-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
        >
          {theme === "dark" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold tracking-tight">{t("practice.title")}</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t("practice.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("practice.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiBook className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">Luyện tập hôm nay</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">0 phút</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <div className="h-full w-0 bg-primary-600 rounded-full" />
        </div>
      </Card>

      <div className="space-y-4">
        {PRACTICE_AREAS.map((area) => (
          <Card key={area.id} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{area.icon}</span>
              <div>
                <h3 className="font-semibold tracking-tight">{area.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chưa ghi nhận</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center">
            <FiEye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">Thấu triệt</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ghi nhận những quan sát sâu về người, môi trường, công việc và bản thân.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(INSIGHT_CONFIG) as PracticeInsightType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveInsight(type);
                setInsightFormOpen(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${
                activeInsight === type
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300 border-black/[0.06] dark:border-white/[0.08]"
              }`}
            >
              <span className="mr-1">{INSIGHT_CONFIG[type].icon}</span>
              {INSIGHT_CONFIG[type].label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setInsightFormOpen((s) => !s)}
          variant="secondary"
          className="w-full"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Thêm {activeConfig.label.toLowerCase()}
        </Button>

        {insightFormOpen && (
          <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <input
              value={insightTitle}
              onChange={(e) => setInsightTitle(e.target.value)}
              placeholder="Tiêu đề (tên người, tên công việc, nơi chốn...)"
              className="input"
            />
            {activeConfig.fields.map((field) => (
              <textarea
                key={field.key}
                value={insightValues[field.key] || ""}
                onChange={(e) =>
                  setInsightValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.label}
                rows={2}
                className="input resize-none"
              />
            ))}
            <Button onClick={handleAddInsight} className="w-full">
              Lưu {activeConfig.label}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {groupedInsights[activeInsight].length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Chưa có ghi nhận nào cho {activeConfig.label.toLowerCase()}.
            </p>
          )}
          {groupedInsights[activeInsight].map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-sm">{insight.title}</p>
                <button
                  onClick={() => handleDeleteInsight(insight.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {Object.entries(insight.fields).map(([key, value]) => {
                  const field = INSIGHT_CONFIG[insight.type].fields.find((f) => f.key === key);
                  return (
                    <div key={key}>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{field?.label || key}:</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">Thấu triệt mối quan hệ</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Phân loại và ghi chép những mối quan hệ cần luyện.</p>
          </div>
        </div>

        <Button onClick={() => setShowRelationshipForm((s) => !s)} variant="secondary" className="w-full">
          <FiPlus className="w-4 h-4 mr-2" />
          Thêm người
        </Button>

        {showRelationshipForm && (
          <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên"
              className="input"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Tuổi"
                className="input"
              />
              <select
                value={relationshipCategory}
                onChange={(e) => setRelationshipCategory(e.target.value as RelationshipCategory)}
                className="input"
              >
                {RELATIONSHIP_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ / Nơi ở"
              className="input"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
              rows={3}
              className="input resize-none"
            />
            <Button onClick={handleAddRelationship} className="w-full" disabled={!name.trim()}>
              Lưu
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {RELATIONSHIP_CATEGORIES.map((cat) => {
            const list = grouped[cat.id];
            return (
              <div key={cat.id} className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 bg-black/[0.02] dark:bg-white/[0.04]">
                  <p className="text-sm font-semibold tracking-tight">{cat.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{list.length} người</p>
                </div>
                {list.length > 0 && (
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {list.map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {r.age ? `${r.age} tuổi` : ""}
                            {r.age && r.address ? " · " : ""}
                            {r.address}
                          </p>
                          {r.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteRelationship(r.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default Practice;
