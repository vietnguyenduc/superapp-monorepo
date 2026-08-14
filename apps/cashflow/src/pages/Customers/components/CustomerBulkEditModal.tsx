import React, { useState } from "react";
import Button from "../../../components/UI/Button";

type EditMode = "findReplace" | "prefix" | "suffix";

interface CustomerBulkEditModalProps {
  isOpen: boolean;
  totalCustomers: number;
  onClose: () => void;
  onApply: (config: {
    mode: EditMode;
    find: string;
    replace: string;
    prefix: string;
    suffix: string;
    caseSensitive: boolean;
  }) => void;
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\\\]/g, "\\$&");

const CustomerBulkEditModal: React.FC<CustomerBulkEditModalProps> = ({
  isOpen,
  totalCustomers,
  onClose,
  onApply,
}) => {
  const [mode, setMode] = useState<EditMode>("findReplace");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    setError(null);
    if (mode === "findReplace" && !find.trim()) {
      setError("Vui lòng nhập từ cần tìm");
      return;
    }
    setIsSubmitting(true);
    onApply({ mode, find, replace, prefix, suffix, caseSensitive });
  };

  const previewName = (name: string) => {
    if (mode === "findReplace") {
      if (!find) return name;
      const regex = new RegExp(escapeRegex(find), caseSensitive ? "g" : "gi");
      return name.replace(regex, () => replace);
    }
    if (mode === "prefix") return prefix + name;
    return name + suffix;
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto pointer-events-none">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 pointer-events-none">
        <div
          className="fixed inset-0 bg-gray-700/70 dark:bg-gray-900/80 transition-opacity pointer-events-auto"
          onClick={onClose}
        />
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-full sm:max-w-md sm:w-full mx-4 sm:mx-0 pointer-events-auto">
          <div className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chỉnh tên khách hàng hàng loạt</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Áp dụng cho {totalCustomers} khách hàng đang được lọc
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex rounded-md bg-gray-100 dark:bg-gray-800 p-1">
                {([
                  { key: "findReplace", label: "Tìm & Thay thế" },
                  { key: "prefix", label: "Thêm tiền tố" },
                  { key: "suffix", label: "Thêm hậu tố" },
                ] as { key: EditMode; label: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMode(opt.key)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded ${
                      mode === opt.key
                        ? "bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {mode === "findReplace" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tìm kiếm</label>
                    <input
                      type="text"
                      value={find}
                      onChange={(e) => setFind(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Ví dụ: Công ty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thay thế bằng</label>
                    <input
                      type="text"
                      value={replace}
                      onChange={(e) => setReplace(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Ví dụ: CTY"
                    />
                  </div>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <span className="ml-2">Phân biệt hoa thường</span>
                  </label>
                </>
              )}

              {mode === "prefix" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiền tố</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Ví dụ: [VIP] "
                  />
                </div>
              )}

              {mode === "suffix" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hậu tố</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Ví dụ: - HCM"
                  />
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-md p-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xem trước:</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">"Công ty An Phát"</p>
                <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">"{previewName("Công ty An Phát")}"</p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" size="md" onClick={handleApply} disabled={isSubmitting || totalCustomers === 0}>
                {isSubmitting ? "Đang áp dụng..." : "Áp dụng"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBulkEditModal;
