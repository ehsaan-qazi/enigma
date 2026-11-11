import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const sessions = await vivaService.listVivaSessionsWithSubmissions(userId);
    return apiSuccess({ sessions });
  } catch (err) {
    return apiError(err);
  }
}
