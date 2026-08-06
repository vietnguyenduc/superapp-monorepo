import { Link, useNavigate } from "react-router-dom";
import { FiPlay, FiSun, FiMoon, FiUser, FiTrendingUp, FiAnchor } from "react-icons/fi";
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
import { useTheme } from "../../contexts/ThemeContext";

const trendData = [
  { day: "M", value: 45 },
  { day: "T", value: 62 },
  { day: "W", value: 58 },
  { day: "T", value: 75 },
  { day: "F", value: 70 },
  { day: "S", value: 85 },
  { day: "S", value: 78 },
];

const frameworks = [
  { id: "first-principles", name: "The First Principles Method", progress: 40, tag: "Strategy" },
  { id: "deep-work", name: "Deep Work", progress: 0, tag: "1 / 3h" },
  { id: "time-blocking", name: "Time Blocking", progress: 0, tag: "" },
];

const weekDays = [
  { label: "T", done: true },
  { label: "W", done: true },
  { label: "T", done: true },
  { label: "F", done: true },
  { label: "S", done: true },
  { label: "S", done: true },
  { label: "M", done: false, today: true },
];

const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between py-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200"
        >
          {theme === "dark" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold">Monday, Oct 23</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div className="text-left">
        <h1 className="text-2xl font-bold">{t("dashboard.goodMorning")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm italic border-l-2 border-gray-300 pl-3">
          &quot;Logic is the beginning of wisdom, not the end.&quot;
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiAnchor className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.streak", { count: 12 })}</p>
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">{t("dashboard.insights")}</h2>
          <FiTrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Productivity Trend (Last 7 Days)</p>
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
                {fw.tag && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{fw.tag}</span>
                    <span className="text-[10px] text-gray-400">{fw.progress > 0 ? `${fw.progress}%` : ""}</span>
                  </div>
                )}
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
