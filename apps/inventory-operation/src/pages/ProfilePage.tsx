import { useState } from "react";
import { useAuthContext } from "@superapp/iam";

const ProfilePage: React.FC = () => {
  const { user, updateProfile, signOut, isTrial } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const result = await updateProfile({ full_name: fullName });
    setSaving(false);
    if (result.error) {
      setMessage("Lỗi: " + result.error);
    } else {
      setMessage("Cập nhật thành công!");
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  if (!user && !isTrial) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500">Vui lòng đăng nhập để xem hồ sơ.</p>
        </div>
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || "Người dùng";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">{user?.email || "Chế độ thử nghiệm"}</p>
            {isTrial && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                Dùng thử
              </span>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tài khoản</h2>

          {message && (
            <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.includes("Lỗi") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ tên"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFullName(user?.full_name || "");
                      setMessage("");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{user?.full_name || "Chưa cập nhật"}</span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sửa
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                {user?.role || "trial"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
              <p className="text-gray-900">{user?.company?.name || user?.company_id || "—"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <p className="text-gray-900">{user?.branch?.name || user?.branch_id || "—"}</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        {user?.staff_permissions && Object.keys(user.staff_permissions).length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quyền hạn nhân viên</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(user.staff_permissions).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <span className={`w-2 h-2 rounded-full ${val ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* App Permissions */}
        {user?.app_permissions && Object.keys(user.app_permissions).length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quyền ứng dụng</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(user.app_permissions).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <span className={`w-2 h-2 rounded-full ${val ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-700">{key}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSignOut}
            className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium border border-red-200"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
