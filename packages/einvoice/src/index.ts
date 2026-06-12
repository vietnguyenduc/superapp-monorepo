export * from './types';
export * from './providers/base-provider';
export * from './providers/misa';
export * from './providers/viettel';
export * from './providers/vnpt';

import { InvoiceProviderType } from './types';
import { IInvoiceProvider } from './providers/base-provider';
import { MisaProvider } from './providers/misa';
import { ViettelProvider } from './providers/viettel';
import { VnptProvider } from './providers/vnpt';

export class EInvoiceFactory {
  /**
   * Khởi tạo Provider tương ứng dựa trên cấu hình
   * @param providerType Loại nhà cung cấp (MISA, VIETTEL, VNPT)
   * @param config Cấu hình (username, password, app_id...)
   */
  static createProvider(providerType: InvoiceProviderType, config: any): IInvoiceProvider {
    switch (providerType) {
      case InvoiceProviderType.MISA:
        return new MisaProvider(config);
      case InvoiceProviderType.VIETTEL:
        return new ViettelProvider(config);
      case InvoiceProviderType.VNPT:
        return new VnptProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }
  }
}
