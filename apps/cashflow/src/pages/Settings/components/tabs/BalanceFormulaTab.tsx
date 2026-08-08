import type { FC } from "react";
import { useMemo, useState } from "react";
import { useSettingsContext } from "../../SettingsContext";
import { transactionTypeService } from "../../../../services/transactionTypeService";
import { getCustomerBalanceDelta } from "../../../../services/businessLogic/balanceMath";
import { formatCurrency } from "../../../../utils/formatting";
import { parseAmount, normalizeTransactionType } from "../../../../services/businessLogic/parsers";
import { toast } from "../../../../utils/toast";

const CANONICAL_LABELS: Record<string, string> = {
  payment: "Phát sinh giảm",
  charge: "Phát sinh tăng",
  adjustment: "Điều chỉnh",
  refund: "Hoàn tiền",
  deposit: "Đặt cọc",
};

export const BalanceFormulaTab: FC = () => {
  const { transactionTypes, setTransactionTypes, companyId } = useSettingsContext();

  const [previewOpening, setPreviewOpening] = useState<string>("0");
  const [previewAmount, setPreviewAmount] = useState<string>("1000000");
  const [previewTypeId, setPreviewTypeId] = useState<string>("");

  type TxType = typeof transactionTypes[0];

  const formulaRows = useMemo(() => {
    const map = new Map<string, { canonical: string; label: string; factor: number; types: TxType[] }>();
    transactionTypes
      .filter((t) => t.isActive)
      .forEach((type) => {
        const canonical = normalizeTransactionType(type.name || type.id);
        const label = CANONICAL_LABELS[canonical] || type.name;
        const existing = map.get(canonical);
        if (!existing) {
          map.set(canonical, { canonical, label, factor: type.math_factor ?? 1, types: [type as TxType] });
        } else {
          existing.types.push(type as TxType);
        }
      });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [transactionTypes]);

  const selectedType = useMemo(
    () => transactionTypes.find((t) => t.id === previewTypeId) || transactionTypes[0],
    [transactionTypes, previewTypeId],
  );

  const previewFactor = selectedType?.math_factor ?? 1;
  const openingValue = parseAmount(previewOpening);
  const amountValue = parseAmount(previewAmount);
  const delta = getCustomerBalanceDelta(selectedType?.id || "", amountValue, previewFactor);
  const newBalance = openingValue + delta;

  const handleToggleFactor = async (row: typeof formulaRows[0]) => {
    const firstType = row.types[0];
    if (!firstType) return;
    const newFactor = firstType.math_factor === 1 ? -1 : 1;
    const newImpact = newFactor === 1 ? "increase" : "decrease";

    for (const type of row.types) {
      const payload = {
        id: type.id,
        name: type.name,
        color: type.color || "blue",
        math_factor: newFactor,
        impact_type: newImpact,
        is_active: type.isActive,
        company_id: companyId,
      };

      const { error } = await transactionTypeService.upsertTransactionType(payload);
      if (error) {
        toast.error(String(error.message || error));
        return;
      }
    }

    setTransactionTypes((prev) =>
      prev.map((t) =>
        row.types.some((rt) => rt.id === t.id) ? { ...t, math_factor: newFactor, impact_type: newImpact } : t
      ),
    );
    toast.success(`Đã cập nhật hệ số cho "${row.label}"`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Công thức dư nợ</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Dư nợ = Đầu kỳ + Σ(Số tiền × Hệ số)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Hệ số +1: giao dịch làm tăng dư nợ. Hệ số -1: giao dịch làm giảm dư nợ.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loại giao dịch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ảnh hưởng dư nợ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hệ số</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {formulaRows.map((row) => (
              <tr key={row.canonical}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.label}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {row.factor === 1 ? "Tăng dư nợ" : row.factor === -1 ? "Giảm dư nợ" : "Không đổi"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {row.factor}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleFactor(row)}
                    className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/60 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    Đổi thành {row.factor === 1 ? "Giảm dư nợ (-1)" : "Tăng dư nợ (+1)"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Xem trước kết quả</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đầu kỳ</label>
            <input
              type="number"
              value={previewOpening}
              onChange={(e) => setPreviewOpening(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền</label>
            <input
              type="number"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại giao dịch</label>
            <select
              value={previewTypeId}
              onChange={(e) => setPreviewTypeId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
            >
              {formulaRows.map((row) => (
                <option key={row.canonical} value={row.types[0]?.id || row.canonical}>{row.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Hệ số: <span className="font-mono font-semibold">{previewFactor}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Biến động: <span className={`font-semibold ${delta > 0 ? "text-red-600" : delta < 0 ? "text-green-600" : "text-gray-600"}`}>{delta > 0 ? "+" : ""}{formatCurrency(delta)}</span>
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            Dư nợ mới: <span className="font-bold">{formatCurrency(newBalance)}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {previewFactor === 1
              ? "Số tiền được cộng vào dư nợ."
              : "Số tiền được trừ khỏi dư nợ."}
          </p>
        </div>
      </div>
    </div>
  );
};
