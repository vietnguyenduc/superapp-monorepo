import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSun,
  FiMoon,
  FiUser,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiTarget,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import KarmaActionModal from "../../components/KarmaActionModal";
import {
  CATEGORY_META,
  MERIT_SIZE_LABELS,
  BLOCK_TO_CATEGORY,
  plannedCompletionAdjustment,
  getRecurringTasks,
  saveRecurringTasks,
  getDaysUntilPeriodEnd,
  getNextDueDate,
  getKarmaEventCountdown,
  genId,
} from "../../services/frameworkMethodService";
import type { TaskCategory, MeritType, MeritSize, DailyTask, BlockId, RecurringTask, RecurrenceType, KarmaEvent } from "../../types";

const CATEGORY_TO_DEFAULT_BLOCK: Record<TaskCategory, BlockId> = {
  doi: "self",
  dao: "relationship",
  loi_tu: "work",
};

const CALENDAR_PRESETS: { id: string; label: string; icon: string; tasks: Partial<RecurringTask>[] }[] = [
  {
    id: "lunar_1_15",
    label: "Mồng 1 & 15 âm lịch",
    icon: "🌙",
    tasks: [
      { title: "Mồng 1 âm lịch", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "Ngày mồng 1 âm lịch", merit_type: "earn", merit_size: "medium" },
      { title: "Rằm 15 âm lịch", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "Ngày 15 âm lịch", merit_type: "earn", merit_size: "medium" },
    ],
  },
  {
    id: "vegetarian_10",
    label: "10 ngày ăn chay",
    icon: "🥗",
    tasks: [
      { title: "Ăn chay", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "10 ngày ăn chay theo lịch cá nhân", merit_type: "earn", merit_size: "small" },
    ],
  },
  {
    id: "memorial_days",
    label: "Lễ giỗ, tế họ",
    icon: "🕯️",
    tasks: [
      { title: "Giỗ / Tế họ", category: "doi", subcategory: "Gia đình", recurrence: "special", warning_before_days: 7, note: "Các ngày lễ giỗ, tế họ trong năm", merit_type: "earn", merit_size: "big" },
    ],
  },
];

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

type CalendarView = "month" | "week";

const Calendar = () => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { tasks, session, merit, updateTask, setPlannedCompletionRate, addTask, sessionDate, setSessionDate, userId, karma } = useSession();

  const [selectedKarmaEvent, setSelectedKarmaEvent] = useState<KarmaEvent | null>(null);

  const subcategoryOptions = useMemo(() => getSubcategoryOptions(), []);

  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState<Date>(parseISO(sessionDate));

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("doi");
  const [newSubcategory, setNewSubcategory] = useState(subcategoryOptions.doi[0] ?? "");
  const [newMeritType, setNewMeritType] = useState<MeritType>("earn");
  const [newMeritSize, setNewMeritSize] = useState<MeritSize>("small");
  const [isRecurring, setIsRecurring] = useState(false);
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>("monthly");
  const [newWarningDays, setNewWarningDays] = useState("3");
  const [newNote, setNewNote] = useState("");

  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);

  useEffect(() => {
    if (!userId) return;
    getRecurringTasks(userId).then(setRecurringTasks);
  }, [userId]);

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

  const resetNewTask = () => {
    setNewTaskTitle("");
    setIsRecurring(false);
    setNewRecurrence("monthly");
    setNewWarningDays("3");
    setNewNote("");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    if (!userId) return;

    if (isRecurring) {
      const newTask: RecurringTask = {
        id: genId(),
        user_id: userId,
        title: newTaskTitle.trim(),
        category: newCategory,
        subcategory: newSubcategory,
        recurrence: newRecurrence,
        warning_before_days: Number(newWarningDays) || 3,
        note: newNote.trim() || undefined,
        next_due_date: getNextDueDate(newRecurrence, new Date()),
        merit_type: newMeritType,
        merit_size: newMeritSize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const next = [newTask, ...recurringTasks];
      setRecurringTasks(next);
      await saveRecurringTasks(next);
      resetNewTask();
      return;
    }

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
    resetNewTask();
  };

  const handleUpdateTask = async (
    task: DailyTask,
    patch: Partial<DailyTask>
  ) => {
    await updateTask(task.id, patch);
  };

  const handleDeleteRecurring = async (id: string) => {
    const next = recurringTasks.filter((t) => t.id !== id);
    setRecurringTasks(next);
    await saveRecurringTasks(next);
  };

  const handleCommitRecurring = async (task: RecurringTask) => {
    const blockId = CATEGORY_TO_DEFAULT_BLOCK[task.category || "doi"];
    const created = await addTask(blockId, task.title);
    if (created) {
      await updateTask(created.id, {
        category: task.category,
        subcategory: task.subcategory,
        merit_type: task.merit_type,
        merit_size: task.merit_size,
      });
    }
  };

  const handleAddPreset = async (presetId: string) => {
    if (!userId) return;
    const preset = CALENDAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const now = new Date();
    const newTasks: RecurringTask[] = preset.tasks.map((task) => ({
      id: genId(),
      user_id: userId,
      title: task.title || "",
      category: (task.category as TaskCategory) ?? "doi",
      subcategory: task.subcategory,
      recurrence: (task.recurrence as RecurrenceType) ?? "special",
      warning_before_days: task.warning_before_days ?? 3,
      note: task.note,
      next_due_date: getNextDueDate((task.recurrence as RecurrenceType) ?? "special", now),
      merit_type: task.merit_type as MeritType,
      merit_size: task.merit_size as MeritSize,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }));

    const next = [...newTasks, ...recurringTasks];
    setRecurringTasks(next);
    await saveRecurringTasks(next);
  };

  const selectedDate = useMemo(() => parseISO(sessionDate), [sessionDate]);

  const dateLabel = format(selectedDate, "EEEE, dd/MM", { locale: vi });

  const calendarDays = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
    const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursorDate, view]);

  const weekDayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map((d) =>
      format(d, "EEEEEE", { locale: vi })
    );
  }, []);

  const handlePrev = () => {
    setCursorDate((d) => (view === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const handleNext = () => {
    setCursorDate((d) => (view === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const handleSelectDate = (d: Date) => {
    setSessionDate(format(d, "yyyy-MM-dd"));
    setCursorDate(d);
  };

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

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-semibold tracking-tight">
            {format(cursorDate, "MMMM yyyy", { locale: vi }).replace(/^\w/, (c) => c.toUpperCase())}
          </h3>
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setView("month")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "month"
                ? "bg-primary-600 text-white"
                : "bg-black/[0.03] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "week"
                ? "bg-primary-600 text-white"
                : "bg-black/[0.03] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300"
            }`}
          >
            Tuần
          </button>
        </div>

        <div className={`grid ${view === "month" ? "grid-cols-7 gap-y-1" : "grid-cols-7 gap-2"} mb-2`}>
          {weekDayLabels.map((label) => (
            <div key={label} className="text-center text-xs font-medium text-gray-400 py-1">
              {label}
            </div>
          ))}
        </div>

        <div className={`grid ${view === "month" ? "grid-cols-7 gap-1" : "grid-cols-7 gap-2"}`}>
          {calendarDays.map((d) => {
            const isSelected = isSameDay(d, selectedDate);
            const today = isToday(d);
            const inCurrentMonth = view === "week" || d.getMonth() === cursorDate.getMonth();
            return (
              <button
                key={d.toISOString()}
                onClick={() => handleSelectDate(d)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary-600 text-white shadow-md"
                    : today
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 ring-1 ring-primary-600"
                    : "bg-transparent text-gray-700 dark:text-gray-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                } ${!inCurrentMonth ? "opacity-30" : ""}`}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      </Card>

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold tracking-tight">Trổ canh</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Còn {karma.account?.balance ?? 1000} / {karma.account?.initial ?? 1000} Nghiệp báo</span>
        </div>
        <div className="space-y-3">
          {karma.events.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có sự kiện Trổ canh nào.</p>}
          {karma.events.slice(0, 6).map((e) => {
            const countdown = getKarmaEventCountdown(e);
            const statusLabel =
              e.status === "pending" ? "Chưa nhận ra" : e.status === "recognized" ? "Đã nhận ra" : e.status === "resolved" ? "Đã giải cảnh" : "Đã tự động trừ";
            const isPending = e.status === "pending" || e.status === "recognized";
            return (
              <div key={e.id} className="p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{e.period === "monthly" ? "Trổ canh tháng" : "Trổ canh quý"} · {e.due_date}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"}`}>{statusLabel}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Countdown: {countdown.label} · Trích {e.reserved_amount} điểm · Đã cấn trừ {e.prepaid || 0}</p>
                {isPending && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedKarmaEvent(e)}>Dừng / Giải</Button>
                    <Button size="sm" className="flex-1" onClick={() => setSelectedKarmaEvent(e)}>Nhận ra</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

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

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600"
          />
          Việc định kỳ
        </label>

        {isRecurring && (
          <div className="space-y-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value as RecurrenceType)}
                className="input"
              >
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="quarterly">Hàng quý</option>
                <option value="half_yearly">Nửa năm</option>
                <option value="special">Dịp đặc biệt</option>
              </select>
              <input
                type="number"
                min={0}
                value={newWarningDays}
                onChange={(e) => setNewWarningDays(e.target.value)}
                placeholder="Cảnh báo trước (ngày)"
                className="input"
              />
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ghi chú chuẩn bị trước khi làm..."
              rows={3}
              className="input resize-none"
            />
          </div>
        )}

        <Button onClick={handleAddTask} className="w-full" disabled={!newTaskTitle.trim()}>
          <FiPlus className="w-4 h-4 mr-2" />
          {isRecurring ? "Thêm việc định kỳ" : "Thêm việc"}
        </Button>
      </Card>

      <div className="space-y-4">
        {(["doi", "dao", "loi_tu"] as TaskCategory[]).map(renderCategoryGroup)}
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold tracking-tight">Việc định kỳ</h3>

        <div className="space-y-3">
          {recurringTasks.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Chưa có việc định kỳ nào.</p>
          )}
          {recurringTasks.map((task) => {
            const daysLeft = getDaysUntilPeriodEnd(task.recurrence, new Date());
            const warning = daysLeft <= task.warning_before_days;
            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border ${
                  warning
                    ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    : "bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">
                        {task.subcategory || CATEGORY_META[task.category || "doi"].label_vi}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">
                        {task.recurrence === "weekly" && "Hàng tuần"}
                        {task.recurrence === "monthly" && "Hàng tháng"}
                        {task.recurrence === "quarterly" && "Hàng quý"}
                        {task.recurrence === "half_yearly" && "Nửa năm"}
                        {task.recurrence === "special" && "Dịp đặc biệt"}
                      </span>
                      {warning && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                          Còn {daysLeft} ngày
                        </span>
                      )}
                    </div>
                    {task.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{task.note}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteRecurring(task.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleCommitRecurring(task)}
                  className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Chốt làm ngày {selectedDate.toLocaleDateString("vi-VN")}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold tracking-tight">Gợi ý bộ lịch</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Thêm nhanh các lịch định kỳ phổ biến.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CALENDAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddPreset(preset.id)}
              className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all"
            >
              <span className="text-2xl block mb-2">{preset.icon}</span>
              <p className="font-medium text-sm">{preset.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{preset.tasks.length} việc định kỳ</p>
            </button>
          ))}
        </div>
      </Card>

      {selectedKarmaEvent && <KarmaActionModal event={selectedKarmaEvent} onClose={() => setSelectedKarmaEvent(null)} />}
    </div>
  );
};

export default Calendar;
