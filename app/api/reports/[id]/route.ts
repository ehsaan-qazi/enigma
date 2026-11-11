import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { reportService } from "@/modules/reports/server/services/report.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const cleanId = id.startsWith("rep_") ? id.slice(4) : id;

    const report = await reportService.generateReport(cleanId, userId);
    return apiSuccess({
      report,
      ...report,
    });
  } catch (err) {
    return apiError(err);
  }
}
