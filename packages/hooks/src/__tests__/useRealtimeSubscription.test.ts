﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the useSupabaseClient hook
vi.mock('../useSupabaseClient', () => ({
  useSupabaseClient: vi.fn(),
}));

import { useSupabaseClient } from '../useSupabaseClient';

describe('useRealtimeSubscription', () => {
  let mockChannel: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
  let mockSupabase: { channel: ReturnType<typeof vi.fn>; removeChannel: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    };
    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    };
    (useSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  it('should create a channel subscription', async () => {
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
      })
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith('public:test_table');
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should not subscribe when disabled', async () => {
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        enabled: false,
      })
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('should clean up channel on unmount', async () => {
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    const { unmount } = renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
      })
    );

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(1);
  });

  it('should pass filter to channel config', async () => {
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        filter: 'column=eq.value',
      })
    );

    // Verify the on callback was called with the right args
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'test_table',
        filter: 'column=eq.value',
      }),
      expect.any(Function)
    );
  });

  it('should call onInsert for INSERT events', async () => {
    const onInsert = vi.fn();
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        onInsert,
      })
    );

    // Get the callback that was passed to channel.on
    const callback = mockChannel.on.mock.calls[0][2];

    // Simulate an INSERT event
    callback({ eventType: 'INSERT', new: { id: 1 }, old: {} });

    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INSERT', new: { id: 1 } })
    );
  });

  it('should call onUpdate for UPDATE events', async () => {
    const onUpdate = vi.fn();
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        onUpdate,
      })
    );

    const callback = mockChannel.on.mock.calls[0][2];
    callback({ eventType: 'UPDATE', new: { id: 1, name: 'updated' }, old: { id: 1, name: 'original' } });

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'UPDATE' })
    );
  });

  it('should call onDelete for DELETE events', async () => {
    const onDelete = vi.fn();
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        onDelete,
      })
    );

    const callback = mockChannel.on.mock.calls[0][2];
    callback({ eventType: 'DELETE', new: {}, old: { id: 1 } });

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'DELETE' })
    );
  });

  it('should call onAny for all events', async () => {
    const onAny = vi.fn();
    const { useRealtimeSubscription } = await import('../useRealtimeSubscription');

    renderHook(() =>
      useRealtimeSubscription({
        table: 'test_table',
        onAny,
      })
    );

    const callback = mockChannel.on.mock.calls[0][2];
    callback({ eventType: 'INSERT', new: { id: 1 }, old: {} });

    expect(onAny).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INSERT' })
    );
  });
});
