import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";

const approvalOptions: { key: string; label: string; description: string }[] = [
  {
    key: "transactions",
    label: "Giao dịch",
    description: "Staff tạo giao dịch mới sẽ ở trạng thái Chờ duyệt thay vì Hoàn thành ngay.",
  },
  {
    key: "customers",
    label: "Khách hàng",
    description: "Khách hàng mới do staff tạo sẽ ở trạng thái Chờ duyệt.",
  },
  {
    key: "bank_accounts",
    label: "Tài khoản ngân hàng",
    description: "Tài khoản ngân hàng mới do staff tạo sẽ ở trạng thái Chờ duyệt.",
  },
  {
    key: "branches",
    label: "Văn phòng / Chi nhánh",
    description: "Văn phòng mới do staff tạo sẽ ở trạng thái Chờ duyệt.",
  },
];

export function ApprovalSettingsTab() {
  const s = useSettingsContext();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Phân quyền duyệt dữ liệu
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Bật = mọi tài khoản staff phải chờ admin duyệt. Tắt = staff được phép nhập thẳng (nếu có quyền).
        </p>
      </div>

      <div className="space-y-3">
        {approvalOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={Boolean((s.approvalSettings as any)?.[option.key])}
                onChange={(e) => s.handleApprovalSettingChange(option.key, e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tự động sinh mã khách hàng
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bật = mã khách hàng được tự động sinh khi tạo mới. Tắt = người dùng phải nhập mã thủ công.
          </p>
        </div>

        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">Tự động sinh mã</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mặc định: bật. Chỉ admin trở lên có thể thay đổi.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={Boolean(s.approvalSettings.auto_customer_code)}
              onChange={(e) => s.handleApprovalSettingChange("auto_customer_code", e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer-code-prefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiền tố
            </label>
            <input
              id="customer-code-prefix"
              type="text"
              value={s.approvalSettings.customer_code_prefix}
              onChange={(e) => s.handleCustomerCodePrefixChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 uppercase"
              maxLength={10}
              placeholder="VD: KH"
            />
          </div>
          <div>
            <label htmlFor="customer-code-digits" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số chữ số
            </label>
            <input
              id="customer-code-digits"
              type="number"
              min={1}
              max={12}
              value={s.approvalSettings.customer_code_digits}
              onChange={(e) => s.handleCustomerCodeDigitsChange(e.target.valueAsNumber)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">Tìm số trống nhỏ nhất</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bật = mã mới lấp chỗ trống (1, 2, 4 → 3). Tắt = luôn lấy số tiếp theo sau mã lớn nhất.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={Boolean(s.approvalSettings.customer_code_fill_gaps)}
              onChange={(e) => s.handleCustomerCodeFillGapsChange(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
          </label>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ví dụ mã tiếp theo: {""}
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {`${s.approvalSettings.customer_code_prefix}${String(1).padStart(s.approvalSettings.customer_code_digits, "0")}`}
          </span>
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={s.saveApprovalSettings} disabled={s.loading}>
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}
