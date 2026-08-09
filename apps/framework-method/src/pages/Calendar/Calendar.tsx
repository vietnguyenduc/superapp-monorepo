import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSun,
  FiMoon,
  FiUser,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiAlertCircle,
  FiRotateCcw,
  FiClock,
  FiCheckCircle,
  FiFeather,
  FiCalendar,
  FiBookOpen,
  FiZap,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isValid,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import KarmaActionModal from "../../components/KarmaActionModal";
import {
  CATEGORY_META,
  BLOCK_TO_CATEGORY,
  getRecurringTasks,
  saveRecurringTasks,
  getDaysUntilPeriodEnd,
  getNextDueDate,
  getKarmaEventCountdown,
  genId,
} from "../../services/frameworkMethodService";
import { MERIT_SIZE_POINTS } from "../../types";
import type { TaskCategory, DailyTask, BlockId, RecurringTask, RecurrenceType, KarmaEvent } from "../../types";

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
      { title: "Mồng 1 âm lịch", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "Ngày mồng 1 âm lịch" },
      { title: "Rằm 15 âm lịch", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "Ngày 15 âm lịch" },
    ],
  },
  {
    id: "vegetarian_10",
    label: "10 ngày ăn chay",
    icon: "🥗",
    tasks: [
      { title: "Ăn chay", category: "dao", subcategory: "Quan hệ", recurrence: "special", warning_before_days: 1, note: "10 ngày ăn chay theo lịch cá nhân" },
    ],
  },
  {
    id: "memorial_days",
    label: "Lễ giỗ, tế họ",
    icon: "🕯️",
    tasks: [
      { title: "Giỗ / Tế họ", category: "doi", subcategory: "Gia đình", recurrence: "special", warning_before_days: 7, note: "Các ngày lễ giỗ, tế họ trong năm" },
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
  const { tasks, merit, updateTask, addTask, toggleTask, removeTask, sessionDate, setSessionDate, userId, karma, applyPlans, tracks } = useSession();

  const [selectedKarmaEvent, setSelectedKarmaEvent] = useState<KarmaEvent | null>(null);
  const [selectedKarmaAction, setSelectedKarmaAction] = useState<"recognize" | "stop" | "resolve" | "recite" | null>(null);

  const subcategoryOptions = useMemo(() => getSubcategoryOptions(), []);

  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState<Date>(parseISO(sessionDate));

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("doi");
  const [newSubcategory, setNewSubcategory] = useState(subcategoryOptions.doi[0] ?? "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>("monthly");
  const [newWarningDays, setNewWarningDays] = useState("3");
  const [newNote, setNewNote] = useState("");

  const [journalPeriod, setJournalPeriod] = useState<"day" | "week" | "month" | "quarter" | "year" | "custom">("day");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  const [memorialOpen, setMemorialOpen] = useState(false);
  const [memorialTitle, setMemorialTitle] = useState("");
  const [memorialDate, setMemorialDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memorialWarningDays, setMemorialWarningDays] = useState("7");
  const [memorialNote, setMemorialNote] = useState("");

  const resetMemorial = () => {
    setMemorialTitle("");
    setMemorialDate(format(new Date(), "yyyy-MM-dd"));
    setMemorialWarningDays("7");
    setMemorialNote("");
  };

  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);

  useEffect(() => {
    if (!userId) return;
    getRecurringTasks(userId).then(setRecurringTasks);
  }, [userId]);



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
      });
    }
    resetNewTask();
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
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }));

    const next = [...newTasks, ...recurringTasks];
    setRecurringTasks(next);
    await saveRecurringTasks(next);
  };

  const handleAddMemorial = async () => {
    if (!userId || !memorialTitle.trim()) return;
    const newTask: RecurringTask = {
      id: genId(),
      user_id: userId,
      title: memorialTitle.trim(),
      category: "doi",
      subcategory: "Gia đình",
      recurrence: "special",
      warning_before_days: Number(memorialWarningDays) || 7,
      note: memorialNote.trim() || undefined,
      next_due_date: memorialDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [newTask, ...recurringTasks];
    setRecurringTasks(next);
    await saveRecurringTasks(next);
    resetMemorial();
    setMemorialOpen(false);
  };

  const selectedDate = useMemo(() => parseISO(sessionDate), [sessionDate]);

  const dateLabel = format(selectedDate, "EEEE, dd/MM", { locale: vi });

  const periodRange = useMemo(() => {
    switch (journalPeriod) {
      case "day":
        return { start: selectedDate, end: selectedDate };
      case "week":
        return { start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) };
      case "month":
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      case "quarter":
        return { start: startOfQuarter(selectedDate), end: endOfQuarter(selectedDate) };
      case "year":
        return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
      case "custom": {
        const s = parseISO(customStart);
        const e = parseISO(customEnd);
        return { start: isValid(s) ? s : selectedDate, end: isValid(e) ? e : selectedDate };
      }
    }
  }, [journalPeriod, selectedDate, customStart, customEnd]);

  const periodStartStr = format(periodRange.start, "yyyy-MM-dd");
  const periodEndStr = format(periodRange.end, "yyyy-MM-dd");

  const isInPeriod = (d?: string) => !!d && d >= periodStartStr && d <= periodEndStr;

  const periodTasks = tasks.filter((t) => isInPeriod(t.date));
  const periodDoneCount = periodTasks.filter((t) => t.status === "done").length;

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

      <Card className="p-5 space-y-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold tracking-tight">Nhật ký</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "day", label: "Ngày" },
              { value: "week", label: "Tuần" },
              { value: "month", label: "Tháng" },
              { value: "quarter", label: "Quý" },
              { value: "year", label: "Năm" },
              { value: "custom", label: "Tùy chọn" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setJournalPeriod(p.value as typeof journalPeriod)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  journalPeriod === p.value
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {journalPeriod === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input"
              />
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(periodRange.start, "dd/MM/yyyy")} - {format(periodRange.end, "dd/MM/yyyy")} · {periodTasks.length} việc · {periodDoneCount} hoàn thành
          </p>
        </div>
        {(() => {
          const frameworkTasks = periodTasks.filter((t) => applyPlans[t.id] || tracks[t.id]);
          const doneTasks = periodTasks.filter((t) => t.status === "done");
          const meritDoneTasks = periodTasks.filter((t) => t.merit_type && t.merit_reflected);
          const dueRecurring = recurringTasks.filter((t) => isInPeriod(t.next_due_date));
          const dueKarmaEvents = karma.events.filter((e) => isInPeriod(e.due_date));
          const getPoints = (t: DailyTask) => t.merit_points ?? (t.merit_size ? MERIT_SIZE_POINTS[t.merit_size] : 0);
          const periodEarned = periodTasks
            .filter((t) => t.merit_type === "earn" && t.merit_reflected)
            .reduce((sum, t) => sum + getPoints(t), 0);
          const periodSpent = periodTasks
            .filter((t) => t.merit_type === "spend" && t.merit_reflected)
            .reduce((sum, t) => sum + getPoints(t), 0);
          const periodTotal = periodEarned - periodSpent;

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tổng việc</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{periodTasks.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</p>
                  <p className="text-lg font-bold text-emerald-600">{doneTasks.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phúc tạo</p>
                  <p className="text-lg font-bold text-emerald-600">+{periodEarned}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tổng Phúc</p>
                  <p className={`text-lg font-bold ${periodTotal >= 0 ? "text-primary-600" : "text-red-600"}`}>
                    {periodTotal >= 0 ? `+${periodTotal}` : periodTotal}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Đưa khuôn trí tuệ vào cuộc sống</p>
                {frameworkTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có khuôn nào được áp dụng trong kỳ này.</p>
                ) : (
                  <div className="space-y-3">
                    {frameworkTasks.map((task) => {
                      const plan = applyPlans[task.id];
                      const track = tracks[task.id];
                      const meta = CATEGORY_META[getTaskCategory(task)];
                      return (
                        <div key={task.id} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <FiBookOpen className="w-4 h-4 text-primary-600" />
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{task.title}</p>
                            <span className="text-xs text-gray-500">{meta.label_vi}</span>
                          </div>
                          {plan && Object.entries(plan.plan_data).length > 0 && (
                            <div className="space-y-1 mb-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Khuôn đã lập:</p>
                              {Object.entries(plan.plan_data).map(([k, v]) => (
                                <p key={k} className="text-xs text-gray-500 dark:text-gray-400"><span className="font-medium">{k}:</span> {v}</p>
                              ))}
                            </div>
                          )}
                          {track && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <p className="text-gray-500 dark:text-gray-400"><span className="font-medium">Đích:</span> {track.dich}</p>
                              <p className="text-gray-500 dark:text-gray-400"><span className="font-medium">Thực tế:</span> {track.thuc_te}</p>
                              <p className="text-gray-500 dark:text-gray-400"><span className="font-medium">Phương pháp:</span> {track.phuong_phap}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Việc trong kỳ</p>
                {periodTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có việc nào trong kỳ này.</p>
                ) : (
                  <div className="space-y-2">
                    {periodTasks.map((task) => {
                      const meta = CATEGORY_META[getTaskCategory(task)];
                      const points = getPoints(task);
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                          <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                            {task.status === "done" ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${meta.gradient ? "bg-gradient-to-br " + meta.gradient : "bg-gray-400"}`}>
                                <FiCheckCircle className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-50"}`}>{task.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{meta.label_vi} · {getTaskSubcategory(task) || meta.label_vi}</p>
                            {task.merit_reflected && task.merit_type && (
                              <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium ${task.merit_type === "earn" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"}`}>
                                {task.merit_type === "earn" ? "+" : "-"}{points} Phúc
                              </span>
                            )}
                          </div>
                          <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Phúc / Tiêu Phúc đã ghi nhận</p>
                {meritDoneTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có Phúc nào được ghi nhận.</p>
                ) : (
                  <div className="space-y-2">
                    {meritDoneTasks.map((task) => {
                      const points = getPoints(task);
                      return (
                        <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            <FiFeather className={`w-4 h-4 ${task.merit_type === "earn" ? "text-emerald-600" : "text-red-600"}`} />
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{task.title}</p>
                          </div>
                          <span className={`text-sm font-bold ${task.merit_type === "earn" ? "text-emerald-600" : "text-red-600"}`}>
                            {task.merit_type === "earn" ? "+" : "-"}{points}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Sự kiện trong kỳ</p>
                {dueRecurring.length === 0 && dueKarmaEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Không có sự kiện nào trong kỳ này.</p>
                ) : (
                  <div className="space-y-2">
                    {dueRecurring.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                        <FiZap className="w-4 h-4 text-amber-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{task.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{task.recurrence === "special" ? "Dịp đặc biệt" : task.recurrence} · {task.subcategory || CATEGORY_META[task.category || "doi"].label_vi}</p>
                        </div>
                      </div>
                    ))}
                    {dueKarmaEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800">
                        <FiAlertCircle className="w-4 h-4 text-rose-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{e.period === "monthly" ? "Trổ cảnh tháng" : "Trổ cảnh quý"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{format(parseISO(e.due_date), "dd/MM/yyyy")} · Trích {e.reserved_amount} điểm · {e.status === "pending" ? "Chưa nhận ra" : e.status === "recognized" ? "Đã nhận ra" : e.status === "resolved" ? "Đã giải cảnh" : "Đã tự động trừ"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Card>

      {(() => {
        const todayStrValue = format(new Date(), "yyyy-MM-dd");
        const currentMonthly = karma.events.find((e) => e.period === "monthly" && e.due_date >= todayStrValue && (e.status === "pending" || e.status === "recognized"));
        const currentQuarterly = karma.events.find((e) => e.period === "quarterly" && e.due_date >= todayStrValue && (e.status === "pending" || e.status === "recognized"));
        const currentEvents = ([currentMonthly, currentQuarterly].filter(Boolean)) as KarmaEvent[];
        const currentIds = new Set(currentEvents.map((e) => e.id));
        const futureCandidates = [...karma.events]
          .filter((e) => !currentIds.has(e.id) && e.due_date > todayStrValue && (e.status === "pending" || e.status === "recognized"))
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
        const futureMonthly = futureCandidates.find((e) => e.period === "monthly");
        const futureQuarterly = futureCandidates.find((e) => e.period === "quarterly");
        const futureEvents = ([futureMonthly, futureQuarterly].filter(Boolean)) as KarmaEvent[];
        const pastEvents = [...karma.events].reverse().filter((e) => e.due_date < todayStrValue || e.status === "resolved" || e.status === "triggered");

        const renderEvent = (e: KarmaEvent) => {
          const countdown = getKarmaEventCountdown(e);
          const statusLabel = e.status === "pending" ? "Chưa nhận ra" : e.status === "recognized" ? "Đã nhận ra" : e.status === "resolved" ? "Đã giải cảnh" : "Đã tự động trừ";
          const isPending = e.status === "pending" || e.status === "recognized";
          return (
            <div key={e.id} className="p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{e.period === "monthly" ? "Trổ cảnh tháng" : "Trổ cảnh quý"} · {e.due_date}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"}`}>{statusLabel}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2"><FiClock className="inline w-3 h-3 mr-1" />{countdown.label} · Trích {e.reserved_amount} điểm · Đã cấn trừ {e.prepaid || 0}</p>
              {isPending && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedKarmaEvent(e); setSelectedKarmaAction("recognize"); }}>Nhận ra</Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedKarmaEvent(e); setSelectedKarmaAction("stop"); }}>Dừng</Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedKarmaEvent(e); setSelectedKarmaAction("recite"); }}>Đọc Sám</Button>
                  <Button size="sm" onClick={() => { setSelectedKarmaEvent(e); setSelectedKarmaAction("resolve"); }}>Giải</Button>
                </div>
              )}
            </div>
          );
        };

        return (
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold tracking-tight">Trổ cảnh</h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Còn {karma.account?.balance ?? 1000} / {karma.account?.initial ?? 1000} Nghiệp báo</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Cảnh hiện tại</p>
              {currentEvents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Không có cảnh hiện tại nào.</p>}
              {currentEvents.map(renderEvent)}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Cảnh tương lai</p>
              {futureEvents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Không có cảnh sắp tới.</p>}
              {futureEvents.map(renderEvent)}
            </div>

            {pastEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1"><FiRotateCcw className="w-3.5 h-3.5" /> Lịch sử cảnh</p>
                {pastEvents.map(renderEvent)}
              </div>
            )}
          </Card>
        );
      })()}

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
              onClick={() => (preset.id === "memorial_days" ? setMemorialOpen(true) : handleAddPreset(preset.id))}
              className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all"
            >
              <span className="text-2xl block mb-2">{preset.icon}</span>
              <p className="font-medium text-sm">{preset.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{preset.id === "memorial_days" ? "Tùy chỉnh ngày" : `${preset.tasks.length} việc định kỳ`}</p>
            </button>
          ))}
        </div>
      </Card>

      {memorialOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕯️</span>
              <h3 className="font-semibold tracking-tight">Thêm ngày lễ giỗ / tế họ</h3>
            </div>
            <Input
              value={memorialTitle}
              onChange={(e) => setMemorialTitle(e.target.value)}
              placeholder="Tên ngày lễ (ví dụ: Giỗ ông bà...)"
            />
            <input
              type="date"
              value={memorialDate}
              onChange={(e) => setMemorialDate(e.target.value)}
              className="input w-full"
            />
            <input
              type="number"
              min={0}
              value={memorialWarningDays}
              onChange={(e) => setMemorialWarningDays(e.target.value)}
              placeholder="Cảnh báo trước (ngày)"
              className="input w-full"
            />
            <textarea
              value={memorialNote}
              onChange={(e) => setMemorialNote(e.target.value)}
              placeholder="Ghi chú chuẩn bị..."
              rows={3}
              className="input resize-none w-full"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { resetMemorial(); setMemorialOpen(false); }}>Hủy</Button>
              <Button onClick={handleAddMemorial} disabled={!memorialTitle.trim()}>Thêm</Button>
            </div>
          </Card>
        </div>
      )}

      {selectedKarmaEvent && <KarmaActionModal event={selectedKarmaEvent} initialAction={selectedKarmaAction || "stop"} onClose={() => { setSelectedKarmaEvent(null); setSelectedKarmaAction(null); }} />}
    </div>
  );
};

export default Calendar;
