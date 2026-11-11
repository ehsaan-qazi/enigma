import { AssessmentReport } from "../types/report.types";

export async function getReport(id: string): Promise<AssessmentReport> {
  const res = await fetch(`/api/reports/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to load assessment report ${id}`);
  }

  const json = await res.json();
  const payload = json.data || json;
  return payload.report || payload;
}

export async function getReports(): Promise<AssessmentReport[]> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  const payload = json.data || json;
  return payload.reports || (Array.isArray(payload) ? payload : []);
}
