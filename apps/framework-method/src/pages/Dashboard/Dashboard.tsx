import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlay, FiSun, FiMoon, FiUser, FiTrendingUp, FiAnchor, FiActivity, FiZap } from "react-icons/fi";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import { getSessionsByDateRange, todayStr } from "../../services/frameworkMethodService";
import type { Session } from "../../types";

const frameworks = [
  { id: "first-principles", name: "The First Principles Method", progress: 40, tag: "Strategy" },
  { id: "deep-work", name: "Deep Work", progress: 0, tag: "1 / 3h" },
  { id: "time-blocking", name: "Time Blocking", progress: 0, tag: "" },
];

const Dashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { merit, streak, userId } = useSession();

  const [history, setHistory] = useState<Session[]>([]);

  useEffect(() => {
    if (!userId) return;
    const end = todayStr();
    const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    getSessionsByDateRange(userId, start, end).then(setHistory);
  }, [userId]);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((s) => {
      map[s.date] = s.merit_total ?? 0;
    });
    const days: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("vi-VN", { weekday: "short" }).replace(".", "");
      days.push({ day: label, value: map[dateStr] ?? 0 });
    }
    return days;
  }, [history]);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between py-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
        >
          {theme === "dark" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold tracking-tight">{t("dashboard.goodMorning")}</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div className="text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t("dashboard.goodMorning")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm italic border-l-2 border-gray-300 pl-3">
          &quot;Logic is the beginning of wisdom, not the end.&quot;
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 mx-auto mb-2">
            <FiAnchor className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t("dashboard.streak", { count: streak?.current_streak ?? 0 })}</p>
          <p className="text-xl font-bold">{streak?.current_streak ?? 0}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mx-auto mb-2">
            <FiActivity className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phúc hôm nay</p>
          <p className={`text-xl font-bold ${merit.total >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {merit.total >= 0 ? `+${merit.total}` : merit.total}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 mx-auto mb-2">
            <FiZap className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng Phúc</p>
          <p className="text-xl font-bold text-violet-600">{history.reduce((sum, s) => sum + (s.merit_total ?? 0), 0)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg tracking-tight">{t("dashboard.productivityTrend")}</h2>
          <FiTrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Phúc nghiệp (7 ngày qua)</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMerit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMerit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg tracking-tight">{t("dashboard.frameworks")}</h2>
          <FiAnchor className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t("dashboard.mostUsed")}</p>
        <div className="space-y-4">
          {frameworks.map((fw) => (
            <Link key={fw.id} to="/session" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold text-lg">
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
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full mt-1.5">
                    <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${fw.progress}%` }} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg tracking-tight">Ready to focus?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Start a new deep work session.</p>
        <Button variant="dark" size="lg" className="w-full" onClick={() => navigate("/session")}>
          <FiPlay className="w-5 h-5 mr-2" />
          {t("dashboard.beginSession")}
        </Button>
      </Card>
    </div>
  );
};

export default Dashboard;
