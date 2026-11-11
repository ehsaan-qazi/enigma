import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { submissionService } from "@/modules/submissions/server/services/submission.service";
import { completeUploadRequestSchema } from "@/modules/submissions/server/validators/submission.validator";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const validatedData = completeUploadRequestSchema.parse(body);

    const submission = await submissionService.completeUpload(
      validatedData.submissionId,
      userId
    );
    return apiSuccess(submission);
  } catch (err) {
    return apiError(err);
  }
}
