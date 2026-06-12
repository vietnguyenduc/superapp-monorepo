import { IInvoiceProvider } from '../base-provider';
import { IInvoiceData, InvoiceResult, InvoiceStatus } from '../../types';

export class MisaProvider implements IInvoiceProvider {
  private appId: string;
  private appSecret: string;
  private taxCode: string;

  constructor(config: { appId: string; appSecret: string; taxCode: string }) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.taxCode = config.taxCode;
  }

  async authenticate(): Promise<boolean> {
    console.log(`[MISA] Authenticating for tax code: ${this.taxCode}...`);
    // TODO: Call MISA /api/v1/auth to get token
    return true;
  }

  async issueInvoice(data: IInvoiceData): Promise<InvoiceResult> {
    console.log(`[MISA] Issuing invoice for order: ${data.orderId}`);
    
    // MOCK DATA: Giả lập trả về thành công
    return {
      success: true,
      invoiceId: `MISA-INV-${Date.now()}`,
      invoiceNo: `1/001/C22T${Math.floor(Math.random() * 10000)}`,
      transactionId: `TX-${Date.now()}`,
      lookupCode: `MISA-${Math.random().toString(36).substring(7).toUpperCase()}`,
      lookupUrl: 'https://meinvoice.vn/tra-cuu',
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
    console.log(`[MISA] Checking status for invoice: ${invoiceId}`);
    return {
      status: 'ISSUED',
      cqtCode: `CQT-${Math.floor(Math.random() * 1000000)}`,
      issueDate: new Date(),
    };
  }
}
