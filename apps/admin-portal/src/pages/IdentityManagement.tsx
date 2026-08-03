import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Loader2, Pencil } from 'lucide-react';
import { apiClient } from "../lib/supabase";
import { useAdminContext } from '../contexts/AdminContext';
import { APP_PERMISSIONS } from '../lib/permissions';
import PermissionEditor, { type UserClaim } from '../components/PermissionEditor';

export default function IdentityManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserClaim | null>(null);
  const { selectedCompanyId, companies } = useAdminContext();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await apiClient.rpc('admin_get_all_users', {
      p_company_id: selectedCompanyId
    });
    if (error) {
      console.error('Failed to fetch users:', error);
      alert('Error fetching users. Are you sure you are a Master Admin?');
    } else {
      setUsers((data || []).map((u: UserClaim) => ({
        ...u,
        app_permissions: u.app_permissions || {},
        staff_permissions: u.staff_permissions || {},
      })));
    }
    setLoading(false);
  };

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUsers();
  }, [selectedCompanyId]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const handleSave = async (editingUser: UserClaim) => {
    setUpdatingId(editingUser.id);
    // Args must match the Postgres function's positional parameter order:
    // target_user_id, new_role, new_app_permissions, new_company_id, new_staff_permissions
    const args: Record<string, unknown> = {};
    args.target_user_id = editingUser.id;
    args.new_role = editingUser.role;
    args.new_app_permissions = editingUser.app_permissions;
    args.new_company_id = editingUser.company_id;
    args.new_staff_permissions = editingUser.staff_permissions || {};
    const { error } = await apiClient.rpc('admin_update_user_claims', args);

    if (error) {
      console.error('Failed to update claims:', error);
      alert('Error updating claims: ' + error.message);
    } else {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    }
    setUpdatingId(null);
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to force logout this user from all devices?')) return;
    setUpdatingId(userId);

    const { error } = await apiClient.functions.invoke('admin-revoke-user', {
      body: { target_user_id: userId }
    });

    if (error) {
      console.error('Revoke failed:', error);
      alert('Failed to revoke sessions: ' + error.message);
    } else {
      alert('User sessions revoked successfully.');
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyName = (companyId: string | null | undefined) => {
    if (!companyId) return '—';
    return companies.find(c => c.id === companyId)?.name || companyId;
  };

  const activeApps = (user: UserClaim) =>
    APP_PERMISSIONS.filter(app => user.app_permissions?.[app.id]).map(app => app.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Matrix</h3>
          <p className="text-sm text-gray-500 mt-1">Manage cross-app access, roles and granular feature permissions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium">
            Refresh
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[300px] hidden lg:block">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Company</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Apps</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              {filteredUsers.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${updatingId === user.id ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">
                    {getCompanyName(user.company_id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {activeApps(user).length === 0 && (
                        <span className="text-sm text-gray-400">No apps</span>
                      )}
                      {activeApps(user).map(name => (
                        <span
                          key={name}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        disabled={updatingId === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Permissions
                      </button>
                      <button
                        onClick={() => handleRevoke(user.id)}
                        disabled={updatingId === user.id}
                        className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Revoke All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No users found.
          </div>
        )}
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-opacity ${updatingId === user.id ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900">{user.full_name || 'No Name'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {user.role}
              </span>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              <span className="text-gray-400">Company:</span>{' '}
              {getCompanyName(user.company_id)}
            </div>

            <div className="mt-3">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Apps</div>
              <div className="flex flex-wrap gap-1.5">
                {activeApps(user).length === 0 && (
                  <span className="text-sm text-gray-400">No apps</span>
                )}
                {activeApps(user).map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setEditingUser(user)}
                disabled={updatingId === user.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Permissions
              </button>
              <button
                onClick={() => handleRevoke(user.id)}
                disabled={updatingId === user.id}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <PermissionEditor
          user={editingUser}
          companies={companies}
          onSave={async (updated) => {
            await handleSave(updated);
            setEditingUser(null);
          }}
          onClose={() => setEditingUser(null)}
          loading={updatingId === editingUser.id}
        />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-amber-800">Note on Access Changes</h4>
          <p className="text-sm text-amber-700 mt-1">
            Modifying a user's role, app access, or feature permissions will update their profile. For instant revocation, use "Revoke All" to terminate active sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
