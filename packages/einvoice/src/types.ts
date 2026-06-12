export interface IInvoiceItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  unit: string;
}

export interface IInvoiceData {
  orderId: string;
  customerName: string;
  customerTaxCode?: string;
  customerAddress?: string;
  customerEmail?: string;
  issueDate: Date;
  items: IInvoiceItem[];
  totalAmountWithoutTax: number;
  totalTaxAmount: number;
  totalAmountWithTax: number;
  paymentMethod: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNo?: string;
  transactionId?: string;
  lookupCode?: string;
  lookupUrl?: string;
  error?: string;
  rawResponse?: any;
}

export interface InvoiceStatus {
  status: 'PENDING' | 'ISSUED' | 'ERROR' | 'CANCELLED';
  issueDate?: Date;
  cqtCode?: string; // Mã của cơ quan thuế
  rawResponse?: any;
}

export enum InvoiceProviderType {
  MISA = 'misa',
  VIETTEL = 'viettel',
  VNPT = 'vnpt'
}
