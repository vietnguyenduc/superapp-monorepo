import { supabase } from '../lib/supabase';
import { isTrialMode } from '@superapp/shared-utils';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
      if (this.isTrial && fallbackOperation) {
        const res = await fallbackOperation();
        return { success: !res.error, data: res.data, error: res.error };
      }

      const { data, error } = await operation();

      if (error) {
        if (fallbackOperation) {
          console.warn('Database error, using fallback:', error);
          const res = await fallbackOperation();
          return { success: !res.error, data: res.data, error: res.error };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('Service execution error:', err);
      return { success: false, error: err.message || 'Đã xảy ra lỗi không xác định' };
    }
  }
}
