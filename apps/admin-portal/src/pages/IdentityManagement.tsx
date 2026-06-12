import React, { useState, useEffect } from 'react';
import { Search, Check, X, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdminContext } from '../contexts/AdminContext';

interface UserClaim {
  id: string;
  email: string;
  full_name: string;
  role: string;
  app_permissions: Record<string, boolean>;
}

const APPS = [
  { id: 'cashflow', name: 'Cashflow', color: 'bg-blue-100 text-blue-800' },
  { id: 'inventory', name: 'Inventory', color: 'bg-amber-100 text-amber-800' },
  { id: 'sales', name: 'Sales', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'hr', name: 'HR & Payroll', color: 'bg-pink-100 text-pink-800' },
  { id: 'accounting', name: 'Accounting', color: 'bg-purple-100 text-purple-800' },
  { id: 'operations', name: 'Operations', color: 'bg-cyan-100 text-cyan-800' },
];

export default function IdentityManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { selectedCompanyId, companies } = useAdminContext();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_get_all_users', {
      p_company_id: selectedCompanyId
    });
    if (error) {
      console.error('Failed to fetch users:', error);
      alert('Error fetching users. Are you sure you are a Master Admin?');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedCompanyId]);

  const handleSave = async (editingUser: UserClaim) => {
    setUpdatingId(editingUser.id);
    const { error } = await supabase.rpc('admin_update_user_claims', {
      target_user_id: editingUser.id,
      new_role: editingUser.role,
      new_app_permissions: editingUser.app_permissions,
      new_company_id: editingUser.company_id
    });

    if (error) {
      console.error('Failed to update claims:', error);
      alert('Error updating claims: ' + error.message);
    } else {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    }
    setUpdatingId(null);
  };

  const togglePermission = (user: UserClaim, appName: string) => {
    const newPermissions = {
      ...(user.app_permissions || {}),
      [appName]: !user.app_permissions?.[appName]
    };
    handleSave({ ...user, app_permissions: newPermissions });
  };

  const changeRole = (user: UserClaim, newRole: string) => {
    // If upgrading to admin_master, forcibly strip company_id
    const newCompanyId = newRole === 'admin_master' ? null : user.company_id;
    handleSave({ ...user, role: newRole, company_id: newCompanyId });
  };

  const changeCompany = (user: UserClaim, newCompanyId: string | null) => {
    handleSave({ ...user, company_id: newCompanyId });
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to force logout this user from all devices?')) return;
    setUpdatingId(userId);
    
    const { error } = await supabase.functions.invoke('admin-revoke-user', {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Matrix</h3>
          <p className="text-sm text-gray-500 mt-1">Manage cross-app access and roles for all company users.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium">
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 font-semibold text-gray-700">User</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Company</th>
              {APPS.map(app => (
                <th key={app.id} className="px-6 py-4 font-semibold text-gray-700 text-center">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${app.color}`}>
                    {app.name}
                  </span>
                </th>
              ))}
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 && !loading && (
              <tr>
                <td colSpan={6 + APPS.length} className="px-6 py-8 text-center text-gray-500">
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
                  <select 
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={user.role}
                    onChange={(e) => changeRole(user, e.target.value)}
                    disabled={updatingId === user.id}
                  >
                    <option value="admin_master">Master Admin</option>
                    <option value="admin_company">Company Admin</option>
                    <option value="branch_manager">Branch Mgr</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-w-[150px]"
                    value={user.role === 'admin_master' ? '' : (user.company_id || '')}
                    onChange={(e) => changeCompany(user, e.target.value || null)}
                    disabled={updatingId === user.id || user.role === 'admin_master'}
                  >
                    <option value="">Unassigned</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </td>
                {APPS.map(app => {
                  const hasAccess = user.app_permissions?.[app.id] ?? false;
                  return (
                    <td key={app.id} className="px-6 py-4 text-center">
                      <button
                        onClick={() => togglePermission(user, app.id)}
                        disabled={updatingId === user.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors disabled:opacity-50 ${
                          hasAccess
                            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {hasAccess ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleRevoke(user.id)}
                    disabled={updatingId === user.id}
                    className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Revoke All
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-amber-800">Note on Access Changes</h4>
          <p className="text-sm text-amber-700 mt-1">
            Modifying a user's role or application access will immediately update their JWT custom claims on their next token refresh. For instant revocation, use "Revoke All" to terminate their active sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
