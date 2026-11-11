import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";
import { submitResponseRequestSchema } from "@/modules/viva/server/validators/viva.validator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = submitResponseRequestSchema.parse(body);

    const result = await vivaService.submitResponse(id, userId, validatedData);
    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
