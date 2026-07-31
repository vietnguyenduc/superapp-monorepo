export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
}

export abstract class BaseService {
  protected static get isTrial(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isTrial') === 'true' ||
           localStorage.getItem('superapp_trial_mode') === 'true' ||
           localStorage.getItem('cashflow_trial_mode_enabled') === 'true' ||
           !!localStorage.getItem('cashflow_trial_user');
  }

  protected static async execute<T>(
    operation: () => Promise<any>,
    fallbackOperation?: () => Promise<any>
  ): Promise<ServiceResponse<T>> {
    try {
      if (this.isTrial && fallbackOperation) {
        const res = await fallbackOperation();
        return { success: !res.error, data: res.data, error: res.error, errors: res.errors };
      }

      const { data, error, errors } = await operation();

      if (error) {
        if (fallbackOperation) {
          console.warn('Database error, using fallback:', error);
          const res = await fallbackOperation();
          return { success: !res.error, data: res.data, error: res.error, errors: res.errors };
        }
        return { success: false, error: error.message, errors };
      }

      return { success: true, data, errors };
    } catch (err: any) {
      console.error('Service execution error:', err);
      return { success: false, error: err.message || 'Đã xảy ra lỗi không xác định' };
    }
  }
}
