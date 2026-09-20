import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Search, ShoppingCart, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { InventoryService } from '../services/inventoryService';
import { supplierService, Supplier } from '../services/supplierService';
import { Product, InventoryRecord } from '../types';
import { calculateDaysOnHand } from '../utils/inventoryPilotMath';
import { buildProductLedgerBalances, calculateDailyOutput } from '../utils/inventoryLedger';

interface MRPItem {
  product: Product;
  currentStock: number;
  salesRate7d: number;
  salesRate30d: number;
  supplier?: Supplier;
  leadTimeDays: number;
  unitPrice: number;
}

const InventoryMRPPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dohView, setDohView] = useState<'7days' | '30days'>('30days');
  const [mrpItems, setMrpItems] = useState<MRPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [targetDays, setTargetDays] = useState(14);

  const { products } = useProducts();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      const res = await supplierService.getSuppliers();
      if (res.success && res.data) setSuppliers(res.data);
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    const loadMRPData = async () => {
      if (products.length === 0) return;
      setLoading(true);
      try {
        setLoadError(null);
        const res = await InventoryService.getInventoryRecords({});
        const records: InventoryRecord[] = res.data || [];
        const asOf = new Date();

        // Calculate stock + sales rate per product
        const items: MRPItem[] = products.map((product) => {
          const productRecords = records.filter((r) => r.productId === product.id || r.productCode === product.businessCode);

          // Current stock = sum(input) - sum(output)
          const currentStock = buildProductLedgerBalances(productRecords, asOf)[0]?.quantity || 0;

          // Sales rate: output records in last 7/30 days
          const salesRate7d = calculateDailyOutput(productRecords, 7, asOf);
          const salesRate30d = calculateDailyOutput(productRecords, 30, asOf);

          return {
            product,
            currentStock,
            salesRate7d,
            salesRate30d,
            supplier: suppliers.find((s) => s.id === (product as any).supplier_id),
            leadTimeDays: (product as any).lead_time_days || 3,
            unitPrice: product.price || 0,
          };
        });
        setMrpItems(items);
      } catch (err) {
        console.error('MRP load error:', err);
        setLoadError(err instanceof Error ? err.message : 'Không thể đối soát dữ liệu MRP');
      } finally {
        setLoading(false);
      }
    };
    loadMRPData();
  }, [products, suppliers]);

  const calculateDOH = calculateDaysOnHand;

  const calculateSuggestedOrder = (item: MRPItem, targetDoh: number) => {
    const rate = dohView === '7days' ? item.salesRate7d : item.salesRate30d;
    const targetStock = rate * (targetDoh + item.leadTimeDays);
    const deficit = targetStock - item.currentStock;
    return deficit > 0 ? Math.round(deficit) : 0;
  };

  const filtered = useMemo(() => {
    return mrpItems.filter((item) => {
      const s = searchTerm.toLowerCase();
      return (
        item.product.name?.toLowerCase().includes(s) ||
        item.product.businessCode?.toLowerCase().includes(s) ||
        item.supplier?.full_name?.toLowerCase().includes(s)
      );
    });
  }, [mrpItems, searchTerm]);

  const avgDOH = filtered.length > 0
    ? (() => { const values = filtered.map(i => calculateDOH(i.currentStock, dohView === '7days' ? i.salesRate7d : i.salesRate30d)).filter((v): v is number => v !== null); return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; })()
    : 0;
  const outOfStockCount = filtered.filter((i) => {
    const rate = dohView === '7days' ? i.salesRate7d : i.salesRate30d;
    const doh = calculateDOH(i.currentStock, rate);
    return i.currentStock < 0 || (doh !== null && doh <= i.leadTimeDays);
  }).length;
  const suggestedPOCount = new Set(filtered.filter((i) => calculateSuggestedOrder(i, targetDays) > 0).map((i) => i.supplier?.id).filter(Boolean)).size;

  const toggleSelect = (productId: string) => {
    const next = new Set(selectedIds);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    setSelectedIds(next);
  };

  const handleCreatePO = () => {
    const selected = mrpItems.filter((i) => selectedIds.has(i.product.id));
    if (selected.length === 0) return;
    setActionError(null);

    // Group by supplier
    const bySupplier = new Map<string, MRPItem[]>();
    selected.forEach((item) => {
      const supplierId = item.supplier?.id || 'unknown';
      if (!bySupplier.has(supplierId)) bySupplier.set(supplierId, []);
      bySupplier.get(supplierId)!.push(item);
    });

    if (bySupplier.size !== 1 || bySupplier.has('unknown')) {
      setActionError('Để tránh bỏ sót đơn hàng, mỗi lần chỉ tạo PO cho sản phẩm của một nhà cung cấp đã được gán.');
      return;
    }

    // For now, navigate with first supplier's items (most common case)
    const firstSupplierId = bySupplier.keys().next().value;
    const firstSupplierItems = bySupplier.get(firstSupplierId) || [];

    const prefillItems = firstSupplierItems.map((item) => ({
      product_id: item.product.id,
      product_code: item.product.businessCode || '',
      product_name: item.product.name || '',
      quantity: calculateSuggestedOrder(item, targetDays),
      unit_price: item.unitPrice,
    }));

    navigate('/procurement?tab=po', {
      state: {
        prefillItems,
        prefillSupplierId: firstSupplierId !== 'unknown' ? firstSupplierId : undefined,
      },
    });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {(actionError || loadError) && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">{actionError || loadError}</div>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">Vòng quay tồn kho & MRP</h1>
          <p className="text-sm text-slate-500 mt-1">Phân tích DOH và đề xuất lượng nhập theo mục tiêu tồn kho của pilot</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
            Mục tiêu tồn
            <input
              aria-label="Số ngày tồn kho mục tiêu"
              type="number"
              min={1}
              max={90}
              value={targetDays}
              onChange={(event) => setTargetDays(Math.min(90, Math.max(1, Number(event.target.value) || 1)))}
              className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            ngày
          </label>
          <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setDohView('7days')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dohView === '7days' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'}`}
          >
            Tốc độ bán 7 ngày
          </button>
          <button
            onClick={() => setDohView('30days')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dohView === '30days' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'}`}
          >
            Tốc độ bán 30 ngày
          </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">DOH Trung bình toàn kho</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{avgDOH} <span className="text-sm font-normal text-slate-500">ngày</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-600">Cảnh báo Đứt hàng</p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{outOfStockCount} <span className="text-sm font-normal">sản phẩm</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600">Đề xuất mua hàng (PO)</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{suggestedPOCount} <span className="text-sm font-normal">nhà cung cấp</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 flex justify-between items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, NCC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={handleCreatePO}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            Tạo PO hàng loạt {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu MRP...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có dữ liệu. Thêm sản phẩm và nhập hàng để xem phân tích MRP.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => { if (e.target.checked) setSelectedIds(new Set(filtered.map(i => i.product.id))); else setSelectedIds(new Set()); }} /></th>
                  <th className="px-6 py-4">Sản phẩm / NCC</th>
                  <th className="px-6 py-4 text-right">Tồn hiện tại</th>
                  <th className="px-6 py-4 text-right">Tốc độ bán<br/>({dohView === '7days' ? '7 ngày' : '30 ngày'}/ngày)</th>
                  <th className="px-6 py-4 text-center">DOH Thực tế</th>
                  <th className="px-6 py-4 text-center">Mục tiêu / Lead Time</th>
                  <th className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-800 dark:text-indigo-300 border-l border-indigo-100 dark:border-indigo-900/30">Gợi ý Đặt (MRP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filtered.map((item) => {
                  const rate = dohView === '7days' ? item.salesRate7d : item.salesRate30d;
                  const doh = calculateDOH(item.currentStock, rate);
                  const suggestedOrder = calculateSuggestedOrder(item, targetDays);
                  const isOutOfStock = item.currentStock < 0 || (doh !== null && doh <= item.leadTimeDays);

                  return (
                    <tr key={item.product.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(item.product.id)} onChange={() => toggleSelect(item.product.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.product.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.supplier?.full_name || 'Chưa gán NCC'}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-gray-300">{item.currentStock.toLocaleString('vi-VN',{maximumFractionDigits:3})} {item.product.inputUnit}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-gray-300">{rate.toLocaleString('vi-VN',{maximumFractionDigits:3})} {item.product.inputUnit} / ngày</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-lg ${isOutOfStock ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{doh === null ? '—' : doh}</span>
                          <span className="text-[10px] text-slate-500 uppercase">ngày</span>
                          {isOutOfStock && <span className="text-[10px] font-bold text-rose-600 mt-1 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">Rủi ro đứt hàng</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md inline-block">{targetDays} ngày tồn</div>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Giao: {item.leadTimeDays} ngày
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10 border-l border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex flex-col gap-1 items-start">
                          {suggestedOrder > 0 ? (
                            <>
                              <div className="font-bold text-indigo-700 dark:text-indigo-300 text-lg">+{suggestedOrder.toLocaleString()}</div>
                              <div className="text-xs text-slate-500">~ {(suggestedOrder * item.unitPrice).toLocaleString()} đ</div>
                            </>
                          ) : (
                            <div className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Đủ tồn kho
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryMRPPage;
