export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
  count?: number | null;
  skipped?: any[];
}

/**
 * Check if the app is running in trial mode.
 * Trial mode can be activated by any of these localStorage flags:
 * - `isTrial` = 'true' (legacy)
 * - `superapp_trial_mode` = 'true' OR a JSON object (set by Admin Portal trial launcher)
 * - `cashflow_trial_mode_enabled` = 'true'
 * - `cashflow_trial_user` = any non-null value (set by Cashflow trial mode)
 *
 * Use this helper everywhere trial mode is checked, instead of hardcoding
 * a single localStorage key — different apps/setters use different flags.
 */
export function isTrialMode(): boolean {
  if (typeof window === 'undefined') return false;
  const sm = localStorage.getItem('superapp_trial_mode');
  return localStorage.getItem('isTrial') === 'true' ||
         sm === 'true' || !!sm || // superapp_trial_mode may be 'true' or a JSON object
         localStorage.getItem('cashflow_trial_mode_enabled') === 'true' ||
         !!localStorage.getItem('cashflow_trial_user');
}

export abstract class BaseService {
  protected static get isTrial(): boolean {
    return isTrialMode();
  }

  // Normalize error to string — fallback operations may return { message: "..." }
  // which React cannot render as a child (error #31).
  private static normalizeError(err: any): string | undefined {
    if (!err) return undefined;
    if (typeof err === 'string') return err;
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.message) return JSON.stringify(err.message);
    return String(err);
  }

  protected static async execute<T>(
    operation: () => Promise<any>,
    fallbackOperation?: () => Promise<any>
  ): Promise<ServiceResponse<T>> {
    try {
      // Trial mode uses localStorage mock data instead of the real backend.
      if (this.isTrial && fallbackOperation) {
        const res = await fallbackOperation();
        const error = this.normalizeError(res.error);
        return { success: !error, data: res.data, error, errors: res.errors, count: res.count, skipped: res.skipped };
      }

      const { data, error, errors, count, skipped } = await operation();

      if (error) {
        return { success: false, error: this.normalizeError(error), errors, skipped };
      }

      return { success: true, data, errors, count, skipped };
    } catch (err: any) {
      console.error('Service execution error:', err);
      return { success: false, error: this.normalizeError(err) || 'Đã xảy ra lỗi không xác định' };
    }
  }
}
