import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";
import { vivaAudioUploadUrlSchema } from "@/modules/viva/server/validators/viva.validator";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const validatedData = vivaAudioUploadUrlSchema.parse(body);

    const result = await vivaService.createAudioUploadUrl(userId, validatedData);
    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
