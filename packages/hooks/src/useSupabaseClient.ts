import { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@repo/types';
import { createSupabaseClient, getSupabaseClient } from '@superapp/shared-utils';

export function useSupabaseClient(url?: string, anonKey?: string): SupabaseClient<Database> {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(() => {
    try {
      return getSupabaseClient();
    } catch {
      if (url && anonKey) {
        return createSupabaseClient(url, anonKey);
      }
      return null;
    }
  });

  useEffect(() => {
    if (!client && url && anonKey) {
      setClient(createSupabaseClient(url, anonKey));
    }
  }, [url, anonKey, client]);

  if (!client) {
    throw new Error('Supabase client not initialized and credentials not provided.');
  }

  return client;
}
