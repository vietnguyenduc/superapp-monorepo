export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
  count?: number | null;
}

export abstract class BaseService {
  protected static get isTrial(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isTrial') === 'true' ||
           localStorage.getItem('superapp_trial_mode') === 'true' ||
           localStorage.getItem('cashflow_trial_mode_enabled') === 'true' ||
           !!localStorage.getItem('cashflow_trial_user');
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
        return { success: !error, data: res.data, error, errors: res.errors, count: res.count };
      }

      const { data, error, errors, count } = await operation();

      if (error) {
        return { success: false, error: this.normalizeError(error), errors };
      }

      return { success: true, data, errors, count };
    } catch (err: any) {
      console.error('Service execution error:', err);
      return { success: false, error: this.normalizeError(err) || 'Đã xảy ra lỗi không xác định' };
    }
  }
}
