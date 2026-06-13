import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('returns correct initial values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(10);
    expect(result.current.startIdx).toBe(0);
    expect(result.current.endIdx).toBe(10);
  });

  it('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 25, initialPageSize: 10 }));
    expect(result.current.totalPages).toBe(3);
  });

  it('handles zero items', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 0 }));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.startIdx).toBe(0);
    expect(result.current.endIdx).toBe(0);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));
    
    act(() => { result.current.nextPage(); });
    expect(result.current.currentPage).toBe(2);
    expect(result.current.startIdx).toBe(10);
    expect(result.current.endIdx).toBe(20);
  });

  it('navigates to previous page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));
    
    act(() => { result.current.goToPage(3); });
    expect(result.current.currentPage).toBe(3);
    
    act(() => { result.current.prevPage(); });
    expect(result.current.currentPage).toBe(2);
  });

  it('does not go below page 1', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));
    
    act(() => { result.current.prevPage(); });
    expect(result.current.currentPage).toBe(1);
  });

  it('does not go above totalPages', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 50 }));
    
    act(() => { result.current.goToPage(10); });
    expect(result.current.currentPage).toBe(5); // totalPages = 5
  });

  it('goes to specific page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => { result.current.goToPage(5); });
    expect(result.current.currentPage).toBe(5);
    expect(result.current.startIdx).toBe(40);
    expect(result.current.endIdx).toBe(50);
  });

  it('changes page size', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));
    
    act(() => { result.current.setPageSize(20); });
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
  });

  it('handles custom initial page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 3 }));
    expect(result.current.currentPage).toBe(3);
    expect(result.current.startIdx).toBe(20);
  });
});
