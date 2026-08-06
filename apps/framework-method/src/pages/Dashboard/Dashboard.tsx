import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { FiPlay, FiTrendingUp, FiAnchor } from "react-icons/fi";
import {
  startOfDay,
  parseISO,
  subDays,
  eachDayOfInterval,
  isSameDay,
  format,
} from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress, getDailySteps } from "../../hooks/useFrameworkProgress";

const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress } = useFrameworkProgress();

  const today = startOfDay(new Date());
  const todayKey = format(today, "yyyy-MM-dd");
  const dailySteps = useMemo(() => getDailySteps(progress), [progress]);
  const totalSteps = dailySteps.length || 5;
  const activeProgress = Math.round((progress.completedSteps.length / totalSteps) * 100);

  const allTasks = progress.tasks || [];

  const completedTaskDates = useMemo(() => {
    return allTasks
      .filter((t) => t.status === "done")
      .map((t) => startOfDay(parseISO(t.date)))
      .filter((d) => !isNaN(d.getTime()));
  }, [allTasks]);

  const streak = useMemo(() => {
    if (!completedTaskDates.length) return 0;
    const sorted = [...completedTaskDates].sort((a, b) => b.getTime() - a.getTime());
    let last = sorted[0];
    let count = 0;
    while (completedTaskDates.some((d) => isSameDay(d, last))) {
      count++;
      last = subDays(last, 1);
    }
    return count;
  }, [completedTaskDates]);

  const weekDays = useMemo(() => {
    const start = subDays(today, 6);
    const days = eachDayOfInterval({ start, end: today });
    return days.map((d) => {
      const hasDoneTask = completedTaskDates.some((sd) => isSameDay(sd, d));
      return { label: format(d, "EEEEE"), done: hasDoneTask, today: isSameDay(d, today) };
    });
  }, [completedTaskDates, today]);

  const trendData = useMemo(() => {
    const start = subDays(today, 6);
    const days = eachDayOfInterval({ start, end: today });
    return days.map((d) => {
      const count = allTasks.filter((t) => t.status === "done" && isSameDay(startOfDay(parseISO(t.date)), d)).length;
      return { day: format(d, "EEEEE"), value: count };
    });
  }, [allTasks, today]);

  const todayStats = useMemo(() => {
    const tasks = allTasks.filter((t) => startOfDay(parseISO(t.date)).getTime() === today.getTime());
    return {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      open: tasks.filter((t) => t.status === "todo").length,
    };
  }, [allTasks, today]);

  const defaultFrameworks = [
    { id: "first-principles", name: "The First Principles Method", progress: activeProgress, tag: t("overview.activeFramework") },
    { id: "deep-work", name: "Deep Work", progress: 0, tag: "" },
    { id: "time-blocking", name: "Time Blocking", progress: 0, tag: "" },
  ];

  const frameworks = progress.templates.length
    ? progress.templates.map((t) => ({
        id: t.id,
        name: t.name,
        progress: t.id === progress.activeTemplateId ? activeProgress : 0,
        tag: t.id === progress.activeTemplateId ? t("overview.activeFramework") : "",
      }))
    : defaultFrameworks;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-left">
        <h1 className="text-2xl font-bold">{t("dashboard.goodMorning")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm italic border-l-2 border-gray-300 dark:border-gray-700 pl-3">
          &quot;Logic is the beginning of wisdom, not the end.&quot;
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiAnchor className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.streak", { count: streak })}</p>
          </div>
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                day.today
                  ? "bg-white dark:bg-gray-950 text-primary-600 border-2 border-primary-600"
                  : day.done
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}
            >
              {day.done && !day.today ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                day.label
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">{t("overview.todayTasks")}</h2>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{todayStats.total}</p>
            <p className="text-xs text-gray-500">{t("overview.taskSummary", { total: todayStats.total, done: todayStats.done, inProgress: todayStats.inProgress }).split("·")[0]}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{todayStats.done}</p>
            <p className="text-xs text-gray-500">{t("common.done")}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">{t("dashboard.insights")}</h2>
          <FiTrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Completed tasks (Last 7 Days)</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">{t("dashboard.frameworks")}</h2>
          <FiAnchor className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Most used this week</p>
        <div className="space-y-4">
          {frameworks.map((fw) => (
            <Link
              key={fw.id}
              to={`/overview?framework=${fw.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold text-lg">
                {fw.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fw.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{fw.tag || "—"}</span>
                  <span className="text-[10px] text-gray-400">{allTasks.filter((t) => t.group === fw.name && startOfDay(parseISO(t.date)).getTime() === today.getTime()).length} tasks today</span>
                </div>
                {fw.progress > 0 && (
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5">
                    <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${fw.progress}%` }} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg">Ready to focus?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Start a new deep work session.</p>
        <Button variant="dark" size="lg" className="w-full" onClick={() => navigate("/overview")}>
          <FiPlay className="w-5 h-5 mr-2" />
          {t("dashboard.beginSession")}
        </Button>
      </Card>
    </div>
  );
};

export default Dashboard;
