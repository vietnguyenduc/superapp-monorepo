import { FiSun, FiMoon, FiUser, FiBook } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";

const PRACTICE_AREAS = [
  { id: "meditation", label: "Thiền định", icon: "🧘" },
  { id: "reading", label: "Đọc sư thấu triệt", icon: "📖" },
  { id: "reflection", label: "Suy ngẫm hàng ngày", icon: "🪞" },
  { id: "action", label: "Hành thực luyện tập", icon: "⚡" },
];

const Practice = () => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

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
    </div>
  );
};

export default Practice;
