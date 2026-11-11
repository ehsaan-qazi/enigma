import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { submissionService } from "@/modules/submissions/server/services/submission.service";
import { uploadUrlRequestSchema } from "@/modules/submissions/server/validators/submission.validator";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const validatedData = uploadUrlRequestSchema.parse(body);

    const result = await submissionService.createUploadUrl(userId, validatedData);
    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
