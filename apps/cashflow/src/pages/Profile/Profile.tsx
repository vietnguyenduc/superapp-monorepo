import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../contexts/AuthContext";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    position: user?.position || "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSave = async () => {
    setSaveStatus("saving");
    const { error } = await updateProfile(formData);
    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("success");
      setIsEditing(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      position: user?.position || "",
    });
    setIsEditing(false);
  };

  const getRoleLabel = (role: string) => {
    const lang = t;
    const roleLabels: Record<string, { vi: string; en: string }> = {
      admin_master: { vi: "Quản trị hệ thống", en: "System Admin" },
      admin_company: { vi: "Quản trị công ty", en: "Company Admin" },
      staff: { vi: "Nhân viên", en: "Staff" },
    };
    const labels = roleLabels[role] || { vi: role, en: role };
    return lang === "vi" ? labels.vi : labels.en;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("profile.title", { defaultValue: "Hồ sơ người dùng" })}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("profile.subtitle", { defaultValue: "Quản lý thông tin tài khoản của bạn" })}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Profile Card */}
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.full_name || "Chưa đặt tên"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {getRoleLabel(user?.role || "staff")}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.email", { defaultValue: "Email" })}
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.fullName", { defaultValue: "Họ và tên" })}
              </label>
              <input
                type="text"
                value={isEditing ? formData.full_name : (user?.full_name || "")}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditing
                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.phone", { defaultValue: "Số điện thoại" })}
              </label>
              <input
                type="tel"
                value={isEditing ? formData.phone : (user?.phone || "")}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditing
                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("profile.position", { defaultValue: "Vị trí" })}
              </label>
              <input
                type="text"
                value={isEditing ? formData.position : (user?.position || "")}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditing
                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Company & Branch Info */}
            {(user?.company || user?.branch) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("profile.organization", { defaultValue: "Thông tin tổ chức" })}
                </h3>
                {user?.company && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("profile.company", { defaultValue: "Công ty" })}:{" "}
                      <span className="text-gray-900 dark:text-white font-medium">{user.company.name}</span>
                    </span>
                  </div>
                )}
                {user?.branch && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("profile.branch", { defaultValue: "Chi nhánh" })}:{" "}
                      <span className="text-gray-900 dark:text-white font-medium">{user.branch.name}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveStatus === "saving"
                      ? t("common.saving", { defaultValue: "Đang lưu..." })
                      : t("common.save", { defaultValue: "Lưu" })}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    {t("common.cancel", { defaultValue: "Hủy" })}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t("common.edit", { defaultValue: "Chỉnh sửa" })}
                </button>
              )}

              {saveStatus === "success" && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("profile.saveSuccess", { defaultValue: "Đã lưu thành công" })}
                </div>
              )}

              {saveStatus === "error" && (
                <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t("profile.saveError", { defaultValue: "Lưu thất bại" })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
