import { useMemo, useState } from "react";
import { FiPlus, FiSun, FiMoon, FiUser, FiTrendingUp, FiTrendingDown, FiActivity, FiTarget } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import {
  CATEGORY_META,
  MERIT_SIZE_LABELS,
  BLOCK_TO_CATEGORY,
  plannedCompletionAdjustment,
} from "../../services/frameworkMethodService";
import type { TaskCategory, MeritType, MeritSize, DailyTask, BlockId } from "../../types";

const CATEGORY_TO_DEFAULT_BLOCK: Record<TaskCategory, BlockId> = {
  doi: "self",
  dao: "relationship",
  loi_tu: "work",
};

const getTaskCategory = (task: DailyTask): TaskCategory => {
  if (task.category) return task.category;
  return BLOCK_TO_CATEGORY[task.block_id]?.category ?? "doi";
};

const getTaskSubcategory = (task: DailyTask): string => {
  if (task.subcategory) return task.subcategory;
  return BLOCK_TO_CATEGORY[task.block_id]?.subcategory ?? "";
};

const getSubcategoryOptions = (): Record<TaskCategory, string[]> => {
  const map: Record<TaskCategory, string[]> = { doi: [], dao: [], loi_tu: [] };
  (Object.keys(BLOCK_TO_CATEGORY) as BlockId[]).forEach((blockId) => {
    const { category, subcategory } = BLOCK_TO_CATEGORY[blockId];
    if (!map[category].includes(subcategory)) map[category].push(subcategory);
  });
  return map;
};

const Calendar = () => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { tasks, session, merit, updateTask, setPlannedCompletionRate, addTask } = useSession();

  const subcategoryOptions = useMemo(() => getSubcategoryOptions(), []);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("doi");
  const [newSubcategory, setNewSubcategory] = useState(subcategoryOptions.doi[0] ?? "");
  const [newMeritType, setNewMeritType] = useState<MeritType>("earn");
  const [newMeritSize, setNewMeritSize] = useState<MeritSize>("small");

  const plannedRate = session?.planned_completion_rate ?? 100;
  const adjustment = plannedCompletionAdjustment(plannedRate);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskCategory, DailyTask[]> = { doi: [], dao: [], loi_tu: [] };
    tasks.forEach((task) => {
      const category = getTaskCategory(task);
      groups[category].push(task);
    });
    return groups;
  }, [tasks]);

  const handleCategoryChange = (category: TaskCategory) => {
    setNewCategory(category);
    setNewSubcategory(subcategoryOptions[category][0] ?? "");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const blockId = CATEGORY_TO_DEFAULT_BLOCK[newCategory];
    const task = await addTask(blockId, newTaskTitle.trim());
    if (task) {
      await updateTask(task.id, {
        category: newCategory,
        subcategory: newSubcategory,
        merit_type: newMeritType,
        merit_size: newMeritSize,
      });
    }
    setNewTaskTitle("");
  };

  const handleUpdateTask = async (
    task: DailyTask,
    patch: Partial<DailyTask>
  ) => {
    await updateTask(task.id, patch);
  };

  const dateLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  const renderCategoryGroup = (category: TaskCategory) => {
    const meta = CATEGORY_META[category];
    const groupTasks = groupedTasks[category];

    return (
      <Card key={category} className="p-5 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md`}
          >
            <span className="font-bold text-sm">{meta.label_vi[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg tracking-tight">{meta.label_vi}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{groupTasks.length} việc</p>
          </div>
        </div>

        <div className="space-y-3">
          {groupTasks.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Chưa có việc nào trong nhóm {meta.label_vi.toLowerCase()}.
            </p>
          )}
          {groupTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">
                      {getTaskSubcategory(task) || meta.label_vi}
                    </span>
                    {task.merit_type && task.merit_size && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          task.merit_type === "earn"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                        }`}
                      >
                        {task.merit_type === "earn" ? "Tạo Phúc" : "Tiêu Phúc"} ·{" "}
                        {MERIT_SIZE_LABELS[task.merit_size].vi}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateTask(task, { merit_type: undefined, merit_size: undefined })}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Bỏ Phúc
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Phúc:</span>
                <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E]">
                  {(["earn", "spend"] as MeritType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdateTask(task, { merit_type: type })}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        task.merit_type === type
                          ? type === "earn"
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                          : "text-gray-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      {type === "earn" ? "Tạo" : "Tiêu"}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-gray-500 ml-1">Cỡ:</span>
                <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E]">
                  {(Object.keys(MERIT_SIZE_LABELS) as MeritSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleUpdateTask(task, { merit_type: task.merit_type || "earn", merit_size: size })}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        task.merit_size === size
                          ? "bg-primary-600 text-white"
                          : "text-gray-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      {MERIT_SIZE_LABELS[size].vi}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between py-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
        >
          {theme === "dark" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold tracking-tight">{dateLabel}</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t("calendar.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("calendar.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mx-auto mb-2">
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phúc tạo</p>
          <p className="text-xl font-bold text-emerald-600">+{merit.earned}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 mx-auto mb-2">
            <FiTrendingDown className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phúc tiêu</p>
          <p className="text-xl font-bold text-red-600">-{merit.spent}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 mx-auto mb-2">
            <FiActivity className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng Phúc</p>
          <p className={`text-xl font-bold ${merit.total >= 0 ? "text-primary-600" : "text-red-600"}`}>
            {merit.total >= 0 ? `+${merit.total}` : merit.total}
          </p>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FiTarget className="w-5 h-5 text-primary-600" />
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
          <span
            className={`font-semibold ${adjustment >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {adjustment >= 0 ? `+${adjustment}` : adjustment}
          </span>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold tracking-tight">Thêm việc mới</h3>
        <input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          placeholder="Tên việc..."
          className="input"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nhóm</label>
            <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E]">
              {(Object.keys(CATEGORY_META) as TaskCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    newCategory === cat
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {CATEGORY_META[cat].label_vi}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phân loại</label>
            <select
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className="input w-full py-2 text-sm"
            >
              {subcategoryOptions[newCategory].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Loại Phúc</label>
            <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E]">
              {(["earn", "spend"] as MeritType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewMeritType(type)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    newMeritType === type
                      ? type === "earn"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {type === "earn" ? "Tạo" : "Tiêu"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cỡ việc</label>
            <div className="flex rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E]">
              {(Object.keys(MERIT_SIZE_LABELS) as MeritSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setNewMeritSize(size)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    newMeritSize === size ? "bg-primary-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {MERIT_SIZE_LABELS[size].vi}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleAddTask} className="w-full" disabled={!newTaskTitle.trim()}>
          <FiPlus className="w-4 h-4 mr-2" />
          Thêm việc
        </Button>
      </Card>

      <div className="space-y-4">
        {(["doi", "dao", "loi_tu"] as TaskCategory[]).map(renderCategoryGroup)}
      </div>
    </div>
  );
};

export default Calendar;
