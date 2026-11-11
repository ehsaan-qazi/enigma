import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { submissionService } from "@/modules/submissions/server/services/submission.service";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const submissions = await submissionService.listSubmissions(userId);
    return apiSuccess(submissions);
  } catch (err) {
    return apiError(err);
  }
}
