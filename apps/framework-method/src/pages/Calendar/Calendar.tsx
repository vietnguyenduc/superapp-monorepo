import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addQuarters,
  subQuarters,
  startOfQuarter,
  endOfQuarter,
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiMoreVertical, FiPlus } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";

const fmt = (date: Date, token: string) => format(date, token, { locale: vi });

type View = "day" | "week" | "month" | "quarter";

type Group = string;

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  group: Group;
  note?: string;
  completed?: boolean;
  timeLabel?: string;
  priority?: string;
}

const PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#d946ef",
];

const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
};

const colorFor = (str: string) => PALETTE[Math.abs(hash(str)) % PALETTE.length];

const Calendar = () => {
  const { t } = useI18n();
  const { progress } = useFrameworkProgress();
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = startOfDay(new Date());

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];

    progress.sessions.forEach((session) => {
      list.push({
        id: `session-${session.id}`,
        date: parseISO(session.date),
        title: session.title,
        group: "Framework",
        note: Object.values(session.reflections || {})
          .filter(Boolean)
          .slice(0, 2)
          .join(" "),
        timeLabel: fmt(parseISO(session.date), "h:mm a"),
      });
    });

    (progress.tasks || []).forEach((task) => {
      list.push({
        id: `task-${task.id}`,
        date: parseISO(task.date),
        title: task.title,
        group: task.group || t("overview.yourFramework"),
        note: [task.category, task.subCategory].filter(Boolean).join(" / ") || undefined,
        completed: task.status === "done",
        priority: task.priority,
      });
    });

    return list;
  }, [progress, t, today]);

  const eventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(startOfDay(e.date), startOfDay(date)));

  const groupEvents = (items: CalendarEvent[]) => {
    const groups: Record<Group, CalendarEvent[]> = {};
    items.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  };

  const navigate = (direction: -1 | 1) => {
    if (view === "day") {
      setCurrentDate(direction === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
      setSelectedDate(direction === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
      setSelectedDate(direction === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(direction === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === "quarter") {
      setCurrentDate(direction === 1 ? addQuarters(currentDate, 1) : subQuarters(currentDate, 1));
    }
  };

  const titleText = () => {
    if (view === "day") return fmt(currentDate, "EEEE, MMM d");
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${fmt(start, "MMM d")} - ${fmt(end, "MMM d")}`;
    }
    if (view === "quarter") return `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${fmt(currentDate, "yyyy")}`;
    return fmt(currentDate, "MMMM yyyy");
  };

  const renderDayList = (date: Date, compact = false) => {
    const items = eventsForDate(date);
    const groups = groupEvents(items);
    const hasEvents = items.length > 0;

    if (!hasEvents) {
      return <p className="text-xs text-gray-400 italic py-2">{t("calendar.noEvents")}</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(groups).map(([group, groupItems]) =>
          groupItems.length > 0 ? (
            <div key={group} className="space-y-1">
              {compact ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorFor(group) }} />
                  <span className="text-[10px] text-gray-500 truncate">
                    {group} · {groupItems.length}
                  </span>
                </div>
              ) : (
                groupItems.map((event) => {
                  const color = colorFor(event.group);
                  return (
                    <div
                      key={event.id}
                      className="p-2 rounded-lg text-xs border-l-4"
                      style={{ borderLeftColor: color, backgroundColor: `${color}1a` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${event.completed ? "line-through text-gray-400" : ""}`}>
                          {event.title}
                        </span>
                        {event.timeLabel && <span className="text-[10px] text-gray-400">{event.timeLabel}</span>}
                      </div>
                      {event.note && <p className="text-gray-500 truncate mt-0.5">{event.note}</p>}
                    </div>
                  );
                })
              )}
            </div>
          ) : null
        )}
      </div>
    );
  };

  const DayView = () => {
    const groups = groupEvents(eventsForDate(currentDate));
    const groupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-gray-500">{fmt(currentDate, "EEEE")}</p>
          <h2 className="text-3xl font-bold">{fmt(currentDate, "MMM d")}</h2>
        </div>
        {groupKeys.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t("calendar.noEvents")}</p>}
        {groupKeys.map((group) => {
          const color = colorFor(group);
          return (
            <Card key={group} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="font-semibold">{group}</h3>
                <span className="text-xs text-gray-400 ml-auto">{groups[group].length}</span>
              </div>
              <div className="space-y-2">
                {groups[group].map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${color}1a` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${event.completed ? "line-through text-gray-400" : ""}`}>
                        {event.title}
                      </p>
                      {event.priority && <span className="text-[10px] uppercase text-gray-400">{event.priority}</span>}
                    </div>
                    {event.note && <p className="text-xs text-gray-500 mt-1">{event.note}</p>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const WeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                isSelected
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <p className="text-[10px] text-gray-400 uppercase">{fmt(day, "EEE")}</p>
              <p className={`text-lg font-bold ${isToday(day) ? "text-primary-600" : ""}`}>{fmt(day, "d")}</p>
              <div className="mt-2 min-h-[60px]">{renderDayList(day, true)}</div>
            </button>
          );
        })}
      </div>
    );
  };

  const MonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const groups = groupEvents(eventsForDate(day));
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square p-1 rounded-xl text-sm flex flex-col items-center justify-start transition-colors ${
                  isSelected(day)
                    ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-300 dark:text-gray-700"}`}
              >
                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold" : ""}`}>
                  {fmt(day, "d")}
                </span>
                <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                  {Object.entries(groups)
                    .filter(([, items]) => items.length > 0)
                    .slice(0, 4)
                    .map(([group]) => (
                      <span
                        key={group}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colorFor(group) }}
                      />
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    );
  };

  const QuarterView = () => {
    const start = startOfQuarter(currentDate);
    const end = endOfQuarter(currentDate);
    const months = eachMonthOfInterval({ start, end });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          return (
            <Card key={month.toISOString()} className="p-4">
              <h3 className="font-semibold mb-3">{fmt(month, "MMMM")}</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
                {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const hasEvents = eventsForDate(day).length > 0;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square flex items-center justify-center rounded-md text-[10px] ${
                        isToday(day)
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                          : hasEvents
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700"
                          : "text-gray-500 dark:text-gray-500"
                      }`}
                    >
                      {fmt(day, "d")}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const isSelected = (day: Date) => isSameDay(day, selectedDate);

  const viewTabs: { key: View; label: string }[] = [
    { key: "day", label: t("calendar.day") || "Day" },
    { key: "week", label: t("calendar.week") || "Week" },
    { key: "month", label: t("calendar.month") || "Month" },
    { key: "quarter", label: t("calendar.quarter") || "Quarter" },
  ];

  const detailGroups = groupEvents(eventsForDate(selectedDate));
  const detailKeys = Object.keys(detailGroups).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{titleText()}</h1>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-3 py-1.5 text-xs sm:text-sm ${
                view === tab.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDate(new Date());
          }}
          className="text-sm font-medium text-primary-600"
        >
          {t("calendar.today") || "Today"}
        </button>
        <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {view === "day" && <DayView />}
      {view === "week" && <WeekView />}
      {view === "month" && <MonthView />}
      {view === "quarter" && <QuarterView />}

      {view !== "day" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {`${t("calendar.scheduledFor") || "Scheduled for"} ${fmt(selectedDate, "MMM d")}`}
            </h2>
            <button className="text-gray-400">
              <FiMoreVertical className="w-4 h-4" />
            </button>
          </div>
          {detailKeys.length === 0 && (
            <p className="text-sm text-gray-400 py-4">{t("calendar.noEvents") || "No activities scheduled."}</p>
          )}
          {detailKeys.map((group) => {
            const color = colorFor(group);
            return (
              <div key={group} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-semibold">{group}</h3>
                  <span className="text-xs text-gray-400 ml-auto">{detailGroups[group].length}</span>
                </div>
                <div className="space-y-2">
                  {detailGroups[group].map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${color}1a` }}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-sm ${event.completed ? "line-through text-gray-400" : ""}`}>
                          {event.title}
                        </p>
                        {event.priority && <span className="text-[10px] uppercase text-gray-400">{event.priority}</span>}
                      </div>
                      {event.note && <p className="text-xs text-gray-500 mt-1">{event.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2">
            <FiPlus className="w-4 h-4" /> {t("calendar.scheduleNew")}
          </button>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
