"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  MessageSquare,
  MessageSquarePlus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  MessageCircle,
  Send,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  Bug,
  Cpu,
  HelpCircle,
  Gauge,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import FileUpload from "@/components/ui/FileUpload";
import { useAuth } from "@/contexts/AuthContext";
import {
  api,
  FeedbackItem,
  FeedbackSummaryResponse,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackComment,
  AttachmentMeta,
} from "@/lib/api";
import { formatRelativeTime, parseApiError } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TYPE_META: Record<
  FeedbackType,
  { label: string; icon: typeof Lightbulb; color: string }
> = {
  feature_request: {
    label: "Feature request",
    icon: Lightbulb,
    color: "text-amber-400",
  },
  bug_report: { label: "Bug report", icon: Bug, color: "text-red-400" },
  model_request: { label: "Model request", icon: Cpu, color: "text-cyan-400" },
  general: {
    label: "General feedback",
    icon: HelpCircle,
    color: "text-neutral-400",
  },
  security_report: {
    label: "Security report",
    icon: ShieldAlert,
    color: "text-orange-400",
  },
  performance_issue: {
    label: "Performance issue",
    icon: Gauge,
    color: "text-purple-400",
  },
};

const STATUS_STYLES: Record<
  FeedbackStatus,
  { label: string; variant: "gray" | "info" | "success" | "warning" | "error" }
> = {
  open: { label: "Open", variant: "gray" },
  under_review: { label: "Under review", variant: "info" },
  needs_info: { label: "Needs info", variant: "warning" },
  in_progress: { label: "In progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  shipped: { label: "Shipped", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
  duplicate: { label: "Duplicate", variant: "warning" },
};

const PRIORITY_STYLES: Record<
  FeedbackPriority,
  { label: string; variant: "gray" | "warning" | "error" }
> = {
  low: { label: "Low", variant: "gray" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "error" },
  critical: { label: "Critical", variant: "error" },
};

interface QuickSubmitItem {
  type: FeedbackType;
  title: string;
  description: string;
  hint?: string;
  hintHref?: string;
  hintAction?: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    sortBy?: "recent" | "popular" | "oldest";
  };
}

const QUICK_SUBMIT: QuickSubmitItem[] = [
  {
    type: "model_request",
    title: "Request model support",
    description:
      'Seeing "Model not available" or a model missing from pricing?',
    hint: "Check supported models",
    hintHref: "/docs/models",
  },
  {
    type: "bug_report",
    title: "Report a product issue",
    description: "Share steps, environment, and impact for faster triage.",
    hint: "View open bugs",
    hintAction: { type: "bug_report", status: "open" },
  },
  {
    type: "feature_request",
    title: "Propose a feature",
    description: "Describe the workflow and the outcome you want to unlock.",
    hint: "See popular requests",
    hintAction: { type: "feature_request", sortBy: "popular" },
  },
  {
    type: "general",
    title: "Share general feedback",
    description: "Anything else that would improve AgentCost.",
  },
];

const TITLE_MAX = 255;
const DESC_MAX = 5000;
const COMMENT_MAX = 2000;
const PAGE_SIZE = 12;

/**
 * Best-effort environment detection from build-time config and API URL.
 * Users can always override via the dropdown.
 */
function detectEnvironment(): string {
  if (typeof window === "undefined") return "";
  const nodeEnv = process.env.NODE_ENV; // "production" | "development" | "test"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
    return "local";
  }
  if (nodeEnv === "production") return "production";
  if (nodeEnv === "development") return "development";
  return "";
}

/* -------------------------------------------------------------------------- */
/*  Toast                                                                      */
/* -------------------------------------------------------------------------- */

type ToastVariant = "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

let _toastId = 0;

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-100 flex flex-col-reverse gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md animate-fade-up ${
            t.variant === "success"
              ? "border-emerald-800/60 bg-emerald-950/80 text-emerald-300"
              : "border-red-800/60 bg-red-950/80 text-red-300"
          }`}
        >
          {t.variant === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 rounded p-0.5 opacity-60 transition hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function FeedbackPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("feedback_id");

  /* ---- Read initial filters from URL query params ---- */
  const urlType = searchParams.get("type") as FeedbackType | null;
  const urlStatus = searchParams.get("status") as FeedbackStatus | null;
  const urlPriority = searchParams.get("priority") as FeedbackPriority | null;
  const urlSortBy = searchParams.get("sort_by") as
    | "recent"
    | "popular"
    | "oldest"
    | null;

  /* ---- Data state ---- */
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummaryResponse | null>(null);
  const [listTotal, setListTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /* ---- Filters ---- */
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">(
    urlType && Object.keys(TYPE_META).includes(urlType) ? urlType : "all",
  );
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">(
    urlStatus && Object.keys(STATUS_STYLES).includes(urlStatus)
      ? urlStatus
      : "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    FeedbackPriority | "all"
  >(
    urlPriority && Object.keys(PRIORITY_STYLES).includes(urlPriority)
      ? urlPriority
      : "all",
  );
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "oldest">(
    urlSortBy && ["recent", "popular", "oldest"].includes(urlSortBy)
      ? urlSortBy
      : "recent",
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(0);

  /* ---- Modal ---- */
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<FeedbackType>("feature_request");

  /* ---- Discussion ---- */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsById, setCommentsById] = useState<
    Record<string, FeedbackComment[]>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [commentLoadingId, setCommentLoadingId] = useState<string | null>(null);
  const [upvoteLoadingId, setUpvoteLoadingId] = useState<string | null>(null);

  /* ---- Submission ---- */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ---- Toast ---- */
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000,
    );
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  }, [listTotal]);

  /* ---- Debounced search ---- */
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(0);
    }, 400);
    return () => window.clearTimeout(handler);
  }, [searchInput]);

  /* ---- Data fetching ---- */
  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.getFeedbackSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.listFeedback({
        type: typeFilter,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        search: searchValue,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(response.items);
      setListTotal(response.total);
    } catch (err) {
      pushToast(parseApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    typeFilter,
    statusFilter,
    priorityFilter,
    sortBy,
    searchValue,
    page,
    pushToast,
  ]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
  }, [focusId]);

  /* ---- Handlers ---- */
  const handleOpenModal = (type: FeedbackType) => {
    setModalType(type);
    setSubmitError(null);
    setShowModal(true);
  };

  const handleUpvote = async (feedbackId: string) => {
    if (!user) {
      pushToast("Sign in to upvote feedback.", "error");
      return;
    }

    /* Optimistic update */
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== feedbackId) return item;
        const toggled = !item.user_has_upvoted;
        return {
          ...item,
          user_has_upvoted: toggled,
          upvotes: toggled ? item.upvotes + 1 : Math.max(0, item.upvotes - 1),
        };
      }),
    );

    setUpvoteLoadingId(feedbackId);
    try {
      await api.toggleFeedbackUpvote(feedbackId);
      /* Refresh in background */
      fetchList();
      fetchSummary();
    } catch (err) {
      /* Revert on failure */
      pushToast(parseApiError(err), "error");
      fetchList();
    } finally {
      setUpvoteLoadingId(null);
    }
  };

  const toggleComments = async (feedbackId: string) => {
    if (expandedId === feedbackId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(feedbackId);

    if (!commentsById[feedbackId]) {
      try {
        const response = await api.getFeedbackComments(feedbackId);
        setCommentsById((prev) => ({ ...prev, [feedbackId]: response.items }));
      } catch (err) {
        pushToast(parseApiError(err), "error");
      }
    }
  };

  const handleSubmitComment = async (feedbackId: string) => {
    const comment = (commentDrafts[feedbackId] || "").trim();
    if (!comment) return;

    setCommentLoadingId(feedbackId);
    try {
      await api.addFeedbackComment(feedbackId, {
        comment,
        user_name: user?.name || undefined,
      });
      const response = await api.getFeedbackComments(feedbackId);
      setCommentsById((prev) => ({ ...prev, [feedbackId]: response.items }));
      setCommentDrafts((prev) => ({ ...prev, [feedbackId]: "" }));
      await fetchList();
      pushToast("Comment posted", "success");
    } catch (err) {
      pushToast(parseApiError(err), "error");
    } finally {
      setCommentLoadingId(null);
    }
  };

  const handleSubmitFeedback = async (payload: {
    type: FeedbackType;
    title: string;
    description: string;
    model_name?: string;
    model_provider?: string;
    user_email?: string;
    user_name?: string;
    metadata?: Record<string, unknown>;
    attachments?: AttachmentMeta[];
    environment?: string;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.createFeedback(payload);
      setShowModal(false);
      pushToast("Feedback submitted — thank you!", "success");
      await fetchList();
      await fetchSummary();
    } catch (err) {
      setSubmitError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Summary cards ---- */
  const summaryCards = useMemo(() => {
    return [
      {
        label: "Total",
        value: summary?.total || 0,
        hint: "All feedback items",
      },
      {
        label: "Open",
        value:
          (summary?.by_status?.open || 0) +
          (summary?.by_status?.under_review || 0) +
          (summary?.by_status?.needs_info || 0),
        hint: "Awaiting triage",
      },
      {
        label: "In progress",
        value: summary?.by_status?.in_progress || 0,
        hint: "Active work",
      },
      {
        label: "Shipped",
        value:
          (summary?.by_status?.completed || 0) +
          (summary?.by_status?.shipped || 0),
        hint: "Delivered",
      },
    ];
  }, [summary]);

  /* ---- Active filter count (for clear-all) ---- */
  const activeFilters =
    (typeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (searchValue ? 1 : 0);

  const clearAllFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("recent");
    setSearchInput("");
    setSearchValue("");
    setPage(0);
  };

  return (
    <div className="relative space-y-8">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-x-0 -top-28 h-72 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.12),transparent_45%,rgba(14,116,144,0.08))]" />

      <div className="relative space-y-8">
        {/* ---- Header ---- */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Feedback &amp; Requests
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
              Centralize feature requests, bug reports, and model support
              requests. Upvote what matters most so we can prioritize
              accordingly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="gap-2"
              onClick={() => handleOpenModal("feature_request")}
            >
              <MessageSquarePlus size={16} />
              Submit feedback
            </Button>
          </div>
        </header>

        {/* ---- Quick entry points ---- */}
        <Card className="relative overflow-hidden border-neutral-800 bg-neutral-900/60">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.15),transparent_55%)]" />
          <div className="relative space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white">
                Quick entry points
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Encountering &ldquo;Model not available&rdquo; or an unsupported
                provider?{" "}
                <Link
                  href="/docs/models"
                  className="text-primary-400 underline underline-offset-2 transition hover:text-primary-300"
                >
                  Check supported models
                </Link>{" "}
                or log a model request below.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_SUBMIT.map((item) => {
                const TypeIcon = TYPE_META[item.type].icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleOpenModal(item.type)}
                    className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-3 text-left transition hover:border-neutral-700 hover:bg-neutral-900/70 focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          <TypeIcon
                            size={14}
                            className={TYPE_META[item.type].color}
                          />
                          {item.title}
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="text-neutral-500 transition group-hover:text-neutral-200"
                        />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                    {item.hint && item.hintHref && (
                      <Link
                        href={item.hintHref}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-block text-xs text-primary-400 underline underline-offset-2 transition hover:text-primary-300"
                      >
                        {item.hint}
                      </Link>
                    )}
                    {item.hint && item.hintAction && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.hintAction!.type)
                            setTypeFilter(item.hintAction!.type);
                          if (item.hintAction!.status)
                            setStatusFilter(item.hintAction!.status);
                          if (item.hintAction!.sortBy)
                            setSortBy(item.hintAction!.sortBy);
                          setPage(0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            if (item.hintAction!.type)
                              setTypeFilter(item.hintAction!.type);
                            if (item.hintAction!.status)
                              setStatusFilter(item.hintAction!.status);
                            if (item.hintAction!.sortBy)
                              setSortBy(item.hintAction!.sortBy);
                            setPage(0);
                          }
                        }}
                        className="mt-3 inline-block cursor-pointer text-xs text-primary-400 underline underline-offset-2 transition hover:text-primary-300"
                      >
                        {item.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ---- Summary metrics ---- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="border-neutral-800 bg-neutral-900/50"
            >
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{card.hint}</p>
            </Card>
          ))}
        </div>

        {/* ---- Filters & search ---- */}
        <Card className="border-neutral-800 bg-neutral-900/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <Search size={18} />
              </div>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title, description, or model"
                className="h-11"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Type"
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value as FeedbackType | "all");
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "All" },
                  { value: "feature_request", label: "Feature" },
                  { value: "bug_report", label: "Bug" },
                  { value: "model_request", label: "Model" },
                  { value: "security_report", label: "Security" },
                  { value: "performance_issue", label: "Performance" },
                  { value: "general", label: "General" },
                ]}
              />
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as FeedbackStatus | "all");
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "under_review", label: "Under review" },
                  { value: "needs_info", label: "Needs info" },
                  { value: "in_progress", label: "In progress" },
                  { value: "completed", label: "Completed" },
                  { value: "shipped", label: "Shipped" },
                  { value: "rejected", label: "Rejected" },
                  { value: "duplicate", label: "Duplicate" },
                ]}
              />
              <FilterSelect
                label="Priority"
                value={priorityFilter}
                onChange={(value) => {
                  setPriorityFilter(value as FeedbackPriority | "all");
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "All" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={sortBy}
                onChange={(value) =>
                  setSortBy(value as "recent" | "popular" | "oldest")
                }
                options={[
                  { value: "recent", label: "Most recent" },
                  { value: "popular", label: "Most popular" },
                  { value: "oldest", label: "Oldest" },
                ]}
              />
              {activeFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                >
                  <X size={12} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* ---- Feedback list ---- */}
        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                className="border-neutral-800 bg-neutral-900/50"
              >
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              </Card>
            ))
          ) : items.length === 0 ? (
            <Card className="border-neutral-800 bg-neutral-900/50" padding="lg">
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800/80 text-neutral-400">
                  <MessageSquare size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    {activeFilters > 0
                      ? "No matching feedback"
                      : "No feedback yet"}
                  </h3>
                  <p className="mx-auto max-w-sm text-sm text-neutral-400">
                    {activeFilters > 0
                      ? "Try adjusting your filters or search term."
                      : "Be the first to submit a feature request, report a bug, or request model support."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {activeFilters > 0 ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={clearAllFilters}
                    >
                      <X size={14} />
                      Clear filters
                    </Button>
                  ) : (
                    QUICK_SUBMIT.slice(0, 3).map((item) => (
                      <Button
                        key={item.type}
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleOpenModal(item.type)}
                      >
                        <ArrowUpRight size={14} />
                        {TYPE_META[item.type].label}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ) : (
            items.map((item, index) => (
              <FeedbackCard
                key={item.id}
                item={item}
                index={index}
                isExpanded={expandedId === item.id}
                comments={commentsById[item.id] || []}
                commentDraft={commentDrafts[item.id] || ""}
                commentLoadingId={commentLoadingId}
                upvoteLoadingId={upvoteLoadingId}
                onUpvote={handleUpvote}
                onToggleComments={toggleComments}
                onCommentDraftChange={(value) =>
                  setCommentDrafts((prev) => ({
                    ...prev,
                    [item.id]: value,
                  }))
                }
                onSubmitComment={handleSubmitComment}
              />
            ))
          )}
        </section>

        {/* ---- Pagination ---- */}
        {listTotal > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-neutral-500">
              Page {page + 1} of {totalPages}
              <span className="ml-2 text-neutral-600">
                ({listTotal} item{listTotal !== 1 && "s"})
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Submit modal ---- */}
      {showModal && (
        <SubmitFeedbackModal
          type={modalType}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitFeedback}
          isSubmitting={isSubmitting}
          submitError={submitError}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
        />
      )}

      {/* ---- Toasts ---- */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FeedbackCard                                                               */
/* -------------------------------------------------------------------------- */

function FeedbackCard({
  item,
  index,
  isExpanded,
  comments,
  commentDraft,
  commentLoadingId,
  upvoteLoadingId,
  onUpvote,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
}: {
  item: FeedbackItem;
  index: number;
  isExpanded: boolean;
  comments: FeedbackComment[];
  commentDraft: string;
  commentLoadingId: string | null;
  upvoteLoadingId: string | null;
  onUpvote: (id: string) => void;
  onToggleComments: (id: string) => void;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (id: string) => void;
}) {
  const TypeIcon = TYPE_META[item.type].icon;

  return (
    <Card
      className={`border-neutral-800 bg-neutral-900/50 transition animate-fade-up ${
        isExpanded ? "ring-1 ring-primary-500/30" : "hover:border-neutral-700"
      }`}
      style={{ animationDelay: `${index * 40}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          {/* Upvote button */}
          <button
            onClick={() => onUpvote(item.id)}
            aria-label={
              item.user_has_upvoted
                ? `Remove upvote (${item.upvotes})`
                : `Upvote (${item.upvotes})`
            }
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
              item.user_has_upvoted
                ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                : "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
            }`}
            disabled={upvoteLoadingId === item.id}
          >
            {upvoteLoadingId === item.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ChevronUp
                size={18}
                className={
                  item.user_has_upvoted
                    ? "text-primary-400"
                    : "text-neutral-400"
                }
              />
            )}
            <span className="mt-0.5 text-xs tabular-nums">{item.upvotes}</span>
          </button>

          {/* Main content */}
          <div className="min-w-0 space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_STYLES[item.status].variant}>
                {STATUS_STYLES[item.status].label}
              </Badge>
              <span
                className={`flex items-center gap-1 text-xs ${TYPE_META[item.type].color}`}
              >
                <TypeIcon size={12} />
                {TYPE_META[item.type].label}
              </span>
            </div>

            {/* Title & description */}
            <div>
              <h3 className="text-base font-semibold leading-snug text-white lg:text-lg">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                {item.description}
              </p>
            </div>

            {/* Model info chip */}
            {item.model_name && (
              <div className="inline-flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
                <Cpu size={14} className="shrink-0 text-cyan-500" />
                <div>
                  <span className="font-medium text-white">
                    {item.model_name}
                  </span>
                  {item.model_provider && (
                    <span className="ml-1.5 text-neutral-500">
                      {item.model_provider}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Admin response */}
            {item.admin_response && (
              <div className="rounded-lg border border-primary-800/30 bg-primary-950/20 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary-300">
                  <ShieldCheck size={12} />
                  Admin response
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-primary-100/90">
                  {item.admin_response}
                </p>
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              <span>
                {item.user_name && (
                  <span className="text-neutral-400">{item.user_name}</span>
                )}
                {item.user_name && " \u00B7 "}
                <time
                  dateTime={item.created_at}
                  title={new Date(item.created_at).toLocaleString()}
                >
                  {formatRelativeTime(item.created_at)}
                </time>
              </span>
              <button
                onClick={() => onToggleComments(item.id)}
                className="flex items-center gap-1 text-neutral-400 transition hover:text-neutral-200"
              >
                <MessageCircle size={14} />
                <span className="tabular-nums">{item.comment_count}</span>{" "}
                comment{item.comment_count !== 1 && "s"}
              </button>
            </div>
          </div>
        </div>

        {/* Discussion toggle (desktop) */}
        <div className="hidden shrink-0 lg:block">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onToggleComments(item.id)}
          >
            <MessageCircle size={14} />
            {isExpanded ? "Hide" : "Discuss"}
          </Button>
        </div>
      </div>

      {/* ---- Expanded comments section ---- */}
      {isExpanded && (
        <div className="mt-6 border-t border-neutral-800 pt-6">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="py-2 text-center text-sm text-neutral-500">
                No comments yet — start the conversation.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl border px-4 py-3 ${
                    comment.is_admin
                      ? "border-primary-800/30 bg-primary-950/10"
                      : "border-neutral-800 bg-neutral-950/50"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span
                      className={
                        comment.is_admin
                          ? "font-medium text-primary-400"
                          : "text-neutral-300"
                      }
                    >
                      {comment.user_name || "Anonymous"}
                    </span>
                    {comment.is_admin && (
                      <Badge variant="info" size="sm">
                        <ShieldCheck size={10} className="mr-1" />
                        Admin
                      </Badge>
                    )}
                    <span className="ml-auto">
                      <time
                        dateTime={comment.created_at}
                        title={new Date(comment.created_at).toLocaleString()}
                      >
                        {formatRelativeTime(comment.created_at)}
                      </time>
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                    {comment.comment}
                  </p>
                </div>
              ))
            )}

            {/* Comment input */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <textarea
                rows={3}
                maxLength={COMMENT_MAX}
                placeholder="Add a comment ..."
                value={commentDraft}
                onChange={(event) => onCommentDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    onSubmitComment(item.id);
                  }
                }}
                className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>
                    Visible to everyone.{" "}
                    <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 font-mono text-[10px] text-neutral-400">
                      Ctrl+Enter
                    </kbd>{" "}
                    to send.
                  </span>
                  {commentDraft.length > 0 && (
                    <span className="tabular-nums">
                      {commentDraft.length}/{COMMENT_MAX}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => onSubmitComment(item.id)}
                  disabled={
                    commentLoadingId === item.id ||
                    commentDraft.trim().length === 0
                  }
                >
                  {commentLoadingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  FilterSelect                                                              */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-neutral-400 transition hover:border-neutral-700">
      <Filter size={12} />
      <span className="hidden text-xs uppercase tracking-wide text-neutral-500 lg:inline">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="appearance-none bg-transparent pr-6 text-xs text-neutral-200 focus:outline-none"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-neutral-900"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500"
        />
      </div>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  SubmitFeedbackModal                                                       */
/* -------------------------------------------------------------------------- */

function SubmitFeedbackModal({
  type,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
  userName,
  userEmail,
}: {
  type: FeedbackType;
  onClose: () => void;
  onSubmit: (payload: {
    type: FeedbackType;
    title: string;
    description: string;
    model_name?: string;
    model_provider?: string;
    user_email?: string;
    user_name?: string;
    metadata?: Record<string, unknown>;
    attachments?: AttachmentMeta[];
    environment?: string;
  }) => void;
  isSubmitting: boolean;
  submitError: string | null;
  userName: string;
  userEmail: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [formType, setFormType] = useState<FeedbackType>(type);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelProvider, setModelProvider] = useState("");
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);

  const [meta, setMeta] = useState<Record<string, string>>({});
  const [referenceUrl, setReferenceUrl] = useState("");
  const [environment, setEnvironment] = useState(detectEnvironment);
  const [fileAttachments, setFileAttachments] = useState<AttachmentMeta[]>([]);

  const updateMeta = (key: string, value: string) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const modelInfoRequired =
    formType === "model_request" &&
    modelName.trim().length === 0 &&
    modelProvider.trim().length === 0;

  const canSubmit =
    !isSubmitting &&
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !modelInfoRequired;

  useEffect(() => {
    setFormType(type);
  }, [type]);

  // Reset per-type fields on category switch, keep auto-detected environment
  useEffect(() => {
    setMeta({});
    setReferenceUrl("");
    setFileAttachments([]);
  }, [formType]);

  /* Lock body scroll while modal is open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isSubmitting]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    const metadata = Object.entries(meta).reduce(
      (acc, [key, val]) => {
        if (val?.trim()) acc[key] = val.trim();
        return acc;
      },
      {} as Record<string, string>,
    );

    // Merge uploaded files + reference link into a single attachments list
    const allAttachments: AttachmentMeta[] = [...fileAttachments];
    if (referenceUrl.trim()) {
      allAttachments.push({
        id: "",
        name: referenceUrl.trim(),
        stored_name: "",
        type: "link",
        size: 0,
        storage: "link",
        path: referenceUrl.trim(),
      });
    }

    onSubmit({
      type: formType,
      title,
      description,
      model_name: formType === "model_request" ? modelName : undefined,
      model_provider: formType === "model_request" ? modelProvider : undefined,
      user_email: email || undefined,
      user_name: name || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      environment: environment || undefined,
    });
  };

  /* Close on backdrop click (not on the panel itself) */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isSubmitting) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-up"
      style={{ animationDuration: "200ms" }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Submit feedback"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Submit feedback
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Capture a request or issue
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Type */}
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-500">
              Type
            </label>
            <select
              value={formType}
              onChange={(event) =>
                setFormType(event.target.value as FeedbackType)
              }
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
            >
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <option key={key} value={key} className="bg-neutral-950">
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Title
              </label>
              <span
                className={`text-xs tabular-nums ${
                  title.length > TITLE_MAX - 20
                    ? "text-red-400"
                    : "text-neutral-600"
                }`}
              >
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value.slice(0, TITLE_MAX))
              }
              placeholder="Short summary of your feedback"
              className="mt-2"
              maxLength={TITLE_MAX}
            />
            {title.length > 0 && title.trim().length < 3 && (
              <p className="mt-1 text-xs text-amber-500">
                Title must be at least 3 characters.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Description
              </label>
              <span
                className={`text-xs tabular-nums ${
                  description.length > DESC_MAX - 100
                    ? "text-red-400"
                    : "text-neutral-600"
                }`}
              >
                {description.length}/{DESC_MAX}
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value.slice(0, DESC_MAX))
              }
              maxLength={DESC_MAX}
              placeholder="Describe the context, impact, and any relevant details"
              className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
            />
            {description.length > 0 && description.trim().length < 10 && (
              <p className="mt-1 text-xs text-amber-500">
                Description should be at least 10 characters.
              </p>
            )}
          </div>

          {/* Model fields */}
          {formType === "model_request" && (
            <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Model details
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Model name
                  </label>
                  <Input
                    value={modelName}
                    onChange={(event) => setModelName(event.target.value)}
                    placeholder="e.g. gpt-4o"
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Provider
                  </label>
                  <Input
                    value={modelProvider}
                    onChange={(event) => setModelProvider(event.target.value)}
                    placeholder="e.g. OpenAI"
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Use case
                </label>
                <textarea
                  rows={2}
                  value={meta.use_case || ""}
                  onChange={(e) => updateMeta("use_case", e.target.value)}
                  placeholder="What will you use this model for?"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Latency sensitivity
                  </label>
                  <select
                    value={meta.latency_sensitivity || ""}
                    onChange={(e) =>
                      updateMeta("latency_sensitivity", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="" className="bg-neutral-950">
                      Not specified
                    </option>
                    <option value="low" className="bg-neutral-950">
                      Low -- batch processing
                    </option>
                    <option value="medium" className="bg-neutral-950">
                      Medium -- interactive
                    </option>
                    <option value="high" className="bg-neutral-950">
                      High -- real-time
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Cost sensitivity
                  </label>
                  <select
                    value={meta.cost_sensitivity || ""}
                    onChange={(e) =>
                      updateMeta("cost_sensitivity", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="" className="bg-neutral-950">
                      Not specified
                    </option>
                    <option value="low" className="bg-neutral-950">
                      Low -- quality matters most
                    </option>
                    <option value="medium" className="bg-neutral-950">
                      Medium -- balanced
                    </option>
                    <option value="high" className="bg-neutral-950">
                      High -- cost is primary concern
                    </option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Provide at least one of model name or provider.{" "}
                <Link
                  href="/docs/models"
                  className="text-primary-400 underline underline-offset-2 hover:text-primary-300"
                >
                  View currently supported models
                </Link>
              </p>
            </div>
          )}

          {/* Bug report fields */}
          {formType === "bug_report" && (
            <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Bug details
              </p>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Steps to reproduce
                </label>
                <textarea
                  rows={3}
                  value={meta.steps_to_reproduce || ""}
                  onChange={(e) =>
                    updateMeta("steps_to_reproduce", e.target.value)
                  }
                  placeholder={"1. Go to ...\n2. Click on ...\n3. Observe ..."}
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Expected behavior
                  </label>
                  <textarea
                    rows={2}
                    value={meta.expected_behavior || ""}
                    onChange={(e) =>
                      updateMeta("expected_behavior", e.target.value)
                    }
                    placeholder="What should have happened"
                    className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Actual behavior
                  </label>
                  <textarea
                    rows={2}
                    value={meta.actual_behavior || ""}
                    onChange={(e) =>
                      updateMeta("actual_behavior", e.target.value)
                    }
                    placeholder="What actually happened"
                    className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Severity
                </label>
                <select
                  value={meta.severity || ""}
                  onChange={(e) => updateMeta("severity", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                >
                  <option value="" className="bg-neutral-950">
                    Select severity
                  </option>
                  <option value="minor" className="bg-neutral-950">
                    Minor -- cosmetic or minor inconvenience
                  </option>
                  <option value="moderate" className="bg-neutral-950">
                    Moderate -- feature works with workaround
                  </option>
                  <option value="major" className="bg-neutral-950">
                    Major -- core feature broken
                  </option>
                  <option value="critical" className="bg-neutral-950">
                    Critical -- data loss or security issue
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Feature request fields */}
          {formType === "feature_request" && (
            <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Feature context
              </p>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Problem statement
                </label>
                <textarea
                  rows={2}
                  value={meta.problem_statement || ""}
                  onChange={(e) =>
                    updateMeta("problem_statement", e.target.value)
                  }
                  placeholder="What problem does this feature solve?"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Current workaround
                </label>
                <textarea
                  rows={2}
                  value={meta.current_workaround || ""}
                  onChange={(e) =>
                    updateMeta("current_workaround", e.target.value)
                  }
                  placeholder="How do you work around this today?"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Business impact
                </label>
                <select
                  value={meta.business_impact || ""}
                  onChange={(e) =>
                    updateMeta("business_impact", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                >
                  <option value="" className="bg-neutral-950">
                    Select impact level
                  </option>
                  <option value="low" className="bg-neutral-950">
                    Low -- nice to have
                  </option>
                  <option value="medium" className="bg-neutral-950">
                    Medium -- improves workflow significantly
                  </option>
                  <option value="high" className="bg-neutral-950">
                    High -- blocking or critical for adoption
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Performance issue fields */}
          {formType === "performance_issue" && (
            <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Performance details
              </p>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Affected area
                </label>
                <Input
                  value={meta.affected_area || ""}
                  onChange={(e) => updateMeta("affected_area", e.target.value)}
                  placeholder="e.g. Dashboard loading, API response time, SDK batch flush"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Expected performance
                  </label>
                  <textarea
                    rows={2}
                    value={meta.expected_performance || ""}
                    onChange={(e) =>
                      updateMeta("expected_performance", e.target.value)
                    }
                    placeholder="What performance do you expect?"
                    className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500">
                    Actual performance
                  </label>
                  <textarea
                    rows={2}
                    value={meta.actual_performance || ""}
                    onChange={(e) =>
                      updateMeta("actual_performance", e.target.value)
                    }
                    placeholder="What are you actually experiencing?"
                    className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Frequency
                </label>
                <select
                  value={meta.frequency || ""}
                  onChange={(e) => updateMeta("frequency", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                >
                  <option value="" className="bg-neutral-950">
                    Select frequency
                  </option>
                  <option value="always" className="bg-neutral-950">
                    Always reproducible
                  </option>
                  <option value="intermittent" className="bg-neutral-950">
                    Intermittent
                  </option>
                  <option value="rare" className="bg-neutral-950">
                    Rare
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Security report fields */}
          {formType === "security_report" && (
            <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <div className="flex items-start gap-2 rounded-lg border border-orange-900/50 bg-orange-950/20 px-3 py-2 text-sm text-orange-400">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>
                  This report will be marked as confidential and only visible to
                  administrators.
                </span>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Steps to reproduce
                </label>
                <textarea
                  rows={3}
                  value={meta.steps_to_reproduce || ""}
                  onChange={(e) =>
                    updateMeta("steps_to_reproduce", e.target.value)
                  }
                  placeholder="Describe how to reproduce the security issue"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Severity
                </label>
                <select
                  value={meta.severity || ""}
                  onChange={(e) => updateMeta("severity", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
                >
                  <option value="" className="bg-neutral-950">
                    Select severity
                  </option>
                  <option value="low" className="bg-neutral-950">
                    Low -- informational
                  </option>
                  <option value="medium" className="bg-neutral-950">
                    Medium -- limited exposure
                  </option>
                  <option value="high" className="bg-neutral-950">
                    High -- sensitive data at risk
                  </option>
                  <option value="critical" className="bg-neutral-950">
                    Critical -- active exploitation possible
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* File attachments */}
          <FileUpload
            attachments={fileAttachments}
            onChange={setFileAttachments}
            disabled={isSubmitting}
          />

          {/* Common: Environment & Reference link */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Environment{" "}
                <span className="normal-case text-neutral-600">(optional)</span>
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
              >
                <option value="" className="bg-neutral-950">
                  Not specified
                </option>
                <option value="production" className="bg-neutral-950">
                  Production
                </option>
                <option value="staging" className="bg-neutral-950">
                  Staging
                </option>
                <option value="development" className="bg-neutral-950">
                  Development
                </option>
                <option value="local" className="bg-neutral-950">
                  Local
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Reference link{" "}
                <span className="normal-case text-neutral-600">(optional)</span>
              </label>
              <Input
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="Link to screenshot, log, or related resource"
                className="mt-2"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Your name{" "}
                <span className="normal-case text-neutral-600">(optional)</span>
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Optional"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500">
                Contact email{" "}
                <span className="normal-case text-neutral-600">(optional)</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Optional — for follow-up notifications"
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
          <p className="hidden text-xs text-neutral-500 sm:block">
            We only use contact details to follow up on this request.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
