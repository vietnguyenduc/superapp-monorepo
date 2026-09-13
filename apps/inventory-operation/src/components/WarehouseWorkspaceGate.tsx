import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useWarehouseWorkspace } from '../contexts/WarehouseWorkspaceContext';

export const WarehouseWorkspaceGate: React.FC = () => {
  const {branches,activeBranch,role,loading,error,createFirst,selectBranch}=useWarehouseWorkspace();
  const [name,setName]=useState('Kho mặc định'); const [saving,setSaving]=useState(false); const [localError,setLocalError]=useState('');
  if(loading)return <div className="p-6 text-sm text-gray-500" role="status">Đang chuẩn bị không gian kho…</div>;
  if(!branches.length){
    const canCreate=role==='admin_company';
    return <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950">🏬</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thiết lập kho đầu tiên</h1>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Inventory cần một kho để gắn đúng dữ liệu nhập, xuất và kiểm kê. Với một kho, hệ thống sẽ tự chọn và không hiện thêm bộ lọc.</p>
      {canCreate?<form className="mt-6 space-y-4" onSubmit={async e=>{e.preventDefault();setLocalError('');setSaving(true);try{await createFirst(name);}catch(err){setLocalError(err instanceof Error?err.message:'Không thể tạo kho');}finally{setSaving(false);}}}>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Tên kho<input aria-label="Tên kho đầu tiên" value={name} onChange={e=>setName(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
        {(localError||error)&&<p className="text-sm text-red-600" role="alert">{localError||error}</p>}
        <button disabled={saving||!name.trim()} className="min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving?'Đang tạo…':'Tạo kho và bắt đầu'}</button>
      </form>:<div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Hãy nhờ quản trị công ty thiết lập kho đầu tiên và phân công bạn vào kho.</div>}
    </div>;
  }
  if(!activeBranch){
    return <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <h1 className="text-xl font-bold">Chưa được phân công kho</h1>
      <p className="mt-2 text-sm leading-6">Hãy nhờ quản trị công ty phân công bạn vào một kho đang hoạt động trước khi nhập, xuất hoặc kiểm kê.</p>
    </div>;
  }
  return <>
    {branches.length>1&&<div className="border-b border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Kho đang thao tác</div><div className="font-semibold text-gray-900 dark:text-white">{activeBranch?.name||'Chưa chọn kho'}</div></div>{role==='admin_company'?<label className="text-sm font-medium text-gray-700 dark:text-gray-200">Đổi kho<select aria-label="Kho đang thao tác" value={activeBranch?.id||''} onChange={e=>void selectBranch(e.target.value)} className="ml-2 min-h-11 rounded-xl border border-blue-200 bg-white px-3 dark:border-blue-800 dark:bg-gray-900">{branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>:<span className="text-sm text-gray-600 dark:text-gray-300">Bạn được phân công cố định tại kho này</span>}</div></div>}
    <Outlet />
  </>;
};
