export async function getSubmission(id: string) {
  const response = await fetch(`/api/submissions/${id}`);

  if (!response.ok) {
    throw new Error("Unable to fetch submission");
  }

  return response.json();
}
