/// <reference types="vite/client" />
export interface ApiClientInit {
  get apiClient(): any;
  initializeApiClient(): Promise<void>;
}

export function createApiClient(supabase: any): ApiClientInit {
  // Kept as a compatibility wrapper while callers migrate to `supabase`.
  // All seven apps now use Supabase cloud for both auth and data operations.
  async function initializeApiClient(): Promise<void> {
    return Promise.resolve();
  }

  return {
    get apiClient() {
      return supabase;
    },
    initializeApiClient,
  };
}
