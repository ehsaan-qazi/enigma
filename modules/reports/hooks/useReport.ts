"use client";

import { useState, useEffect, useCallback } from "react";
import { AssessmentReport } from "../types/report.types";
import { getReport, getReports } from "../services/reports-api";

export function useReport(reportId?: string) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSingleReport = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReport(id);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to load viva assessment report.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReportsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reportId) {
      fetchSingleReport(reportId);
    } else {
      fetchReportsList();
    }
  }, [reportId, fetchSingleReport, fetchReportsList]);

  return {
    report,
    reports,
    isLoading,
    error,
    refresh: () => (reportId ? fetchSingleReport(reportId) : fetchReportsList()),
  };
}
