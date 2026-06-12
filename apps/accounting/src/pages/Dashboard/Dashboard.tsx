import React from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('navigation.dashboard', { defaultValue: 'Tổng quan kế toán' })}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Tổng Doanh Thu</h3>
          <p className="text-2xl font-semibold mt-2">0 ₫</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Tổng Chi Phí</h3>
          <p className="text-2xl font-semibold mt-2">0 ₫</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Lợi Nhuận</h3>
          <p className="text-2xl font-semibold mt-2">0 ₫</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
