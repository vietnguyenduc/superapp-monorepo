import React, { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { isTrialMode, mockEmergencyContacts } from '../lib/trialData';

const EmergencyPage = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);

      // Trial mode: use mock data
      if (isTrialMode()) {
        setContacts(mockEmergencyContacts);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(TABLES.OPERATION_EMERGENCY_CONTACTS)
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Danh bạ khẩn cấp</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Đang tải danh bạ...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Chưa có số liên lạc khẩn cấp nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{contact.name}</h3>
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full mt-1">
                    {contact.category || 'Khác'}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
              </div>
              {contact.notes && <p className="text-sm text-slate-500">{contact.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyPage;
