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

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Tự động sinh mã khách hàng
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Bật = mã khách hàng được tự động sinh (KH0001, KH0002, ...) khi tạo mới. Tắt = người dùng phải nhập mã thủ công.
        </p>
        <div className="mt-4 flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
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
      </div>

      <div className="flex justify-end">
        <Button onClick={s.saveApprovalSettings} disabled={s.loading}>
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}
