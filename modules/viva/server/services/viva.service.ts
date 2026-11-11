export async function initiateViva(submissionId: string, userId: string) {
  // Verify submission ownership.
  // Verify submission is ready.
  // Create viva session.
  // Request or retrieve generated questions.
  // Persist initial assessment state.
  // Return the session.
  return { submissionId, userId, status: "created" as const };
}
