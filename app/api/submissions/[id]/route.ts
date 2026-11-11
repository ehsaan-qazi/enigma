import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { submissionService } from "@/modules/submissions/server/services/submission.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const submission = await submissionService.getSubmission(id, userId);
    return apiSuccess(submission);
  } catch (err) {
    return apiError(err);
  }
}
