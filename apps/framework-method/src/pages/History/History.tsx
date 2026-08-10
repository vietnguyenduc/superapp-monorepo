import { FiCheckCircle, FiCircle, FiCalendar, FiTarget, FiActivity } from "react-icons/fi";
import { Card } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useSession } from "../../contexts/SessionContext";
import { DEFAULT_BLOCKS } from "../../services/frameworkMethodService";

const History = () => {
  const { t, language } = useI18n();
  const { tasks, applyPlans, tracks, blocks } = useSession();

  const blockMap = DEFAULT_BLOCKS.reduce((acc, b) => {
    acc[b.id] = language === "en" ? b.name_en : b.name_vi;
    return acc;
  }, {} as Record<string, string>);

  const taskList = tasks.map((task) => {
    const plan = applyPlans[task.id];
    const track = tracks[task.id];
    return { ...task, plan, track };
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("history.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => {
          const blockTasks = taskList.filter((t) => t.block_id === block.id);
          if (blockTasks.length === 0) return null;
          return (
            <Card key={block.id} className="p-4">
              <h2 className="font-semibold mb-3">{blockMap[block.id] || block.name_vi}</h2>
              <div className="space-y-3">
                {blockTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.status === "done" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                      {task.status === "done" ? <FiCheckCircle className="w-4 h-4" /> : <FiCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                          <FiCalendar className="w-3 h-3" />
                          {task.date}
                        </span>
                        {task.plan && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <FiTarget className="w-3 h-3" />
                            {t("history.hasPlan")}
                          </span>
                        )}
                        {task.track && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <FiActivity className="w-3 h-3" />
                            {t("history.hasTrack")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {taskList.length === 0 && (
          <p className="text-sm text-gray-500">{t("history.empty")}</p>
        )}
      </div>
    </div>
  );
};

export default History;
