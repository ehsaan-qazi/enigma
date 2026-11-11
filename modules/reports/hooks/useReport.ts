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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load viva assessment report.";
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load reports list.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        if (reportId) {
          const data = await getReport(reportId);
          if (!ignore) setReport(data);
        } else {
          const data = await getReports();
          if (!ignore) setReports(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to load reports.";
          setError(message);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reportId]);

  return {
    report,
    reports,
    isLoading,
    error,
    refresh: () => (reportId ? fetchSingleReport(reportId) : fetchReportsList()),
  };
}
