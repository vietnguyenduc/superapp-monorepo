import { BaseService } from "@superapp/shared-utils";

export class ReportService extends BaseService {
  static async getReports() {
    return { data: [], error: null };
  }
}

export const reportService = {
  getReports: ReportService.getReports.bind(ReportService),
};
