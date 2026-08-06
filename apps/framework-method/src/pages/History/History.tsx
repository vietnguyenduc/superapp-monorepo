import { FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import { format } from "date-fns";

const History = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { progress } = useFrameworkProgress();

  const sessions = [...progress.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("history.subtitle")}</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500">No completed sessions yet. Finish a framework or close the day to see history.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/history/${item.id}`)}
              className="w-full text-left"
            >
              <Card className="flex items-center gap-4 p-4 hover:border-primary-500 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {format(new Date(item.date), "MMM d, yyyy")} · completed
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
