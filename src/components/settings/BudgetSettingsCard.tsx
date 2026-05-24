"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ShieldAlert,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Bell,
  Ban,
  Check,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  api,
  type BudgetCurrency,
  type ProjectBudgetSettings,
} from "@/lib/api";
import { cn, parseApiError } from "@/lib/utils";

interface BudgetSettingsCardProps {
  projectId: string;
}

type EnforcementMode = "off" | "warn" | "hard_cap";

const DEFAULT_THRESHOLDS = [50, 80, 100];

const CURRENCY_META: Record<
  BudgetCurrency,
  { symbol: string; code: string; label: string }
> = {
  USD: { symbol: "$", code: "USD", label: "US Dollar (USD)" },
  INR: { symbol: "₹", code: "INR", label: "Indian Rupee (INR)" },
};

const ENFORCEMENT_OPTIONS: {
  value: EnforcementMode;
  label: string;
  description: string;
  icon: typeof Eye;
  iconClass: string;
}[] = [
  {
    value: "off",
    label: "Tracking only",
    description: "Watch spend silently. No alerts, no blocking.",
    icon: Eye,
    iconClass: "text-neutral-400 bg-neutral-700/40",
  },
  {
    value: "warn",
    label: "Notify on thresholds",
    description:
      "Send in-app + email alerts to owners and admins when each threshold is crossed.",
    icon: Bell,
    iconClass: "text-sky-400 bg-sky-900/30",
  },
  {
    value: "hard_cap",
    label: "Block when budget is reached",
    description:
      "Same alerts as Notify, plus reject new events once month-to-date spend hits the budget.",
    icon: Ban,
    iconClass: "text-red-400 bg-red-900/30",
  },
];

function formatMoney(amount: number, currency: BudgetCurrency): string {
  if (amount == null || isNaN(amount)) {
    return `${CURRENCY_META[currency].symbol}0.00`;
  }
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_META[currency].symbol}${amount.toFixed(2)}`;
  }
}

function EnforcementDropdown({
  value,
  onChange,
}: {
  value: EnforcementMode;
  onChange: (next: EnforcementMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected =
    ENFORCEMENT_OPTIONS.find((o) => o.value === value) ?? ENFORCEMENT_OPTIONS[1];
  const SelectedIcon = selected.icon;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2.5 text-white transition-colors",
          "hover:bg-neutral-800 focus:border-primary-500 focus:outline-none",
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md shrink-0",
              selected.iconClass,
            )}
          >
            <SelectedIcon size={14} />
          </span>
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-neutral-400 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl"
        >
          {ENFORCEMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "bg-neutral-800/80"
                    : "hover:bg-neutral-800/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                    opt.iconClass,
                  )}
                >
                  <Icon size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-primary-400" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-400 leading-relaxed">
                    {opt.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CurrencyToggle({
  value,
  onChange,
  disabled,
}: {
  value: BudgetCurrency;
  onChange: (next: BudgetCurrency) => void;
  disabled?: boolean;
}) {
  const options: BudgetCurrency[] = ["USD", "INR"];
  return (
    <div
      role="tablist"
      aria-label="Budget currency"
      className="inline-flex rounded-lg border border-neutral-700 bg-neutral-800/40 p-0.5"
    >
      {options.map((cur) => {
        const isActive = cur === value;
        return (
          <button
            key={cur}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(cur)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              isActive
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="mr-1">{CURRENCY_META[cur].symbol}</span>
            {cur}
          </button>
        );
      })}
    </div>
  );
}

export function BudgetSettingsCard({ projectId }: BudgetSettingsCardProps) {
  const [settings, setSettings] = useState<ProjectBudgetSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currency, setCurrency] = useState<BudgetCurrency>("USD");
  const [liveFxRate, setLiveFxRate] = useState<number | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [mode, setMode] = useState<EnforcementMode>("warn");
  const [thresholds, setThresholds] = useState<number[]>(DEFAULT_THRESHOLDS);
  const [newThreshold, setNewThreshold] = useState<string>("");
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getProjectBudget(projectId);
      setSettings(data);
      setCurrency(data.budget_currency || "USD");
      setBudgetInput(
        data.monthly_budget_usd != null ? String(data.monthly_budget_usd) : "",
      );
      setMode(data.budget_enforcement_mode);
      setThresholds(
        data.budget_alert_thresholds?.length
          ? [...data.budget_alert_thresholds].sort((a, b) => a - b)
          : DEFAULT_THRESHOLDS,
      );
    } catch (err) {
      setLoadError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Always reflect the *live* USD->target rate the moment the user toggles
  // currency, so we never show "1 USD = 1 INR" between toggle and save.
  useEffect(() => {
    let cancelled = false;
    async function fetchRate() {
      if (currency === "USD") {
        if (!cancelled) setLiveFxRate(1.0);
        return;
      }
      try {
        const data = await api.getFxRate(currency);
        if (!cancelled) setLiveFxRate(data.rate);
      } catch {
        // Leave previous rate; the saved settings.fx_rate will still render.
      }
    }
    fetchRate();
    return () => {
      cancelled = true;
    };
  }, [currency]);

  // Prefer the just-fetched live rate; fall back to whatever the backend
  // returned with the saved settings (or 1.0 if neither is available).
  const displayFxRate = liveFxRate ?? settings?.fx_rate ?? 1.0;

  const utilization = settings?.utilization_percent ?? null;
  const utilizationBarColor = useMemo(() => {
    if (utilization == null) return "bg-neutral-700";
    if (utilization >= 100) return "bg-red-500";
    if (utilization >= 80) return "bg-amber-500";
    if (utilization >= 50) return "bg-sky-500";
    return "bg-emerald-500";
  }, [utilization]);

  const handleAddThreshold = () => {
    setThresholdError(null);
    const raw = newThreshold.trim();
    if (!raw) return;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 1 || num > 100) {
      setThresholdError("Enter a number between 1 and 100.");
      return;
    }
    const rounded = Math.round(num * 100) / 100;
    if (thresholds.includes(rounded)) {
      setThresholdError("That threshold is already configured.");
      return;
    }
    setThresholds([...thresholds, rounded].sort((a, b) => a - b));
    setNewThreshold("");
  };

  const handleRemoveThreshold = (value: number) => {
    if (thresholds.length <= 1) {
      setThresholdError("At least one threshold is required.");
      return;
    }
    setThresholds(thresholds.filter((t) => t !== value));
  };

  const handleSave = async () => {
    setSaveMessage(null);
    if (thresholds.length === 0) {
      setSaveMessage({
        type: "error",
        text: "Add at least one alert threshold before saving.",
      });
      return;
    }
    let monthly: number | null = null;
    if (budgetInput.trim() !== "") {
      const parsed = Number(budgetInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setSaveMessage({
          type: "error",
          text: "Monthly budget must be a non-negative number.",
        });
        return;
      }
      monthly = parsed > 0 ? Math.round(parsed * 100) / 100 : null;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateProjectBudget(projectId, {
        monthly_budget_usd: monthly,
        budget_enforcement_mode: mode,
        budget_alert_thresholds: thresholds,
        budget_currency: currency,
      });
      setSettings(updated);
      setSaveMessage({ type: "success", text: "Budget settings saved." });
    } catch (err) {
      setSaveMessage({ type: "error", text: parseApiError(err) });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  // Recompute month-to-date spend in the currently-selected currency so
  // toggling the picker updates the display immediately, without waiting
  // for the user to save and refetch.
  const spendUsd = settings?.current_month_spend_usd ?? 0;
  const currentSpendDisplay = spendUsd * displayFxRate;
  const budgetDisplay = settings?.monthly_budget_usd;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-900/30 text-amber-400 shrink-0">
          <ShieldAlert size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium text-white">
                Budget Guardrails
              </h3>
              <p className="text-sm text-neutral-400">
                Set a monthly cap and alert thresholds. Owners and project
                admins are notified in-app and via email when thresholds are
                crossed.
              </p>
            </div>
            {!isLoading && settings?.period_key && (
              <span className="shrink-0 rounded-full border border-neutral-700 bg-neutral-800/50 px-2.5 py-1 text-xs text-neutral-400">
                {settings.period_key} (UTC)
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
              <RefreshCw size={14} className="animate-spin" />
              Loading budget settings…
            </div>
          ) : loadError ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              <AlertCircle size={14} /> {loadError}
            </div>
          ) : (
            <>
              {/* Current utilization */}
              {settings && (
                <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Month-to-date spend
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {formatMoney(currentSpendDisplay, currency)}
                      </p>
                      {currency !== "USD" && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {formatMoney(
                            settings.current_month_spend_usd ?? 0,
                            "USD",
                          )}{" "}
                          · 1 USD ≈ {displayFxRate.toFixed(2)} {currency}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Monthly budget
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-200">
                        {budgetDisplay != null
                          ? formatMoney(budgetDisplay, currency)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full ${utilizationBarColor} transition-all`}
                      style={{
                        width: `${Math.min(100, Math.max(0, utilization ?? 0))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-400">
                    {utilization != null
                      ? `${utilization.toFixed(1)}% of monthly budget used`
                      : "Set a budget to track utilization."}
                  </p>
                </div>
              )}

              {/* Currency picker */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-300">
                    Currency
                  </p>
                  <p className="text-xs text-neutral-500">
                    Cost events arrive in USD and are converted at live ECB
                    rates for display and threshold checks.
                  </p>
                  {currency !== "USD" && (
                    <p className="mt-1 text-[11px] text-neutral-600">
                      Live rate: 1 USD ≈ {displayFxRate.toFixed(2)} {currency}
                    </p>
                  )}
                </div>
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>

              {/* Budget input + Enforcement mode */}
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Monthly budget ({currency})
                  </label>
                  <div className="mt-1.5 flex items-center rounded-lg border border-neutral-700 bg-neutral-800/50 focus-within:border-primary-500">
                    <span className="pl-3 pr-1 text-neutral-500 select-none">
                      {CURRENCY_META[currency].symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      placeholder={
                        currency === "INR" ? "e.g. 4000" : "e.g. 50"
                      }
                      className="w-full bg-transparent px-2 py-2 text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Leave blank or set to 0 to disable budget enforcement.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Enforcement mode
                  </label>
                  <div className="mt-1.5">
                    <EnforcementDropdown value={mode} onChange={setMode} />
                  </div>
                </div>
              </div>

              {/* Thresholds */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-300">
                  Alert thresholds (% of monthly budget)
                </label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Each threshold fires exactly once per project per calendar
                  month, deduplicated.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {thresholds.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-sm text-neutral-200"
                    >
                      {t}%
                      <button
                        type="button"
                        onClick={() => handleRemoveThreshold(t)}
                        aria-label={`Remove ${t}% threshold`}
                        className="text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddThreshold();
                      }
                    }}
                    placeholder="Add threshold (1–100)"
                    className="w-56 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddThreshold}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-600 transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                {thresholdError && (
                  <p className="mt-2 text-xs text-red-400">{thresholdError}</p>
                )}
              </div>

              {/* Save action */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  Save budget settings
                </button>
                {saveMessage && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      saveMessage.type === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {saveMessage.type === "success" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {saveMessage.text}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
