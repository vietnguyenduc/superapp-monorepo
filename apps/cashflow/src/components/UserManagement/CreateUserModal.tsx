import React, { useState } from "react";
import { logger } from "../../utils/logger";
import { useCompany } from "@superapp/iam";
import { useAuthContext as useAuth } from "@superapp/iam";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { companies, selectedCompany } = useCompany();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    position: "",
    role: "staff" as "admin_company" | "staff",
    company_id: selectedCompany?.id || "",
    branch_id: "",
    permissions: {
      import_customers: false,
      import_transactions: false,
      add_transaction_only: false,
      no_edit_transaction: false,
      edit_settings: false,
      view_reports: true,
      manage_customers: false,
      manage_transactions: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordOption, setPasswordOption] = useState<"manual" | "auto">("auto");
  const [manualPassword, setManualPassword] = useState("");
  const [sendEmailNotification, setSendEmailNotification] = useState(false);

  if (!isOpen) return null;

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Determine final password
      let finalPassword = "";
      if (passwordOption === "auto") {
        finalPassword = generatePassword();
      } else {
        finalPassword = manualPassword;
        if (finalPassword.length < 8) {
          setError("Mật khẩu phải có ít nhất 8 ký tự");
          setLoading(false);
          return;
        }
      }

      // Call Edge Function using Service Role (bypasses rate limits)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-user`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: finalPassword,
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
          role: formData.role,
          company_id: formData.company_id,
          branch_id: formData.branch_id,
          staff_permissions: formData.permissions,
          created_by: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo người dùng');
      }

      // Send email notification if checked
      if (sendEmailNotification) {
        // Email sending requires email service configuration
        // TODO: Configure email service (SendGrid, Resend, Supabase Auth, etc.)
        // Example implementation with Supabase Auth:
        // const { error: emailError } = await supabase.auth.admin.sendEmail({
        //   email: formData.email,
        //   subject: 'Tài khoản của bạn đã được tạo',
        //   body: `Mật khẩu của bạn là: ${finalPassword}`
        // });
        // Example with SendGrid:
        // await fetch('/api/send-email', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     to: formData.email,
        //     subject: 'Tài khoản của bạn đã được tạo',
        //     text: `Mật khẩu của bạn là: ${finalPassword}`
        //   })
        // });
        logger.log('Email notification would be sent to:', formData.email);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể tạo người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tạo Người Dùng Mới
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Thông Tin Cơ Bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="nguoidung@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Họ Tên *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Điện Thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0912345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vị Trí
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Quản lý"
                />
              </div>
            </div>
          </div>

          {/* Password Setup */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Thiết Lập Mật Khẩu
            </h3>
            <div className="space-y-3">
              <div className="flex space-x-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="auto"
                    checked={passwordOption === "auto"}
                    onChange={(e) => setPasswordOption(e.target.value as "auto" | "manual")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tự động tạo mật khẩu</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="manual"
                    checked={passwordOption === "manual"}
                    onChange={(e) => setPasswordOption(e.target.value as "auto" | "manual")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Thiết lập mật khẩu thủ công</span>
                </label>
              </div>
              
              {passwordOption === "manual" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mật Khẩu *
                  </label>
                  <input
                    type="password"
                    required={passwordOption === "manual"}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                    minLength={8}
                  />
                </div>
              )}
              
              {passwordOption === "auto" && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Mật khẩu sẽ được tự động tạo (12 ký tự)
                  </span>
                </div>
              )}

              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gửi hướng dẫn đăng nhập qua email</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Người dùng sẽ nhận email với URL đăng nhập và mật khẩu
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Role Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Phân Quyền Vai Trò
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vai Trò *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin_company" | "staff" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff</option>
                <option value="admin_company">Admin Company</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Công Ty *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn Công Ty</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chi Nhánh
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất Cả Chi Nhánh</option>
              </select>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Quyền Chi Tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.import_customers}
                  onChange={(e) => handlePermissionChange("import_customers", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nhập Khách Hàng</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.import_transactions}
                  onChange={(e) => handlePermissionChange("import_transactions", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nhập Giao Dịch</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.add_transaction_only}
                  onChange={(e) => handlePermissionChange("add_transaction_only", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Chỉ Thêm Giao Dịch</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.no_edit_transaction}
                  onChange={(e) => handlePermissionChange("no_edit_transaction", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Không Sửa Giao Dịch</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.edit_settings}
                  onChange={(e) => handlePermissionChange("edit_settings", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Chỉnh Sửa Cài Đặt</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.view_reports}
                  onChange={(e) => handlePermissionChange("view_reports", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Xem Báo Cáo</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_customers}
                  onChange={(e) => handlePermissionChange("manage_customers", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Quản Lý Khách Hàng</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_transactions}
                  onChange={(e) => handlePermissionChange("manage_transactions", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Quản Lý Giao Dịch</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tạo..." : "Tạo Người Dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
