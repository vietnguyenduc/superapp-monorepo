import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { useAuthContext } from '@superapp/iam';

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<AccountBalance[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      loadReport();
    }
  }, [currentCompany?.id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounting_accounts')
        .select('id, code, name, type')
        .eq('company_id', currentCompany?.id)
        .order('code');

      // Fetch posted transactions
      const { data: txData } = await supabase
        .from('accounting_transactions')
        .select(`
          id,
          accounting_transaction_lines (
            account_id, debit_amount, credit_amount
          )
        `)
        .eq('company_id', currentCompany?.id)
        .eq('status', 'POSTED');

      if (!accountsData) return;

      const accMap = new Map<string, AccountBalance>();
      accountsData.forEach(acc => {
        accMap.set(acc.id, {
          ...acc,
          debit: 0,
          credit: 0,
          balance: 0
        });
      });

      if (txData) {
        txData.forEach(tx => {
          tx.accounting_transaction_lines.forEach((line: any) => {
            const acc = accMap.get(line.account_id);
            if (acc) {
              acc.debit += Number(line.debit_amount || 0);
              acc.credit += Number(line.credit_amount || 0);
            }
          });
        });
      }

      // Calculate final balance based on account type
      const result = Array.from(accMap.values()).map(acc => {
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.balance = acc.debit - acc.credit;
        } else {
          acc.balance = acc.credit - acc.debit;
        }
        return acc;
      });

      setBalances(result.filter(a => a.debit > 0 || a.credit > 0 || a.balance !== 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = balances.filter(b => b.type === 'ASSET').reduce((sum, b) => sum + b.balance, 0);
  const totalLiabilities = balances.filter(b => b.type === 'LIABILITY').reduce((sum, b) => sum + b.balance, 0);
  const totalEquity = balances.filter(b => b.type === 'EQUITY').reduce((sum, b) => sum + b.balance, 0);
  const totalRevenue = balances.filter(b => b.type === 'REVENUE').reduce((sum, b) => sum + b.balance, 0);
  const totalExpense = balances.filter(b => b.type === 'EXPENSE').reduce((sum, b) => sum + b.balance, 0);
  
  const netIncome = totalRevenue - totalExpense;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.reports', { defaultValue: 'Báo cáo tài chính' })}</h1>
      
      {loading ? (
        <div className="p-4 text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Tổng Tài Sản</h3>
              <div className="text-2xl font-bold text-blue-600">{totalAssets.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Nợ & Vốn Chủ (Chưa gồm Lãi/Lỗ)</h3>
              <div className="text-2xl font-bold text-orange-600">{(totalLiabilities + totalEquity).toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Lãi / Lỗ ròng</h3>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netIncome.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Bảng Cân Đối Phát Sinh</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tài khoản</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Phát sinh Nợ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Phát sinh Có</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dư cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balances.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Không có dữ liệu</td></tr>
                  ) : (
                    balances.map(acc => (
                      <tr key={acc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{acc.code}</div>
                          <div className="text-sm text-gray-500">{acc.name} ({acc.type})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{acc.debit.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{acc.credit.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">{acc.balance.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Reports;
