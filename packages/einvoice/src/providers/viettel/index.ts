import { IInvoiceProvider } from '../base-provider';
import { IInvoiceData, InvoiceResult, InvoiceStatus } from '../../types';

export class ViettelProvider implements IInvoiceProvider {
  private username: string;
  private pass: string;
  private taxCode: string;

  constructor(config: { username: string; pass: string; taxCode: string }) {
    this.username = config.username;
    this.pass = config.pass;
    this.taxCode = config.taxCode;
  }

  async authenticate(): Promise<boolean> {
    console.log(`[VIETTEL] Authenticating...`);
    // TODO: Call Viettel Auth Service
    return true;
  }

  async issueInvoice(data: IInvoiceData): Promise<InvoiceResult> {
    console.log(`[VIETTEL] Issuing invoice for order: ${data.orderId}`);
    
    // MOCK DATA: Giả lập trả về thành công
    return {
      success: true,
      invoiceId: `VT-INV-${Date.now()}`,
      invoiceNo: `1/001/C22T${Math.floor(Math.random() * 10000)}`,
      transactionId: `VT-TX-${Date.now()}`,
      lookupCode: `VT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      lookupUrl: 'https://sinvoice.viettel.vn/tra-cuu',
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
    console.log(`[VIETTEL] Checking status for invoice: ${invoiceId}`);
    return {
      status: 'ISSUED',
      cqtCode: `CQT-VT-${Math.floor(Math.random() * 1000000)}`,
      issueDate: new Date(),
    };
  }
}
