import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpecialOutboundService } from '../specialOutboundService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  getCurrentUserId: vi.fn().mockResolvedValue('mock-user-id'),
  getCurrentCompanyId: vi.fn().mockResolvedValue('mock-company-id'),
  getCurrentUserRole: vi.fn().mockResolvedValue('admin'),
  getCurrentBranchId: vi.fn().mockResolvedValue('mock-branch-id'),
}));

function createMockTable(singleResult = { id: 'rec-1' }) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: singleResult, error: null });
  const selectFn = vi.fn().mockReturnValue({ maybeSingle });

  const eqThenable: any = {
    eq: vi.fn().mockReturnThis(),
    select: selectFn,
    maybeSingle,
    then: vi.fn((onFulfilled: any) => Promise.resolve(onFulfilled ? onFulfilled({ data: singleResult, error: null }) : { data: singleResult, error: null })),
    catch: vi.fn(() => Promise.resolve({ data: singleResult, error: null })),
  };

  // Re-wire eq to return the same thenable object (supports .eq().eq())
  eqThenable.eq = vi.fn(() => eqThenable);

  return {
    insert: vi.fn().mockReturnValue({ select: selectFn }),
    update: vi.fn().mockReturnValue(eqThenable),
    delete: vi.fn().mockReturnValue(eqThenable),
    select: vi.fn().mockReturnValue(eqThenable),
    _eqThenable: eqThenable,
  };
}

describe('SpecialOutboundService', () => {
  let handlers: Record<string, ReturnType<typeof createMockTable>>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    handlers = {
      special_outbound_records: createMockTable({ id: 'rec-1' }),
      approval_logs: createMockTable({ id: 'log-1' }),
    };

    (supabase.from as any).mockImplementation((table: string) => handlers[table] ?? createMockTable());
  });

  describe('createRecord', () => {
    it('inserts the correct payload and writes a created approval log', async () => {
      const recordData = {
        date: '2026-08-13',
        product_id: 'prod-1',
        quantity: 5,
        unit: 'kg',
        reason: 'damage',
        reason_detail: 'broken seal',
        notes: 'test notes',
        requestedBy: 'evil-user',
        requested_by: 'evil-user-2',
        approval_status: 'approved',
        created_by: 'evil-creator',
        updated_by: 'evil-updater',
      };

      const result = await SpecialOutboundService.createRecord(recordData as any);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('special_outbound_records');
      expect(supabase.from).toHaveBeenCalledWith('approval_logs');

      const [newRecord] = handlers.special_outbound_records.insert.mock.calls[0][0];
      expect(newRecord).toMatchObject({
        date: '2026-08-13',
        product_id: 'prod-1',
        quantity: 5,
        unit: 'kg',
        reason: 'damage',
        reason_detail: 'broken seal',
        notes: 'test notes',
        approval_status: 'pending',
        requested_by: 'mock-user-id',
        company_id: 'mock-company-id',
        branch_id: 'mock-branch-id',
      });
      expect(newRecord).toHaveProperty('updated_at');
      expect(newRecord).not.toHaveProperty('created_by');
      expect(newRecord).not.toHaveProperty('updated_by');
      expect(newRecord).not.toHaveProperty('requestedBy');

      const [logPayload] = handlers.approval_logs.insert.mock.calls[0][0];
      expect(logPayload).toMatchObject({
        record_type: 'special_outbound',
        record_id: 'rec-1',
        action: 'created',
        status: 'pending',
        user_id: 'mock-user-id',
        user_name: 'Hệ thống',
        user_role: 'admin',
        comment: 'Tạo yêu cầu xuất đặc biệt',
      });
      expect(logPayload).not.toHaveProperty('company_id');
    });
  });

  describe('updateRecord', () => {
    it('updates only allowed fields and writes an updated approval log', async () => {
      const updates = {
        quantity: 20,
        reason: 'lost',
        company_id: 'evil-company',
        branch_id: 'evil-branch',
        created_by: 'evil-creator',
        updated_by: 'evil-updater',
        requestedBy: 'evil-requester',
      };

      const result = await SpecialOutboundService.updateRecord('rec-1', updates as any);

      expect(result.success).toBe(true);

      const [[updatePayload]] = handlers.special_outbound_records.update.mock.calls;
      expect(updatePayload).toMatchObject({
        quantity: 20,
        reason: 'lost',
      });
      expect(updatePayload).toHaveProperty('updated_at');
      expect(updatePayload).not.toHaveProperty('company_id');
      expect(updatePayload).not.toHaveProperty('branch_id');
      expect(updatePayload).not.toHaveProperty('created_by');
      expect(updatePayload).not.toHaveProperty('updated_by');
      expect(updatePayload).not.toHaveProperty('requestedBy');

      // The where clause should include id and company_id (tenant scoping)
      const eqCalls = handlers.special_outbound_records._eqThenable.eq.mock.calls;
      expect(eqCalls.map((c: any[]) => c[0])).toContain('id');
      expect(eqCalls.map((c: any[]) => c[0])).toContain('company_id');

      const [logPayload] = handlers.approval_logs.insert.mock.calls[0][0];
      expect(logPayload).toMatchObject({
        record_type: 'special_outbound',
        record_id: 'rec-1',
        action: 'updated',
        status: 'pending',
        user_id: 'mock-user-id',
        user_name: 'Hệ thống',
        user_role: 'admin',
        comment: 'Cập nhật yêu cầu xuất đặc biệt',
      });
    });
  });

  describe('approveRecord', () => {
    it('sets approval_status to approved, records approver, and writes an approved log', async () => {
      const result = await SpecialOutboundService.approveRecord('rec-1', 'Approved by manager');

      expect(result.success).toBe(true);

      const [[updatePayload]] = handlers.special_outbound_records.update.mock.calls;
      expect(updatePayload).toMatchObject({
        approval_status: 'approved',
        approved_by: 'mock-user-id',
      });
      expect(updatePayload).toHaveProperty('approved_at');
      expect(updatePayload).toHaveProperty('updated_at');

      const [logPayload] = handlers.approval_logs.insert.mock.calls[0][0];
      expect(logPayload).toMatchObject({
        record_type: 'special_outbound',
        record_id: 'rec-1',
        action: 'approved',
        status: 'approved',
        user_id: 'mock-user-id',
        user_name: 'Hệ thống',
        user_role: 'admin',
        comment: 'Approved by manager',
      });
    });
  });

  describe('rejectRecord', () => {
    it('sets approval_status to rejected, records rejection reason, and writes a rejected log', async () => {
      const result = await SpecialOutboundService.rejectRecord('rec-1', 'Out of stock');

      expect(result.success).toBe(true);

      const [[updatePayload]] = handlers.special_outbound_records.update.mock.calls;
      expect(updatePayload).toMatchObject({
        approval_status: 'rejected',
        approved_by: 'mock-user-id',
        rejection_reason: 'Out of stock',
      });
      expect(updatePayload).toHaveProperty('approved_at');
      expect(updatePayload).toHaveProperty('updated_at');

      const [logPayload] = handlers.approval_logs.insert.mock.calls[0][0];
      expect(logPayload).toMatchObject({
        record_type: 'special_outbound',
        record_id: 'rec-1',
        action: 'rejected',
        status: 'rejected',
        user_id: 'mock-user-id',
        user_name: 'Hệ thống',
        user_role: 'admin',
        comment: 'Out of stock',
      });
    });
  });

  describe('deleteRecord', () => {
    it('deletes approval logs first, then deletes the record scoped by company_id', async () => {
      const result = await SpecialOutboundService.deleteRecord('rec-1');

      expect(result.success).toBe(true);

      expect(handlers.approval_logs.delete).toHaveBeenCalled();
      expect(handlers.special_outbound_records.delete).toHaveBeenCalled();

      const alEqCalls = handlers.approval_logs._eqThenable.eq.mock.calls.map((c: any[]) => c[0]);
      expect(alEqCalls).toContain('record_id');

      const sorEqCalls = handlers.special_outbound_records._eqThenable.eq.mock.calls.map((c: any[]) => c[0]);
      expect(sorEqCalls).toContain('id');
      expect(sorEqCalls).toContain('company_id');
    });
  });
});
