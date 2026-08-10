import { useState, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { Button, Card, Input } from "./UI";
import { useSession } from "../contexts/SessionContext";
import { MERIT_SIZE_POINTS } from "../types";
import type { DailyTask, MeritSize } from "../types";

interface MeritReflectionModalProps {
  task: DailyTask;
  onClose: () => void;
}

const MeritReflectionModal = ({ task, onClose }: MeritReflectionModalProps) => {
  const { updateTask } = useSession();
  const [outcome, setOutcome] = useState(task.reflection_outcome || "");
  const [mind, setMind] = useState(task.reflection_mind || "");
  const defaultPoints = useMemo(() => (task.merit_size ? MERIT_SIZE_POINTS[task.merit_size as MeritSize] : 1), [task.merit_size]);
  const [points, setPoints] = useState(String(task.merit_points ?? defaultPoints));

  const handleSubmit = async () => {
    const meritPoints = Math.max(0, Math.round(Number(points) || 0));
    await updateTask(task.id, {
      merit_reflected: true,
      merit_points: meritPoints,
      reflection_outcome: outcome.trim() || undefined,
      reflection_mind: mind.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Đo tâm & Đo Phúc</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {task.merit_type === "earn" ? "Tạo Phúc" : "Tiêu Phúc"} · {task.merit_size ? task.merit_size.replace("_", " ") : ""}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Mặc định {defaultPoints} điểm — có thể điều chỉnh sau khi nhìn lại.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Điểm Phúc ghi nhận"
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Loại</label>
            <div className="input flex items-center text-sm font-semibold">
              {task.merit_type === "earn" ? (
                <span className="text-emerald-600">+Phúc</span>
              ) : (
                <span className="text-red-600">-Phúc</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Thành quả / Kết quả đạt được</label>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={3}
            className="input w-full resize-none"
            placeholder="Tóm tắt lại việc đã làm, kết quả ra sao..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Tâm mình thế nào?</label>
          <textarea
            value={mind}
            onChange={(e) => setMind(e.target.value)}
            rows={3}
            className="input w-full resize-none"
            placeholder="Bình an, vui, lo âu, hối hận... ghi lại trạng thái tâm khi làm việc này."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button className="flex-1" onClick={handleSubmit}>Ghi nhận Phúc</Button>
        </div>
      </Card>
    </div>
  );
};

export default MeritReflectionModal;
