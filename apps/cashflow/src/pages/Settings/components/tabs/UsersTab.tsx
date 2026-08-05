import type { FC } from "react";
import { useSettingsContext } from "../../SettingsContext";
import Button from "../../../../components/UI/Button";
import ToggleSwitch from "../../../../components/UI/ToggleSwitch";
import CreateUserModal from "../../../../components/UserManagement/CreateUserModal";

export const UsersTab: FC = () => {
  const {
    user,
    setError,
    setIsCreateUserModalOpen,
    loadingStaff,
    staffUsers,
    handleOpenEditUser,
    setExpandedPermissions,
    expandedPermissions,
    handleUpdateStaffPermission,
    handlePromoteToAdminMaster,
    isCreateUserModalOpen,
    loadStaffUsers,
    isEditUserModalOpen,
    userEditForm,
    setUserEditForm,
    setIsEditUserModalOpen,
    setEditingUser,
    handleSaveUserDetails
  } = useSettingsContext();
  return (
    <>
      {(user?.role === "admin" || user?.role === "admin_master" || user?.role === "admin_company") && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs md:text-sm">
                        <span className="font-bold">✨ Hợp nhất Phân quyền Trung tâm</span>. Để đảm bảo tính đồng bộ bảo mật, hệ thống khuyến nghị bạn quản lý vai trò tài khoản và phân quyền ứng dụng tập trung tại **Admin Portal**.
                      </div>
                      <a 
                        href={`${import.meta.env.VITE_ADMIN_PORTAL_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5173' : 'https://admin.appforyou.xyz')}/identity`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-md shadow-indigo-500/10"
                      >
                        Mở Admin Portal ↗
                      </a>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          Tài khoản & phân quyền
                        </h2>
                        {user?.role === 'admin_company' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            👁️ Chế độ xem - Bạn không thể chỉnh sửa thông tin
                          </p>
                        )}
                      </div>
                      {(user?.role === "admin" || user?.role === "admin_master") && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setError(null);
                            setIsCreateUserModalOpen(true);
                          }}
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Tạo tài khoản mới
                        </Button>
                      )}
                    </div>

                    {loadingStaff ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
                      </div>
                    ) : staffUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Không có nhân viên nào</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {staffUsers.map((staff) => (
                          <div key={staff.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* User info header */}
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {staff.full_name || staff.email}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {staff.email}
                                        </p>
                                      </div>
                                      {user?.role === 'admin_master' && (
                                        <button
                                          onClick={() => handleOpenEditUser(staff)}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
                                          title="Chỉnh sửa thông tin"
                                        >
                                          ✏️ Sửa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* User details */}
                                <div className="grid grid-cols-2 gap-2 text-xs ml-13">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">Vai trò:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {staff.role === 'staff' ? 'Nhân viên' : staff.role === 'admin_company' ? 'Quản trị công ty' : staff.role}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">Công ty:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {staff.companies?.name || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">Tạo lúc:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(staff.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">Cập nhật:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString('vi-VN') + ' ' + new Date(staff.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                        
                              <div className="flex flex-col gap-4">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Quyền hạn:
                                </div>
                          
                                {/* Customers Section */}
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                  <button
                                    onClick={() => setExpandedPermissions(prev => ({ ...prev, customers: !prev.customers }))}
                                    className="flex items-center justify-between w-full text-left"
                                  >
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">👥 Khách hàng</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.customers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {expandedPermissions.customers && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Nhập khách hàng (chỉ sửa của mình)
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.customers?.import_own)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "customers.import_own", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Quản lý khách hàng (sửa/xóa tất cả)
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.customers?.manage_all)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "customers.manage_all", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Transactions Section */}
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                  <button
                                    onClick={() => setExpandedPermissions(prev => ({ ...prev, transactions: !prev.transactions }))}
                                    className="flex items-center justify-between w-full text-left"
                                  >
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">💰 Giao dịch</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.transactions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {expandedPermissions.transactions && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Nhập giao dịch (chỉ sửa của mình)
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.transactions?.import_own)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "transactions.import_own", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Quản lý giao dịch (sửa/xóa tất cả)
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.transactions?.manage_all)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "transactions.manage_all", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Settings Section */}
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                  <button
                                    onClick={() => setExpandedPermissions(prev => ({ ...prev, settings: !prev.settings }))}
                                    className="flex items-center justify-between w-full text-left"
                                  >
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">⚙️ Cài đặt</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.settings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {expandedPermissions.settings && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Chỉnh sửa cài đặt chung
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.edit_general)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.edit_general", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Văn phòng
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.branches)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.branches", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Tài khoản ngân hàng
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.bank_accounts)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.bank_accounts", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Loại giao dịch
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.transaction_types)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.transaction_types", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Trường khách hàng
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.customer_fields)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.customer_fields", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Màu sắc
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.color_settings)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.color_settings", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Báo cáo
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.settings?.reports)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.reports", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Reports Section */}
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                  <button
                                    onClick={() => setExpandedPermissions(prev => ({ ...prev, reports: !prev.reports }))}
                                    className="flex items-center justify-between w-full text-left"
                                  >
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">📊 Báo cáo</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.reports ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {expandedPermissions.reports && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-700 dark:text-gray-300">
                                          Xem báo cáo
                                        </label>
                                        <ToggleSwitch
                                          checked={Boolean(staff.staff_permissions?.reports?.view)}
                                          onChange={(checked) => handleUpdateStaffPermission(staff.id, "reports.view", checked)}
                                          size="sm"
                                          disabled={user?.role === 'admin_company'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Delete permission (separate) */}
                                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-3">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Xóa dữ liệu
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.can_delete)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "can_delete", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                          
                                {user?.role === 'admin_master' && staff.role !== 'admin_master' && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                      onClick={() => handlePromoteToAdminMaster(staff.id, staff.email || staff.full_name || '')}
                                    >
                                      👑 Promote lên Admin Master
                                    </Button>
                                  </div>
                                )}
                          
                                {staff.role === 'admin_master' && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                      👑 Admin Master - Có quyền truy cập toàn bộ hệ thống
                                    </div>
                                  </div>
                                )}
                          
                                <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  * Mật khẩu được quản lý bởi Supabase Auth và không thể hiển thị. Để đặt lại mật khẩu, hãy sử dụng chức năng quên mật khẩu.
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
      {user?.role !== "admin" && user?.role !== "admin_master" && (
                  <div className="p-4 sm:p-6">
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chỉ admin mới có thể quản lý quyền nhân viên
                      </p>
                    </div>
                  </div>
                )}
      {isCreateUserModalOpen && (
                  <CreateUserModal
                    isOpen={isCreateUserModalOpen}
                    onClose={() => setIsCreateUserModalOpen(false)}
                    onSuccess={() => {
                      setIsCreateUserModalOpen(false);
                      loadStaffUsers();
                    }}
                  />
                )}
      {isEditUserModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Chỉnh sửa thông tin người dùng
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Họ tên
                          </label>
                          <input
                            type="text"
                            value={userEditForm.full_name}
                            onChange={(e) => setUserEditForm({ ...userEditForm, full_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Công ty
                          </label>
                          <input
                            type="text"
                            value={userEditForm.company_name}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            title="Tên công ty được gán từ hệ thống"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Chức vụ
                          </label>
                          <input
                            type="text"
                            value={userEditForm.position}
                            onChange={(e) => setUserEditForm({ ...userEditForm, position: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setIsEditUserModalOpen(false);
                            setEditingUser(null);
                            setUserEditForm({ full_name: "", position: "", company_name: "" });
                          }}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveUserDetails}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                )}
    </>
  );
};
