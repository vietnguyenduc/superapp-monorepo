"use client";

import { useEffect } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useSupabaseClient } from './useSupabaseClient';

interface UseRealtimeSubscriptionProps<T extends { [key: string]: any }> {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onAny?: (payload: RealtimePostgresChangesPayload<T>) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T extends { [key: string]: any }>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onAny,
  enabled = true,
}: UseRealtimeSubscriptionProps<T>) {
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!enabled) return;

    const channel: RealtimeChannel = supabase.channel(`public:${table}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (onAny) onAny(payload);
          if (payload.eventType === 'INSERT' && onInsert) onInsert(payload);
          if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload);
          if (payload.eventType === 'DELETE' && onDelete) onDelete(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, schema, event, filter, enabled, onInsert, onUpdate, onDelete, onAny]);
}
