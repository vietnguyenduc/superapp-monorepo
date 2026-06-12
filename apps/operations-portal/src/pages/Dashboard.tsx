import { useEffect, useState } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { isTrialMode, mockDashboardStats } from '../lib/trialData';

const Dashboard = () => {
  const [stats, setStats] = useState({
    checkinsToday: 0,
    newNotices: 0,
    activeGroups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Trial mode: use mock data
      if (isTrialMode()) {
        setStats(mockDashboardStats);
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check-ins today
      const { count: checkinCount } = await supabase
        .from(TABLES.OPERATION_CHECKINS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // New notices (created within the last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { count: noticeCount } = await supabase
        .from(TABLES.OPERATION_DOCUMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('document_type', 'notice')
        .gte('created_at', lastWeek.toISOString());

      // Active groups
      const { count: groupCount } = await supabase
        .from(TABLES.OPERATION_CHAT_GROUPS)
        .select('*', { count: 'exact', head: true });

      setStats({
        checkinsToday: checkinCount || 0,
        newNotices: noticeCount || 0,
        activeGroups: groupCount || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan Vận hành</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-slate-500">Check-in hôm nay</h3>
          {loading ? <div className="text-gray-300 mt-2">Đang tải...</div> : <p className="text-3xl font-bold text-blue-600 mt-2">{stats.checkinsToday}</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-slate-500">Thông báo mới (7 ngày qua)</h3>
          {loading ? <div className="text-gray-300 mt-2">Đang tải...</div> : <p className="text-3xl font-bold text-green-600 mt-2">{stats.newNotices}</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-slate-500">Group Chat hoạt động</h3>
          {loading ? <div className="text-gray-300 mt-2">Đang tải...</div> : <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeGroups}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
