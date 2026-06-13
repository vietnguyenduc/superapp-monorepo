import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useSearchDebounce, useFormDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('does not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' });
    
    // Value should still be 'hello' before delay
    expect(result.current).toBe('hello');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world');
  });

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(200); });
    
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(200); });
    
    rerender({ value: 'd' });
    act(() => { vi.advanceTimersByTime(500); });

    // Should be the last value, not intermediate ones
    expect(result.current).toBe('d');
  });
});

describe('useSearchDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses default 300ms delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSearchDebounce(value),
      { initialProps: { value: 'test' } }
    );

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('updated');
  });
});

describe('useFormDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses default 500ms delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFormDebounce(value),
      { initialProps: { value: { name: 'John' } } }
    );

    rerender({ value: { name: 'Jane' } });
    act(() => { vi.advanceTimersByTime(500); });

    expect(result.current).toEqual({ name: 'Jane' });
  });
});
