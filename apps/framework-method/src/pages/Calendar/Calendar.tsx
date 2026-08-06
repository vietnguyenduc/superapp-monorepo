import { useState } from "react";
import { FiMoreVertical, FiPlus } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
const days = [
  { day: 23, current: false },
  { day: 24, current: false },
  { day: 25, current: false },
  { day: 26, current: false },
  { day: 27, current: false },
  { day: 28, current: false },
  { day: 29, current: false },
  { day: 30, current: false },
  { day: 31, current: false },
  { day: 1, current: false },
  { day: 2, current: false },
  { day: 3, current: false },
  { day: 4, current: false },
  { day: 5, current: false },
  { day: 6, current: false },
  { day: 7, current: false },
  { day: 8, current: false },
  { day: 9, current: false },
  { day: 10, current: false },
  { day: 11, current: false },
  { day: 12, current: false },
  { day: 13, current: false },
  { day: 14, current: false },
  { day: 15, current: false },
  { day: 16, current: false },
  { day: 17, current: false },
  { day: 18, current: false },
  { day: 19, current: false },
  { day: 20, current: false },
  { day: 21, current: false },
  { day: 22, current: false },
  { day: 23, current: true },
  { day: 24, current: false },
  { day: 25, current: false },
  { day: 26, current: false },
  { day: 27, current: false },
  { day: 28, current: false },
  { day: 29, current: false },
  { day: 30, current: false },
  { day: 31, current: false },
  { day: 1, current: false },
  { day: 2, current: false },
  { day: 3, current: false },
  { day: 4, current: false },
  { day: 5, current: false },
];

const events = [
  { id: "1", time: "AM", title: "Deep Work Session", desc: "Focused writing and structural analysis. No interruptions." },
  { id: "2", time: "14:00 PM", title: "First Principles Analysis", desc: "Reviewing core logic framework for project Alpha." },
  { id: "3", time: "16:30 PM", title: "Inbox Zero & Planning", desc: "Process communications and set priorities for tomorrow." },
];

const Calendar = () => {
  const { t } = useI18n();
  const [view, setView] = useState<"month" | "week">("month");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("calendar.month")}</h1>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <button
            onClick={() => setView("month")}
            className={`px-4 py-1.5 text-sm ${
              view === "month"
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t("calendar.month")}
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-4 py-1.5 text-sm ${
              view === "week"
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t("calendar.week")}
          </button>
        </div>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {weekDays.map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, idx) => (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center text-sm rounded-full mx-auto w-9 h-9 ${
                d.current
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {d.day}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("calendar.scheduledForToday")}</h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 pt-1">
                {event.time}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.desc}</p>
              </div>
              <button className="text-gray-400 mt-1">
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2">
          <FiPlus className="w-4 h-4" /> {t("calendar.scheduleNew")}
        </button>
      </Card>
    </div>
  );
};

export default Calendar;
