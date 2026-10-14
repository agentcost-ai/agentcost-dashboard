"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChartSkeleton, MetricCardSkeleton } from "@/components/ui/Skeleton";
import { ReportDocument, type ReportTheme } from "@/components/reports/ReportDocument";
import {
  ReportRangePicker,
  type ReportRange,
} from "@/components/reports/ReportRangePicker";
import { exportReportCsv } from "@/lib/reportCsv";
import { downloadReportPdf } from "@/lib/reportPdf";
import { api, ExecutiveReport } from "@/lib/api";
import { cn, parseApiError } from "@/lib/utils";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

const THEME_KEY = "agentcost_report_theme";

const RANGE_LABELS: Record<string, string> = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
  mtd: "month to date",
};

function describeRange(range: ReportRange): string {
  if (range.start && range.end) return `${range.start} to ${range.end}`;
  return RANGE_LABELS[range.range ?? "30d"] ?? range.range ?? "the selected range";
}

function readTheme(): ReportTheme {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function ReportsPage() {
  const { isConfigured } = useApiConfiguration();
  const [range, setRange] = useState<ReportRange>({ range: "30d" });
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // When the report on screen was built, and for which range.
  const [builtAt, setBuiltAt] = useState<Date | null>(null);
  const [builtFor, setBuiltFor] = useState<ReportRange | null>(null);
  // Only the newest request may replace the report: switching range quickly
  // must not let a slower, older answer land last.
  const latestRequest = useRef(0);
  // How the sheet looks on screen. Exports and print are always light.
  const [theme, setTheme] = useState<ReportTheme>(readTheme);

  const chooseTheme = (next: ReportTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // A blocked store only costs the preference, not the page.
    }
  };

  const fetchReport = useCallback(async () => {
    if (!api.hasProjectAccess()) {
      setLoading(false);
      return;
    }
    const request = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExecutiveReport(range);
      if (request !== latestRequest.current) return;
      setReport(data);
      setBuiltAt(new Date());
      setBuiltFor(range);
      setShowOnboarding(false);
    } catch (err) {
      if (request !== latestRequest.current) return;
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
      if (request === latestRequest.current) setLoading(false);
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
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Reports</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost, usage, reliability and savings as one document you can hand over
          </p>
          <p className="mt-1 text-xs text-neutral-500" aria-live="polite">
            {loading
              ? `Building the report for ${describeRange(range)}…`
              : builtAt && builtFor
                ? `Showing ${describeRange(builtFor)} · updated ${builtAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReportRangePicker value={range} onChange={setRange} />
          <div
            role="group"
            aria-label="Report appearance"
            className="flex items-center gap-1 rounded-xl border border-white/6 bg-white/2 p-1"
          >
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => chooseTheme(option)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                  theme === option ? "bg-white/8 text-white" : "text-neutral-500 hover:text-neutral-300",
                )}
              >
                {option}
              </button>
            ))}
          </div>
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
            Export CSV
          </button>
          <button
            onClick={() => report && downloadReportPdf(report)}
            disabled={!report}
            className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            Export PDF
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
        // A new range is loading: keep the old report readable but plainly
        // out of date, rather than unchanged and indistinguishable.
        <div className="relative" aria-busy={loading}>
          {loading && (
            <div className="no-print sticky top-3 z-10 mb-3 flex justify-center print:hidden">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#141416]/95 px-3.5 py-1.5 text-[12.5px] text-neutral-200 shadow-lg">
                <RefreshCw size={13} className="animate-spin" />
                Updating to {describeRange(range)}
              </span>
            </div>
          )}
          <div className={cn("transition-opacity duration-200", loading && "pointer-events-none opacity-40")}>
            <ReportDocument report={report} theme={theme} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
