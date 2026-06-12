import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService } from './baseService';

// Use vi.hoisted to run before any imports — defines localStorage on globalThis
const { localStorageMock } = vi.hoisted(() => {
  const store: Record<string, string> = {};
  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true,
  });
  return { localStorageMock: mock };
});

describe('BaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('isTrial', () => {
    it('returns true when localStorage has isTrial=true', () => {
      localStorageMock.getItem.mockReturnValue('true');
      expect((BaseService as any).isTrial).toBe(true);
    });

    it('returns false when localStorage has isTrial=false', () => {
      localStorageMock.getItem.mockReturnValue('false');
      expect((BaseService as any).isTrial).toBe(false);
    });

    it('returns false when localStorage has no isTrial', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect((BaseService as any).isTrial).toBe(false);
    });
  });

  describe('execute', () => {
    it('returns success response when operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test' }, error: null });

      const result = await BaseService['execute'](operation);

      expect(result).toEqual({
        success: true,
        data: { id: '1', name: 'Test' },
      });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('returns error response when operation fails without fallback', async () => {
      const operation = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });

      const result = await BaseService['execute'](operation);

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      });
    });

    it('uses fallback when operation fails and fallback is provided', async () => {
      const operation = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });
      const fallbackOperation = vi.fn().mockResolvedValue({ data: { id: 'fb-1', name: 'Fallback' }, error: null });

      const result = await BaseService['execute'](operation, fallbackOperation);

      expect(result).toEqual({
        success: true,
        data: { id: 'fb-1', name: 'Fallback' },
      });
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallbackOperation).toHaveBeenCalledTimes(1);
    });

    it('uses fallback when in trial mode', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      const operation = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      const fallbackOperation = vi.fn().mockResolvedValue({ data: { id: 'fb-1' }, error: null });

      const result = await BaseService['execute'](operation, fallbackOperation);

      // In trial mode, should skip operation and go directly to fallback
      expect(result).toEqual({
        success: true,
        data: { id: 'fb-1' },
      });
      expect(operation).not.toHaveBeenCalled();
      expect(fallbackOperation).toHaveBeenCalledTimes(1);
    });

    it('returns fallback error when fallback also fails', async () => {
      const operation = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const fallbackOperation = vi.fn().mockResolvedValue({ data: null, error: 'Fallback also failed' });

      const result = await BaseService['execute'](operation, fallbackOperation);

      expect(result).toEqual({
        success: false,
        error: 'Fallback also failed',
      });
    });

    it('catches thrown errors and returns error response', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Unexpected crash'));

      const result = await BaseService['execute'](operation);

      expect(result).toEqual({
        success: false,
        error: 'Unexpected crash',
      });
    });

    it('returns generic error message when error has no message', async () => {
      const operation = vi.fn().mockRejectedValue({ code: 500 });

      const result = await BaseService['execute'](operation);

      expect(result).toEqual({
        success: false,
        error: 'Đã xảy ra lỗi không xác định',
      });
    });

    it('logs warning when falling back due to database error', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const operation = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const fallbackOperation = vi.fn().mockResolvedValue({ data: 'ok', error: null });

      await BaseService['execute'](operation, fallbackOperation);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Database error, using fallback:', { message: 'DB error' });
      consoleWarnSpy.mockRestore();
    });
  });
});
