import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid';
import { supabase, TABLES, getCurrentUserId , apiClient} from "../lib/supabase";
import { isTrialMode, mockChatGroups, mockChatMessages } from '../lib/trialData';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initUserAndGroups();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (groupId) {
      loadMessagesForGroup(groupId);
    }
  }, [groupId]);

  const initUserAndGroups = async () => {
    const currentUserId = await getCurrentUserId();
    setUserId(currentUserId);

    // Trial mode: use mock groups
    if (isTrialMode()) {
      setGroups(mockChatGroups);
      if (!groupId && mockChatGroups.length > 0) {
        setGroupId(mockChatGroups[0].id);
        setGroupName(mockChatGroups[0].name);
      }
      return;
    }

    await fetchGroups();
  };

  const fetchGroups = async () => {
    const { data } = await supabase
      .from(TABLES.OPERATION_CHAT_GROUPS)
      .select('id, name')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setGroups(data);
      if (!groupId) {
        setGroupId(data[0].id);
        setGroupName(data[0].name);
      }
    }
  };

  const loadMessagesForGroup = async (selectedGroupId: string) => {
    // Trial mode: use mock messages
    if (isTrialMode()) {
      setMessages(mockChatMessages[selectedGroupId] || []);
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const { data: existingMessages } = await supabase
      .from(TABLES.OPERATION_CHAT_MESSAGES)
      .select('*, users(full_name)')
      .eq('group_id', selectedGroupId)
      .order('created_at', { ascending: true });

    if (existingMessages) {
      setMessages(existingMessages);
    } else {
      setMessages([]);
    }

    // Subscribe to real-time changes
    const channel = supabase.channel(`public:${TABLES.OPERATION_CHAT_MESSAGES}:group_id=eq.${selectedGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.OPERATION_CHAT_MESSAGES,
          filter: `group_id=eq.${selectedGroupId}`
        },
        async (payload) => {
          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from(TABLES.USERS)
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            users: userData || { full_name: 'Người dùng' }
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();
      
    channelRef.current = channel;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userId || !groupId) return;
    
    const textToSend = message;
    setMessage('');

    try {
      const { error } = await supabase
        .from(TABLES.OPERATION_CHAT_MESSAGES)
        .insert({
          group_id: groupId,
          user_id: userId,
          message: textToSend
        });

      if (error) throw error;
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      setMessage(textToSend);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !userId) return;

    try {
      // Get company id
      const { data: userRecord } = await supabase
        .from(TABLES.USERS)
        .select('company_id')
        .eq('id', userId)
        .single();
      
      const companyId = userRecord?.company_id;

      const { data, error } = await supabase
        .from(TABLES.OPERATION_CHAT_GROUPS)
        .insert({
          company_id: companyId,
          name: newGroupName,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Add current user to members
      if (data) {
        await apiClient.from(TABLES.OPERATION_CHAT_MEMBERS).insert({
          group_id: data.id,
          user_id: userId
        });
        
        setNewGroupName('');
        setShowCreateGroup(false);
        await fetchGroups();
        setGroupId(data.id);
        setGroupName(data.name);
      }
    } catch (err) {
      console.error('Error creating group', err);
      alert('Có lỗi xảy ra khi tạo nhóm.');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar for groups */}
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 h-1/3 md:h-full">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Danh sách nhóm</h2>
          <button 
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        
        {showCreateGroup && (
          <form onSubmit={handleCreateGroup} className="p-3 bg-white border-b border-slate-100">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Tên nhóm mới..."
              className="w-full text-sm border-slate-300 rounded px-2 py-1 mb-2 border"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded w-full">Tạo</button>
              <button type="button" onClick={() => setShowCreateGroup(false)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded w-full">Hủy</button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">Chưa có nhóm nào.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {groups.map(g => (
                <li key={g.id}>
                  <button 
                    onClick={() => {
                      setGroupId(g.id);
                      setGroupName(g.name);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${groupId === g.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                  >
                    <div className={`font-medium text-sm ${groupId === g.id ? 'text-blue-700' : 'text-slate-700'}`}>{g.name}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-2/3 md:h-full">
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <h2 className="font-semibold text-slate-800">{groupName || 'Chọn một nhóm để chat'}</h2>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
          {messages.map(msg => {
            const isSelf = msg.user_id === userId;
            return (
              <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${isSelf ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  {!isSelf && <div className="text-xs font-semibold text-blue-600 mb-1">{msg.users?.full_name || 'Người dùng'}</div>}
                  <div className="text-sm">{msg.message}</div>
                  <div className={`text-[10px] mt-1 text-right ${isSelf ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={!groupId}
              className="flex-1 border-slate-300 rounded-full px-4 py-2 bg-slate-50 border focus:bg-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!groupId}
              className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
