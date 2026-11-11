import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const nextQuestionData = await vivaService.getNextQuestion(id, userId);
    return apiSuccess(nextQuestionData);
  } catch (err) {
    return apiError(err);
  }
}
