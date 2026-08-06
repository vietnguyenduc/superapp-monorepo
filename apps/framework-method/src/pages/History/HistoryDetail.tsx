import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";
import { format } from "date-fns";

const HistoryDetail = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { progress } = useFrameworkProgress();

  const session = useMemo(() => {
    const allSessions = [
      ...progress.sessions,
      ...Object.values(progress.taskRuns || {}).flatMap((r) => r.sessions),
    ];
    return allSessions.find((s) => s.id === sessionId);
  }, [progress, sessionId]);

  if (!session) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-10">
        <p className="text-gray-500">{t("history.notFound") || "Session not found."}</p>
        <Button variant="dark" onClick={() => navigate("/history")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const reflections = session.reflections || {};
  const entries = Object.entries(reflections).filter(([key]) => key !== "wentWell" && key !== "notes");
  const evening = { wentWell: reflections.wentWell || "", notes: reflections.notes || "" };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <button onClick={() => navigate("/history")} className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100">
        <FiArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <div>
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{format(new Date(session.date), "MMM d, yyyy h:mm a")}</p>
      </div>

      <Card>
        <h2 className="font-semibold text-lg mb-3">{t("history.detail")}</h2>
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-sm text-gray-500">{t("history.noReflection")}</p>}
          {entries.map(([label, value]) => (
            <div key={label} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-line">{String(value)}</p>
            </div>
          ))}
        </div>
      </Card>

      {(evening.wentWell || evening.notes) && (
        <Card>
          <h2 className="font-semibold text-lg mb-3">{t("evening.eveningReflection")}</h2>
          {evening.wentWell && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("evening.whatWentWell")}</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-line">{evening.wentWell}</p>
            </div>
          )}
          {evening.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("evening.notes") || "Notes"}</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-line">{evening.notes}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default HistoryDetail;
