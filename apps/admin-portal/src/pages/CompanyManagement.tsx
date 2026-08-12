import React, { useState, useEffect } from 'react';
import { Building2, Plus, Power, Users, Activity } from 'lucide-react';
import { apiClient } from "../lib/supabase";

interface CompanyStat {
  company_id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  total_users: number;
  active_branches: number;
}

export default function CompanyManagement() {
  const [stats, setStats] = useState<CompanyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await apiClient.rpc('admin_get_company_stats');
    if (!error && data) {
      setStats(data);
    } else if (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.code) return;

    setIsSubmitting(true);
    const { error } = await apiClient.rpc('admin_create_company', {
      p_name: newCompany.name,
      p_code: newCompany.code
    });

    if (error) {
      alert('Lỗi tạo công ty: ' + error.message);
    } else {
      alert('Tạo công ty thành công!');
      setShowModal(false);
      setNewCompany({ name: '', code: '' });
      fetchStats();
      // Optionally trigger global context refresh if needed, but for now stats is enough
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt';
    if (!confirm(`Are you sure you want to ${action} this company?`)) return;

    const { error } = await apiClient.rpc('admin_toggle_company_status', {
      p_company_id: companyId,
      p_is_active: !currentStatus
    });

    if (error) {
      alert(`Error trying to ${action} company: ` + error.message);
    } else {
      setStats(stats.map(s => s.company_id === companyId ? { ...s, is_active: !currentStatus } : s));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading company stats...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-500 mt-1">Manage tenant companies, track usage, and monitor system health.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No companies found.</td>
              </tr>
            ) : stats.map(c => (
              <tr key={c.company_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">Code: {c.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {c.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{c.total_users}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{c.active_branches}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleToggleStatus(c.company_id, c.is_active)}
                    className={`${c.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors`}
                    title={c.is_active ? "Disable Company" : "Enable Company"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Create New Company</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                  <input 
                    type="text" 
                    required
                    value={newCompany.code}
                    onChange={(e) => setNewCompany({...newCompany, code: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. ACME"
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier code, e.g. for subdomains (optional future use).</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
