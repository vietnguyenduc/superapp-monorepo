import { apiClient as _rawApiClient, configureApiClient as _configureApiClient, getApiUrl } from "./";

export interface ApiClientInit {
  get apiClient(): any;
  initializeApiClient(): Promise<void>;
}

function isProductionHost(): boolean {
  return typeof window !== "undefined" && window.location?.hostname?.endsWith(".appforyou.xyz");
}

function isLocalInsForgeUrl(url: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)/i.test(url);
}

async function checkInsForgeHealth(apiUrl: string): Promise<boolean> {
  if (!isLocalInsForgeUrl(apiUrl)) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${apiUrl}/health`, { signal: controller.signal, method: "GET" });
    clearTimeout(timeoutId);
    return res.status === 200;
  } catch {
    return false;
  }
}

export function createApiClient(supabase: any): ApiClientInit {
  _configureApiClient({
    tokenGetter: async () => {
      try {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
      } catch {
        return null;
      }
    },
  });

  let apiClient: any = supabase;

  async function initializeApiClient(): Promise<void> {
    if (typeof window === "undefined") return;
    if (isProductionHost()) return;

    const apiUrl = getApiUrl();
    if (await checkInsForgeHealth(apiUrl)) {
      console.info("[createApiClient] Local InsForge API available; routing data through it.");
      apiClient = _rawApiClient;
    } else {
      console.warn("[createApiClient] Local InsForge API not reachable; using Supabase cloud.");
    }
  }

  // Fire-and-forget on module load so data calls use the right backend as soon as possible.
  initializeApiClient().catch(() => {});

  return {
    get apiClient() {
      return apiClient;
    },
    initializeApiClient,
  };
}
