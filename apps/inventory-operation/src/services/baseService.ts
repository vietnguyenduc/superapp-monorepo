import { isTrialMode } from '@superapp/shared-utils';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
  count?: number | null;
  skipped?: any[];
}

/**
 * Normalize error to string — fallback operations may return { message: "..." }
 * which React cannot render as a child (error #31).
 */
function normalizeError(err: any): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.message) return JSON.stringify(err.message);
  return String(err);
}

export abstract class BaseService {
  protected static get isTrial(): boolean {
    return isTrialMode();
  }

  protected static async execute<T>(
    operation: () => Promise<any>,
    fallbackOperation?: () => Promise<any>
  ): Promise<ServiceResponse<T>> {
    try {
      // Trial mode uses localStorage mock data instead of the real backend.
      if (this.isTrial && fallbackOperation) {
        const res = await fallbackOperation();
        const error = normalizeError(res.error);
        return { success: !error, data: res.data, error, errors: res.errors, count: res.count, skipped: res.skipped };
      }

      const { data, error, errors, count, skipped } = await operation();

      if (error) {
        return { success: false, error: normalizeError(error), errors, skipped };
      }

      return { success: true, data, errors, count, skipped };
    } catch (err: any) {
      console.error('Service execution error:', err);
      return { success: false, error: normalizeError(err) || 'Đã xảy ra lỗi không xác định' };
    }
  }
}
