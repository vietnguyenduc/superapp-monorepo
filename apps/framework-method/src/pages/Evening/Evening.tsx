import { useState } from "react";
import { FiThumbsUp, FiTarget, FiCalendar, FiPlus, FiPower } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

const goals = [
  { category: "Focus Work", target: 3, completed: 3 },
  { category: "Admin Tasks", target: 2, completed: 1 },
];

const tomorrowItems = [
  { id: "1", title: "Finalize Q3 Strategy Deck", note: "Deep work session (9:00 AM - 11:00 AM)", done: false },
  { id: "2", title: "Weekly Sync with Product Team", note: "Review sprint progress (2:00 PM)", done: false },
];

const Evening = () => {
  const { t } = useI18n();
  const [wentWell, setWentWell] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold">{t("evening.eveningReflection")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          Take a moment to review your day, celebrate the wins, and prepare for tomorrow.
        </p>
        <div className="flex justify-center mt-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiPower className="w-8 h-8" />
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiThumbsUp className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg">{t("evening.whatWentWell")}</h2>
        </div>
        <textarea
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          className="input h-28 resize-none"
          placeholder="Reflect on your achievements, moments of joy, or unexpected successes today..."
        />
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiTarget className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{t("evening.dailyGoals")}</h2>
            <p className="text-xs text-gray-500">Focus Work 3/3, Admin Tasks 1/2</p>
          </div>
        </div>
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.round((goal.completed / goal.target) * 100);
            return (
              <div key={goal.category}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{goal.category}</span>
                  <span className="text-gray-500">
                    {goal.completed}/{goal.target}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 bg-primary-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold">
            {t("evening.solidProgress")}
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
              <FiCalendar className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg">{t("evening.tomorrowFocus")}</h2>
          </div>
          <button className="w-8 h-8 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          {tomorrowItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600" />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">Notes for Tomorrow</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input h-20 resize-none"
          placeholder="Add any additional context, reminders, or preparation notes for tomorrow's tasks..."
        />
      </Card>

      <Button variant="dark" size="lg" className="w-full">
        <FiPower className="w-5 h-5 mr-2" />
        {t("evening.closeDay")}
      </Button>
    </div>
  );
};

export default Evening;
