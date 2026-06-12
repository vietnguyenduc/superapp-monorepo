import { IInvoiceData, InvoiceResult, InvoiceStatus } from '../types';

export interface IInvoiceProvider {
  /**
   * Khởi tạo kết nối / xác thực với nhà cung cấp (nếu cần)
   */
  authenticate?(): Promise<boolean>;

  /**
   * Gửi yêu cầu phát hành hóa đơn
   * @param data Dữ liệu đơn hàng/hóa đơn từ app Sales
   */
  issueInvoice(data: IInvoiceData): Promise<InvoiceResult>;

  /**
   * Lấy trạng thái của hóa đơn đã phát hành (để kiểm tra xem đã được CQT cấp mã chưa)
   * @param invoiceId Mã hóa đơn trả về từ hàm issueInvoice
   */
  getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus>;
}
