import { useState, useEffect } from 'react';
import { supabase, TABLES, getCurrentUserId } from '../lib/supabase';
import { isTrialMode, mockTickets } from '../lib/trialData';

const TicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // Trial mode: use mock data
      if (isTrialMode()) {
        setTickets(mockTickets);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(TABLES.OPERATION_TICKETS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: userRecord } = await supabase.from(TABLES.USERS).select('company_id').eq('id', userId).single();
      
      const { error } = await supabase.from(TABLES.OPERATION_TICKETS).insert({
        company_id: userRecord?.company_id,
        title: newTitle,
        description: newDesc,
        created_by: userId
      });

      if (error) throw error;
      
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sự cố & Bảo trì</h1>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Báo sự cố mới
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-slate-400">X</button>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Báo sự cố mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full border p-2 rounded" rows={3}></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Gửi báo cáo</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? <div className="text-slate-500">Đang tải...</div> : tickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between">
              <h3 className="font-bold text-slate-900">{ticket.title}</h3>
              <span className="text-sm bg-slate-100 px-2 py-1 rounded">{ticket.status}</span>
            </div>
            <p className="text-slate-500 text-sm mt-2">{ticket.description}</p>
            <div className="text-xs text-slate-400 mt-4">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketsPage;
