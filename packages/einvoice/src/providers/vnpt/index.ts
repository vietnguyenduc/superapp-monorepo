import { IInvoiceProvider } from '../base-provider';
import { IInvoiceData, InvoiceResult, InvoiceStatus } from '../../types';

export class VnptProvider implements IInvoiceProvider {
  private username: string;
  private pass: string;
  private taxCode: string;

  constructor(config: { username: string; pass: string; taxCode: string }) {
    this.username = config.username;
    this.pass = config.pass;
    this.taxCode = config.taxCode;
  }

  async authenticate(): Promise<boolean> {
    console.log(`[VNPT] Authenticating...`);
    // TODO: Call VNPT Auth Service
    return true;
  }

  async issueInvoice(data: IInvoiceData): Promise<InvoiceResult> {
    console.log(`[VNPT] Issuing invoice for order: ${data.orderId}`);
    
    // MOCK DATA: Giả lập trả về thành công
    return {
      success: true,
      invoiceId: `VNPT-INV-${Date.now()}`,
      invoiceNo: `1/001/C22T${Math.floor(Math.random() * 10000)}`,
      transactionId: `VNPT-TX-${Date.now()}`,
      lookupCode: `VNPT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      lookupUrl: 'https://vinvoice.vnpt.vn/tra-cuu',
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
    console.log(`[VNPT] Checking status for invoice: ${invoiceId}`);
    return {
      status: 'ISSUED',
      cqtCode: `CQT-VNPT-${Math.floor(Math.random() * 1000000)}`,
      issueDate: new Date(),
    };
  }
}
