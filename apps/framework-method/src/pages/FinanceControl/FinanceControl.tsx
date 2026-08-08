import { FiDollarSign, FiSun, FiMoon, FiUser } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";

const FINANCE_CATEGORIES = [
  { id: "income", label: "Thu nhập", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600" },
  { id: "fixed", label: "Chi tiêu cố định", bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600" },
  { id: "variable", label: "Chi tiêu linh hoạt", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
  { id: "savings", label: "Tiết kiệm / Đầu tư", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600" },
  { id: "debt", label: "Nợ / Vay", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600" },
];

const FinanceControl = () => {
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
        <h2 className="text-lg font-semibold tracking-tight">{t("financeControl.title")}</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t("financeControl.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("financeControl.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tổng thu</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">+0 đ</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tổng chi</p>
          <p className="text-xl font-bold text-red-600 mt-1">-0 đ</p>
        </Card>
      </div>

      <div className="space-y-4">
        {FINANCE_CATEGORIES.map((cat) => (
          <Card key={cat.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center`}>
                <FiDollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight">{cat.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chưa có dữ liệu</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FinanceControl;
