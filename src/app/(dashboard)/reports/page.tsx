"use client";

import { useState, useEffect, useCallback } from "react";
import { FileDown, Printer, RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChartSkeleton, MetricCardSkeleton } from "@/components/ui/Skeleton";
import { ReportDocument } from "@/components/reports/ReportDocument";
import {
  ReportRangePicker,
  type ReportRange,
} from "@/components/reports/ReportRangePicker";
import { exportReportCsv } from "@/lib/reportCsv";
import { downloadReportPdf } from "@/lib/reportPdf";
import { api, ExecutiveReport } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

export default function ReportsPage() {
  const { isConfigured } = useApiConfiguration();
  const [range, setRange] = useState<ReportRange>({ range: "30d" });
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!api.isConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExecutiveReport(range);
      setReport(data);
      setShowOnboarding(false);
    } catch (err) {
      const msg = parseApiError(err);
      if (
        msg.includes("401") ||
        msg.includes("Invalid API key") ||
        msg.includes("session has expired")
      ) {
        setShowOnboarding(true);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header / controls — excluded from print */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
            <FileText size={22} className="text-sky-400" />
            Reports
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            A board-ready breakdown of cost, usage, reliability and savings
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReportRangePicker value={range} onChange={setRange} />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/6 px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:border-white/12 hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => report && exportReportCsv(report)}
            disabled={!report}
            className="flex items-center gap-2 rounded-lg border border-white/6 px-3 py-1.5 text-[13px] text-neutral-300 transition-colors hover:border-white/12 hover:text-white disabled:opacity-50"
          >
            <FileDown size={14} /> CSV
          </button>
          <button
            onClick={() => report && downloadReportPdf(report)}
            disabled={!report}
            className="flex items-center gap-2 rounded-lg bg-sky-500/15 px-3 py-1.5 text-[13px] font-medium text-sky-300 transition-colors hover:bg-sky-500/25 disabled:opacity-50"
          >
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </div>

      {error && (
        <Card className="no-print border-red-900/50 bg-red-950/20 print:hidden">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-sm text-neutral-400">
            Make sure the backend is running and accessible.
          </p>
        </Card>
      )}

      {loading && !report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <Card>
            <ChartSkeleton />
          </Card>
        </div>
      ) : report ? (
        <ReportDocument report={report} />
      ) : null}
    </div>
  );
}
