import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthContext } from '@superapp/iam';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';

interface TransactionLine {
  id?: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  accounting_accounts?: { code: string; name: string };
}

interface Transaction {
  id: string;
  date: string;
  voucher_number: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  accounting_transaction_lines: TransactionLine[];
}

interface Account {
  id: string;
  code: string;
  name: string;
}

const Transactions: React.FC = () => {
  const { currentCompany } = useAuthContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Form State
  const [date, setDate] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<TransactionLine[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load accounts for the dropdown
      const { data: accData } = await supabase
        .from('accounting_accounts')
        .select('id, code, name')
        .eq('company_id', currentCompany?.id)
        .eq('is_active', true)
        .order('code');
      setAccounts(accData || []);

      // Load transactions
      const { data: txData, error: txError } = await supabase
        .from('accounting_transactions')
        .select(`
          *,
          accounting_transaction_lines (
            id, account_id, debit_amount, credit_amount, description,
            accounting_accounts (code, name)
          )
        `)
        .eq('company_id', currentCompany?.id)
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions((txData as any) || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setDate(tx.date);
      setVoucherNumber(tx.voucher_number);
      setDescription(tx.description || '');
      setLines(tx.accounting_transaction_lines.map(l => ({...l})));
    } else {
      setEditingTx(null);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setVoucherNumber(`PC-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`);
      setDescription('');
      setLines([
        { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
        { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }
      ]);
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof TransactionLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit_amount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit_amount || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;
    
    // Validations
    if (lines.length < 2) {
      setError('Cần ít nhất 2 bút toán (1 Nợ, 1 Có).');
      return;
    }
    if (lines.some(l => !l.account_id)) {
      setError('Vui lòng chọn tài khoản cho tất cả các dòng.');
      return;
    }
    if (totalDebit !== totalCredit) {
      setError(`Tổng Nợ (${totalDebit}) phải bằng Tổng Có (${totalCredit}).`);
      return;
    }
    if (totalDebit === 0) {
      setError('Số tiền phát sinh phải lớn hơn 0.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const txPayload = {
        company_id: currentCompany.id,
        date,
        voucher_number: voucherNumber,
        description,
        status: editingTx ? editingTx.status : 'DRAFT'
      };

      let txId = editingTx?.id;

      if (editingTx) {
        // Update transaction
        const { error: updateError } = await supabase
          .from('accounting_transactions')
          .update(txPayload)
          .eq('id', editingTx.id);
        if (updateError) throw updateError;
        
        // Delete old lines (simplest way to handle line updates)
        await supabase.from('accounting_transaction_lines').delete().eq('transaction_id', editingTx.id);
      } else {
        // Insert transaction
        const { data, error: insertError } = await supabase
          .from('accounting_transactions')
          .insert([txPayload])
          .select()
          .single();
        if (insertError) throw insertError;
        txId = data.id;
      }

      // Insert new lines
      const linesPayload = lines.map(l => ({
        transaction_id: txId,
        account_id: l.account_id,
        debit_amount: Number(l.debit_amount),
        credit_amount: Number(l.credit_amount),
        description: l.description
      }));

      const { error: linesError } = await supabase
        .from('accounting_transaction_lines')
        .insert(linesPayload);
        
      if (linesError) throw linesError;

      handleCloseModal();
      loadData();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setError(err.message || 'Lỗi khi lưu bút toán');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chứng từ này?')) return;
    try {
      const { error } = await supabase.from('accounting_transactions').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error(err);
      alert('Không thể xóa chứng từ này.');
    }
  };

  const handlePost = async (id: string) => {
    if (!window.confirm('Ghi sổ chứng từ này? Sau khi ghi sổ sẽ không thể sửa xóa.')) return;
    try {
      const { error } = await supabase.from('accounting_transactions').update({ status: 'POSTED' }).eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error(err);
      alert('Lỗi ghi sổ');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bút toán (Journal Entries)</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FiPlus /> Thêm chứng từ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có chứng từ nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày CT</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số CT</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diễn giải</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => {
                  const txTotal = tx.accounting_transaction_lines.reduce((s, l) => s + Number(l.debit_amount), 0);
                  const isDraft = tx.status === 'DRAFT';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{tx.voucher_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{txTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {isDraft ? 'Bản nháp' : 'Đã ghi sổ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isDraft && (
                          <>
                            <button onClick={() => handlePost(tx.id)} className="text-green-600 hover:text-green-900 mr-3" title="Ghi sổ"><FiCheck size={16} /></button>
                            <button onClick={() => handleOpenModal(tx)} className="text-blue-600 hover:text-blue-900 mr-3" title="Sửa"><FiEdit2 size={16} /></button>
                            <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900" title="Xóa"><FiTrash2 size={16} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-4xl mx-auto my-6 z-50 flex flex-col h-[90vh]">
            <div className="relative flex flex-col w-full h-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
              
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                <h3 className="text-xl font-semibold">
                  {editingTx ? 'Sửa chứng từ' : 'Thêm chứng từ mới'}
                </h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none hover:text-gray-800"
                  onClick={handleCloseModal}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {/* Body */}
              <div className="relative p-6 flex-auto overflow-y-auto bg-gray-50">
                {error && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <div className="bg-white p-4 rounded shadow-sm border mb-6">
                  <h4 className="font-medium text-gray-900 mb-4 border-b pb-2">Thông tin chung</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Ngày chứng từ *</label>
                      <input type="date" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Số chứng từ *</label>
                      <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" required value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Diễn giải</label>
                      <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm border">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h4 className="font-medium text-gray-900">Chi tiết bút toán</h4>
                    <button type="button" onClick={addLine} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                      <FiPlus size={14}/> Thêm dòng
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-2">Tài khoản</th>
                          <th className="pb-2">Nợ</th>
                          <th className="pb-2">Có</th>
                          <th className="pb-2">Diễn giải chi tiết</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lines.map((line, index) => (
                          <tr key={index}>
                            <td className="py-2 pr-2">
                              <select 
                                className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
                                value={line.account_id}
                                onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                              >
                                <option value="">-- Chọn tài khoản --</option>
                                {accounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <input type="number" min="0" className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 text-right"
                                value={line.debit_amount} onChange={e => updateLine(index, 'debit_amount', e.target.value)}
                                disabled={line.credit_amount > 0}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input type="number" min="0" className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 text-right"
                                value={line.credit_amount} onChange={e => updateLine(index, 'credit_amount', e.target.value)}
                                disabled={line.debit_amount > 0}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input type="text" className="w-full border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
                                value={line.description} onChange={e => updateLine(index, 'description', e.target.value)} placeholder="Diễn giải..." />
                            </td>
                            <td className="py-2 text-right">
                              <button type="button" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700" disabled={lines.length <= 2}>
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-gray-50">
                          <td className="py-3 text-right pr-4">Tổng cộng:</td>
                          <td className="py-3 pr-2 text-right text-blue-700">{totalDebit.toLocaleString()}</td>
                          <td className="py-3 pr-2 text-right text-blue-700">{totalCredit.toLocaleString()}</td>
                          <td colSpan={2}>
                            {totalDebit !== totalCredit && <span className="text-red-500 text-sm ml-2">Lệch {(Math.abs(totalDebit - totalCredit)).toLocaleString()}</span>}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-5 border-t border-solid rounded-b border-blueGray-200">
                <button className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1" type="button" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase text-sm px-6 py-3 rounded shadow outline-none disabled:opacity-50"
                  type="button"
                  onClick={handleSave}
                  disabled={saving || totalDebit !== totalCredit || totalDebit === 0}
                >
                  {saving ? 'Đang lưu...' : 'Lưu chứng từ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
