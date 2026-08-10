import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { Card, Button, Input } from "../UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import { BLOCK_TO_CATEGORY } from "../../services/frameworkMethodService";
import type { TaskCategory, BlockId } from "../../types";

const CATEGORY_TO_DEFAULT_BLOCK: Record<TaskCategory, BlockId> = {
  doi: "family",
  dao: "relationship",
  loi_tu: "work",
};

const getSubcategoryOptions = (): Record<TaskCategory, string[]> => {
  const map: Record<TaskCategory, string[]> = { doi: [], dao: [], loi_tu: [] };
  (Object.keys(BLOCK_TO_CATEGORY) as BlockId[]).forEach((blockId) => {
    const { category, subcategory } = BLOCK_TO_CATEGORY[blockId];
    if (!map[category].includes(subcategory)) map[category].push(subcategory);
  });
  return map;
};

const GlobalTaskFab = () => {
  const { t } = useI18n();
  const { addTask, updateTask } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const subcategoryOptions = getSubcategoryOptions();
  const [category, setCategory] = useState<TaskCategory>("doi");
  const [subcategory, setSubcategory] = useState(subcategoryOptions.doi[0] ?? "");

  const handleCategoryChange = (next: TaskCategory) => {
    setCategory(next);
    setSubcategory(subcategoryOptions[next][0] ?? "");
  };

  const reset = () => {
    setTitle("");
    setCategory("doi");
    setSubcategory(subcategoryOptions.doi[0] ?? "");
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const blockId = CATEGORY_TO_DEFAULT_BLOCK[category];
    const created = await addTask(blockId, trimmed);
    if (created) {
      await updateTask(created.id, { category, subcategory });
    }
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/25 flex items-center justify-center active:scale-95 transition-transform"
        aria-label={t("common.add")}
      >
        <FiPlus className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold tracking-tight">Tạo việc nhanh</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên việc..."
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nhóm</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as TaskCategory)}
                  className="input w-full py-2 text-sm"
                >
                  <option value="doi">Đời</option>
                  <option value="dao">Đạo</option>
                  <option value="loi_tu">Lợi tư</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phân loại</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="input w-full py-2 text-sm"
                >
                  {subcategoryOptions[category].map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
              <FiPlus className="w-4 h-4 mr-2" />
              Tạo việc
            </Button>
          </Card>
        </div>
      )}
    </>
  );
};

export default GlobalTaskFab;
