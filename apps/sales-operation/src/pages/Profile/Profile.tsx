import React, { useState, useEffect } from "react";
import { useAuthContext } from "@superapp/iam";
import { supabase } from "../../lib/supabase";

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    position: user?.position || "",
    company_name: user?.company?.name || "",
  });

  // Update formData when user object changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        position: user.position || "",
        company_name: user.company?.name || "",
      });
      setAvatarPreview(user.avatar_url || null);
      setLogoPreview(user.company?.logo_url || null);
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.company?.logo_url || null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const isAdmin = user?.role === "admin_master" || user?.role === "admin_company" || user?.role === "admin_branch";

  const canEditField = (fieldName: string) => {
    if (isAdmin) return true;
    // Staff users can only edit phone and avatar
    return fieldName === "phone";
  };

  const handleSave = async () => {
    setSaveStatus("saving");

    // Upload avatar if file selected
    let avatarUrl = user?.avatar_url || null;
    if (avatarFile) {
      const fileName = `avatar-${user?.id}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicUrl.publicUrl;
      }
    }

    // Upload company logo if admin and file selected
    let logoUrl = user?.company?.logo_url || null;

    if (logoFile && isAdmin) {
      const fileName = `logo-${user?.company_id}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, logoFile);

      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from("company-logos").getPublicUrl(fileName);
        logoUrl = publicUrl.publicUrl;

        // Update company logo in database
        if (user?.company_id) {
          await supabase.from("companies").update({ logo_url: logoUrl }).eq("id", user.company_id);
        }
      }
    }

    const { error } = await updateProfile({
      ...(isAdmin ? formData : { phone: formData.phone }),
      avatar_url: avatarUrl || undefined,
    });

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
      company_name: user?.company?.name || "",
    });
    setAvatarFile(null);
    setLogoFile(null);
    setAvatarPreview(user?.avatar_url || null);
    setLogoPreview(user?.company?.logo_url || null);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus("error");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus("error");
      return;
    }

    setPasswordStatus("saving");
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) {
      setPasswordStatus("error");
    } else {
      setPasswordStatus("success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
      setTimeout(() => setPasswordStatus("idle"), 3000);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, { vi: string; en: string }> = {
      admin_master: { vi: "Quản trị hệ thống", en: "System Admin" },
      admin_company: { vi: "Quản trị công ty", en: "Company Admin" },
      admin_branch: { vi: "Quản trị chi nhánh", en: "Branch Admin" },
      staff: { vi: "Nhân viên", en: "Staff" },
    };
    const labels = roleLabels[role] || { vi: role, en: role };
    return labels.vi;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ người dùng</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Profile Card with Avatar */}
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full cursor-pointer shadow-lg transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.full_name || "Chưa đặt tên"}</h2>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Họ và tên</label>
              <input
                type="text"
                value={isEditing && canEditField("full_name") ? formData.full_name : (user?.full_name || "")}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing || !canEditField("full_name")}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditing && canEditField("full_name")
                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                }`}
              />
              {!canEditField("full_name") && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Chỉ quản trị viên có thể chỉnh sửa</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số điện thoại</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí</label>
              <input
                type="text"
                value={isEditing && canEditField("position") ? formData.position : (user?.position || "")}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                disabled={!isEditing || !canEditField("position")}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditing && canEditField("position")
                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                }`}
              />
              {!canEditField("position") && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Chỉ quản trị viên có thể chỉnh sửa</p>
              )}
            </div>

            {/* Company Name & Logo - Admin only */}
            {(user?.role === "admin_master" || user?.role === "admin_company" || user?.role === "admin_branch") && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thông tin công ty</label>
                <div className="flex items-start gap-4">
                  {/* Logo on the left */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-1 text-center">No Logo</span>
                      </div>
                    )}
                    {isEditing && (
                      <label className="cursor-pointer block mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <span className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                          Tải lên logo
                        </span>
                      </label>
                    )}
                  </div>
                  {/* Company name on the right */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tên công ty</label>
                    <input
                      type="text"
                      value={isEditing && canEditField("company_name") ? formData.company_name : (user?.company?.name || "")}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      disabled={!isEditing || !canEditField("company_name")}
                      className={`w-full px-3 py-2 border rounded-lg overflow-hidden text-ellipsis ${
                        isEditing && canEditField("company_name")
                          ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Company & Branch Info */}
            {(user?.company || user?.branch) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thông tin tổ chức</h3>
                {user?.company && (
                  <div className="mb-3 overflow-hidden">
                    <span className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      Công ty: <span className="text-gray-900 dark:text-white font-medium break-words">{user.company.name}</span>
                    </span>
                  </div>
                )}
                {user?.branch && (
                  <div className="overflow-hidden">
                    <span className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      Chi nhánh: <span className="text-gray-900 dark:text-white font-medium break-words">{user.branch.name}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Change Password Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {isChangingPassword ? "Hủy đổi mật khẩu" : "Đổi mật khẩu"}
              </button>

              {isChangingPassword && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordStatus === "saving"}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {passwordStatus === "saving" ? "Đang lưu..." : "Cập nhật mật khẩu"}
                    </button>
                    {passwordStatus === "success" && (
                      <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã cập nhật mật khẩu
                      </div>
                    )}
                    {passwordStatus === "error" && (
                      <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Lỗi cập nhật mật khẩu
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveStatus === "saving" ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Chỉnh sửa
                </button>
              )}

              {saveStatus === "success" && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đã lưu thành công
                </div>
              )}

              {saveStatus === "error" && (
                <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Lưu thất bại
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
