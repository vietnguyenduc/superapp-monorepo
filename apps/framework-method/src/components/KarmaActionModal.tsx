import { useEffect, useMemo, useState } from "react";
import { FiX, FiImage } from "react-icons/fi";
import { Button, Input, Card } from "./UI";
import { useSession } from "../contexts/SessionContext";
import { genId } from "../services/frameworkMethodService";
import type { KarmaEvent, KarmaTemplateRow } from "../types";

interface KarmaActionModalProps {
  event: KarmaEvent;
  onClose: () => void;
  initialAction?: "recognize" | "stop" | "resolve" | "recite";
}

type KarmaModalAction = "recognize" | "stop" | "resolve" | "recite";

const ACTION_LABELS: Record<KarmaModalAction, string> = {
  recognize: "Nhận ra",
  stop: "Dừng nghiệp",
  resolve: "Giải cảnh",
  recite: "Đọc Sám",
};

const ACTION_TITLES: Record<KarmaModalAction, string> = {
  recognize: "Nhận ra cảnh",
  stop: "Dừng nghiệp trước",
  resolve: "Giải cảnh",
  recite: "Đọc Sám / Trả nghiệp",
};

const KarmaActionModal = ({ event, onClose, initialAction = "stop" }: KarmaActionModalProps) => {
  const { performKarmaAction, karmaTemplate, updateKarmaTemplate } = useSession();

  const [action, setAction] = useState<KarmaModalAction>(initialAction);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState(event.note || "");
  const [imageUrl, setImageUrl] = useState(event.image_url || "");
  const [rows, setRows] = useState<KarmaTemplateRow[]>(karmaTemplate?.rows || []);

  useEffect(() => {
    setRows(karmaTemplate?.rows || []);
  }, [karmaTemplate]);

  const remaining = useMemo(() => Math.max(0, event.reserved_amount - (event.prepaid || 0)), [event]);

  useEffect(() => {
    if (action === "resolve") setAmount(String(remaining));
    else if (action === "stop" || action === "recite") setAmount("");
  }, [action, remaining]);

  const handleRowChange = (index: number, field: keyof KarmaTemplateRow, value: string | number) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  const handleAddRow = () => {
    setRows([...rows, { id: genId(), target: "", amount: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const selectedRows = rows.filter((r) => r.target.trim() && r.amount > 0);
    await updateKarmaTemplate(selectedRows);
    await performKarmaAction({
      eventId: event.id,
      action,
      amount: action === "recognize" ? 0 : Number(amount) || 0,
      note,
      imageUrl,
      khuonRows: selectedRows,
    });
    onClose();
  };

  const title = ACTION_TITLES[action];

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {event.period === "monthly" ? "Trổ canh tháng" : "Trổ canh quý"} · Hạn {event.due_date}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(ACTION_LABELS) as KarmaModalAction[]).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`py-2 rounded-2xl text-xs sm:text-sm font-medium border truncate ${
                action === a
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                  : "border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300"
              }`}
            >
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>

        {action !== "recognize" && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số điểm (Nghiệp báo)"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={action === "resolve" ? String(remaining) : "Nhập số điểm"}
              disabled={action === "resolve"}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Còn phải trả</label>
              <div className="input flex items-center text-sm font-semibold">{remaining} điểm</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Ghi chú đã làm gì</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="input w-full resize-none"
            placeholder="Viết rõ hành động, thời gian, địa điểm..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <FiImage className="w-4 h-4" /> Ảnh minh chứng (URL)
          </label>
          <Input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Khuôn dừng nghiệp / trả nợ</label>
            <button onClick={handleAddRow} className="text-sm text-primary-600 font-medium">+ Thêm đối tượng</button>
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={row.target}
                  onChange={(e) => handleRowChange(i, "target", e.target.value)}
                  placeholder="Đối tượng"
                  className="input flex-1 text-sm"
                />
                <input
                  type="number"
                  value={row.amount || ""}
                  onChange={(e) => handleRowChange(i, "amount", Number(e.target.value) || 0)}
                  placeholder="Số tiền"
                  className="input w-28 text-sm"
                />
                <button onClick={() => handleRemoveRow(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-2xl">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={action !== "recognize" && (Number(amount) || 0) <= 0}>Xác nhận</Button>
        </div>
      </Card>
    </div>
  );
};

export default KarmaActionModal;
