import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { reportService } from "@/modules/reports/server/services/report.service";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const reports = await reportService.listReports(userId);

    return apiSuccess({
      reports,
      count: reports.length,
    });
  } catch (err) {
    return apiError(err);
  }
}
