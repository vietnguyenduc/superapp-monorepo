import { FiCheckCircle } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

const history = [
  { id: "1", title: "The First Principles Method", date: "Oct 23, 2026", status: "completed" },
  { id: "2", title: "Deep Work Session", date: "Oct 22, 2026", status: "completed" },
  { id: "3", title: "Time Blocking", date: "Oct 20, 2026", status: "completed" },
];

const History = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("history.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <Card key={item.id} className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.date} completed</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
