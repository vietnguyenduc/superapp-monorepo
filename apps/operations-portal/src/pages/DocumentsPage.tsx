import React, { useEffect, useState } from 'react';
import { DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase, TABLES, STORAGE, getCurrentUserId } from '../lib/supabase';
import { isTrialMode, mockDocuments } from '../lib/trialData';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('regulation');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      // Trial mode: use mock data
      if (isTrialMode()) {
        setDocuments(mockDocuments);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(TABLES.OPERATION_DOCUMENTS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocFile) return;

    try {
      setIsUploading(true);
      setUploadError('');
      
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Vui lòng đăng nhập để thực hiện');

      // Get company id
      const { data: userRecord } = await supabase
        .from(TABLES.USERS)
        .select('company_id')
        .eq('id', userId)
        .single();
      
      const companyId = userRecord?.company_id;
      if (!companyId) throw new Error('Không tìm thấy công ty của bạn');

      // Upload file
      const fileExt = newDocFile.name.split('.').pop();
      const fileName = `documents/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE.OPERATIONS_MEDIA)
        .upload(fileName, newDocFile);

      if (uploadError) throw uploadError;

      // Insert record
      const { error: insertError } = await supabase
        .from(TABLES.OPERATION_DOCUMENTS)
        .insert({
          company_id: companyId,
          title: newDocTitle,
          document_type: newDocType as any,
          file_url: fileName,
          created_by: userId
        });

      if (insertError) throw insertError;

      // Success, reset form
      setShowUploadModal(false);
      setNewDocTitle('');
      setNewDocFile(null);
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Có lỗi xảy ra khi upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileUrl: string) => {
    if (!fileUrl) return;
    try {
      const { data, error } = await supabase.storage.from('operations_media').createSignedUrl(fileUrl, 60);
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Không thể tải file.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tài liệu & Quy định</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Đăng tài liệu mới
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Đăng tài liệu mới</h2>
            {uploadError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{uploadError}</div>}
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên tài liệu</label>
                <input 
                  type="text" 
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại</label>
                <select 
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                >
                  <option value="regulation">Quy định</option>
                  <option value="notice">Thông báo</option>
                  <option value="issuance">Ban hành</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File đính kèm</label>
                <input 
                  type="file" 
                  onChange={(e) => setNewDocFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
              >
                {isUploading ? 'Đang tải lên...' : 'Đăng tài liệu'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải tài liệu...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có tài liệu nào.</div>
        ) : (
          <>
            {/* Desktop table — ẩn trên mobile */}
            <div className="hidden sm:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên tài liệu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phân loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày đăng</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{doc.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.document_type === 'regulation' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {doc.document_type === 'regulation' ? 'Quy định' : 'Thông báo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {doc.file_url && (
                          <button 
                            onClick={() => handleDownload(doc.file_url)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" /> Tải về
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — chỉ hiện trên mobile */}
            <div className="sm:hidden divide-y divide-slate-200">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{doc.title}</span>
                    <span className={`shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.document_type === 'regulation' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {doc.document_type === 'regulation' ? 'Quy định' : 'Thông báo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                    {doc.file_url && (
                      <button 
                        onClick={() => handleDownload(doc.file_url)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" /> Tải về
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
