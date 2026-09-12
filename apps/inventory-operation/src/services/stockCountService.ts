import { isTrialMode } from '@superapp/shared-utils';
import { apiClient } from '../lib/supabase';
import { InventoryService } from './inventoryService';
import { ProductService } from './productService';
import { fallbackService } from './fallbackService';

export type StockCountStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export interface StockCountLine { id: string; product_id: string; book_quantity: number; counted_quantity: number | null; unit: string; explanation?: string; variance?: number | null; adjustment_record_id?: string; product?: { name: string; business_code: string } }
export interface StockCountSession { id: string; count_date: string; status: StockCountStatus; notes?: string; review_notes?: string; created_at: string; lines: StockCountLine[] }

const KEY = 'inventory_stock_count_sessions';
const readTrial = (): StockCountSession[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const writeTrial = (sessions: StockCountSession[]) => localStorage.setItem(KEY, JSON.stringify(sessions));

export const stockCountService = {
  async list(): Promise<StockCountSession[]> {
    if (isTrialMode()) return readTrial();
    const { data, error } = await apiClient.from('inventory_count_sessions').select('*, lines:inventory_count_lines(*, product:products(name,business_code))').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as StockCountSession[];
  },
  async create(countDate: string, notes: string): Promise<string> {
    if (!isTrialMode()) {
      const { data, error } = await apiClient.rpc('inventory_create_count_session', { p_count_date: countDate, p_notes: notes });
      if (error) throw new Error(error.message); return data as string;
    }
    const [productsResult, inventoryResult] = await Promise.all([ProductService.getProducts({ status: 'active' }), InventoryService.getInventoryRecords()]);
    const id = crypto.randomUUID(); const records = inventoryResult.data || [];
    const lines: StockCountLine[] = (productsResult.data || []).map(product => ({ id: crypto.randomUUID(), product_id: product.id, book_quantity: records.filter(r => r.productCode === product.businessCode).reduce((sum, r) => sum + (r.inputQuantity || 0) - (r.outputQuantity || 0), 0), counted_quantity: null, unit: product.inputUnit, product: { name: product.name, business_code: product.businessCode } }));
    writeTrial([{ id, count_date: countDate, status: 'draft', notes, created_at: new Date().toISOString(), lines }, ...readTrial()]); return id;
  },
  async saveLines(sessionId: string, lines: StockCountLine[]): Promise<void> {
    if (isTrialMode()) { const sessions=readTrial().map(s=>s.id===sessionId?{...s,lines}:s); writeTrial(sessions); return; }
    for (const line of lines) { const { error }=await apiClient.from('inventory_count_lines').update({ counted_quantity: line.counted_quantity, explanation: line.explanation || null }).eq('id',line.id).eq('session_id',sessionId); if(error) throw new Error(error.message); }
  },
  async submit(sessionId: string): Promise<void> {
    if (isTrialMode()) { const sessions=readTrial(); const session=sessions.find(s=>s.id===sessionId); if(!session) throw new Error('Không tìm thấy phiên'); if(session.lines.some(l=>l.counted_quantity===null)) throw new Error('Còn sản phẩm chưa nhập tồn thực tế'); if(session.lines.some(l=>l.counted_quantity!==l.book_quantity&&!l.explanation?.trim())) throw new Error('Chênh lệch phải có giải trình'); session.status='submitted'; writeTrial(sessions); return; }
    const { error }=await apiClient.rpc('inventory_submit_count_session',{p_session_id:sessionId}); if(error) throw new Error(error.message);
  },
  async review(sessionId: string, action: 'approve'|'reject', notes: string): Promise<void> {
    if (isTrialMode()) { const sessions=readTrial(); const session=sessions.find(s=>s.id===sessionId); if(!session || session.status!=='submitted') throw new Error('Phiên kiểm kê không ở trạng thái chờ duyệt'); session.status=action==='approve'?'approved':'rejected'; session.review_notes=notes; if(action==='approve') { for(const line of session.lines){const variance=Number(line.counted_quantity)-Number(line.book_quantity);if(!variance)continue;const result=await fallbackService.createInventoryRecord({date:new Date(session.count_date),productCode:line.product?.business_code||line.product_id,productName:line.product?.name||'',inputQuantity:Math.max(variance,0),outputQuantity:Math.max(-variance,0),rawMaterialStock:0,rawMaterialUnit:line.unit,processedStock:0,processedUnit:'',finishedProductStock:0,finishedProductUnit:'',notes:`Điều chỉnh kiểm kê: ${line.explanation}`,sourceType:'stock_count' as any,referenceId:session.id,createdBy:'trial',updatedBy:'trial'} as any);line.adjustment_record_id=result.data?.id;} } writeTrial(sessions); return; }
    const { error }=await apiClient.rpc('inventory_review_count_session',{p_session_id:sessionId,p_action:action,p_review_notes:notes}); if(error) throw new Error(error.message);
  }
};
