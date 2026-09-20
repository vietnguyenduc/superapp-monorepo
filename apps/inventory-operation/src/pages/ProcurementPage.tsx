import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@superapp/iam';
import { useProducts } from '../hooks/useProducts';
import { supplierService, Supplier } from '../services/supplierService';
import { procurementService, ProcurementLineInput, PurchaseOrderRecord, SupplierReturnRecord } from '../services/procurementService';

type Tab = 'po' | 'return';
type Line = ProcurementLineInput & { key: string };
const emptyLine = (): Line => ({ key: crypto.randomUUID(), productId: '', quantity: 1, unitPrice: 0, notes: '' });

const ProcurementPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthContext();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'return' ? 'return' : 'po';
  const { products } = useProducts();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [returns, setReturns] = useState<SupplierReturnRecord[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Hàng lỗi hoặc không đạt chất lượng');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const isApprover = user?.role === 'admin_company' || user?.role === 'admin_master';

  useEffect(() => {
    const state = location.state as { prefillSupplierId?: string; prefillItems?: Array<{ product_id: string; quantity: number; unit_price: number }> } | null;
    if (state?.prefillItems?.length && tab === 'po') {
      setSupplierId(state.prefillSupplierId || '');
      setLines(state.prefillItems.map((item) => ({ key: crypto.randomUUID(), productId: item.product_id, quantity: item.quantity, unitPrice: item.unit_price || 0, notes: '' })));
      window.history.replaceState({}, document.title, location.pathname + location.search);
    }
  }, [location, tab]);

  const reload = useCallback(async () => {
    const [supplierResult, poResult, returnResult] = await Promise.all([
      supplierService.getSuppliers(), procurementService.getPurchaseOrders(), procurementService.getSupplierReturns(),
    ]);
    if (supplierResult.success && supplierResult.data) setSuppliers(supplierResult.data.filter((supplier) => supplier.status !== 'inactive'));
    if (poResult.success && poResult.data) setPurchaseOrders(poResult.data);
    if (returnResult.success && returnResult.data) setReturns(returnResult.data);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const total = useMemo(() => lines.reduce((sum, line) => sum + Math.max(0, line.quantity || 0) * Math.max(0, line.unitPrice || 0), 0), [lines]);
  const updateLine = (key: string, patch: Partial<Line>) => setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  const cleanLines = () => lines.filter((line) => line.productId && line.quantity > 0);
  const resetForm = () => { setSupplierId(''); setDate(new Date().toISOString().slice(0, 10)); setReason('Hàng lỗi hoặc không đạt chất lượng'); setNotes(''); setLines([emptyLine()]); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validLines = cleanLines();
    if (!supplierId || validLines.length === 0) { setNotice({ type: 'error', message: 'Chọn nhà cung cấp và ít nhất một sản phẩm có số lượng hợp lệ.' }); return; }
    setSaving(true);
    const result = tab === 'po'
      ? await procurementService.createPurchaseOrder({ supplierId, expectedDate: date, notes, items: validLines })
      : await procurementService.createSupplierReturn({ supplierId, returnDate: date, reason, notes, items: validLines });
    setSaving(false);
    if (result.success) { setNotice({ type: 'success', message: tab === 'po' ? 'Đã tạo PO. PO chưa làm thay đổi tồn kho.' : 'Đã tạo phiếu trả. Phiếu cần duyệt trước khi giảm tồn.' }); resetForm(); reload(); }
    else setNotice({ type: 'error', message: result.error || 'Không thể lưu phiếu.' });
  };

  const review = async (id: string, action: 'approve' | 'cancel') => {
    const result = await procurementService.reviewSupplierReturn(id, action);
    setNotice(result.success ? { type: 'success', message: action === 'approve' ? 'Đã duyệt phiếu trả.' : 'Đã hủy phiếu trả.' } : { type: 'error', message: result.error || 'Không thể cập nhật phiếu.' });
    if (result.success) reload();
  };
  const complete = async (id: string) => {
    const result = await procurementService.completeSupplierReturn(id);
    setNotice(result.success ? { type: 'success', message: `Đã hoàn tất trả NCC và ghi ${result.data?.created || 0} dòng xuất kho.` } : { type: 'error', message: result.error || 'Không thể hoàn tất phiếu trả.' });
    if (result.success) reload();
  };

  return <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950"><div className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h1 className="text-xl font-bold text-gray-900 dark:text-white">Mua hàng & trả nhà cung cấp</h1><p className="mt-1 text-sm text-gray-500">PO là kế hoạch mua; chỉ nhận hàng mới tăng tồn. Phiếu trả cần duyệt trước khi xuất kho.</p></header>
    <div className="flex gap-2 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><button onClick={() => setParams({ tab: 'po' })} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'po' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>Đặt hàng (PO)</button><button onClick={() => setParams({ tab: 'return' })} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'return' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>Trả hàng NCC</button></div>
    {notice && <div role="alert" className={`rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.message}</div>}
    <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="font-semibold text-gray-900 dark:text-white">{tab === 'po' ? 'Tạo đơn đặt hàng' : 'Tạo phiếu trả hàng'}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nhà cung cấp<select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-gray-900"><option value="">Chọn nhà cung cấp</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.full_name}</option>)}</select></label><label className="text-sm font-medium text-gray-700 dark:text-gray-200">{tab === 'po' ? 'Ngày dự kiến nhận' : 'Ngày trả'}<input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-gray-900" /></label>{tab === 'return' && <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Lý do trả<input required value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-gray-900" /></label>}</div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-left text-xs uppercase text-gray-500"><tr><th className="pb-2">Sản phẩm</th><th className="pb-2">Số lượng</th><th className="pb-2">Đơn giá</th><th className="pb-2">Thành tiền</th><th /></tr></thead><tbody>{lines.map((line) => <tr key={line.key} className="border-t"><td className="py-2 pr-2"><select required value={line.productId} onChange={(e) => updateLine(line.key, { productId: e.target.value })} className="w-full rounded-lg border p-2 text-gray-900"><option value="">Chọn sản phẩm</option>{products.filter((product) => product.status !== 'inactive').map((product) => <option key={product.id} value={product.id}>{product.businessCode ? `${product.businessCode} · ` : ''}{product.name} ({product.inputUnit})</option>)}</select></td><td className="py-2 pr-2"><input min="0.001" step="0.001" required type="number" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })} className="w-28 rounded-lg border p-2 text-gray-900" /></td><td className="py-2 pr-2"><input min="0" step="1000" type="number" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })} className="w-32 rounded-lg border p-2 text-gray-900" /></td><td className="py-2 pr-2 text-right font-medium">{(line.quantity * line.unitPrice).toLocaleString('vi-VN')}</td><td className="py-2 text-right"><button type="button" disabled={lines.length === 1} onClick={() => setLines((items) => items.filter((item) => item.key !== line.key))} className="text-red-600 disabled:opacity-30">Xóa</button></td></tr>)}</tbody></table></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setLines((items) => [...items, emptyLine()])} className="rounded-lg border px-3 py-2 text-sm">+ Thêm dòng</button><div className="flex items-center gap-4"><span className="font-semibold">Tổng: {total.toLocaleString('vi-VN')} đ</span><button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : tab === 'po' ? 'Tạo PO' : 'Gửi duyệt phiếu trả'}</button></div></div>
      <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">Ghi chú<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-gray-900" rows={2} /></label></form>
    {tab === 'po' ? <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="font-semibold text-gray-900 dark:text-white">PO gần đây</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead className="text-left text-xs uppercase text-gray-500"><tr><th>Mã PO</th><th>NCC</th><th>Ngày nhận dự kiến</th><th>Trạng thái</th><th className="text-right">Tổng tiền</th></tr></thead><tbody>{purchaseOrders.map((order) => <tr key={order.id} className="border-t"><td className="py-3 font-medium">{order.po_number}</td><td>{order.supplier?.full_name || order.supplier?.name || '—'}</td><td>{order.expected_date || '—'}</td><td>Không ảnh hưởng tồn</td><td className="text-right">{Number(order.total_amount || 0).toLocaleString('vi-VN')}</td></tr>)}{purchaseOrders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">Chưa có PO.</td></tr>}</tbody></table></div></section> : <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="font-semibold text-gray-900 dark:text-white">Phiếu trả gần đây</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="text-left text-xs uppercase text-gray-500"><tr><th>Mã phiếu</th><th>NCC</th><th>Lý do</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead><tbody>{returns.map((record) => <tr key={record.id} className="border-t"><td className="py-3 font-medium">{record.return_number}</td><td>{record.supplier?.full_name || record.supplier?.name || '—'}</td><td>{record.reason}</td><td>{record.status === 'pending' ? 'Chờ duyệt' : record.status === 'approved' ? 'Đã duyệt' : record.status === 'completed' ? 'Đã hoàn tất' : 'Đã hủy'}</td><td className="text-right">{record.status === 'pending' && isApprover && <><button onClick={() => review(record.id, 'approve')} className="mr-2 text-emerald-700">Duyệt</button><button onClick={() => review(record.id, 'cancel')} className="text-red-600">Hủy</button></>}{record.status === 'approved' && <button onClick={() => complete(record.id)} className="text-indigo-700">Hoàn tất xuất kho</button>}</td></tr>)}{returns.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">Chưa có phiếu trả.</td></tr>}</tbody></table></div></section>}
  </div></div>;
};

export default ProcurementPage;
