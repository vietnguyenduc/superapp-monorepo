import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInventory } from '../useInventory';
import { InventoryService } from '../../services/inventoryService';
import { fallbackService } from '../../services/fallbackService';

vi.mock('../../services/inventoryService', () => ({
  InventoryService: {
    getInventoryRecords: vi.fn(),
    createInventoryRecord: vi.fn(),
    updateInventoryRecord: vi.fn(),
    deleteInventoryRecord: vi.fn(),
    importInventoryRecords: vi.fn(),
    getInventorySummary: vi.fn(),
  },
}));

vi.mock('../../services/fallbackService', () => ({
  fallbackService: {
    getInventoryRecords: vi.fn(),
    createInventoryRecord: vi.fn(),
  },
}));

vi.mock('../../data/trialMockData', () => ({
  getTrialInventoryRecords: vi.fn(() => []),
  saveTrialInventoryRecords: vi.fn(),
  seedTrialDataIfNeeded: vi.fn(),
}));

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with empty records and loading state', () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useInventory());

    expect(result.current.records).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads records from database on mount', async () => {
    const mockRecords = [
      { id: '1', productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() },
    ];

    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: mockRecords });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].productCode).toBe('SP001');
  });

  it('loads from trial mode when isTrial is set', async () => {
    localStorage.setItem('isTrial', 'true');

    const { getTrialInventoryRecords } = await import('../../data/trialMockData');
    (getTrialInventoryRecords as any).mockReturnValue([
      { id: 't1', productCode: 'TR001', productName: 'Trial', rawMaterialStock: 5, date: new Date() },
    ]);

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].productCode).toBe('TR001');
  });

  it('falls back to fallbackService when database fails', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: false, error: 'DB error', data: null });

    const fallbackData = [{ id: 'f1', productCode: 'FB001', productName: 'Fallback', rawMaterialStock: 3, date: new Date() }];
    (fallbackService.getInventoryRecords as any).mockResolvedValue({ data: fallbackData, error: null });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.records).toHaveLength(1);
    expect(fallbackService.getInventoryRecords).toHaveBeenCalled();
  });

  it('sets error when both sources fail', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: false, error: 'DB error', data: null });
    (fallbackService.getInventoryRecords as any).mockResolvedValue({ data: null, error: 'Fallback error' });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });

  it('creates a record and prepends to list', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [] });

    const newRecord = { id: 'n1', productCode: 'SP001', productName: 'New', rawMaterialStock: 20, date: new Date() };
    (InventoryService.createInventoryRecord as any).mockResolvedValue({ success: true, data: newRecord });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult;
    await act(async () => {
      createResult = await result.current.createRecord({
        productCode: 'SP001',
        productName: 'New',
        rawMaterialStock: 20,
        date: new Date(),
      } as any);
    });

    expect(createResult.success).toBe(true);
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].productCode).toBe('SP001');
  });

  it('creates record in trial mode via fallbackService', async () => {
    localStorage.setItem('isTrial', 'true');
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [] });

    const newRecord = { id: 't1', productCode: 'TR001', productName: 'Trial', rawMaterialStock: 10, date: new Date() };
    (fallbackService.createInventoryRecord as any).mockResolvedValue({ data: newRecord, error: null });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult;
    await act(async () => {
      createResult = await result.current.createRecord({
        productCode: 'TR001',
        productName: 'Trial',
        rawMaterialStock: 10,
        date: new Date(),
      } as any);
    });

    expect(createResult.success).toBe(true);
    expect(fallbackService.createInventoryRecord).toHaveBeenCalled();
  });

  it('updates a record', async () => {
    const existingRecord = { id: '1', productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() };
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [existingRecord] });
    (InventoryService.updateInventoryRecord as any).mockResolvedValue({ success: true, data: { rawMaterialStock: 20 } });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateRecord('1', { rawMaterialStock: 20 });
    });

    expect(result.current.records[0].rawMaterialStock).toBe(20);
  });

  it('deletes a record', async () => {
    const existingRecord = { id: '1', productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() };
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [existingRecord] });
    (InventoryService.deleteInventoryRecord as any).mockResolvedValue({ success: true, data: true });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records).toHaveLength(1);

    await act(async () => {
      await result.current.deleteRecord('1');
    });

    expect(result.current.records).toHaveLength(0);
  });

  it('imports multiple records', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [] });

    const importedRecords = [
      { id: 'i1', productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() },
    ];
    (InventoryService.importInventoryRecords as any).mockResolvedValue({ success: true, data: importedRecords, count: 1 });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let importResult;
    await act(async () => {
      importResult = await result.current.importRecords([{ productCode: 'SP001', productName: 'A', rawMaterialStock: 10 } as any]);
    });

    expect(importResult.success).toBe(true);
    expect(importResult.count).toBe(1);
  });

  it('gets inventory summary', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: true, data: [] });
    (InventoryService.getInventorySummary as any).mockResolvedValue({
      success: true,
      data: [{ productCode: 'SP001', totalInput: 100 }],
    });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let summaryResult;
    await act(async () => {
      summaryResult = await result.current.getSummary(new Date('2024-01-01'), new Date('2024-01-31'));
    });

    expect(summaryResult.success).toBe(true);
    expect(summaryResult.data).toHaveLength(1);
  });

  it('clearError resets error state', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValue({ success: false, error: 'Some error', data: null });
    (fallbackService.getInventoryRecords as any).mockResolvedValue({ data: null, error: 'Fallback error' });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('refresh reloads records', async () => {
    (InventoryService.getInventoryRecords as any).mockResolvedValueOnce({ success: true, data: [{ id: '1', productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() }] });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records).toHaveLength(1);

    (InventoryService.getInventoryRecords as any).mockResolvedValueOnce({ success: true, data: [{ id: '2', productCode: 'SP002', productName: 'B', rawMaterialStock: 20, date: new Date() }] });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].productCode).toBe('SP002');
  });
});
